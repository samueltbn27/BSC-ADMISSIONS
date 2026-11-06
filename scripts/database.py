#!/usr/bin/env python3
"""Transactional SQL migration/seed runner; Python stdlib + PostgreSQL psql only."""
import argparse
import hashlib
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
LOCK_ID = 628317204617


def psql(sql, *, capture=False, database=None):
    env = os.environ.copy()
    env.setdefault("PGCONNECT_TIMEOUT", "10")
    if database:
        env["PGDATABASE"] = database
    result = subprocess.run(
        ["psql", "-X", "--set=ON_ERROR_STOP=1", "--no-password", "--quiet", "--tuples-only", "--no-align", "--file=-"],
        input=sql, text=True, env=env, capture_output=True, check=False,
    )
    if result.returncode:
        # SQL errors can include PII, hashes and statement values. Never print them.
        raise RuntimeError("Database operation failed. Review privately with a DBA; SQL details suppressed.")
    if not capture and result.stdout.strip():
        print(result.stdout.strip())
    return result.stdout.strip()


def literal(value):
    return "'" + value.replace("'", "''") + "'"


def migrations():
    result = []
    for up in sorted((ROOT / "database/migrations").glob("*.up.sql")):
        version = up.name.removesuffix(".up.sql") if sys.version_info >= (3, 9) else up.name[:-7]
        if not re.fullmatch(r"[0-9]{3}_[a-z_]+", version):
            raise RuntimeError("Invalid migration filename")
        down = up.with_name(version + ".down.sql")
        result.append((version, up.read_text(), down.read_text()))
    return result


def digest(sql):
    return hashlib.sha256(sql.encode()).hexdigest()


def header():
    return f"""BEGIN;
SELECT pg_advisory_xact_lock({LOCK_ID});
CREATE SCHEMA IF NOT EXISTS bsc_meta;
REVOKE ALL ON SCHEMA bsc_meta FROM PUBLIC;
CREATE TABLE IF NOT EXISTS bsc_meta.migrations (
    version text PRIMARY KEY, up_checksum text NOT NULL, down_checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);
"""


def checksums(items):
    versions = ",".join(literal(v) for v, _, _ in items)
    sql = f"""DO $$ BEGIN
IF EXISTS (SELECT 1 FROM bsc_meta.migrations WHERE version NOT IN ({versions})) THEN
    RAISE EXCEPTION 'Unknown applied migration';
END IF; END $$;
"""
    for version, up, down in items:
        sql += f"""DO $$ BEGIN
IF EXISTS (SELECT 1 FROM bsc_meta.migrations WHERE version = {literal(version)}
    AND (up_checksum <> '{digest(up)}' OR down_checksum <> '{digest(down)}')) THEN
    RAISE EXCEPTION 'Applied migration checksum mismatch';
END IF; END $$;
"""
    return sql


def migrate():
    items = migrations()
    sql = header() + checksums(items)
    for version, up, down in items:
        sql += f"SELECT EXISTS (SELECT 1 FROM bsc_meta.migrations WHERE version = {literal(version)}) AS applied \\gset\n\\if :applied\n\\else\n"
        sql += up + "\n"
        sql += f"INSERT INTO bsc_meta.migrations(version, up_checksum, down_checksum) VALUES ({literal(version)}, '{digest(up)}', '{digest(down)}');\n\\endif\n"
    psql(sql + "COMMIT;", capture=True)
    print("Migrations applied; checksums verified.")


def rollback(allowed):
    if not allowed:
        raise RuntimeError("Rollback needs --allow-destructive. Use only after review and backup.")
    items = migrations()
    sql = header() + checksums(items)
    sql += "SELECT coalesce(max(version), '') AS latest FROM bsc_meta.migrations \\gset\n"
    for version, _, down in reversed(items):
        sql += f"SELECT :'latest' = {literal(version)} AS undo \\gset\n\\if :undo\n"
        sql += down + f"\nDELETE FROM bsc_meta.migrations WHERE version = {literal(version)};\n\\endif\n"
    psql(sql + "COMMIT;", capture=True)
    print("Latest migration rolled back (if present).")


def seed():
    items = migrations()
    sql = header() + checksums(items)
    sql += f"""DO $$ BEGIN
IF (SELECT count(*) FROM bsc_meta.migrations) <> {len(items)} THEN
    RAISE EXCEPTION 'Migrate before seeding';
END IF; END $$;
"""
    sql += (ROOT / "database/seeds/reference.sql").read_text()
    psql(sql + "\nCOMMIT;", capture=True)
    print("Reference data seeded idempotently; existing reference values preserved.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["migrate", "seed", "status", "rollback"])
    parser.add_argument("--allow-destructive", action="store_true")
    args = parser.parse_args()
    if not os.environ.get("PGDATABASE"):
        raise RuntimeError("Set PGDATABASE explicitly to avoid operating on a default database.")
    if args.command == "migrate":
        migrate()
    elif args.command == "seed":
        seed()
    elif args.command == "rollback":
        rollback(args.allow_destructive)
    else:
        psql("SELECT version || ' applied ' || applied_at::text FROM bsc_meta.migrations ORDER BY version;")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)

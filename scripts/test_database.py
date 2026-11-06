#!/usr/bin/env python3
"""Real PostgreSQL integration suite in a uniquely named, retained scratch database."""
import os
import subprocess
import sys
import uuid

from database import ROOT, psql


def run(command, env):
    subprocess.run(command, cwd=ROOT, env=env, check=True)


def main():
    # A new database is always created; never reset/truncate/drop an existing one.
    test_database = "bsc_test_" + uuid.uuid4().hex
    test_owner = "bsc_owner_" + uuid.uuid4().hex
    psql(f'CREATE ROLE "{test_owner}" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;\nCREATE DATABASE "{test_database}" OWNER "{test_owner}";', capture=True, database="postgres")
    env = os.environ.copy()
    env["PGDATABASE"] = test_database
    print("Isolated test database: " + test_database, flush=True)
    os.environ["PGDATABASE"] = test_database
    owner_env = env.copy()
    owner_env["PGOPTIONS"] = env.get("PGOPTIONS", "") + " -c role=" + test_owner
    command = [sys.executable, "scripts/database.py"]
    # Two processes race to deploy an empty database; the transaction lock serializes them.
    workers = [subprocess.Popen(command + ["migrate"], cwd=ROOT, env=owner_env) for _ in range(2)]
    if any(worker.wait() != 0 for worker in workers):
        raise RuntimeError("Concurrent migration failed")
    run(command + ["migrate"], owner_env)
    run(command + ["seed"], owner_env)
    run(command + ["seed"], owner_env)
    psql((ROOT / "database/bootstrap/privileges.sql").read_text(), capture=True)
    psql((ROOT / "database/bootstrap/privileges.sql").read_text(), capture=True)
    result = psql(f"\\set migration_owner {test_owner}\n" + (ROOT / "tests/database/integrity.sql").read_text(), capture=True)
    assertions = [line for line in result.splitlines() if line.startswith("PASS:")]
    print(f"SQL integration assertions: {len(assertions)} passed.", flush=True)
    # Integrity fixture is rolled back, so a complete down/up cycle is safe.
    run(command + ["rollback", "--allow-destructive"], owner_env)
    run(command + ["rollback", "--allow-destructive"], owner_env)
    if psql("SELECT to_regnamespace('bsc') IS NULL;", capture=True) != "t":
        raise RuntimeError("Schema rollback failed")
    run(command + ["migrate"], owner_env)
    run(command + ["seed"], owner_env)
    psql((ROOT / "database/bootstrap/privileges.sql").read_text(), capture=True)
    run(command + ["rollback", "--allow-destructive"], owner_env)
    # Prove schema rollback refuses real business rows, retaining both rows/ledger.
    psql("INSERT INTO bsc.admission_periods(name, academic_year, opens_at, closes_at) VALUES ('Rollback guard', '2099/2100', now(), now() + interval '1 day');", capture=True)
    refused = subprocess.run(command + ["rollback", "--allow-destructive"], cwd=ROOT, env=owner_env, capture_output=True)
    if refused.returncode == 0:
        raise RuntimeError("Data-preserving rollback guard failed")
    if psql("SELECT count(*) FROM bsc.admission_periods;", capture=True) != "1":
        raise RuntimeError("Rollback changed business data")
    if psql("SELECT count(*) FROM bsc_meta.migrations;", capture=True) != "1":
        raise RuntimeError("Rollback changed ledger after failure")
    run(command + ["migrate"], owner_env)
    # Applied files are immutable: corrupt the ledger only in this scratch DB.
    psql("UPDATE bsc_meta.migrations SET up_checksum = 'tampered' WHERE version = '002_workflows';", capture=True)
    refused = subprocess.run(command + ["migrate"], cwd=ROOT, env=owner_env, capture_output=True)
    if refused.returncode == 0:
        raise RuntimeError("Checksum mismatch was accepted")
    print("PASS: concurrent fresh migrations, repeat migration/seed/bootstrap, SQL assertions, full rollback/reapply, data rollback guard, checksum rejection.")
    print("Scratch database retained (synthetic data only): " + test_database)
    print("Non-superuser NOLOGIN migration owner retained: " + test_owner)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)

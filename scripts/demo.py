#!/usr/bin/env python3
"""Own a private, disposable PostgreSQL cluster for academic demo only."""
import argparse
import getpass
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / '.local/demo'
DB = 'bsc_demo_v1'
PORT = 55441
MARKER = LOCAL / 'demo.json'


def binary(name):
    for folder in [os.environ.get('PG_BINDIR', ''), '/opt/homebrew/opt/postgresql@18/bin', '/usr/lib/postgresql/18/bin']:
        if not folder:
            continue
        if (Path(folder) / name).exists():
            return str(Path(folder) / name)
    found = shutil.which(name)
    if found:
        return found
    raise RuntimeError(f'{name} tidak ditemukan. Pasang PostgreSQL 18 dan tambahkan bin ke PATH.')


def run(args, **kwargs):
    return subprocess.run(args, check=True, cwd=ROOT, **kwargs)


def sql(statement, env, database='postgres'):
    result = subprocess.run([binary('psql'), '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', database],
                            input=statement, text=True, capture_output=True, env=env)
    if result.returncode:
        raise RuntimeError('Operasi setup database gagal; detail SQL disembunyikan.')
    return result.stdout.strip()


def private_write(path, content):
    # Open with restricted mode from the first byte (including credentials).
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    os.fchmod(fd, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(content)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['setup', 'reset', 'start', 'stop', 'test-db'])
    args = parser.parse_args()
    LOCAL.mkdir(parents=True, exist_ok=True, mode=0o700)
    LOCAL.chmod(0o700)
    # Use a short private Unix socket path: workspace paths can exceed sun_path.
    socket_dir = Path('/tmp') / ('bsc-demo-' + str(os.getuid()))
    if socket_dir.is_symlink():
        raise RuntimeError('Socket path tidak boleh symlink')
    socket_dir.mkdir(mode=0o700, exist_ok=True)
    if socket_dir.stat().st_uid != os.getuid():
        raise RuntimeError('Pemilik socket path tidak sesuai')
    socket_dir.chmod(0o700)
    env = os.environ.copy()
    env.update(PGHOST=str(socket_dir), PGPORT=str(PORT), PGUSER=getpass.getuser(), PGDATABASE=DB)
    env.pop('PGOPTIONS', None)
    env['PATH'] = str(Path(binary('psql')).parent) + os.pathsep + env['PATH']
    pgdata = LOCAL / 'pgdata'
    if args.command in ['setup', 'reset']:
        with socket.socket() as sock:
            if sock.connect_ex(('127.0.0.1', 4000)) == 0:
                raise RuntimeError('Hentikan backend port 4000 sebelum setup/reset agar sesi lama berakhir.')
    if not MARKER.exists():
        if args.command != 'setup' or pgdata.exists() or (ROOT / 'backend/.env').exists():
            raise RuntimeError('Jalankan setup pada folder baru; menolak menimpa cluster atau .env existing.')
        private_write(MARKER, json.dumps({'database': DB, 'root': str(ROOT)}))
    marker = json.loads(MARKER.read_text())
    if marker != {'database': DB, 'root': str(ROOT)}:
        raise RuntimeError('Marker demo tidak cocok; tidak ada database yang diubah.')
    if args.command == 'stop':
        run([binary('pg_ctl'), '-D', str(pgdata), 'stop', '-m', 'fast'])
        return
    if not pgdata.exists():
        run([binary('initdb'), '-D', str(pgdata), '--auth-local=trust',
             '--auth-host=scram-sha-256', '--encoding=UTF8'], stdout=subprocess.DEVNULL)
    running = subprocess.run([binary('pg_ctl'), '-D', str(pgdata), 'status'], capture_output=True)
    if running.returncode:
        run([binary('pg_ctl'), '-D', str(pgdata), '-l', str(LOCAL / 'postgres.log'),
             '-o', f"-k {socket_dir} -p {PORT} -h 127.0.0.1 -c log_statement=none -c log_min_error_statement=panic -c log_parameter_max_length_on_error=0", 'start'])
    if args.command == 'test-db':
        run([sys.executable, 'scripts/test_database.py'], env=env)
        return
    if args.command == 'start':
        if not (ROOT / 'frontend/dist/index.html').exists():
            raise RuntimeError('Build frontend terlebih dahulu: npm --prefix frontend run build')
        subprocess.run(['npm', 'start'], cwd=ROOT / 'backend', check=True)
        return
    # Roles exist before migration 003 (its explicit GRANT statements need them).
    for role in ['bsc_runtime', 'bsc_authenticator', 'bsc_demo_owner']:
        sql(f"DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='{role}') THEN CREATE ROLE {role} NOLOGIN; END IF; END $$;", env)
    exists = sql(f"SELECT 1 FROM pg_database WHERE datname='{DB}';", env) == '1'
    if exists and args.command == 'setup':
        print('Demo sudah disiapkan. Gunakan reset untuk mengulang atau start untuk menjalankan.')
        return
    if exists:
        owner = sql(f"SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname='{DB}'", env)
        if owner != 'bsc_demo_owner':
            raise RuntimeError('Database bukan milik demo; reset ditolak.')
        sql(f'DROP DATABASE {DB} WITH (FORCE);', env)
    sql(f'CREATE DATABASE {DB} OWNER bsc_demo_owner;', env)
    migration_env = dict(env, PGOPTIONS='-c role=bsc_demo_owner')
    for command in ['migrate', 'seed']:
        run([sys.executable, 'scripts/database.py', command], env=migration_env)
    sql((ROOT / 'database/bootstrap/privileges.sql').read_text(), env, DB)
    passwords = {role: secrets.token_urlsafe(32) for role in ['bsc_demo_app', 'bsc_demo_auth']}
    for role, password in passwords.items():
        sql(f"DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='{role}') THEN CREATE ROLE {role} LOGIN; END IF; END $$; ALTER ROLE {role} PASSWORD '{password}';", env)
    sql(f'GRANT bsc_runtime TO bsc_demo_app; GRANT bsc_authenticator TO bsc_demo_auth; REVOKE CONNECT ON DATABASE {DB} FROM PUBLIC; GRANT CONNECT ON DATABASE {DB} TO bsc_demo_app,bsc_demo_auth;', env)
    upload = LOCAL / 'uploads'
    if upload.exists():
        shutil.rmtree(upload)
    upload.mkdir(mode=0o700)
    private_write(ROOT / 'backend/.env', '\n'.join([
        'NODE_ENV=development', 'PORT=4000', 'HOST=127.0.0.1', 'PGHOST=127.0.0.1', f'PGPORT={PORT}', f'PGDATABASE={DB}',
        'PGUSER_RUNTIME=bsc_demo_app', f'PGPASSWORD_RUNTIME={passwords["bsc_demo_app"]}',
        'PGUSER_AUTH=bsc_demo_auth', f'PGPASSWORD_AUTH={passwords["bsc_demo_auth"]}',
        'COOKIE_SECURE=false', 'ALLOWED_ORIGIN=http://localhost:4000',
        f'UPLOAD_DIR={upload}', 'UPLOAD_MAX_BYTES=5242880', 'FRONTEND_DIST=../frontend/dist', '',
    ]))
    seed_env = dict(env, DEMO_BOOTSTRAP='1')
    subprocess.run(['npm', 'run', 'demo:seed'], cwd=ROOT / 'backend', env=seed_env, check=True)
    print('Demo siap. Kredensial: .local/demo/accounts.json (0600). Berkas dummy: .local/demo/fixtures/.')
    print('Jalankan: python3 scripts/demo.py start → http://localhost:4000')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)

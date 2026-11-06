-- Run as DBA after migration. Creates NOLOGIN capability roles, never passwords.
-- Review cluster-wide role names before first use. Do not use the migration owner at runtime.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bsc_runtime') THEN
        CREATE ROLE bsc_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bsc_authenticator') THEN
        CREATE ROLE bsc_authenticator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
    END IF;
END;
$$;
-- Refuse elevated existing capability roles instead of silently trusting them.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('bsc_runtime', 'bsc_authenticator')
        AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolcanlogin)) THEN
        RAISE EXCEPTION 'Existing capability role is unsafe; ask DBA to review';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.member
        WHERE r.rolname IN ('bsc_runtime', 'bsc_authenticator'))
        OR EXISTS (SELECT 1 FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner
            WHERE r.rolname IN ('bsc_runtime', 'bsc_authenticator'))
        OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_roles r ON r.oid = c.relowner
            WHERE r.rolname IN ('bsc_runtime', 'bsc_authenticator'))
        OR EXISTS (SELECT 1 FROM pg_proc p JOIN pg_roles r ON r.oid = p.proowner
            WHERE r.rolname IN ('bsc_runtime', 'bsc_authenticator'))
        OR EXISTS (SELECT 1 FROM pg_database d JOIN pg_roles r ON r.oid = d.datdba
            WHERE d.datname = current_database() AND r.rolname IN ('bsc_runtime', 'bsc_authenticator')) THEN
        RAISE EXCEPTION 'Capability role inherits privileges or owns objects; ask DBA to review';
    END IF;
END;
$$;
REVOKE ALL ON SCHEMA bsc, bsc_api, bsc_auth, bsc_meta, public FROM bsc_runtime, bsc_authenticator;
REVOKE ALL ON ALL TABLES IN SCHEMA bsc, bsc_meta FROM bsc_runtime, bsc_authenticator;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA bsc FROM bsc_runtime, bsc_authenticator;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA bsc, bsc_api, bsc_auth FROM bsc_runtime, bsc_authenticator;
GRANT USAGE ON SCHEMA bsc_api TO bsc_runtime;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA bsc_api TO bsc_runtime;
GRANT USAGE ON SCHEMA bsc_auth TO bsc_authenticator;
GRANT EXECUTE ON FUNCTION bsc_auth.lookup_account(text) TO bsc_authenticator;
-- Isolation in this application database, not in any other/shared database.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SELECT format('REVOKE CREATE, TEMPORARY ON DATABASE %I FROM PUBLIC, bsc_runtime, bsc_authenticator', current_database()) \gexec
COMMIT;

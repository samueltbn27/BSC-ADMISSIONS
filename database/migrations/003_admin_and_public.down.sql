-- Revert migration 003: drop new functions, the announcements table, and
-- restore the original audit log allowlists.

DROP FUNCTION bsc_api.delete_announcement(uuid, uuid);
DROP FUNCTION bsc_api.list_announcements(uuid);
DROP FUNCTION bsc_api.get_account(uuid, uuid);
DROP FUNCTION bsc_api.get_document(uuid, uuid);
DROP FUNCTION bsc_api.update_announcement(uuid, uuid, text, text, boolean);
DROP FUNCTION bsc_api.create_announcement(uuid, text, text, boolean);
DROP FUNCTION bsc_api.list_published_announcements();
DROP FUNCTION bsc_api.list_applicants(uuid, text, integer, integer);
DROP FUNCTION bsc_api.list_audit_logs(uuid, integer, integer);
DROP FUNCTION bsc_api.list_users(uuid, text, integer, integer);
DROP FUNCTION bsc_api.update_major(uuid, smallint, text, text, boolean);
DROP FUNCTION bsc_api.create_major(uuid, text, text, text);
DROP FUNCTION bsc_api.list_majors(uuid);
DROP FUNCTION bsc_api.update_period(uuid, uuid, text, text, timestamptz, timestamptz, boolean);
DROP FUNCTION bsc_api.create_period(uuid, text, text, timestamptz, timestamptz, boolean);
DROP FUNCTION bsc_api.list_periods(uuid);
DROP FUNCTION bsc_api.get_my_profile(uuid);

DROP TABLE bsc.school_announcements;

DO $$
DECLARE cname text;
BEGIN
    SELECT conname INTO cname FROM pg_constraint
        WHERE conrelid = 'bsc.audit_logs'::regclass AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%entity_type IN%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE bsc.audit_logs DROP CONSTRAINT %I', cname);
    END IF;
    SELECT conname INTO cname FROM pg_constraint
        WHERE conrelid = 'bsc.audit_logs'::regclass AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%action IN%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE bsc.audit_logs DROP CONSTRAINT %I', cname);
    END IF;
END $$;
ALTER TABLE bsc.audit_logs ADD CONSTRAINT audit_logs_action_check CHECK (
    action IN ('account_created', 'account_updated', 'profile_saved', 'application_created',
        'major_changed', 'status_changed', 'document_uploaded', 'document_verified',
        'application_verified', 'result_saved', 'result_published', 'password_changed')
);
ALTER TABLE bsc.audit_logs ADD CONSTRAINT audit_logs_entity_type_check CHECK (
    entity_type IN ('user', 'profile', 'application', 'document', 'result')
);

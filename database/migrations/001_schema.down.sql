-- Refuse to destroy business data, even when the operator requests a rollback.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM bsc.users) OR EXISTS (SELECT 1 FROM bsc.admission_periods) THEN
        RAISE EXCEPTION 'Rollback refused: business data exists; use a forward migration';
    END IF;
END;
$$;
-- The schema is exclusively owned by this migration; no shared/public objects.
DROP SCHEMA bsc CASCADE;

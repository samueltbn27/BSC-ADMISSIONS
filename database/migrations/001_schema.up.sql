-- PostgreSQL 18. Database objects belong to the deployment/migration role.
CREATE SCHEMA bsc;
REVOKE ALL ON SCHEMA bsc FROM PUBLIC;
-- Per-schema REVOKE cannot remove PostgreSQL's global PUBLIC EXECUTE default.
-- The dedicated migration role owns only this application's objects.
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE bsc.roles (
    code text PRIMARY KEY CHECK (code IN ('applicant', 'committee', 'admin')),
    name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80)
);

CREATE TABLE bsc.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role_code text NOT NULL DEFAULT 'applicant' REFERENCES bsc.roles(code) ON DELETE RESTRICT ON UPDATE RESTRICT,
    account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'closed')),
    password_changed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT email_normalized CHECK (email = lower(btrim(email)) AND length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
    -- Only the backend produces/verifies these hashes. Format checking is not hashing.
    CONSTRAINT password_argon2id CHECK (CASE
        WHEN length(password_hash) BETWEEN 90 AND 512 AND password_hash ~ '^\$argon2id\$v=19\$m=[0-9]+,t=[0-9]+,p=[0-9]+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
        THEN substring(split_part(split_part(password_hash, '$', 4), ',', 1) FROM 3)::numeric BETWEEN 19456 AND 1048576
            AND substring(split_part(split_part(password_hash, '$', 4), ',', 2) FROM 3)::numeric BETWEEN 2 AND 20
            AND substring(split_part(split_part(password_hash, '$', 4), ',', 3) FROM 3)::numeric BETWEEN 1 AND 16
        ELSE false END)
);
CREATE INDEX users_role_idx ON bsc.users(role_code);

CREATE TABLE bsc.applicant_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES bsc.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 150),
    birthplace text CHECK (length(btrim(birthplace)) BETWEEN 1 AND 100),
    birth_date date CHECK (birth_date >= DATE '1900-01-01'),
    gender text CHECK (gender IN ('L', 'P')),
    address text CHECK (length(btrim(address)) BETWEEN 1 AND 1000),
    phone text CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bsc.majors (
    id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9]{1,15}$' AND code <> 'TKJT'),
    name text NOT NULL UNIQUE CHECK (length(btrim(name)) BETWEEN 1 AND 150),
    description text CHECK (length(description) <= 2000),
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE bsc.admission_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    academic_year text NOT NULL CHECK (academic_year ~ '^[0-9]{4}/[0-9]{4}$' AND split_part(academic_year, '/', 2)::integer = split_part(academic_year, '/', 1)::integer + 1),
    opens_at timestamptz NOT NULL,
    closes_at timestamptz NOT NULL,
    is_active boolean NOT NULL DEFAULT false,
    UNIQUE (academic_year, name),
    CHECK (closes_at > opens_at)
);

CREATE TABLE bsc.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_profile_id uuid NOT NULL REFERENCES bsc.applicant_profiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    period_id uuid NOT NULL REFERENCES bsc.admission_periods(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    major_id smallint NOT NULL REFERENCES bsc.majors(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    registration_number text GENERATED ALWAYS AS ('BSC-' || upper(replace(id::text, '-', ''))) STORED NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'correction_requested', 'verified', 'selection_in_progress', 'completed', 'withdrawn')),
    submitted_at timestamptz,
    profile_snapshot jsonb CHECK (profile_snapshot IS NULL OR jsonb_typeof(profile_snapshot) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (applicant_profile_id, period_id),
    CHECK ((status = 'draft' AND submitted_at IS NULL) OR (status = 'withdrawn') OR (status NOT IN ('draft', 'withdrawn') AND submitted_at IS NOT NULL AND profile_snapshot IS NOT NULL))
);
CREATE INDEX applications_queue_idx ON bsc.applications(period_id, status, created_at);
CREATE INDEX applications_major_idx ON bsc.applications(major_id);

CREATE TABLE bsc.document_types (
    id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_]{1,39}$'),
    name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    is_required boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    max_size_bytes bigint NOT NULL DEFAULT 5242880 CHECK (max_size_bytes BETWEEN 1 AND 20971520),
    allowed_mime_types text[] NOT NULL DEFAULT ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[],
    CHECK (cardinality(allowed_mime_types) > 0 AND array_position(allowed_mime_types, NULL) IS NULL AND allowed_mime_types <@ ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[])
);

CREATE TABLE bsc.application_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES bsc.applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    document_type_id smallint NOT NULL REFERENCES bsc.document_types(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    storage_key text NOT NULL UNIQUE CHECK (storage_key ~ '^applications/[a-f0-9-]{36}/[a-f0-9-]{36}$'),
    mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 1 AND 20971520),
    verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'correction_requested')),
    revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_id, document_type_id),
    UNIQUE (id, application_id)
);
CREATE INDEX application_documents_type_idx ON bsc.application_documents(document_type_id);

CREATE TABLE bsc.verification_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES bsc.applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    document_id uuid,
    document_revision integer CHECK (document_revision > 0),
    verified_by uuid NOT NULL REFERENCES bsc.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    status text NOT NULL CHECK (status IN ('approved', 'correction_requested')),
    note text CHECK (length(btrim(note)) BETWEEN 1 AND 1000),
    verified_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (document_id, application_id) REFERENCES bsc.application_documents(id, application_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CHECK (status <> 'correction_requested' OR note IS NOT NULL),
    CHECK ((document_id IS NULL) = (document_revision IS NULL))
);
CREATE INDEX verification_records_application_idx ON bsc.verification_records(application_id, verified_at);
CREATE INDEX verification_records_document_idx ON bsc.verification_records(document_id, application_id);
CREATE INDEX verification_records_actor_idx ON bsc.verification_records(verified_by);

CREATE TABLE bsc.application_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES bsc.applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    previous_status text CHECK (previous_status IN ('draft', 'submitted', 'under_review', 'correction_requested', 'verified', 'selection_in_progress', 'completed', 'withdrawn')),
    new_status text NOT NULL CHECK (new_status IN ('draft', 'submitted', 'under_review', 'correction_requested', 'verified', 'selection_in_progress', 'completed', 'withdrawn')),
    changed_by uuid NOT NULL REFERENCES bsc.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    note text CHECK (length(btrim(note)) BETWEEN 1 AND 1000),
    changed_at timestamptz NOT NULL DEFAULT now(),
    CHECK (previous_status IS DISTINCT FROM new_status)
);
CREATE INDEX application_status_history_application_idx ON bsc.application_status_history(application_id, changed_at);
CREATE INDEX application_status_history_actor_idx ON bsc.application_status_history(changed_by);

CREATE TABLE bsc.selection_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL UNIQUE REFERENCES bsc.applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    outcome text NOT NULL CHECK (outcome IN ('accepted', 'waitlisted', 'rejected')),
    note text CHECK (length(btrim(note)) BETWEEN 1 AND 1000),
    announcement_at timestamptz NOT NULL,
    published_at timestamptz,
    decided_by uuid NOT NULL REFERENCES bsc.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (published_at IS NULL OR published_at >= announcement_at)
);
CREATE INDEX selection_results_actor_idx ON bsc.selection_results(decided_by);

CREATE TABLE bsc.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid NOT NULL REFERENCES bsc.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    action text NOT NULL CHECK (action IN ('account_created', 'account_updated', 'profile_saved', 'application_created', 'major_changed', 'status_changed', 'document_uploaded', 'document_verified', 'application_verified', 'result_saved', 'result_published', 'password_changed')),
    entity_type text NOT NULL CHECK (entity_type IN ('user', 'profile', 'application', 'document', 'result')),
    entity_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_actor_idx ON bsc.audit_logs(actor_id, occurred_at);
CREATE INDEX audit_logs_entity_idx ON bsc.audit_logs(entity_type, entity_id, occurred_at);

CREATE FUNCTION bsc.touch_updated_at() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;
DO $$
DECLARE tab text;
BEGIN
    FOREACH tab IN ARRAY ARRAY['users', 'applicant_profiles', 'applications', 'selection_results'] LOOP
        EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON bsc.%I FOR EACH ROW EXECUTE FUNCTION bsc.touch_updated_at()', tab);
    END LOOP;
END;
$$;

CREATE FUNCTION bsc.validate_profile() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF NEW.birth_date > CURRENT_DATE OR NOT EXISTS (SELECT 1 FROM bsc.users WHERE id = NEW.user_id AND role_code = 'applicant') THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Invalid applicant profile';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER validate_profile BEFORE INSERT OR UPDATE ON bsc.applicant_profiles
FOR EACH ROW EXECUTE FUNCTION bsc.validate_profile();

CREATE FUNCTION bsc.validate_document() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF NEW.storage_key NOT LIKE 'applications/' || NEW.application_id::text || '/%' OR NOT EXISTS (
        SELECT 1 FROM bsc.document_types WHERE id = NEW.document_type_id AND is_active
        AND NEW.mime_type = ANY(allowed_mime_types) AND NEW.size_bytes <= max_size_bytes
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Invalid document metadata';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER validate_document BEFORE INSERT OR UPDATE ON bsc.application_documents
FOR EACH ROW EXECUTE FUNCTION bsc.validate_document();

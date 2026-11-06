-- All public operations receive an actor resolved by a trusted backend session.
-- Never pass an actor from a browser field. No end-user connects to PostgreSQL.
CREATE SCHEMA bsc_api;
REVOKE ALL ON SCHEMA bsc_api FROM PUBLIC;

CREATE FUNCTION bsc._role(actor uuid) RETURNS text LANGUAGE plpgsql
SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE result text;
BEGIN
    SELECT role_code INTO result FROM bsc.users WHERE id = actor AND account_status = 'active' FOR SHARE;
    IF result IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN result;
END;
$$;

CREATE FUNCTION bsc._application(actor uuid, app_id uuid) RETURNS bsc.applications LANGUAGE plpgsql
SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications; actor_role text;
BEGIN
    actor_role := bsc._role(actor);
    SELECT * INTO app FROM bsc.applications WHERE id = app_id FOR UPDATE;
    IF app.id IS NULL OR (actor_role = 'applicant' AND NOT EXISTS (
        SELECT 1 FROM bsc.applicant_profiles WHERE id = app.applicant_profile_id AND user_id = actor
    )) THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN app;
END;
$$;

CREATE FUNCTION bsc._audit(actor uuid, event text, kind text, target uuid) RETURNS void LANGUAGE sql
SET search_path = pg_catalog, bsc, pg_temp AS $$
    INSERT INTO bsc.audit_logs(actor_id, action, entity_type, entity_id) VALUES (actor, event, kind, target);
$$;

CREATE FUNCTION bsc._transition(actor uuid, app_id uuid, target_status text, reason text) RETURNS void LANGUAGE plpgsql
SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE old_status text;
BEGIN
    SELECT status INTO STRICT old_status FROM bsc.applications WHERE id = app_id FOR UPDATE;
    UPDATE bsc.applications SET status = target_status,
        submitted_at = CASE WHEN target_status = 'submitted' THEN coalesce(submitted_at, now()) ELSE submitted_at END,
        profile_snapshot = CASE WHEN target_status = 'submitted' THEN (
            SELECT to_jsonb(p) - ARRAY['id', 'user_id', 'created_at', 'updated_at'] FROM bsc.applicant_profiles p
            WHERE p.id = bsc.applications.applicant_profile_id
        ) ELSE profile_snapshot END
        WHERE id = app_id;
    INSERT INTO bsc.application_status_history(application_id, previous_status, new_status, changed_by, note)
        VALUES (app_id, old_status, target_status, actor, reason);
    PERFORM bsc._audit(actor, 'status_changed', 'application', app_id);
END;
$$;

CREATE FUNCTION bsc_api.register_account(p_email text, p_password_hash text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE result uuid;
BEGIN
    INSERT INTO bsc.users(email, password_hash) VALUES (lower(btrim(p_email)), p_password_hash) RETURNING id INTO result;
    PERFORM bsc._audit(result, 'account_created', 'user', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.save_profile(p_actor uuid, p_full_name text, p_birthplace text, p_birth_date date, p_gender text, p_address text, p_phone text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE result uuid;
BEGIN
    IF bsc._role(p_actor) <> 'applicant' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    -- Serialize profile saves and application creation, including an absent profile.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text, 0));
    PERFORM 1 FROM bsc.applications a JOIN bsc.applicant_profiles p ON p.id = a.applicant_profile_id
        WHERE p.user_id = p_actor ORDER BY a.id FOR UPDATE OF a;
    IF EXISTS (SELECT 1 FROM bsc.applications a JOIN bsc.applicant_profiles p ON p.id = a.applicant_profile_id
        WHERE p.user_id = p_actor AND a.status NOT IN ('draft', 'correction_requested', 'withdrawn', 'completed')) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Profile is locked by an active application';
    END IF;
    INSERT INTO bsc.applicant_profiles(user_id, full_name, birthplace, birth_date, gender, address, phone)
        VALUES (p_actor, btrim(p_full_name), p_birthplace, p_birth_date, p_gender, p_address, p_phone)
        ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, birthplace = EXCLUDED.birthplace,
            birth_date = EXCLUDED.birth_date, gender = EXCLUDED.gender, address = EXCLUDED.address, phone = EXCLUDED.phone
        RETURNING id INTO result;
    PERFORM bsc._audit(p_actor, 'profile_saved', 'profile', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.create_application(p_actor uuid, p_period uuid, p_major smallint) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE profile_id uuid; result uuid;
BEGIN
    IF bsc._role(p_actor) <> 'applicant' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text, 0));
    SELECT id INTO profile_id FROM bsc.applicant_profiles WHERE user_id = p_actor;
    IF profile_id IS NULL OR NOT EXISTS (SELECT 1 FROM bsc.admission_periods
        WHERE id = p_period AND is_active AND now() >= opens_at AND now() < closes_at) OR NOT EXISTS (
        SELECT 1 FROM bsc.majors WHERE id = p_major AND is_active
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Application requirements not met';
    END IF;
    INSERT INTO bsc.applications(applicant_profile_id, period_id, major_id)
        VALUES (profile_id, p_period, p_major) RETURNING id INTO result;
    INSERT INTO bsc.application_status_history(application_id, previous_status, new_status, changed_by)
        VALUES (result, NULL, 'draft', p_actor);
    PERFORM bsc._audit(p_actor, 'application_created', 'application', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.change_major(p_actor uuid, p_application uuid, p_major smallint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications;
BEGIN
    app := bsc._application(p_actor, p_application);
    IF bsc._role(p_actor) <> 'applicant' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF app.status NOT IN ('draft', 'correction_requested') OR NOT EXISTS (SELECT 1 FROM bsc.majors WHERE id = p_major AND is_active) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Application is not editable';
    END IF;
    UPDATE bsc.applications SET major_id = p_major WHERE id = p_application;
    PERFORM bsc._audit(p_actor, 'major_changed', 'application', p_application);
END;
$$;

CREATE FUNCTION bsc_api.put_document(p_actor uuid, p_application uuid, p_type smallint, p_storage_key text, p_mime_type text, p_size_bytes bigint) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications; result uuid;
BEGIN
    app := bsc._application(p_actor, p_application);
    IF bsc._role(p_actor) <> 'applicant' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF app.status NOT IN ('draft', 'correction_requested') THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Application is not editable';
    END IF;
    -- Each replacement receives a fresh private object key, resetting verification.
    IF EXISTS (SELECT 1 FROM bsc.application_documents WHERE application_id = p_application AND document_type_id = p_type AND storage_key = p_storage_key) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'A replacement requires a new storage key';
    END IF;
    INSERT INTO bsc.application_documents(application_id, document_type_id, storage_key, mime_type, size_bytes)
        VALUES (p_application, p_type, p_storage_key, p_mime_type, p_size_bytes)
        ON CONFLICT (application_id, document_type_id) DO UPDATE SET storage_key = EXCLUDED.storage_key,
            mime_type = EXCLUDED.mime_type, size_bytes = EXCLUDED.size_bytes, verification_status = 'pending',
            revision = bsc.application_documents.revision + 1, uploaded_at = now()
        RETURNING id INTO result;
    PERFORM bsc._audit(p_actor, 'document_uploaded', 'document', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.change_application_status(p_actor uuid, p_application uuid, p_status text, p_note text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications; actor_role text;
BEGIN
    app := bsc._application(p_actor, p_application);
    actor_role := bsc._role(p_actor);
    IF actor_role = 'applicant' THEN
        IF p_status = 'submitted' AND app.status IN ('draft', 'correction_requested') THEN
            IF NOT EXISTS (SELECT 1 FROM bsc.admission_periods WHERE id = app.period_id AND is_active AND now() >= opens_at AND now() < closes_at)
                OR NOT EXISTS (SELECT 1 FROM bsc.majors WHERE id = app.major_id AND is_active)
                OR NOT EXISTS (SELECT 1 FROM bsc.applicant_profiles WHERE id = app.applicant_profile_id
                    AND birthplace IS NOT NULL AND birth_date IS NOT NULL AND gender IS NOT NULL AND address IS NOT NULL AND phone IS NOT NULL)
                OR EXISTS (SELECT 1 FROM bsc.document_types t WHERE t.is_active AND t.is_required AND NOT EXISTS (
                    SELECT 1 FROM bsc.application_documents d WHERE d.application_id = p_application AND d.document_type_id = t.id
                )) THEN
                RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Submission requirements not met';
            END IF;
        ELSIF p_status = 'withdrawn' AND app.status IN ('draft', 'submitted', 'correction_requested') THEN
            NULL;
        ELSE
            RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Status transition denied';
        END IF;
    ELSIF actor_role IN ('committee', 'admin') THEN
        IF NOT ((app.status = 'submitted' AND p_status = 'under_review')
            OR (app.status = 'under_review' AND p_status IN ('verified', 'correction_requested'))
            OR (app.status = 'verified' AND p_status = 'selection_in_progress')) THEN
            RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Status transition denied';
        END IF;
        IF p_status = 'correction_requested' AND nullif(btrim(p_note), '') IS NULL THEN
            RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'A correction note is required';
        END IF;
        IF p_status = 'verified' AND (
            EXISTS (SELECT 1 FROM bsc.application_documents WHERE application_id = p_application AND verification_status <> 'approved')
            OR EXISTS (SELECT 1 FROM bsc.document_types t WHERE t.is_active AND t.is_required AND NOT EXISTS (
                SELECT 1 FROM bsc.application_documents d WHERE d.application_id = p_application AND d.document_type_id = t.id AND d.verification_status = 'approved'
            ))
        ) THEN
            RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Documents must be approved';
        END IF;
        IF p_status IN ('verified', 'correction_requested') THEN
            INSERT INTO bsc.verification_records(application_id, verified_by, status, note)
                VALUES (p_application, p_actor, CASE WHEN p_status = 'verified' THEN 'approved' ELSE p_status END, p_note);
            PERFORM bsc._audit(p_actor, 'application_verified', 'application', p_application);
        END IF;
    END IF;
    PERFORM bsc._transition(p_actor, p_application, p_status, p_note);
END;
$$;

CREATE FUNCTION bsc_api.verify_document(p_actor uuid, p_document uuid, p_status text, p_note text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app_id uuid; app bsc.applications;
BEGIN
    IF bsc._role(p_actor) NOT IN ('committee', 'admin') THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    SELECT application_id INTO app_id FROM bsc.application_documents WHERE id = p_document;
    app := bsc._application(p_actor, app_id);
    IF app.status <> 'under_review' THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Application is not under review';
    END IF;
    INSERT INTO bsc.verification_records(application_id, document_id, document_revision, verified_by, status, note)
        SELECT app_id, p_document, revision, p_actor, p_status, p_note FROM bsc.application_documents WHERE id = p_document;
    UPDATE bsc.application_documents SET verification_status = p_status WHERE id = p_document;
    PERFORM bsc._audit(p_actor, 'document_verified', 'document', p_document);
END;
$$;

CREATE FUNCTION bsc_api.save_selection_result(p_actor uuid, p_application uuid, p_outcome text, p_note text, p_announcement_at timestamptz) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications; result uuid;
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    app := bsc._application(p_actor, p_application);
    IF app.status <> 'selection_in_progress' OR EXISTS (SELECT 1 FROM bsc.selection_results WHERE application_id = p_application AND published_at IS NOT NULL) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Result is not editable';
    END IF;
    INSERT INTO bsc.selection_results(application_id, outcome, note, announcement_at, decided_by)
        VALUES (p_application, p_outcome, p_note, p_announcement_at, p_actor)
        ON CONFLICT (application_id) DO UPDATE SET outcome = EXCLUDED.outcome, note = EXCLUDED.note,
            announcement_at = EXCLUDED.announcement_at, decided_by = p_actor
        RETURNING id INTO result;
    PERFORM bsc._audit(p_actor, 'result_saved', 'result', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.publish_selection_result(p_actor uuid, p_application uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications; result uuid;
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    app := bsc._application(p_actor, p_application);
    IF app.status <> 'selection_in_progress' THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Application is not in selection';
    END IF;
    UPDATE bsc.selection_results SET published_at = now()
        WHERE application_id = p_application AND published_at IS NULL AND announcement_at <= now() RETURNING id INTO result;
    IF result IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Result is not ready for publication';
    END IF;
    PERFORM bsc._transition(p_actor, p_application, 'completed', NULL);
    PERFORM bsc._audit(p_actor, 'result_published', 'result', result);
END;
$$;

CREATE FUNCTION bsc_api.get_application(p_actor uuid, p_application uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE app bsc.applications; actor_role text; result jsonb;
BEGIN
    actor_role := bsc._role(p_actor);
    SELECT * INTO app FROM bsc.applications WHERE id = p_application;
    IF app.id IS NULL OR (actor_role = 'applicant' AND NOT EXISTS (
        SELECT 1 FROM bsc.applicant_profiles WHERE id = app.applicant_profile_id AND user_id = p_actor
    )) THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    SELECT jsonb_build_object('application', to_jsonb(app) - 'profile_snapshot',
        'profile', CASE WHEN app.status IN ('draft', 'correction_requested') THEN to_jsonb(p) - ARRAY['id', 'user_id', 'created_at', 'updated_at']
            ELSE coalesce(app.profile_snapshot, to_jsonb(p) - ARRAY['id', 'user_id', 'created_at', 'updated_at']) END,
        'documents', coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM bsc.application_documents d WHERE d.application_id = app.id), '[]'::jsonb),
        'history', coalesce((SELECT jsonb_agg(to_jsonb(h) ORDER BY h.changed_at, h.id) FROM bsc.application_status_history h WHERE h.application_id = app.id), '[]'::jsonb),
        'verifications', coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.verified_at, v.id) FROM bsc.verification_records v WHERE v.application_id = app.id), '[]'::jsonb),
        'selection_result', (SELECT to_jsonb(r) FROM bsc.selection_results r WHERE r.application_id = app.id
            AND (actor_role = 'admin' OR (r.published_at IS NOT NULL AND r.announcement_at <= now() AND r.published_at <= now()))))
    INTO result FROM bsc.applicant_profiles p WHERE p.id = app.applicant_profile_id;
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.list_applications(p_actor uuid, p_period uuid DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (id uuid, registration_number text, period_id uuid, major_id smallint, status text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE actor_role text;
BEGIN
    actor_role := bsc._role(p_actor);
    IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid pagination';
    END IF;
    RETURN QUERY SELECT a.id, a.registration_number, a.period_id, a.major_id, a.status, a.created_at
        FROM bsc.applications a JOIN bsc.applicant_profiles p ON p.id = a.applicant_profile_id
        WHERE (actor_role IN ('committee', 'admin') OR p.user_id = p_actor) AND (p_period IS NULL OR a.period_id = p_period)
        ORDER BY a.created_at DESC, a.id LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE FUNCTION bsc_api.get_catalog() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
    SELECT jsonb_build_object(
        'majors', coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.code) FROM bsc.majors m WHERE m.is_active), '[]'::jsonb),
        'periods', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.opens_at) FROM bsc.admission_periods p WHERE p.is_active), '[]'::jsonb),
        'document_types', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.code) FROM bsc.document_types t WHERE t.is_active), '[]'::jsonb));
$$;

CREATE FUNCTION bsc_api.manage_account(p_actor uuid, p_user uuid, p_role text, p_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' OR p_actor = p_user THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF EXISTS (SELECT 1 FROM bsc.applicant_profiles WHERE user_id = p_user) AND p_role <> 'applicant' THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Applicant role is bound to a profile';
    END IF;
    UPDATE bsc.users SET role_code = p_role, account_status = p_status WHERE id = p_user;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    PERFORM bsc._audit(p_actor, 'account_updated', 'user', p_user);
END;
$$;

CREATE FUNCTION bsc_api.replace_password_hash(p_actor uuid, p_password_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    PERFORM bsc._role(p_actor);
    UPDATE bsc.users SET password_hash = p_password_hash, password_changed_at = now() WHERE id = p_actor;
    PERFORM bsc._audit(p_actor, 'password_changed', 'user', p_actor);
END;
$$;

-- A separate authentication DB login gets this single capability, not table access.
CREATE SCHEMA bsc_auth;
REVOKE ALL ON SCHEMA bsc_auth FROM PUBLIC;
CREATE FUNCTION bsc_auth.lookup_account(p_email text)
RETURNS TABLE (id uuid, password_hash text, role_code text, account_status text, password_changed_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
    SELECT u.id, u.password_hash, u.role_code, u.account_status, u.password_changed_at
        FROM bsc.users u WHERE u.email = lower(btrim(p_email));
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA bsc, bsc_api, bsc_auth FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA bsc FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA bsc FROM PUBLIC;

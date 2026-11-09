-- Incremental migration 003: admin operations, public announcements, and
-- read helpers that the full-stack backend needs. All new functions keep the
-- secured pattern: SECURITY DEFINER, fixed search_path, actor resolved server-side.
-- No existing table is altered structurally; only the audit action allowlist is
-- extended so new administrative actions can be recorded.

-- ---------------------------------------------------------------------------
-- 1. Extend audit log allowlists (incremental constraint changes).
-- ---------------------------------------------------------------------------
DO $$
DECLARE cname text;
BEGIN
    FOR cname IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'bsc.audit_logs'::regclass AND contype = 'c'
          AND pg_get_constraintdef(oid) ~ 'action|entity_type'
    LOOP
        EXECUTE format('ALTER TABLE bsc.audit_logs DROP CONSTRAINT %I', cname);
    END LOOP;
END $$;
ALTER TABLE bsc.audit_logs ADD CONSTRAINT audit_logs_action_check CHECK (
    action IN ('account_created', 'account_updated', 'profile_saved', 'application_created',
        'major_changed', 'status_changed', 'document_uploaded', 'document_verified',
        'application_verified', 'result_saved', 'result_published', 'password_changed',
        'period_created', 'period_updated', 'major_created', 'major_updated',
        'announcement_created', 'announcement_updated', 'announcement_deleted')
);
ALTER TABLE bsc.audit_logs ADD CONSTRAINT audit_logs_entity_type_check CHECK (
    entity_type IN ('user', 'profile', 'application', 'document', 'result',
        'period', 'major', 'announcement')
);

-- ---------------------------------------------------------------------------
-- 2. Public announcements table.
-- ---------------------------------------------------------------------------
CREATE TABLE bsc.school_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
    body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 10000),
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_by uuid NOT NULL REFERENCES bsc.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (NOT is_published OR published_at IS NOT NULL)
);
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON bsc.school_announcements
FOR EACH ROW EXECUTE FUNCTION bsc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. New API functions.
-- ---------------------------------------------------------------------------

-- Own profile (applicant only). Returns NULL when no profile exists yet.
CREATE FUNCTION bsc_api.get_my_profile(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'applicant' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN (SELECT to_jsonb(p) - ARRAY['id', 'user_id', 'created_at', 'updated_at']
        FROM bsc.applicant_profiles p WHERE p.user_id = p_actor);
END;
$$;

-- All periods (admin only). The public catalog already exposes active periods.
CREATE FUNCTION bsc_api.list_periods(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.opens_at DESC)
        FROM bsc.admission_periods p), '[]'::jsonb);
END;
$$;

CREATE FUNCTION bsc_api.create_period(p_actor uuid, p_name text, p_academic_year text,
    p_opens_at timestamptz, p_closes_at timestamptz, p_is_active boolean) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE result uuid;
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF p_academic_year !~ '^[0-9]{4}/[0-9]{4}$'
        OR split_part(p_academic_year, '/', 2)::integer <> split_part(p_academic_year, '/', 1)::integer + 1
        OR p_closes_at <= p_opens_at THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Invalid period schedule';
    END IF;
    INSERT INTO bsc.admission_periods(name, academic_year, opens_at, closes_at, is_active)
        VALUES (btrim(p_name), p_academic_year, p_opens_at, p_closes_at, p_is_active)
        RETURNING id INTO result;
    PERFORM bsc._audit(p_actor, 'period_created', 'period', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.update_period(p_actor uuid, p_period uuid, p_name text, p_academic_year text,
    p_opens_at timestamptz, p_closes_at timestamptz, p_is_active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF p_academic_year !~ '^[0-9]{4}/[0-9]{4}$'
        OR split_part(p_academic_year, '/', 2)::integer <> split_part(p_academic_year, '/', 1)::integer + 1
        OR p_closes_at <= p_opens_at THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Invalid period schedule';
    END IF;
    UPDATE bsc.admission_periods SET name = btrim(p_name), academic_year = p_academic_year,
        opens_at = p_opens_at, closes_at = p_closes_at, is_active = p_is_active
        WHERE id = p_period;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    PERFORM bsc._audit(p_actor, 'period_updated', 'period', p_period);
END;
$$;

-- All majors (admin only). Public catalog exposes active majors only.
CREATE FUNCTION bsc_api.list_majors(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.code) FROM bsc.majors m), '[]'::jsonb);
END;
$$;

CREATE FUNCTION bsc_api.create_major(p_actor uuid, p_code text, p_name text, p_description text)
RETURNS smallint LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE result smallint;
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    INSERT INTO bsc.majors(code, name, description)
        VALUES (upper(btrim(p_code)), btrim(p_name), nullif(btrim(p_description), ''))
        RETURNING id INTO result;
    PERFORM bsc._audit(p_actor, 'major_created', 'major', md5('major:' || result)::uuid);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.update_major(p_actor uuid, p_major smallint, p_name text,
    p_description text, p_is_active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    UPDATE bsc.majors SET name = btrim(p_name), description = nullif(btrim(p_description), ''),
        is_active = p_is_active WHERE id = p_major;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    PERFORM bsc._audit(p_actor, 'major_updated', 'major', md5('major:' || p_major)::uuid);
END;
$$;

-- User listing for admin (never exposes password hashes).
CREATE FUNCTION bsc_api.list_users(p_actor uuid, p_role text DEFAULT NULL,
    p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (id uuid, email text, role_code text, account_status text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid pagination';
    END IF;
    RETURN QUERY SELECT u.id, u.email, u.role_code, u.account_status, u.created_at
        FROM bsc.users u
        WHERE (p_role IS NULL OR u.role_code = p_role)
        ORDER BY u.created_at DESC, u.id LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Audit log listing for admin.
CREATE FUNCTION bsc_api.list_audit_logs(p_actor uuid, p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0)
RETURNS TABLE (occurred_at timestamptz, actor_id uuid, action text, entity_type text, entity_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 200 OR p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid pagination';
    END IF;
    RETURN QUERY SELECT l.occurred_at, l.actor_id, l.action, l.entity_type, l.entity_id
        FROM bsc.audit_logs l
        ORDER BY l.occurred_at DESC, l.id LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Applicant search for committee/admin (no email exposure; latest application joined).
CREATE FUNCTION bsc_api.list_applicants(p_actor uuid, p_search text DEFAULT NULL,
    p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (user_id uuid, full_name text, phone text, application_id uuid,
    reg_no text, st text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) NOT IN ('committee', 'admin') THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid pagination';
    END IF;
    RETURN QUERY SELECT p.user_id, p.full_name, p.phone,
        a.id, a.registration_number, a.status, p.created_at
        FROM bsc.applicant_profiles p
        LEFT JOIN LATERAL (
            SELECT ap.id, ap.registration_number, ap.status
            FROM bsc.applications ap
            WHERE ap.applicant_profile_id = p.id
            ORDER BY ap.created_at DESC, ap.id LIMIT 1
        ) a ON true
        WHERE (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%'
            OR a.registration_number ILIKE '%' || p_search || '%')
        ORDER BY p.created_at DESC, p.id LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Public announcements (no actor; runtime pool may call).
CREATE FUNCTION bsc_api.list_published_announcements() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
    SELECT coalesce((SELECT jsonb_agg(to_jsonb(a) - ARRAY['created_by', 'created_at', 'updated_at', 'is_published'] ORDER BY a.published_at DESC)
        FROM bsc.school_announcements a WHERE a.is_published AND a.published_at <= now()), '[]'::jsonb);
$$;

CREATE FUNCTION bsc_api.create_announcement(p_actor uuid, p_title text, p_body text,
    p_publish boolean) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE result uuid;
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    INSERT INTO bsc.school_announcements(title, body, is_published, published_at, created_by)
        VALUES (btrim(p_title), btrim(p_body), p_publish,
            CASE WHEN p_publish THEN now() ELSE NULL END, p_actor)
        RETURNING id INTO result;
    PERFORM bsc._audit(p_actor, 'announcement_created', 'announcement', result);
    RETURN result;
END;
$$;

CREATE FUNCTION bsc_api.update_announcement(p_actor uuid, p_id uuid, p_title text,
    p_body text, p_publish boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    UPDATE bsc.school_announcements SET title = btrim(p_title), body = btrim(p_body),
        is_published = p_publish,
        published_at = CASE WHEN p_publish THEN coalesce(published_at, now()) ELSE NULL END
        WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    PERFORM bsc._audit(p_actor, 'announcement_updated', 'announcement', p_id);
END;
$$;

CREATE FUNCTION bsc_api.delete_announcement(p_actor uuid, p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    DELETE FROM bsc.school_announcements WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    PERFORM bsc._audit(p_actor, 'announcement_deleted', 'announcement', p_id);
END;
$$;

-- Single document lookup with the same ownership/role rules as get_application.
CREATE FUNCTION bsc_api.get_document(p_actor uuid, p_document uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
DECLARE actor_role text; app_id uuid;
BEGIN
    actor_role := bsc._role(p_actor);
    SELECT application_id INTO app_id FROM bsc.application_documents WHERE id = p_document;
    IF app_id IS NULL OR (actor_role = 'applicant' AND NOT EXISTS (
        SELECT 1 FROM bsc.applications a JOIN bsc.applicant_profiles p ON p.id = a.applicant_profile_id
        WHERE a.id = app_id AND p.user_id = p_actor
    )) THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN (SELECT to_jsonb(d) FROM bsc.application_documents d WHERE d.id = p_document);
END;
$$;

-- Single account lookup for admin management (never exposes hashes).
CREATE FUNCTION bsc_api.get_account(p_actor uuid, p_user uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN (SELECT to_jsonb(u) - 'password_hash' FROM bsc.users u WHERE u.id = p_user);
END;
$$;

-- All announcements for admin (including drafts).
CREATE FUNCTION bsc_api.list_announcements(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, bsc, pg_temp AS $$
BEGIN
    IF bsc._role(p_actor) <> 'admin' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Access denied';
    END IF;
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC)
        FROM bsc.school_announcements a), '[]'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Grants for the new functions (runtime capability).
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION bsc_api.get_my_profile(uuid) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.get_document(uuid, uuid) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.get_account(uuid, uuid) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_announcements(uuid) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_periods(uuid) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.create_period(uuid, text, text, timestamptz, timestamptz, boolean) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.update_period(uuid, uuid, text, text, timestamptz, timestamptz, boolean) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_majors(uuid) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.create_major(uuid, text, text, text) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.update_major(uuid, smallint, text, text, boolean) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_users(uuid, text, integer, integer) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_audit_logs(uuid, integer, integer) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_applicants(uuid, text, integer, integer) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.list_published_announcements() TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.create_announcement(uuid, text, text, boolean) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.update_announcement(uuid, uuid, text, text, boolean) TO bsc_runtime;
GRANT EXECUTE ON FUNCTION bsc_api.delete_announcement(uuid, uuid) TO bsc_runtime;

\set ON_ERROR_STOP on
BEGIN;
-- Helpers exist only inside this rolled-back transaction, never in production.
CREATE SCHEMA bsc_tests;
GRANT USAGE ON SCHEMA bsc_tests TO bsc_runtime, bsc_authenticator;
CREATE FUNCTION bsc_tests.ok(condition boolean, label text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
    IF condition IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
    RETURN 'PASS: ' || label;
END;
$$;
CREATE FUNCTION bsc_tests.reject(statement text, expected text, label text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
    BEGIN
        EXECUTE statement;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS actual = RETURNED_SQLSTATE;
    END;
    IF actual IS DISTINCT FROM expected THEN
        RAISE EXCEPTION 'FAIL: % (expected %, received %)', label, expected, coalesce(actual, 'success');
    END IF;
    RETURN 'PASS: ' || label;
END;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA bsc_tests TO bsc_runtime, bsc_authenticator;
\if :{?migration_owner}
\else
SELECT current_user AS migration_owner \gset
\endif
SET ROLE :"migration_owner";
CREATE FUNCTION bsc_api.future_acl_probe() RETURNS integer LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog, bsc, pg_temp AS $$ SELECT 1; $$;
RESET ROLE;
SELECT bsc_tests.ok(NOT has_function_privilege('bsc_runtime', 'bsc_api.future_acl_probe()', 'EXECUTE'), 'new functions do not inherit PUBLIC EXECUTE');
SELECT bsc_tests.ok((SELECT count(*) = 3 FROM bsc.roles), 'idempotent role seed');
SELECT bsc_tests.ok((SELECT count(*) = 5 FROM bsc.majors), 'idempotent five-major seed');
SELECT bsc_tests.ok((SELECT count(*) = 4 FROM bsc.document_types), 'idempotent document-type seed');
SELECT bsc_tests.ok(NOT EXISTS (SELECT 1 FROM bsc.users), 'reference seed creates no credentialed accounts');
SELECT bsc_tests.ok((SELECT code = 'TJKT' FROM bsc.majors WHERE name = 'Teknik Jaringan Komputer dan Telekomunikasi'), 'canonical TJKT');
SELECT bsc_tests.reject($q$INSERT INTO bsc.majors(code, name) VALUES ('TKJT', 'Duplicate alias')$q$, '23514', 'reject TKJT alias');
SELECT bsc_tests.reject($q$INSERT INTO bsc.users(email,password_hash) VALUES ('user@example.test','plaintext')$q$, '23514', 'reject plaintext passwords');
SELECT bsc_tests.reject($q$INSERT INTO bsc.admission_periods(name,academic_year,opens_at,closes_at) VALUES ('Bad','2026/2028',now(),now()+interval '1 day')$q$, '23514', 'reject invalid academic year');
SELECT bsc_tests.reject($q$INSERT INTO bsc.admission_periods(name,academic_year,opens_at,closes_at) VALUES ('Bad','2026/2027',now(),now())$q$, '23514', 'reject reversed period');

\set alice '00000000-0000-4000-8000-000000000001'
\set bob '00000000-0000-4000-8000-000000000002'
\set committee '00000000-0000-4000-8000-000000000003'
\set admin '00000000-0000-4000-8000-000000000004'
\set period '00000000-0000-4000-8000-000000000005'
-- Syntactic PHC fixture only, not a usable/known password or a hashing test.
SELECT '$argon2id$v=19$m=65536,t=3,p=1$' || repeat('A',22) || '$' || repeat('B',43) AS fixture_hash \gset
INSERT INTO bsc.users(id,email,password_hash,role_code) VALUES
    (:'alice','alice@example.test',:'fixture_hash','applicant'),
    (:'bob','bob@example.test',:'fixture_hash','applicant'),
    (:'committee','committee@example.test',:'fixture_hash','committee'),
    (:'admin','admin@example.test',:'fixture_hash','admin');
INSERT INTO bsc.admission_periods(id,name,academic_year,opens_at,closes_at,is_active)
    VALUES (:'period','Synthetic intake','2026/2027', now()-interval '1 day',now()+interval '1 day',true);
SELECT id AS major FROM bsc.majors WHERE code='TJKT' \gset
SELECT id AS diploma FROM bsc.document_types WHERE code='graduation_proof' \gset
SELECT id AS family FROM bsc.document_types WHERE code='family_card' \gset
SELECT id AS photo FROM bsc.document_types WHERE code='photo' \gset
SELECT bsc_tests.reject(format('INSERT INTO bsc.users(id,email,password_hash) VALUES (%L,%L,%L)', :'alice','other@example.test',:'fixture_hash'), '23505', 'primary key uniqueness');
SELECT bsc_tests.reject(format('INSERT INTO bsc.applicant_profiles(user_id,full_name) VALUES (%L,%L)', 'ffffffff-ffff-4fff-8fff-ffffffffffff','Synthetic'), '23514', 'profile ownership requires applicant account');
SELECT bsc_tests.reject(format('INSERT INTO bsc.applicant_profiles(user_id,full_name) VALUES (%L,%L)', :'committee','Synthetic'), '23514', 'committee cannot own applicant profile');

SET ROLE bsc_runtime;
SELECT bsc_tests.reject('SELECT * FROM bsc.users', '42501', 'runtime cannot read credential table');
SELECT bsc_tests.reject('DELETE FROM bsc.audit_logs', '42501', 'runtime cannot delete audit records');
SELECT bsc_tests.reject('UPDATE bsc.applications SET status=''completed''', '42501', 'runtime cannot bypass workflow');
SELECT bsc_tests.reject('SELECT bsc._role(NULL)', '42501', 'private helpers inaccessible');
SELECT bsc_tests.reject($q$SELECT bsc_auth.lookup_account('alice@example.test')$q$, '42501', 'runtime cannot fetch password hashes');
SELECT bsc_tests.reject(format('SELECT bsc_api.register_account(%L,%L)', ' ALICE@EXAMPLE.TEST ',:'fixture_hash'), '23505', 'normalized email duplicates rejected');
SELECT bsc_tests.reject(format('SELECT bsc_api.register_account(%L,%L)', 'a b@example.test',:'fixture_hash'), '23514', 'invalid email rejected');
SELECT bsc_tests.reject(format('SELECT bsc_api.register_account(%L,%L)', 'weak@example.test', replace(:'fixture_hash', 'm=65536', 'm=1')), '23514', 'weak Argon2 memory parameter rejected');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_profile(%L,%L,NULL,NULL,NULL,NULL,NULL)', :'committee','Synthetic'), '42501', 'staff cannot use applicant write operation');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_profile(%L,%L,NULL,CURRENT_DATE+1,NULL,NULL,NULL)', :'alice','Synthetic'), '23514', 'future birth date rejected');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_profile(%L,%L,NULL,NULL,NULL,NULL,%L)', :'alice','Synthetic','bad-phone'), '23514', 'phone validation');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_profile(%L,%L,NULL,NULL,%L,NULL,NULL)', :'alice','Synthetic','invalid'), '23514', 'gender validation');
SELECT bsc_api.save_profile(:'alice','Synthetic Alice','Kota Simulasi','2010-01-01','P','Alamat sintetis 1','+6281234567890') AS alice_profile \gset
SELECT bsc_api.save_profile(:'bob','Synthetic Bob','Kota Simulasi','2010-02-02','L','Alamat sintetis 2','+6281234567891') AS bob_profile \gset
SELECT bsc_api.create_application(:'alice',:'period',:major::smallint) AS app \gset
SELECT bsc_api.create_application(:'bob',:'period',:major::smallint) AS bob_app \gset
SELECT bsc_tests.reject(format('SELECT bsc_api.create_application(%L,%L,%L::smallint)', :'alice',:'period',:major), '23505', 'one application per applicant per period');
SELECT bsc_tests.reject(format('SELECT bsc_api.get_application(%L,%L)', :'bob',:'app'), '42501', 'cross-applicant read denied');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_major(%L,%L,%L::smallint)', :'bob',:'app',:major), '42501', 'cross-applicant write denied');
SELECT bsc_tests.reject(format('SELECT bsc_api.get_application(NULL,%L)', :'app'), '42501', 'unauthenticated actor denied');
SELECT bsc_tests.ok((SELECT count(*) = 1 FROM bsc_api.list_applications(:'alice')), 'applicant list ownership');
SELECT bsc_tests.ok((SELECT count(*) = 2 FROM bsc_api.list_applications(:'committee')), 'committee queue');
SELECT bsc_tests.reject(format('SELECT bsc_api.list_applications(%L,NULL,101)', :'alice'), '22023', 'pagination bounded');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_application_status(%L,%L,%L)', :'alice',:'app','completed'), '42501', 'applicant cannot self-approve');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_application_status(%L,%L,%L,%L)', :'alice',:'app','withdrawn',repeat('x',1001)), '23514', 'invalid history note aborts transition');
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')->'application'->>'status' = 'draft', 'failed history insert rolls back status update atomically');
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')::text NOT LIKE '%password_hash%', 'application read excludes credential fields');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_application_status(%L,%L,%L)', :'alice',:'app','submitted'), '23514', 'missing required documents reject submission');
SELECT bsc_tests.reject(format('SELECT bsc_api.put_document(%L,%L,%L::smallint,%L,%L,100)', :'alice',:'app',:diploma,'https://public.example/file','application/pdf'), '23514', 'public URL rejected');
SELECT bsc_tests.reject(format('SELECT bsc_api.put_document(%L,%L,%L::smallint,%L,%L,100)', :'alice',:'app',:photo,'applications/'||:'app'||'/'||gen_random_uuid(),'application/pdf'), '23514', 'per-type MIME restrictions');
SELECT bsc_tests.reject(format('SELECT bsc_api.put_document(%L,%L,%L::smallint,%L,%L,6000000)', :'alice',:'app',:diploma,'applications/'||:'app'||'/'||gen_random_uuid(),'application/pdf'), '23514', 'per-type size limit');
SELECT bsc_api.put_document(:'alice',:'app',:diploma::smallint,'applications/'||:'app'||'/'||gen_random_uuid(),'application/pdf',100::bigint) AS doc \gset
SELECT bsc_api.put_document(:'alice',:'app',:family::smallint,'applications/'||:'app'||'/'||gen_random_uuid(),'application/pdf',100::bigint) AS doc_family \gset
SELECT bsc_api.put_document(:'alice',:'app',:photo::smallint,'applications/'||:'app'||'/'||gen_random_uuid(),'image/jpeg',100::bigint) AS doc_photo \gset
SELECT bsc_api.change_application_status(:'alice',:'app','submitted');
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')->'application'->>'status' = 'submitted', 'submission updates status');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_profile(%L,%L,NULL,NULL,NULL,NULL,NULL)', :'alice','Changed'), '23514', 'submitted profile locked');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_major(%L,%L,%L::smallint)', :'alice',:'app',:major), '23514', 'submitted major locked');
SELECT bsc_tests.reject(format('SELECT bsc_api.verify_document(%L,%L,%L)', :'alice',:'doc','approved'), '42501', 'applicant cannot verify documents');
SELECT bsc_api.change_application_status(:'committee',:'app','under_review');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_application_status(%L,%L,%L)', :'committee',:'app','verified'), '23514', 'unapproved documents block verification');
SELECT bsc_tests.reject(format('SELECT bsc_api.verify_document(%L,%L,%L)', :'committee',:'doc','correction_requested'), '23514', 'document correction requires note');
SELECT bsc_api.verify_document(:'committee',:'doc','correction_requested','Unggah ulang dokumen sintetis.');
SELECT bsc_api.change_application_status(:'committee',:'app','correction_requested','Perbaiki bukti kelulusan.');
SELECT bsc_api.put_document(:'alice',:'app',:diploma::smallint,'applications/'||:'app'||'/'||gen_random_uuid(),'application/pdf',200::bigint) AS replacement \gset
SELECT bsc_tests.ok(:'replacement' = :'doc', 'document slot retains identity on replacement');
SELECT bsc_api.change_application_status(:'alice',:'app','submitted');
SELECT bsc_api.change_application_status(:'committee',:'app','under_review');
SELECT bsc_api.verify_document(:'committee',:'doc','approved');
SELECT bsc_api.verify_document(:'committee',:'doc_family','approved');
SELECT bsc_api.verify_document(:'committee',:'doc_photo','approved');
SELECT bsc_api.change_application_status(:'committee',:'app','verified');
SELECT bsc_api.change_application_status(:'committee',:'app','selection_in_progress');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_selection_result(%L,%L,%L,NULL,now())', :'committee',:'app','accepted'), '42501', 'committee cannot decide selection');
SELECT bsc_api.save_selection_result(:'admin',:'app','accepted','Hasil sintetis.',now()+interval '1 day') AS result \gset
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')->'selection_result' = 'null'::jsonb, 'unpublished result hidden from owner');
SELECT bsc_tests.ok(bsc_api.get_application(:'committee',:'app')->'selection_result' = 'null'::jsonb, 'unpublished result hidden from committee');
SELECT bsc_tests.ok(bsc_api.get_application(:'admin',:'app')->'selection_result'->>'outcome' = 'accepted', 'admin can review unpublished result');
SELECT bsc_tests.reject(format('SELECT bsc_api.publish_selection_result(%L,%L)', :'admin',:'app'), '23514', 'announcement schedule enforced');
SELECT bsc_api.save_selection_result(:'admin',:'app','accepted','Hasil sintetis.',now());
SELECT bsc_api.publish_selection_result(:'admin',:'app');
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')->'selection_result'->>'outcome' = 'accepted', 'published result visible to owner');
SELECT bsc_tests.reject(format('SELECT bsc_api.get_application(%L,%L)', :'bob',:'app'), '42501', 'published result remains private');
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')->'application'->>'status' = 'completed', 'publication and final status atomic');
SELECT bsc_tests.reject(format('SELECT bsc_api.save_selection_result(%L,%L,%L,NULL,now())', :'admin',:'app','rejected'), '23514', 'published result immutable');
SELECT bsc_api.save_profile(:'alice','Updated Synthetic Alice','Kota Baru','2010-01-01','P','Alamat baru','+6281234567890');
SELECT bsc_tests.ok(bsc_api.get_application(:'alice',:'app')->'profile'->>'full_name' = 'Synthetic Alice', 'archived form preserves submitted profile snapshot');
SELECT bsc_tests.reject(format('SELECT bsc_api.manage_account(%L,%L,%L,%L)', :'alice',:'alice','admin','active'), '42501', 'applicant cannot escalate role');
SELECT bsc_tests.reject(format('SELECT bsc_api.manage_account(%L,%L,%L,%L)', :'committee',:'bob','admin','active'), '42501', 'committee cannot manage roles');
SELECT bsc_tests.reject(format('SELECT bsc_api.manage_account(%L,%L,%L,%L)', :'admin',:'bob','committee','active'), '23514', 'profile ownership role cannot drift');
SELECT bsc_api.manage_account(:'admin',:'bob','applicant','suspended');
SELECT bsc_tests.reject(format('SELECT bsc_api.get_application(%L,%L)', :'bob',:'bob_app'), '42501', 'suspended account denied');
SELECT bsc_api.manage_account(:'admin',:'bob','applicant','active');
SELECT bsc_api.change_application_status(:'bob',:'bob_app','withdrawn');
SELECT bsc_tests.reject(format('SELECT bsc_api.change_application_status(%L,%L,%L)', :'bob',:'bob_app','submitted'), '42501', 'withdrawn application terminal');

-- Parameterized prepared query: SQL metacharacters remain a single value.
PREPARE injection_probe(text, text) AS SELECT bsc_api.register_account($1, $2);
SELECT bsc_tests.reject(format('EXECUTE injection_probe(%L,%L)', 'x'';DROP SCHEMA bsc CASCADE;--', :'fixture_hash'), '23514', 'SQL injection payload rejected as data');
DEALLOCATE injection_probe;
RESET ROLE;

SELECT bsc_tests.ok((SELECT count(*) = 12 FROM information_schema.tables WHERE table_schema='bsc' AND table_type='BASE TABLE'), 'twelve core tables remain intact');
SELECT bsc_tests.ok((SELECT verification_status = 'approved' AND revision = 2 FROM bsc.application_documents WHERE id=:'doc'), 'replacement increments revision then reverified');
SELECT bsc_tests.ok((SELECT array_agg(document_revision ORDER BY document_revision) = ARRAY[1,2] FROM bsc.verification_records WHERE document_id=:'doc'), 'historical verification retains document revision');
SELECT bsc_tests.ok((SELECT count(*) = 9 FROM bsc.application_status_history WHERE application_id=:'app'), 'status history complete including creation and correction');
SELECT bsc_tests.ok(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='bsc' AND table_name='audit_logs' AND column_name IN ('password_hash','email','note','payload')), 'audit excludes credentials and PII payloads');
SELECT bsc_tests.reject(format('INSERT INTO bsc.applications(applicant_profile_id,period_id,major_id) VALUES (%L,%L,32767)', :'alice_profile',gen_random_uuid()), '23503', 'application foreign keys enforced');
SELECT bsc_tests.reject(format('UPDATE bsc.applications SET status=%L WHERE id=%L', 'invalid',:'app'), '23514', 'status domain enforced');
SELECT bsc_tests.reject(format('INSERT INTO bsc.verification_records(application_id,document_id,document_revision,verified_by,status) VALUES (%L,%L,1,%L,%L)', :'bob_app',:'doc',:'committee','approved'), '23503', 'composite FK prevents cross-application document verification');
SELECT bsc_tests.reject(format('DELETE FROM bsc.majors WHERE id=%L', :major), '23001', 'referenced major deletion restricted');
SELECT bsc_tests.reject(format('DELETE FROM bsc.users WHERE id=%L', :'alice'), '23001', 'referenced owner deletion restricted');

SET ROLE bsc_authenticator;
SELECT bsc_tests.ok((SELECT count(*) = 1 FROM bsc_auth.lookup_account('ALICE@EXAMPLE.TEST')), 'auth lookup normalizes email');
SELECT bsc_tests.reject('SELECT * FROM bsc.users', '42501', 'auth role cannot read table directly');
SELECT bsc_tests.reject('SELECT bsc_api.get_catalog()', '42501', 'auth role separated from application capability');
RESET ROLE;
ROLLBACK;

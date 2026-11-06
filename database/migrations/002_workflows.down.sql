DROP SCHEMA bsc_auth CASCADE;
DROP SCHEMA bsc_api CASCADE;
DROP FUNCTION bsc._transition(uuid, uuid, text, text);
DROP FUNCTION bsc._audit(uuid, text, text, uuid);
DROP FUNCTION bsc._application(uuid, uuid);
DROP FUNCTION bsc._role(uuid);

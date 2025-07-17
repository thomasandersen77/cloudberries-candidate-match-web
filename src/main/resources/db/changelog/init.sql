-- File: setup_user.sql
-- Description: Creates the 'test_user' role and grants necessary permissions for the application.

-- 1. Create the role with login credentials.
--    IMPORTANT: Use a strong password, preferably from a secret manager.
CREATE ROLE test_user WITH LOGIN PASSWORD 'test_password';

-- 2. Grant connection rights to the target database.
GRANT CONNECT ON DATABASE candidatematch TO test_user;

-- 3. Grant schema-level permissions.
GRANT USAGE ON SCHEMA public TO test_user;

-- 4. Grant permissions on existing tables, sequences, and functions.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO test_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO test_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO test_user;

-- 5. Grant permissions on FUTURE tables, sequences, and functions for the 'test_user' role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO test_user;
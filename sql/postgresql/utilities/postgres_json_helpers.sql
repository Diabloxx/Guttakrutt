-- PostgreSQL JSON Helper Functions
-- Creates utility functions for working with JSON data in PostgreSQL

-- Function to safely extract a text value from a JSONB field
CREATE OR REPLACE FUNCTION json_extract_text(data JSONB, path TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN data #>> string_to_array(path, '.');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to safely extract a numeric value from a JSONB field
CREATE OR REPLACE FUNCTION json_extract_numeric(data JSONB, path TEXT)
RETURNS NUMERIC AS $$
DECLARE
    extracted TEXT;
BEGIN
    extracted := data #>> string_to_array(path, '.');
    RETURN extracted::NUMERIC;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to safely extract a boolean value from a JSONB field
CREATE OR REPLACE FUNCTION json_extract_boolean(data JSONB, path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    extracted TEXT;
BEGIN
    extracted := data #>> string_to_array(path, '.');
    
    -- Handle various boolean representations
    IF extracted IS NULL THEN
        RETURN NULL;
    ELSIF extracted = 'true' OR extracted = 't' OR extracted = '1' THEN
        RETURN TRUE;
    ELSIF extracted = 'false' OR extracted = 'f' OR extracted = '0' THEN
        RETURN FALSE;
    ELSE
        RETURN NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to safely merge two JSONB objects
CREATE OR REPLACE FUNCTION json_safe_merge(original JSONB, update_data JSONB)
RETURNS JSONB AS $$
BEGIN
    IF original IS NULL THEN
        RETURN update_data;
    ELSIF update_data IS NULL THEN
        RETURN original;
    ELSE
        RETURN original || update_data;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN original;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage:
--
-- SELECT json_extract_text('{"user": {"name": "John", "age": 30}}'::JSONB, 'user.name');
-- -- Returns: 'John'
--
-- SELECT json_extract_numeric('{"score": 85.5}'::JSONB, 'score');
-- -- Returns: 85.5
--
-- SELECT json_extract_boolean('{"active": true}'::JSONB, 'active');
-- -- Returns: TRUE
--
-- SELECT json_safe_merge('{"a": 1, "b": 2}'::JSONB, '{"b": 3, "c": 4}'::JSONB);
-- -- Returns: {"a": 1, "b": 3, "c": 4}
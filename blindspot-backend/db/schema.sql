-- Supabase Schema for Blindspot

CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    origin_city TEXT,
    destination_city TEXT,
    decision_text TEXT,
    score INTEGER,
    grade TEXT,
    axes JSONB,
    timeline JSONB,
    blindspots JSONB,
    advisory_flag BOOLEAN,
    raw_data JSONB,
    share_uuid UUID DEFAULT gen_random_uuid()
);

-- Note: In Supabase, you might want to add Row Level Security (RLS) policies 
-- to ensure session_id can only access its own data.

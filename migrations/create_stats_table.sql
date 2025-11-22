-- ===================================
-- Create Stats Table
-- Run this in Supabase SQL Editor
-- ===================================

CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key TEXT UNIQUE NOT NULL,
  base_value INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial values (base numbers)
INSERT INTO stats (stat_key, base_value) VALUES
  ('unique_events', 31),
  ('lanyards_delivered', 4246),
  ('complaints', 0)
ON CONFLICT (stat_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stats_stat_key ON stats(stat_key);

-- RLS Decision:
-- Option 1: Disable RLS (Recommended for internal stats table)
-- The stats table is only accessed server-side with service role key
-- No need for RLS since it's not user-facing
ALTER TABLE stats DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS enabled with policy (if you want extra security)
-- Uncomment below if you prefer to keep RLS enabled:
-- ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role can manage stats" ON stats
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);


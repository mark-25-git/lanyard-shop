-- ===================================
-- Create Increment Stat Function (Optional - for atomic updates)
-- Run this in Supabase SQL Editor if you want atomic increments
-- ===================================

CREATE OR REPLACE FUNCTION increment_stat(
  stat_key TEXT,
  increment_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE stats
  SET 
    base_value = base_value + increment_amount,
    last_updated = NOW()
  WHERE stats.stat_key = increment_stat.stat_key;
  
  -- If stat doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO stats (stat_key, base_value, last_updated)
    VALUES (increment_stat.stat_key, increment_amount, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;



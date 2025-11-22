-- Migration: Add event_or_organization_name column to orders table
-- Run this in Supabase SQL Editor if you have an existing database

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS event_or_organization_name TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN orders.event_or_organization_name IS 'Optional event title or organization name provided by the customer during checkout';





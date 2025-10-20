-- Add sports_location_id to matches table to link with sports_locations
-- This will allow us to display full address information without duplicating data

ALTER TABLE matches 
ADD COLUMN sports_location_id UUID REFERENCES sports_locations(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_matches_sports_location_id ON matches(sports_location_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN matches.sports_location_id IS 'Foreign key to sports_locations table for full address information';

-- Note: We keep location_name, latitude, longitude for backward compatibility
-- and for cases where a match location is not in sports_locations table
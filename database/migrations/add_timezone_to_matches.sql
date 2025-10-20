-- Add timezone column to matches table
-- This will store the timezone where the match was created (organizer's timezone)

ALTER TABLE matches 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Madrid';

-- Update existing matches to have a default timezone
UPDATE matches 
SET timezone = 'Europe/Madrid' 
WHERE timezone IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN matches.timezone IS 'IANA timezone identifier for the match (e.g., Europe/Madrid, America/Argentina/Buenos_Aires)';

-- Create index for timezone queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_matches_timezone ON matches(timezone);
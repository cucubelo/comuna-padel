-- Add expires_at column to match_invitations table
-- This will allow invitations to have an expiration time

ALTER TABLE match_invitations 
ADD COLUMN expires_at TIMESTAMPTZ;

-- Set default expiration time for existing invitations (24 hours from created_at)
UPDATE match_invitations 
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;

-- Make expires_at NOT NULL for future records
ALTER TABLE match_invitations 
ALTER COLUMN expires_at SET NOT NULL;

-- Add index for efficient querying of expired invitations
CREATE INDEX idx_match_invitations_expires_at ON match_invitations(expires_at);

-- Add index for efficient querying of non-expired pending invitations
CREATE INDEX idx_match_invitations_status_expires_at ON match_invitations(status, expires_at);
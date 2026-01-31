-- Add column to track last processed Traccar position ID
ALTER TABLE traccar_devices 
ADD COLUMN IF NOT EXISTS last_traccar_position_id BIGINT;

-- Add column to track last Traccar fix time (backup for duplicate detection)
ALTER TABLE traccar_devices 
ADD COLUMN IF NOT EXISTS last_traccar_fix_time TIMESTAMPTZ;
-- Add slot_number column to gap_offers table for numbered slot selection
ALTER TABLE public.gap_offers ADD COLUMN IF NOT EXISTS slot_number INTEGER;

-- Add batch_id to group offers sent in the same SMS batch to a pupil
ALTER TABLE public.gap_offers ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Add index for efficient lookup by phone + slot number
CREATE INDEX IF NOT EXISTS idx_gap_offers_phone_slot ON public.gap_offers (pupil_phone, slot_number, status);
-- Migration 017: Add level pricing constraints and audit columns
-- Ensures prices are positive, tracked, and auditable

-- Ensure price column exists and add constraints
ALTER TABLE public.assessment_levels
ADD COLUMN IF NOT EXISTS price_per_token DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_currency TEXT DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS price_updated_by UUID;

-- Drop old price column if it exists and migrate data
ALTER TABLE public.assessment_levels
RENAME COLUMN IF EXISTS price TO price_per_token;

-- Add check constraint to ensure prices are non-negative
ALTER TABLE public.assessment_levels
DROP CONSTRAINT IF EXISTS price_must_be_positive,
ADD CONSTRAINT price_must_be_positive CHECK (price_per_token >= 0);

-- Index for price lookups
CREATE INDEX IF NOT EXISTS idx_assessment_levels_price
ON public.assessment_levels(price_per_token);

-- Seed default prices if not already set
UPDATE public.assessment_levels
SET price_per_token = CASE 
  WHEN name = 'Beginner' THEN 100.00
  WHEN name = 'Intermediate' THEN 150.00
  WHEN name = 'Advanced' THEN 200.00
  ELSE price_per_token
END,
price_currency = 'NGN',
price_updated_at = NOW()
WHERE price_per_token = 0 OR price_per_token IS NULL;

DO $$ BEGIN
  RAISE NOTICE 'Migration 017 complete: Level pricing configured with NGN currency and validation constraints.';
END $$;

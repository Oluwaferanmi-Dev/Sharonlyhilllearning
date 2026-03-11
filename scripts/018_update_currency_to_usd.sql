-- Migration 018: Update token pricing currency from NGN to USD
-- Changes all pricing to use USD as the standard currency

-- Update default currency for new levels
ALTER TABLE assessment_levels 
ALTER COLUMN price_currency SET DEFAULT 'USD';

-- Update all existing levels to use USD
UPDATE assessment_levels 
SET price_currency = 'USD' 
WHERE price_currency = 'NGN' OR price_currency IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN assessment_levels.price_currency IS 'Currency for token pricing. Standard: USD';

-- Verify update
SELECT id, name, price_per_token, price_currency FROM assessment_levels ORDER BY order_index;

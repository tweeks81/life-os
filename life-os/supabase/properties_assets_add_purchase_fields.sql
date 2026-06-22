-- Add purchase price and purchased_from to property_assets
ALTER TABLE property_assets
  ADD COLUMN IF NOT EXISTS purchase_price numeric,
  ADD COLUMN IF NOT EXISTS purchased_from text;

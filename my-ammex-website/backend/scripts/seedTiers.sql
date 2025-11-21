-- Seed default tiers (Bronze, Silver, Gold, Platinum)
-- Run after createTierSchema if you want manual inserts.

INSERT INTO "Tier" (name, discount_percent, min_spend, priority, is_active, "createdAt", "updatedAt")
VALUES
  ('Bronze',   0.00,      0,      1, TRUE, NOW(), NOW()),
  ('Silver',  10.00,  10000,      2, TRUE, NOW(), NOW()),
  ('Gold',    20.00,  50000,      3, TRUE, NOW(), NOW()),
  ('Platinum',30.00, 100000,      4, TRUE, NOW(), NOW())
ON CONFLICT (name) DO UPDATE
SET
  discount_percent = EXCLUDED.discount_percent,
  min_spend        = EXCLUDED.min_spend,
  priority         = EXCLUDED.priority,
  is_active        = EXCLUDED.is_active,
  "updatedAt"      = NOW();



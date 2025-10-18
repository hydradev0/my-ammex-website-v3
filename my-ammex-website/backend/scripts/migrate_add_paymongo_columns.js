/*
  One-off migration to add PayMongo-related columns and extend Payment.status enum.
  Uses DATABASE_URL from .env via pg.
*/

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log('Connected to Postgres. Applying PayMongo migration...');

    // Extend enum_Payment_status with new values if missing
    const enumSql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid
    WHERE t.typname='enum_Payment_status' AND e.enumlabel='pending_payment'
  ) THEN
    ALTER TYPE "enum_Payment_status" ADD VALUE 'pending_payment';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid
    WHERE t.typname='enum_Payment_status' AND e.enumlabel='processing'
  ) THEN
    ALTER TYPE "enum_Payment_status" ADD VALUE 'processing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid
    WHERE t.typname='enum_Payment_status' AND e.enumlabel='succeeded'
  ) THEN
    ALTER TYPE "enum_Payment_status" ADD VALUE 'succeeded';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid
    WHERE t.typname='enum_Payment_status' AND e.enumlabel='failed'
  ) THEN
    ALTER TYPE "enum_Payment_status" ADD VALUE 'failed';
  END IF;
END $$;
`;

    // Add gateway columns if missing
    const colsSql = `
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gateway_provider"   VARCHAR(255);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gateway_payment_id" VARCHAR(255);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gateway_status"     VARCHAR(255);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gateway_metadata"   JSONB;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failure_code"       VARCHAR(255);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failure_message"    TEXT;
`;

    await client.query('BEGIN');
    await client.query(enumSql);
    await client.query(colsSql);
    await client.query('COMMIT');
    console.log('PayMongo migration completed successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();



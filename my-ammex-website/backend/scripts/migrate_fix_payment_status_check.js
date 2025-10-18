/*
  Fix Payment.status CHECK constraint to allow gateway statuses.
*/
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log('Connected. Adjusting Payment.status CHECK constraint...');

    // Drop existing check constraint if present, then add a new inclusive one
    const sql = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'Payment'
      AND constraint_name = 'Payment_status_check'
  ) THEN
    ALTER TABLE "Payment" DROP CONSTRAINT "Payment_status_check";
  END IF;
END $$;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_status_check"
  CHECK (status IN (
    'pending_payment','processing','succeeded','failed',
    'pending_approval','approved','rejected'
  ));
`;

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Constraint updated successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Update failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();



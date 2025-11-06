/**
 * Cleanup Script: Remove Duplicate Payment Receipts
 * 
 * This script finds and removes duplicate payment receipts,
 * keeping only the first one created for each payment.
 * 
 * Usage: node scripts/cleanupDuplicateReceipts.js
 */

const { getModels, getSequelize, connectDB } = require('../config/db');
const { Op } = require('sequelize');

async function cleanupDuplicateReceipts() {
  console.log('🧹 Starting duplicate receipts cleanup...\n');
  
  try {
    // Initialize database connection
    await connectDB();
    
    const { PaymentReceipt } = getModels();
    const sequelize = getSequelize();
    
    // Step 1: Find all payment IDs that have duplicate receipts
    const duplicates = await sequelize.query(`
      SELECT 
        payment_id,
        COUNT(*) as receipt_count,
        ARRAY_AGG(id ORDER BY created_at ASC) as receipt_ids
      FROM "PaymentReceipt"
      GROUP BY payment_id
      HAVING COUNT(*) > 1
      ORDER BY payment_id;
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate receipts found! Database is clean.');
      return;
    }
    
    console.log(`📊 Found ${duplicates.length} payments with duplicate receipts:\n`);
    
    let totalDeleted = 0;
    
    // Step 2: Process each duplicate set
    for (const dup of duplicates) {
      const paymentId = dup.payment_id;
      const receiptIds = dup.receipt_ids;
      const keepId = receiptIds[0]; // Keep the first (oldest) receipt
      const deleteIds = receiptIds.slice(1); // Delete the rest
      
      console.log(`Payment ID ${paymentId}:`);
      console.log(`  - Total receipts: ${dup.receipt_count}`);
      console.log(`  - Keeping receipt ID: ${keepId}`);
      console.log(`  - Deleting receipt IDs: ${deleteIds.join(', ')}`);
      
      // Fetch details of receipts being deleted
      const receiptsToDelete = await PaymentReceipt.findAll({
        where: { id: { [Op.in]: deleteIds } },
        attributes: ['id', 'receiptNumber', 'amount', 'createdAt']
      });
      
      receiptsToDelete.forEach(r => {
        console.log(`    ❌ Deleting: ${r.receiptNumber} (₱${r.amount}) - ${r.createdAt}`);
      });
      
      // Delete duplicate receipts
      const deleted = await PaymentReceipt.destroy({
        where: { id: { [Op.in]: deleteIds } }
      });
      
      totalDeleted += deleted;
      console.log(`  ✅ Deleted ${deleted} duplicate receipt(s)\n`);
    }
    
    // Step 3: Summary
    console.log('='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Payments with duplicates: ${duplicates.length}`);
    console.log(`Total receipts deleted: ${totalDeleted}`);
    console.log('='.repeat(60));
    console.log('\n✅ Cleanup complete!');
    
    // Step 4: Verify no duplicates remain
    const remaining = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT payment_id
        FROM "PaymentReceipt"
        GROUP BY payment_id
        HAVING COUNT(*) > 1
      ) as dupes;
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (remaining[0].count === '0') {
      console.log('✅ Verification passed: No duplicates remain!');
    } else {
      console.warn('⚠️ Warning: Some duplicates may still exist. Re-run the script.');
    }
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  }
}

// Dry run function - shows what would be deleted without actually deleting
async function dryRunCleanup() {
  console.log('🔍 DRY RUN - No changes will be made\n');
  
  try {
    // Initialize database connection
    await connectDB();
    
    const sequelize = getSequelize();
    
    const duplicates = await sequelize.query(`
      SELECT 
        payment_id,
        COUNT(*) as receipt_count,
        ARRAY_AGG(id ORDER BY created_at ASC) as receipt_ids,
        ARRAY_AGG(receipt_number ORDER BY created_at ASC) as receipt_numbers,
        ARRAY_AGG(created_at ORDER BY created_at ASC) as created_dates
      FROM "PaymentReceipt"
      GROUP BY payment_id
      HAVING COUNT(*) > 1
      ORDER BY payment_id;
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate receipts found!');
      return;
    }
    
    console.log(`📊 Found ${duplicates.length} payments with duplicate receipts:\n`);
    
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. Payment ID ${dup.payment_id}:`);
      console.log(`   - Total receipts: ${dup.receipt_count}`);
      console.log(`   - Receipt numbers: ${dup.receipt_numbers.join(', ')}`);
      console.log(`   - Would KEEP: ${dup.receipt_numbers[0]} (oldest)`);
      console.log(`   - Would DELETE: ${dup.receipt_numbers.slice(1).join(', ')}\n`);
    });
    
    console.log('='.repeat(60));
    console.log('This was a DRY RUN - no changes were made');
    console.log('Run without --dry-run flag to actually delete duplicates');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Dry run failed:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  
  const runScript = isDryRun ? dryRunCleanup() : cleanupDuplicateReceipts();
  
  runScript
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateReceipts, dryRunCleanup };


const { connectDB, getModels } = require('../config/db');

const testHookDirectly = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const { Item } = getModels();
    if (!Item) {
      console.log('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔔 Testing database hook directly...');

    // Find an item to test with
    const testItem = await Item.findOne({
      where: { isActive: true }
    });

    if (!testItem) {
      console.log('❌ No active items found to test with');
      return;
    }

    console.log(`📦 Testing with item: ${testItem.itemName} (ID: ${testItem.id})`);
    console.log(`📊 Current stock: ${testItem.quantity}, Min level: ${testItem.minLevel}, Max level: ${testItem.maxLevel}`);

    const originalQuantity = testItem.quantity;

    // Test 1: Set to low stock using Sequelize update (this should trigger the hook)
    console.log('\n🔔 Test 1: Low Stock (Using Sequelize update)');
    const lowStockQuantity = Math.max(0, testItem.minLevel - 1);
    console.log(`📉 Updating quantity from ${originalQuantity} to ${lowStockQuantity}...`);
    
    // This should trigger the afterUpdate hook
    await testItem.update({ quantity: lowStockQuantity });
    console.log('✅ Item updated via Sequelize - hook should have been triggered!');
    
    // Wait a moment for the hook to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Set to high stock (if maxLevel is set)
    if (testItem.maxLevel && testItem.maxLevel > 0) {
      console.log('\n🔔 Test 2: High Stock (Using Sequelize update)');
      const highStockQuantity = testItem.maxLevel + 5;
      console.log(`📈 Updating quantity from ${lowStockQuantity} to ${highStockQuantity}...`);
      
      // This should trigger the afterUpdate hook
      await testItem.update({ quantity: highStockQuantity });
      console.log('✅ Item updated via Sequelize - hook should have been triggered!');
      
      // Wait a moment for the hook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('\n⚠️  Test 2: Skipped (no maxLevel set for this item)');
    }

    // Restore original quantity
    console.log('\n🔄 Restoring original quantity...');
    await testItem.update({ quantity: originalQuantity });
    console.log(`✅ Restored quantity to ${originalQuantity}`);

    console.log('\n✅ Hook test completed!');
    console.log('🔔 Check the console logs above to see if the hook was triggered.');
    console.log('📋 If you see the hook logs, the notifications should have been created.');

  } catch (error) {
    console.error('❌ Error testing hook:', error);
  }
};

testHookDirectly();

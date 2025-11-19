import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/Product.js';

// Load environment variables
dotenv.config();

/**
 * Utility script to recalculate totalStockValue for all products
 * This fixes the issue where products were updated with findByIdAndUpdate
 * which bypassed the pre-save hook
 */
const recalculateStockValues = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to database');

    // Fetch all products
    const products = await Product.find({});
    console.log(`\nFound ${products.length} products`);
    console.log('Starting recalculation...\n');

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const product of products) {
      const oldValue = product.totalStockValue;

      // Calculate correct value
      let newValue;
      if (product.baseUnitType === 'grams') {
        newValue = (product.stockBaseUnit / 1000) * product.costPrice;
      } else {
        newValue = product.stockBaseUnit * product.costPrice;
      }

      // Update if different
      if (Math.abs(oldValue - newValue) > 0.01) {
        product.totalStockValue = newValue;
        await product.save();
        updatedCount++;

        console.log(`✓ Updated: ${product.name}`);
        console.log(`  Stock: ${product.baseUnitType === 'grams' ? (product.stockBaseUnit / 1000).toFixed(2) + ' kg' : product.stockBaseUnit + ' pieces'}`);
        console.log(`  Cost Price: ${product.costPrice.toFixed(2)} TND`);
        console.log(`  Old Value: ${oldValue.toFixed(2)} TND`);
        console.log(`  New Value: ${newValue.toFixed(2)} TND`);
        console.log('');
      } else {
        unchangedCount++;
      }
    }

    console.log('\n================================');
    console.log('RECALCULATION COMPLETE');
    console.log('================================');
    console.log(`Total products: ${products.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Unchanged: ${unchangedCount}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error recalculating stock values:', error);
    process.exit(1);
  }
};

// Run the script
recalculateStockValues();

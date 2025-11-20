import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const findAndRemoveDuplicates = async () => {
  try {
    await connectDB();

    // Get all products
    const products = await Product.find({}).sort({ createdAt: 1 });
    console.log(`\n📊 Total products in database: ${products.length}`);

    // Find duplicates by name (case-insensitive)
    const nameMap = new Map();
    const duplicates = [];

    products.forEach(product => {
      const nameLower = product.name.toLowerCase();
      
      if (nameMap.has(nameLower)) {
        // Duplicate found
        const existing = nameMap.get(nameLower);
        duplicates.push({
          name: product.name,
          existing: existing,
          duplicate: product
        });
      } else {
        nameMap.set(nameLower, product);
      }
    });

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate products found!');
      console.log(`📦 You have ${products.length} unique products.`);
      await mongoose.connection.close();
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} duplicate products:\n`);

    // Display duplicates
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. "${dup.name}"`);
      console.log(`   - Original: ID=${dup.existing._id}, Created=${dup.existing.createdAt}`);
      console.log(`   - Duplicate: ID=${dup.duplicate._id}, Created=${dup.duplicate.createdAt}`);
      console.log(`   - Will delete the duplicate (newer one)\n`);
    });

    // Ask for confirmation (in real script, you can add readline for user input)
    console.log('🗑️  Removing duplicates (keeping the oldest/original product)...\n');

    let deletedCount = 0;
    for (const dup of duplicates) {
      // Delete the duplicate (newer one)
      await Product.findByIdAndDelete(dup.duplicate._id);
      console.log(`✅ Deleted duplicate: "${dup.duplicate.name}" (ID: ${dup.duplicate._id})`);
      deletedCount++;
    }

    console.log(`\n✅ Successfully removed ${deletedCount} duplicate products`);
    
    const remainingProducts = await Product.countDocuments();
    console.log(`📦 Remaining products: ${remainingProducts}`);

    await mongoose.connection.close();
    console.log('\n✅ Done! Database connection closed.');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

findAndRemoveDuplicates();

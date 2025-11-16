import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';

dotenv.config();

const seedData = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // حذف البيانات القديمة
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ تم حذف البيانات القديمة');

    // إنشاء المستخدمين
    const adminPassword = await bcrypt.hash('admin123', 12);
    const cashierPassword = await bcrypt.hash('cashier123', 12);

    const users = await User.insertMany([
      {
        name: 'المدير العام',
        email: 'admin@pos.com',
        passwordHash: adminPassword,
        role: 'admin'
      },
      {
        name: 'كاشير 1',
        email: 'cashier@pos.com',
        passwordHash: cashierPassword,
        role: 'cashier'
      }
    ]);
    console.log('👥 تم إنشاء المستخدمين');

    // إنشاء الفئات
    const categories = await Category.insertMany([
      { name: 'حلويات' },
      { name: 'مشروبات' },
      { name: 'مواد غذائية' },
      { name: 'منتجات الألبان' },
      { name: 'خضروات وفواكه' },
      { name: 'لحوم ودواجن' },
      { name: 'معلبات' },
      { name: 'توابل' }
    ]);
    console.log('📑 تم إنشاء الفئات');

    // إنشاء المنتجات
    const products = [
      // حلويات
      {
        name: 'شوكولاتة نوتيلا',
        categoryId: categories[0]._id,
        productType: ['unit', 'kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 5000,
        minAlertStock: 1000,
        pricePerUnit: 8.500,
        pricePerKg: 45.000,
        costPrice: 35.000,
        cupWeightGrams: 1800
      },
      {
        name: 'بسكويت أوريو',
        categoryId: categories[0]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 100,
        minAlertStock: 20,
        pricePerUnit: 3.500,
        costPrice: 2.500
      },
      {
        name: 'حلوى السمسمية',
        categoryId: categories[0]._id,
        productType: ['kilogram', 'cup'],
        baseUnitType: 'grams',
        stockBaseUnit: 10000,
        minAlertStock: 2000,
        pricePerKg: 25.000,
        pricePerCup: 45.000,
        cupWeightGrams: 1800,
        costPrice: 18.000
      },
      // مشروبات
      {
        name: 'عصير برتقال طبيعي',
        categoryId: categories[1]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 50,
        minAlertStock: 10,
        pricePerUnit: 4.500,
        costPrice: 3.000
      },
      {
        name: 'قهوة تركية',
        categoryId: categories[1]._id,
        productType: ['kilogram', 'cup'],
        baseUnitType: 'grams',
        stockBaseUnit: 8000,
        minAlertStock: 1500,
        pricePerKg: 55.000,
        pricePerCup: 100.000,
        cupWeightGrams: 1800,
        costPrice: 40.000
      },
      {
        name: 'مياه معدنية',
        categoryId: categories[1]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 200,
        minAlertStock: 50,
        pricePerUnit: 0.800,
        costPrice: 0.500
      },
      // مواد غذائية
      {
        name: 'أرز أبيض',
        categoryId: categories[2]._id,
        productType: ['kilogram', 'cup'],
        baseUnitType: 'grams',
        stockBaseUnit: 50000,
        minAlertStock: 10000,
        pricePerKg: 4.500,
        pricePerCup: 8.000,
        cupWeightGrams: 1800,
        costPrice: 3.200
      },
      {
        name: 'معكرونة سباغيتي',
        categoryId: categories[2]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 150,
        minAlertStock: 30,
        pricePerUnit: 2.000,
        costPrice: 1.400
      },
      {
        name: 'زيت زيتون',
        categoryId: categories[2]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 80,
        minAlertStock: 15,
        pricePerUnit: 18.000,
        costPrice: 14.000
      },
      // منتجات الألبان
      {
        name: 'حليب كامل الدسم',
        categoryId: categories[3]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 60,
        minAlertStock: 15,
        pricePerUnit: 2.500,
        costPrice: 1.800
      },
      {
        name: 'جبن موزاريلا',
        categoryId: categories[3]._id,
        productType: ['kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 15000,
        minAlertStock: 3000,
        pricePerKg: 32.000,
        costPrice: 25.000
      },
      {
        name: 'زبادي يوناني',
        categoryId: categories[3]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 40,
        minAlertStock: 10,
        pricePerUnit: 3.200,
        costPrice: 2.400
      },
      // خضروات وفواكه
      {
        name: 'طماطم طازجة',
        categoryId: categories[4]._id,
        productType: ['kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 20000,
        minAlertStock: 5000,
        pricePerKg: 3.500,
        costPrice: 2.000
      },
      {
        name: 'تفاح أحمر',
        categoryId: categories[4]._id,
        productType: ['kilogram', 'unit'],
        baseUnitType: 'grams',
        stockBaseUnit: 25000,
        minAlertStock: 5000,
        pricePerKg: 6.000,
        pricePerUnit: 1.500,
        costPrice: 4.000
      },
      {
        name: 'بطاطس',
        categoryId: categories[4]._id,
        productType: ['kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 30000,
        minAlertStock: 8000,
        pricePerKg: 2.500,
        costPrice: 1.500
      },
      // لحوم ودواجن
      {
        name: 'دجاج كامل',
        categoryId: categories[5]._id,
        productType: ['kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 40000,
        minAlertStock: 10000,
        pricePerKg: 12.000,
        costPrice: 9.000
      },
      {
        name: 'لحم بقري',
        categoryId: categories[5]._id,
        productType: ['kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 25000,
        minAlertStock: 5000,
        pricePerKg: 35.000,
        costPrice: 28.000
      },
      // معلبات
      {
        name: 'تونة معلبة',
        categoryId: categories[6]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 120,
        minAlertStock: 30,
        pricePerUnit: 4.500,
        costPrice: 3.200
      },
      {
        name: 'صلصة طماطم',
        categoryId: categories[6]._id,
        productType: ['unit'],
        baseUnitType: 'pieces',
        stockBaseUnit: 90,
        minAlertStock: 20,
        pricePerUnit: 1.800,
        costPrice: 1.200
      },
      // توابل
      {
        name: 'ملح طعام',
        categoryId: categories[7]._id,
        productType: ['unit', 'kilogram'],
        baseUnitType: 'grams',
        stockBaseUnit: 15000,
        minAlertStock: 3000,
        pricePerUnit: 0.800,
        pricePerKg: 1.500,
        costPrice: 0.800
      },
      {
        name: 'فلفل أسود',
        categoryId: categories[7]._id,
        productType: ['kilogram', 'cup'],
        baseUnitType: 'grams',
        stockBaseUnit: 5000,
        minAlertStock: 1000,
        pricePerKg: 45.000,
        pricePerCup: 80.000,
        cupWeightGrams: 1800,
        costPrice: 35.000
      }
    ];

    await Product.insertMany(products);
    console.log('📦 تم إنشاء المنتجات');

    console.log('\n✅ تم إنشاء البيانات التجريبية بنجاح!\n');
    console.log('🔐 بيانات تسجيل الدخول:');
    console.log('═══════════════════════════════════');
    console.log('👤 مدير:');
    console.log('   البريد: admin@pos.com');
    console.log('   كلمة المرور: admin123');
    console.log('\n💼 كاشير:');
    console.log('   البريد: cashier@pos.com');
    console.log('   كلمة المرور: cashier123');
    console.log('═══════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error);
    process.exit(1);
  }
};

seedData();
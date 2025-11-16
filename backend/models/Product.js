import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المنتج مطلوب'],
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true, // allows null values to not be unique
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'الفئة مطلوبة']
  },
  productType: {
    type: [String],
    enum: ['unit', 'kilogram', 'cup'],
    required: [true, 'نوع المنتج مطلوب']
  },
  stockBaseUnit: {
    type: Number,
    default: 0,
    min: 0
  },
  baseUnitType: {
    type: String,
    enum: ['grams', 'pieces'],
    required: [true, 'نوع الوحدة الأساسية مطلوب']
  },
  minAlertStock: {
    type: Number,
    default: 10
  },
  pricePerUnit: {
    type: Number,
    default: 0
  },
  pricePerKg: {
    type: Number,
    default: 0
  },
  pricePerCup: {
    type: Number,
    default: 0
  },
  cupWeightGrams: {
    type: Number,
    default: 1800
  },
  costPrice: {
    type: Number,
    required: [true, 'سعر التكلفة مطلوب'],
    min: 0
  },
  totalStockValue: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// حساب قيمة المخزون الإجمالية
productSchema.pre('save', function(next) {
  if (this.baseUnitType === 'grams') {
    this.totalStockValue = (this.stockBaseUnit / 1000) * this.costPrice;
  } else {
    this.totalStockValue = this.stockBaseUnit * this.costPrice;
  }
  next();
});

export default mongoose.model('Product', productSchema);
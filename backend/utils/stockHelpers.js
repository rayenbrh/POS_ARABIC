/**
 * وظائف مساعدة لحسابات المخزون
 * Helper functions for stock calculations
 */

/**
 * تحويل الكيلوغرامات إلى غرامات
 * Convert kilograms to grams
 */
const kgToGrams = (kg) => {
  return Math.round(kg * 1000);
};

/**
 * تحويل الغرامات إلى كيلوغرامات
 * Convert grams to kilograms
 */
const gramsToKg = (grams) => {
  return grams / 1000;
};

/**
 * حساب سعر المنتج بناءً على الكمية والنوع
 * Calculate product price based on quantity and type
 */
const calculatePrice = (product, qtyBaseUnit) => {
  if (product.productType === 'unit') {
    // قطع × سعر القطعة
    return qtyBaseUnit * product.pricePerUnit;
  } else if (product.productType === 'kilogram') {
    // تحويل الغرامات إلى كغ × سعر الكغ
    const kg = gramsToKg(qtyBaseUnit);
    return kg * product.pricePerKg;
  } else if (product.productType === 'cup') {
    // حساب عدد الأكواب × سعر الكوب
    const cups = qtyBaseUnit / product.cupWeightGrams;
    return cups * product.pricePerCup;
  }
  return 0;
};

/**
 * تحويل المدخل من المستخدم إلى الوحدة الأساسية
 * Convert user input to base unit
 */
const inputToBaseUnit = (product, inputValue, inputType = 'quantity') => {
  if (product.productType === 'unit') {
    // القطع تبقى كما هي
    return Math.round(inputValue);
  } else if (product.productType === 'kilogram') {
    if (inputType === 'kg') {
      // تحويل الكغ إلى غرام
      return kgToGrams(inputValue);
    } else if (inputType === 'grams') {
      return Math.round(inputValue);
    } else if (inputType === 'price') {
      // حساب الكمية من السعر (السعر ÷ سعر الكغ = كغ)
      const kg = inputValue / product.pricePerKg;
      return kgToGrams(kg);
    }
  } else if (product.productType === 'cup') {
    // عدد الأكواب × وزن الكوب
    return Math.round(inputValue * product.cupWeightGrams);
  }
  return 0;
};

/**
 * تنسيق المخزون للعرض
 * Format stock for display
 */
const formatStockDisplay = (product) => {
  if (product.baseUnitType === 'grams') {
    const kg = gramsToKg(product.stockBaseUnit).toFixed(3);
    return `${kg} كغ`;
  } else {
    return `${product.stockBaseUnit} قطعة`;
  }
};

/**
 * التحقق من توفر المخزون
 * Check stock availability
 */
const checkStockAvailability = (product, requestedQtyBaseUnit) => {
  return product.stockBaseUnit >= requestedQtyBaseUnit;
};

/**
 * حساب تكلفة البضائع المباعة
 * Calculate cost of goods sold
 */
const calculateCOGS = (product, qtyBaseUnit) => {
  if (product.baseUnitType === 'grams') {
    const kg = gramsToKg(qtyBaseUnit);
    return kg * product.costPrice;
  } else {
    return qtyBaseUnit * product.costPrice;
  }
};

module.exports = {
  kgToGrams,
  gramsToKg,
  calculatePrice,
  inputToBaseUnit,
  formatStockDisplay,
  checkStockAvailability,
  calculateCOGS
};
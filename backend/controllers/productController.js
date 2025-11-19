import Product from '../models/Product.js';
import Category from '../models/Category.js';


// جلب جميع المنتجات
export const getAllProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المنتجات'
    });
  }
};

// جلب منتج واحد
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المنتج'
    });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const product = await Product.findOne({ barcode })
      .populate('categoryId', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على منتج بهذا الباركود'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product by barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في البحث عن المنتج'
    });
  }
};

// إنشاء منتج جديد
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      categoryId,
      productType,
      baseUnitType,
      stockBaseUnit,
      minAlertStock,
      pricePerUnit,
      pricePerKg,
      pricePerCup,
      cupWeightGrams,
      costPrice
    } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'الباركود مستخدم بالفعل'
        });
      }
    }

    const product = await Product.create({
      name,
      barcode: barcode || undefined,
      categoryId,
      productType,
      baseUnitType,
      stockBaseUnit: stockBaseUnit || 0,
      minAlertStock,
      pricePerUnit,
      pricePerKg,
      pricePerCup,
      cupWeightGrams,
      costPrice
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name');

    res.status(201).json({
      success: true,
      product: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في إنشاء المنتج'
    });
  }
};

// تحديث منتج
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      categoryId,
      productType,
      baseUnitType,
      stockBaseUnit,
      minAlertStock,
      pricePerUnit,
      pricePerKg,
      pricePerCup,
      cupWeightGrams,
      costPrice
    } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // Check if barcode is being changed and if it already exists
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'الباركود مستخدم بالفعل'
        });
      }
    }

    // Check if category exists
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'الفئة غير موجودة'
        });
      }
    }

    // Update product fields using direct assignment to trigger pre-save hook
    if (name !== undefined) product.name = name;
    if (barcode !== undefined) product.barcode = barcode;
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (productType !== undefined) product.productType = productType;
    if (baseUnitType !== undefined) product.baseUnitType = baseUnitType;
    if (stockBaseUnit !== undefined) product.stockBaseUnit = stockBaseUnit;
    if (minAlertStock !== undefined) product.minAlertStock = minAlertStock;
    if (pricePerUnit !== undefined) product.pricePerUnit = pricePerUnit;
    if (pricePerKg !== undefined) product.pricePerKg = pricePerKg;
    if (pricePerCup !== undefined) product.pricePerCup = pricePerCup;
    if (cupWeightGrams !== undefined) product.cupWeightGrams = cupWeightGrams;
    if (costPrice !== undefined) product.costPrice = costPrice;

    // Save the product - this will trigger the pre-save hook to recalculate totalStockValue
    await product.save();

    // Populate category for response
    await product.populate('categoryId', 'name');

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في تحديث المنتج'
    });
  }
};

// حذف منتج
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف المنتج'
    });
  }
};
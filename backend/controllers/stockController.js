import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

// إضافة أو تعديل المخزون
export const moveStock = async (req, res) => {
  try {
    const { productId, qtyChangeBaseUnit, type, reason } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // تحديث المخزون
    if (type === 'in' || type === 'adjustment') {
      product.stockBaseUnit += qtyChangeBaseUnit;
    } else if (type === 'out') {
      if (product.stockBaseUnit < qtyChangeBaseUnit) {
        return res.status(400).json({
          success: false,
          message: 'المخزون غير كافٍ'
        });
      }
      product.stockBaseUnit -= qtyChangeBaseUnit;
    }

    // Save product - this triggers pre-save hook to recalculate totalStockValue
    await product.save();

    // إنشاء حركة مخزون
    const stockMovement = await StockMovement.create({
      productId,
      qtyChangeBaseUnit,
      baseUnitType: product.baseUnitType,
      type,
      reason,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      stockMovement: stockMovement,
      newStock: product.stockBaseUnit
    });
  } catch (error) {
    console.error('Move stock error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث المخزون'
    });
  }
};

// جلب حركات المخزون
export const getStockMovements = async (req, res) => {
  try {
    const { productId, startDate, endDate } = req.query;
    
    const filter = {};
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const movements = await StockMovement.find(filter)
      .populate('productId', 'name')
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: movements.length,
      movements
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب حركات المخزون'
    });
  }
};
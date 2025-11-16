import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

// إضافة أو تعديل المخزون
export const moveStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, qtyChangeBaseUnit, type, reason } = req.body;

    const product = await Product.findById(productId).session(session);

    if (!product) {
      await session.abortTransaction();
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
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'المخزون غير كافٍ'
        });
      }
      product.stockBaseUnit -= qtyChangeBaseUnit;
    }

    await product.save({ session });

    // إنشاء حركة مخزون
    const stockMovement = await StockMovement.create([{
      productId,
      qtyChangeBaseUnit,
      baseUnitType: product.baseUnitType,
      type,
      reason,
      userId: req.user._id
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      stockMovement: stockMovement[0],
      newStock: product.stockBaseUnit
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث المخزون'
    });
  } finally {
    session.endSession();
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
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب حركات المخزون'
    });
  }
};
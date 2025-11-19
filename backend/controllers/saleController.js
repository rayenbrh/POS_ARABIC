import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

// إنشاء عملية بيع جديدة مع تحديث المخزون
export const createSale = async (req, res) => {
  try {
    const { items, total, amountGiven, changeReturned } = req.body;

    // التحقق من وجود المستخدم
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'يرجى تسجيل الدخول أولاً'
      });
    }

    // التحقق من وجود العناصر
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد منتجات في السلة'
      });
    }

    // التحقق من المخزون أولاً قبل أي تحديثات
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `المنتج غير موجود`
        });
      }

      if (product.stockBaseUnit < item.qtyBaseUnit) {
        return res.status(400).json({
          success: false,
          message: `المخزون غير كافٍ للمنتج: ${product.name}`
        });
      }
    }

    // إنشاء عملية البيع أولاً
    const sale = await Sale.create({
      cashierId: req.user._id,
      items,
      total,
      amountGiven,
      changeReturned
    });

    // تحديث المخزون وإنشاء حركات المخزون
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (product) {
        // تحديث المخزون
        product.stockBaseUnit -= item.qtyBaseUnit;
        await product.save();

        // إضافة حركة مخزون
        await StockMovement.create({
          productId: item.productId,
          qtyChangeBaseUnit: -item.qtyBaseUnit,
          baseUnitType: item.baseUnitType,
          type: 'out',
          reason: 'عملية بيع',
          userId: req.user._id,
          relatedSaleId: sale._id
        });
      }
    }

    res.status(201).json({
      success: true,
      sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء عملية البيع',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// جلب جميع المبيعات
export const getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, cashierId } = req.query;
    
    const filter = { isDeleted: false };
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (cashierId) {
      filter.cashierId = cashierId;
    }

    const sales = await Sale.find(filter)
      .populate('cashierId', 'name')
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المبيعات'
    });
  }
};

// جلب عملية بيع واحدة
export const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashierId', 'name email')
      .populate('items.productId', 'name');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'عملية البيع غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب عملية البيع'
    });
  }
};

// حذف عملية بيع (soft delete)
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'عملية البيع غير موجودة'
      });
    }

    if (sale.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'عملية البيع محذوفة بالفعل'
      });
    }

    // إرجاع المخزون
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stockBaseUnit += item.qtyBaseUnit;
        await product.save();

        // إضافة حركة مخزون
        await StockMovement.create({
          productId: item.productId,
          qtyChangeBaseUnit: item.qtyBaseUnit,
          baseUnitType: item.baseUnitType,
          type: 'in',
          reason: 'إلغاء عملية بيع',
          userId: req.user._id,
          relatedSaleId: sale._id
        });
      }
    }

    // تحديث حالة البيع
    sale.isDeleted = true;
    sale.deletedBy = req.user._id;
    sale.deletedAt = new Date();
    await sale.save();

    res.status(200).json({
      success: true,
      message: 'تم حذف عملية البيع وإرجاع المخزون بنجاح'
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف عملية البيع'
    });
  }
};

// جلب المبيعات المحذوفة
export const getDeletedSales = async (req, res) => {
  try {
    const sales = await Sale.find({ isDeleted: true })
      .populate('cashierId', 'name')
      .populate('deletedBy', 'name')
      .populate('items.productId', 'name')
      .sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
  } catch (error) {
    console.error('Get deleted sales error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المبيعات المحذوفة'
    });
  }
};
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

// إنشاء عملية بيع جديدة مع تحديث المخزون
export const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, total, amountGiven, changeReturned } = req.body;

    // التحقق من المخزون
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `المنتج غير موجود`
        });
      }

      if (product.stockBaseUnit < item.qtyBaseUnit) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `المخزون غير كافٍ للمنتج: ${product.name}`
        });
      }

      // تحديث المخزون
      product.stockBaseUnit -= item.qtyBaseUnit;
      await product.save({ session });

      // إضافة حركة مخزون
      await StockMovement.create([{
        productId: item.productId,
        qtyChangeBaseUnit: -item.qtyBaseUnit,
        baseUnitType: item.baseUnitType,
        type: 'out',
        reason: 'عملية بيع',
        userId: req.user._id
      }], { session });
    }

    // إنشاء عملية البيع
    const sale = await Sale.create([{
      cashierId: req.user._id,
      items,
      total,
      amountGiven,
      changeReturned
    }], { session });

    // ربط حركات المخزون بعملية البيع
    await StockMovement.updateMany(
      { userId: req.user._id, relatedSaleId: null },
      { relatedSaleId: sale[0]._id },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      sale: sale[0]
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء عملية البيع'
    });
  } finally {
    session.endSession();
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
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب عملية البيع'
    });
  }
};

// حذف عملية بيع (soft delete)
export const deleteSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const sale = await Sale.findById(id).session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'عملية البيع غير موجودة'
      });
    }

    if (sale.isDeleted) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'عملية البيع محذوفة بالفعل'
      });
    }

    // إرجاع المخزون
    for (const item of sale.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        product.stockBaseUnit += item.qtyBaseUnit;
        await product.save({ session });

        // إضافة حركة مخزون
        await StockMovement.create([{
          productId: item.productId,
          qtyChangeBaseUnit: item.qtyBaseUnit,
          baseUnitType: item.baseUnitType,
          type: 'in',
          reason: 'إلغاء عملية بيع',
          userId: req.user._id,
          relatedSaleId: sale._id
        }], { session });
      }
    }

    // تحديث حالة البيع
    sale.isDeleted = true;
    sale.deletedBy = req.user._id;
    sale.deletedAt = new Date();
    await sale.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'تم حذف عملية البيع وإرجاع المخزون بنجاح'
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف عملية البيع'
    });
  } finally {
    session.endSession();
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
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المبيعات المحذوفة'
    });
  }
};
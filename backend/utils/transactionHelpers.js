import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

/**
 * تنفيذ عملية بيع بشكل ذري (Atomic)
 * Execute sale transaction atomically
 */
const executeSaleTransaction = async (saleData, items, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    // إنشاء البيع
    // Create sale
    const sale = await Sale.create([saleData], { session });
    const saleId = sale[0]._id;

    // تحديث المخزون وإنشاء حركات المخزون
    // Update stock and create stock movements
    for (const item of items) {
      // تحديث المخزون
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`المنتج ${item.productName} غير موجود`);
      }

      if (product.stockBaseUnit < item.qtyBaseUnit) {
        throw new Error(`مخزون ${item.productName} غير كافٍ`);
      }

      product.stockBaseUnit -= item.qtyBaseUnit;
      await product.save({ session });

      // إنشاء حركة مخزون
      await StockMovement.create([{
        productId: item.productId,
        qtyChangeBaseUnit: -item.qtyBaseUnit,
        baseUnitType: item.baseUnitType,
        type: 'out',
        reason: `بيع - فاتورة ${saleId}`,
        userId: userId,
        relatedSaleId: saleId
      }], { session });
    }

    await session.commitTransaction();
    return sale[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * استرجاع المخزون عند حذف فاتورة
 * Restore stock when deleting a sale
 */
const restoreStockFromSale = async (saleId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(saleId).session(session);
    
    if (!sale) {
      throw new Error('الفاتورة غير موجودة');
    }

    // إرجاع المخزون لكل منتج
    for (const item of sale.items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (product) {
        product.stockBaseUnit += item.qtyBaseUnit;
        await product.save({ session });

        // إنشاء حركة مخزون معاكسة
        await StockMovement.create([{
          productId: item.productId,
          qtyChangeBaseUnit: item.qtyBaseUnit,
          baseUnitType: item.baseUnitType,
          type: 'in',
          reason: `إرجاع من فاتورة محذوفة ${saleId}`,
          userId: userId,
          relatedSaleId: saleId
        }], { session });
      }
    }

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export {
  executeSaleTransaction,
  restoreStockFromSale
};
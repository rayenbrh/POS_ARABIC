import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

// تقرير مالي شامل
export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // إجمالي المبيعات
    const salesData = await Sale.aggregate([
      { $match: { ...dateFilter, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    // حساب التكلفة الإجمالية للمبيعات
    const sales = await Sale.find({ ...dateFilter, isDeleted: false }).populate('items.productId');
    let totalCost = 0;
    
    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.productId) {
          const costPerBaseUnit = item.baseUnitType === 'grams' 
            ? item.productId.costPrice / 1000 
            : item.productId.costPrice;
          totalCost += costPerBaseUnit * item.qtyBaseUnit;
        }
      }
    }

    // إجمالي المصروفات
    const expensesData = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
    const totalTransactions = salesData.length > 0 ? salesData[0].totalTransactions : 0;
    const totalExpenses = expensesData.length > 0 ? expensesData[0].totalExpenses : 0;
    
    const grossProfit = totalSales - totalCost;
    const netIncome = grossProfit - totalExpenses;

    res.status(200).json({
      success: true,
      report: {
        totalSales,
        totalCost,
        grossProfit,
        totalExpenses,
        netIncome,
        totalTransactions,
        averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        profitMargin: totalSales > 0 ? (grossProfit / totalSales) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء التقرير المالي'
    });
  }
};

// تقرير المنتجات ذات المخزون المنخفض
export const getLowStockReport = async (req, res) => {
  try {
    const products = await Product.find().populate('categoryId', 'name');
    
    const lowStockProducts = products.filter(product => {
      return product.stockBaseUnit <= product.minAlertStock;
    });

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب تقرير المخزون المنخفض'
    });
  }
};

// تقرير المبيعات حسب المنتج
export const getSalesByProduct = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const salesByProduct = await Sale.aggregate([
      { $match: { ...dateFilter, isDeleted: false } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.qtyBaseUnit' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalTransactions: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // جلب تفاصيل المنتجات
    const productsWithSales = await Product.populate(salesByProduct, {
      path: '_id',
      select: 'name categoryId baseUnitType'
    });

    res.status(200).json({
      success: true,
      count: productsWithSales.length,
      products: productsWithSales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب تقرير المبيعات حسب المنتج'
    });
  }
};

// تقرير تاريخ المنتج الكامل - NEW
export const getProductHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // جلب المنتج
    const product = await Product.findById(productId).populate('categoryId', 'name');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // جلب حركات المخزون
    const stockMovements = await StockMovement.find({
      productId,
      ...dateFilter
    })
      .populate('userId', 'name')
      .populate('relatedSaleId')
      .sort({ createdAt: -1 });

    // جلب المبيعات للمنتج
    const sales = await Sale.find({
      'items.productId': productId,
      isDeleted: false,
      ...dateFilter
    })
      .populate('cashierId', 'name')
      .sort({ createdAt: -1 });

    // دمج البيانات
    const transactions = [];

    // إضافة حركات المخزون
    stockMovements.forEach(movement => {
      transactions.push({
        _id: movement._id,
        type: 'stock_movement',
        movementType: movement.type,
        quantity: movement.qtyChangeBaseUnit,
        baseUnitType: movement.baseUnitType,
        reason: movement.reason,
        user: movement.userId,
        relatedSale: movement.relatedSaleId,
        date: movement.createdAt
      });
    });

    // إضافة المبيعات
    sales.forEach(sale => {
      const item = sale.items.find(i => i.productId.toString() === productId);
      if (item) {
        transactions.push({
          _id: sale._id,
          type: 'sale',
          quantity: -item.qtyBaseUnit, // سالب لأنه بيع
          baseUnitType: item.baseUnitType,
          revenue: item.subtotal,
          unitPrice: item.unitPrice,
          cashier: sale.cashierId,
          date: sale.createdAt
        });
      }
    });

    // ترتيب حسب التاريخ
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      product,
      transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب تاريخ المنتج'
    });
  }
};

// تقرير رأس المال والأرباح - NEW
export const getCapitalAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // جلب جميع المنتجات
    const products = await Product.find().populate('categoryId', 'name');

    // حساب رأس المال المستثمر في كل منتج
    const productAnalysis = [];

    for (const product of products) {
      // رأس المال الحالي في المخزون
      const currentCapital = product.totalStockValue;

      // جلب المبيعات للمنتج
      const sales = await Sale.find({
        'items.productId': product._id,
        isDeleted: false,
        ...dateFilter
      });

      let totalRevenue = 0;
      let totalCost = 0;
      let totalQuantitySold = 0;

      sales.forEach(sale => {
        const item = sale.items.find(i => i.productId.toString() === product._id.toString());
        if (item) {
          totalRevenue += item.subtotal;
          totalQuantitySold += item.qtyBaseUnit;

          // حساب التكلفة
          const costPerBaseUnit = item.baseUnitType === 'grams'
            ? product.costPrice / 1000
            : product.costPrice;
          totalCost += costPerBaseUnit * item.qtyBaseUnit;
        }
      });

      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      productAnalysis.push({
        product: {
          _id: product._id,
          name: product.name,
          category: product.categoryId?.name,
          costPrice: product.costPrice,
          baseUnitType: product.baseUnitType
        },
        currentStock: product.stockBaseUnit,
        currentCapital: currentCapital,
        totalQuantitySold: totalQuantitySold,
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        profit: profit,
        profitMargin: profitMargin
      });
    }

    // حساب الإجماليات
    const totals = {
      totalCapitalInStock: productAnalysis.reduce((sum, p) => sum + p.currentCapital, 0),
      totalRevenue: productAnalysis.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalCost: productAnalysis.reduce((sum, p) => sum + p.totalCost, 0),
      totalProfit: productAnalysis.reduce((sum, p) => sum + p.profit, 0)
    };

    totals.overallProfitMargin = totals.totalRevenue > 0
      ? (totals.totalProfit / totals.totalRevenue) * 100
      : 0;

    // ترتيب حسب الأرباح
    productAnalysis.sort((a, b) => b.profit - a.profit);

    res.status(200).json({
      success: true,
      totals,
      products: productAnalysis
    });
  } catch (error) {
    console.error('Capital analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحليل رأس المال'
    });
  }
};
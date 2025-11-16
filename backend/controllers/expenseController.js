import Expense from '../models/Expense.js';

// إنشاء مصروف جديد
export const createExpense = async (req, res) => {
  try {
    const { amount, reasonArabic } = req.body;

    if (!amount || !reasonArabic) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ والسبب مطلوبان'
      });
    }

    const expense = await Expense.create({
      amount,
      reasonArabic,
      takenFrom: 'caisse',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء المصروف'
    });
  }
};

// جلب جميع المصروفات
export const getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await Expense.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المصروفات'
    });
  }
};

// حذف مصروف
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'المصروف غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم حذف المصروف بنجاح'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف المصروف'
    });
  }
};
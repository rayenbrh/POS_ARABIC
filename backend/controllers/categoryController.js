import Category from '../models/Category.js';

// جلب جميع الفئات
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الفئات'
    });
  }
};

// إنشاء فئة جديدة
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم الفئة مطلوب'
      });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'الفئة موجودة بالفعل'
      });
    }

    const category = await Category.create({ name });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء الفئة'
    });
  }
};

// تحديث فئة
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث الفئة'
    });
  }
};

// حذف فئة
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم حذف الفئة بنجاح'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف الفئة'
    });
  }
};
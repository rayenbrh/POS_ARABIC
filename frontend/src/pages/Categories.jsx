import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب الفئات');
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentCategory({ name: '' });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditMode(true);
    setCurrentCategory(category);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await api.put(`/categories/${currentCategory._id}`, currentCategory);
        toast.success('تم تحديث الفئة بنجاح');
      } else {
        await api.post('/categories', currentCategory);
        toast.success('تم إضافة الفئة بنجاح');
      }
      
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في حفظ الفئة');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الفئة؟')) return;

    try {
      await api.delete(`/categories/${id}`);
      toast.success('تم حذف الفئة بنجاح');
      fetchCategories();
    } catch (error) {
      toast.error('خطأ في حذف الفئة');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الفئات</h1>
        <Button onClick={openAddModal}>
          ➕ إضافة فئة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category._id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-bold mb-4">{category.name}</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => openEditModal(category)}
                variant="secondary"
                className="flex-1"
              >
                ✏️ تعديل
              </Button>
              <Button
                onClick={() => handleDelete(category._id)}
                variant="danger"
                className="flex-1"
              >
                🗑️ حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMode ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="اسم الفئة"
            name="name"
            value={currentCategory.name}
            onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
            required
          />

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="success" fullWidth>
              {editMode ? 'تحديث' : 'إضافة'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [newExpense, setNewExpense] = useState({
    amount: '',
    reasonArabic: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const params = `?startDate=${dateFilter.startDate}T00:00:00.000Z&endDate=${dateFilter.endDate}T23:59:59.999Z`;
      const { data } = await api.get(`/expenses${params}`);
      setExpenses(data.expenses);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب المصروفات');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (!newExpense.reasonArabic.trim()) {
      toast.error('يرجى إدخال سبب المصروف');
      return;
    }

    try {
      await api.post('/expenses', {
        amount: parseFloat(newExpense.amount),
        reasonArabic: newExpense.reasonArabic
      });
      
      toast.success('تم إضافة المصروف بنجاح');
      setShowModal(false);
      setNewExpense({ amount: '', reasonArabic: '' });
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إضافة المصروف');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المصروف؟')) return;

    try {
      await api.delete(`/expenses/${id}`);
      toast.success('تم حذف المصروف بنجاح');
      fetchExpenses();
    } catch (error) {
      toast.error('خطأ في حذف المصروف');
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">💸 إدارة المصروفات</h1>
        <Button onClick={() => setShowModal(true)}>
          ➕ إضافة مصروف جديد
        </Button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="font-bold mb-4">تصفية حسب التاريخ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchExpenses} fullWidth>
              🔍 بحث
            </Button>
          </div>
        </div>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg mb-6">
        <h3 className="text-lg mb-2">إجمالي المصروفات</h3>
        <p className="text-4xl font-bold">{getTotalExpenses().toFixed(2)} د.ت</p>
        <p className="text-sm opacity-80 mt-2">
          عدد المصروفات: {expenses.length}
        </p>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">التاريخ والوقت</th>
                <th className="px-4 py-3 text-right">السبب</th>
                <th className="px-4 py-3 text-right">المبلغ</th>
                <th className="px-4 py-3 text-right">المستخدم</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <span className="text-6xl mb-4">📭</span>
                      <p className="text-xl">لا توجد مصروفات في هذه الفترة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold">
                          {new Date(expense.createdAt).toLocaleDateString('ar-TN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(expense.createdAt).toLocaleTimeString('ar-TN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{expense.reasonArabic}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xl font-bold text-red-600">
                        {expense.amount.toFixed(2)} د.ت
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {expense.createdBy?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{expense.createdBy?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => handleDelete(expense._id)}
                        variant="danger"
                        className="text-sm"
                      >
                        🗑️ حذف
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="إضافة مصروف جديد"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ سيتم خصم المبلغ من الصندوق (Caisse)
            </p>
          </div>

          <Input
            label="المبلغ (د.ت)"
            type="number"
            step="0.01"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            placeholder="0.00"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              سبب المصروف <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newExpense.reasonArabic}
              onChange={(e) => setNewExpense({ ...newExpense, reasonArabic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="مثال: صيانة الثلاجة، فاتورة كهرباء، مصاريف نقل..."
              required
            ></textarea>
          </div>

          {/* Common Expenses Suggestions */}
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2 text-gray-700">اقتراحات سريعة:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'صيانة الأجهزة',
                'فاتورة كهرباء',
                'فاتورة ماء',
                'مصاريف نقل',
                'مصاريف تشغيل',
                'رواتب',
                'مواد تنظيف'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setNewExpense({ ...newExpense, reasonArabic: suggestion })}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {newExpense.amount && newExpense.reasonArabic && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-yellow-800 mb-2">📋 معاينة:</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{newExpense.reasonArabic}</span>
                <span className="text-xl font-bold text-red-600">
                  {parseFloat(newExpense.amount).toFixed(2)} د.ت
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="success" fullWidth>
              ✓ إضافة المصروف
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
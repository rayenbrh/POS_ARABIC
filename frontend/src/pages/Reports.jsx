import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Loader from '../components/Loader';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [financialReport, setFinancialReport] = useState(null);
  const [salesByProduct, setSalesByProduct] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = `?startDate=${dateRange.startDate}T00:00:00.000Z&endDate=${dateRange.endDate}T23:59:59.999Z`;
      
      const [financialRes, salesRes, expensesRes] = await Promise.all([
        api.get(`/reports/financials${params}`),
        api.get(`/reports/sales-by-product${params}`),
        api.get(`/expenses${params}`)
      ]);

      setFinancialReport(financialRes.data.report);
      setSalesByProduct(salesRes.data.products);
      setExpenses(expensesRes.data.expenses);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب التقارير');
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">التقارير المالية</h1>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReports} fullWidth>
              🔍 عرض التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {financialReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg mb-2">إجمالي المبيعات</h3>
            <p className="text-3xl font-bold">{financialReport.totalSales.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-2">دينار تونسي</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg mb-2">التكلفة الإجمالية</h3>
            <p className="text-3xl font-bold">{financialReport.totalCost.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-2">دينار تونسي</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg mb-2">الربح الإجمالي</h3>
            <p className="text-3xl font-bold">{financialReport.grossProfit.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-2">
              هامش: {financialReport.profitMargin.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg mb-2">المصروفات</h3>
            <p className="text-3xl font-bold">{financialReport.totalExpenses.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-2">دينار تونسي</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg md:col-span-2">
            <h3 className="text-lg mb-2">صافي الربح</h3>
            <p className="text-4xl font-bold">{financialReport.netIncome.toFixed(2)}</p>
            <p className="text-sm opacity-80 mt-2">الربح بعد المصروفات</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg md:col-span-2">
            <h3 className="text-lg mb-2">عدد المعاملات</h3>
            <p className="text-4xl font-bold">{financialReport.totalTransactions}</p>
            <p className="text-sm opacity-80 mt-2">
              متوسط الفاتورة: {financialReport.averageTransactionValue.toFixed(2)} د.ت
            </p>
          </div>
        </div>
      )}

      {/* Sales by Product */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">المبيعات حسب المنتج</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">المنتج</th>
                <th className="px-4 py-3 text-right">الكمية المباعة</th>
                <th className="px-4 py-3 text-right">الإيرادات</th>
                <th className="px-4 py-3 text-right">عدد المعاملات</th>
              </tr>
            </thead>
            <tbody>
              {salesByProduct.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{item._id?.name}</td>
                  <td className="px-4 py-3">
                    {item.totalQuantity.toFixed(2)} {item._id?.baseUnitType === 'grams' ? 'جرام' : 'قطعة'}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {item.totalRevenue.toFixed(2)} د.ت
                  </td>
                  <td className="px-4 py-3">{item.totalTransactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">المصروفات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">السبب</th>
                <th className="px-4 py-3 text-right">المبلغ</th>
                <th className="px-4 py-3 text-right">المستخدم</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {new Date(expense.createdAt).toLocaleDateString('ar-TN')}
                  </td>
                  <td className="px-4 py-3">{expense.reasonArabic}</td>
                  <td className="px-4 py-3 font-bold text-red-600">
                    {expense.amount.toFixed(2)} د.ت
                  </td>
                  <td className="px-4 py-3">{expense.createdBy?.name}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                    لا توجد مصروفات في هذه الفترة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
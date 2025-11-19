import { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // جلب المبيعات اليومية
      const salesRes = await api.get(`/sales?startDate=${startOfDay}&endDate=${endOfDay}`);
      
      let financialData = null;
      if (isAdmin) {
        const financialRes = await api.get(`/reports/financials?startDate=${startOfDay}&endDate=${endOfDay}`);
        financialData = financialRes.data.report;
      }

      // جلب المنتجات ذات المخزون المنخفض
      const lowStockRes = await api.get('/reports/low-stock');

      setStats({
        todaySales: salesRes.data.sales.length,
        todayRevenue: salesRes.data.sales.reduce((sum, sale) => sum + sale.total, 0),
        financial: financialData
      });

      setLowStockProducts(lowStockRes.data.products);
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setLoading(false);
    }
  };

  const formatStock = (product) => {
    if (product.baseUnitType === 'grams') {
      return `${(product.stockBaseUnit / 1000).toFixed(2)} كغ`;
    }
    return `${product.stockBaseUnit} قطعة`;
  };

  const formatMinAlert = (product) => {
    if (product.baseUnitType === 'grams') {
      return `${(product.minAlertStock / 1000).toFixed(2)} كغ`;
    }
    return `${product.minAlertStock} قطعة`;
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>

      {/* إحصائيات اليوم */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg mb-2">المبيعات اليوم</h3>
          <p className="text-3xl font-bold">{stats?.todaySales || 0}</p>
          <p className="text-sm opacity-80 mt-2">عدد الفواتير</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg mb-2">الإيرادات اليوم</h3>
          <p className="text-3xl font-bold">{stats?.todayRevenue?.toFixed(2) || 0}</p>
          <p className="text-sm opacity-80 mt-2">دينار تونسي</p>
        </div>

        {/* Net Income - Only for Admin */}
        {isAdmin && stats?.financial && (
          <>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg mb-2">الربح الصافي</h3>
              <p className="text-3xl font-bold">{stats.financial.netIncome.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-2">دينار تونسي</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg mb-2">المصروفات</h3>
              <p className="text-3xl font-bold">{stats.financial.totalExpenses.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-2">دينار تونسي</p>
            </div>
          </>
        )}
      </div>

      {/* المنتجات ذات المخزون المنخفض */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>تنبيه: منتجات بمخزون منخفض</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-right">الفئة</th>
                  <th className="px-4 py-3 text-right">المخزون الحالي</th>
                  <th className="px-4 py-3 text-right">حد التنبيه</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.categoryId?.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-semibold">
                        {formatStock(product)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatMinAlert(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
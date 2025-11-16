import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const DeletedTickets = () => {
  const [deletedSales, setDeletedSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedSales();
  }, []);

  const fetchDeletedSales = async () => {
    try {
      const { data } = await api.get('/sales/deleted');
      setDeletedSales(data.sales);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب الفواتير المحذوفة');
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🗑️ الفواتير المحذوفة</h1>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {deletedSales.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-xl">لا توجد فواتير محذوفة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right">تاريخ البيع</th>
                  <th className="px-4 py-3 text-right">الكاشير</th>
                  <th className="px-4 py-3 text-right">الإجمالي</th>
                  <th className="px-4 py-3 text-right">تاريخ الحذف</th>
                  <th className="px-4 py-3 text-right">حذفت بواسطة</th>
                  <th className="px-4 py-3 text-right">المنتجات</th>
                </tr>
              </thead>
              <tbody>
                {deletedSales.map((sale) => (
                  <tr key={sale._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">
                      {sale._id.slice(-6)}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(sale.createdAt).toLocaleString('ar-TN')}
                    </td>
                    <td className="px-4 py-3">{sale.cashierId?.name}</td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {sale.total.toFixed(2)} د.ت
                    </td>
                    <td className="px-4 py-3">
                      {new Date(sale.deletedAt).toLocaleString('ar-TN')}
                    </td>
                    <td className="px-4 py-3">{sale.deletedBy?.name}</td>
                    <td className="px-4 py-3">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          عرض ({sale.items.length})
                        </summary>
                        <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="text-sm mb-1">
                              <span className="font-semibold">
                                {item.productId?.name || 'منتج محذوف'}
                              </span>
                              {' - '}
                              <span>{item.subtotal.toFixed(2)} د.ت</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletedTickets;
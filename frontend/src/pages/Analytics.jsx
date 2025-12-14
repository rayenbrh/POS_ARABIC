import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Loader from '../components/Loader';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('product-history'); // 'product-history' or 'capital'
  
  // Product History State
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDateRange, setHistoryDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Capital Analysis State
  const [capitalData, setCapitalData] = useState(null);
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [capitalSearchQuery, setCapitalSearchQuery] = useState('');
  const [capitalDateRange, setCapitalDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب المنتجات');
      setLoading(false);
    }
  };

  const fetchProductHistory = async (productId = selectedProduct?._id) => {
    if (!productId) {
      toast.error('يرجى اختيار منتج');
      return;
    }

    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historyDateRange.startDate) params.append('startDate', historyDateRange.startDate);
      if (historyDateRange.endDate) params.append('endDate', historyDateRange.endDate);

      const { data } = await api.get(`/reports/product-history/${productId}?${params}`);
      setProductHistory(data.transactions);
      setHistoryLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب تاريخ المنتج');
      setHistoryLoading(false);
    }
  };

  const fetchCapitalAnalysis = async () => {
    setCapitalLoading(true);
    try {
      const params = new URLSearchParams();
      if (capitalDateRange.startDate) params.append('startDate', capitalDateRange.startDate);
      if (capitalDateRange.endDate) params.append('endDate', capitalDateRange.endDate);

      const { data } = await api.get(`/reports/capital-analysis?${params}`);
      setCapitalData(data);
      setCapitalLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب تحليل رأس المال');
      setCapitalLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setHistoryDateRange({ startDate: '', endDate: '' });
  };

  const clearHistoryFilters = () => {
    setHistoryDateRange({ startDate: '', endDate: '' });
    if (selectedProduct) {
      fetchProductHistory(selectedProduct._id);
    }
  };

  const clearCapitalFilters = () => {
    setCapitalDateRange({ startDate: '', endDate: '' });
    fetchCapitalAnalysis();
  };

  useEffect(() => {
    if (selectedProduct) {
      fetchProductHistory(selectedProduct._id);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (activeTab === 'capital' && !capitalData) {
      fetchCapitalAnalysis();
    }
  }, [activeTab]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📊 التحليلات المتقدمة</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('product-history')}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'product-history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📦 تاريخ المنتج
        </button>
        <button
          onClick={() => setActiveTab('capital')}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'capital'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          💰 تحليل رأس المال
        </button>
      </div>

      {/* Product History Tab */}
      {activeTab === 'product-history' && (
        <div>
          {/* Product Selector */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">اختر المنتج</h2>
            
            <div className="mb-4">
              <select
                value={selectedProduct?._id || ''}
                onChange={(e) => {
                  const product = products.find(p => p._id === e.target.value);
                  handleProductSelect(product);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              >
                <option value="">-- اختر منتج --</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.categoryId?.name})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">المخزون الحالي</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedProduct.baseUnitType === 'grams'
                      ? `${(selectedProduct.stockBaseUnit / 1000).toFixed(2)} كغ`
                      : `${parseFloat(selectedProduct.stockBaseUnit).toFixed(2)} قطعة`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">سعر التكلفة</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedProduct.costPrice.toFixed(2)} د.ت
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">قيمة المخزون</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedProduct.totalStockValue?.toFixed(2)} د.ت
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Date Filter */}
          {selectedProduct && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">🗓️ فترة البحث</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={historyDateRange.startDate}
                    onChange={(e) => setHistoryDateRange({ ...historyDateRange, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={historyDateRange.endDate}
                    onChange={(e) => setHistoryDateRange({ ...historyDateRange, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => fetchProductHistory()}
                    variant="primary"
                    className="flex-1"
                  >
                    بحث
                  </Button>
                  <Button
                    onClick={clearHistoryFilters}
                    variant="secondary"
                  >
                    مسح
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {selectedProduct && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                📋 سجل المعاملات ({productHistory.length})
              </h2>

              {historyLoading ? (
                <Loader />
              ) : productHistory.length === 0 ? (
                <p className="text-center text-gray-400 py-8">لا توجد معاملات في هذه الفترة</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right">التاريخ</th>
                        <th className="px-4 py-3 text-right">الوقت</th>
                        <th className="px-4 py-3 text-right">النوع</th>
                        <th className="px-4 py-3 text-right">الكمية</th>
                        <th className="px-4 py-3 text-right">السبب/التفاصيل</th>
                        <th className="px-4 py-3 text-right">المستخدم</th>
                        <th className="px-4 py-3 text-right">الإيراد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productHistory.map((transaction, index) => {
                        const date = new Date(transaction.date);
                        const isPositive = transaction.quantity > 0;
                        
                        return (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {date.toLocaleDateString('ar-TN')}
                            </td>
                            <td className="px-4 py-3">
                              {date.toLocaleTimeString('ar-TN')}
                            </td>
                            <td className="px-4 py-3">
                              {transaction.type === 'sale' ? (
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  🛒 بيع
                                </span>
                              ) : transaction.movementType === 'in' ? (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  ➕ إضافة
                                </span>
                              ) : transaction.movementType === 'out' ? (
                                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  ➖ خصم
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  🔄 تعديل
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{transaction.quantity} {transaction.baseUnitType === 'grams' ? 'جرام' : 'قطعة'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {transaction.type === 'sale' ? (
                                <span>عملية بيع</span>
                              ) : (
                                transaction.reason
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {transaction.user?.name || transaction.cashier?.name || '-'}
                            </td>
                            <td className="px-4 py-3">
                              {transaction.revenue ? (
                                <span className="font-bold text-green-600">
                                  {transaction.revenue.toFixed(2)} د.ت
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Capital Analysis Tab */}
      {activeTab === 'capital' && (
        <div>
          {/* Date Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🗓️ فترة التحليل</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={capitalDateRange.startDate}
                  onChange={(e) => setCapitalDateRange({ ...capitalDateRange, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={capitalDateRange.endDate}
                  onChange={(e) => setCapitalDateRange({ ...capitalDateRange, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={fetchCapitalAnalysis}
                  variant="primary"
                  className="flex-1"
                >
                  تحليل
                </Button>
                <Button
                  onClick={clearCapitalFilters}
                  variant="secondary"
                >
                  مسح
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {capitalData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">رأس المال في المخزون</p>
                  <p className="text-3xl font-bold">
                    {capitalData.totals.totalCapitalInStock.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">د.ت</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold">
                    {capitalData.totals.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">د.ت</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">إجمالي التكاليف</p>
                  <p className="text-3xl font-bold">
                    {capitalData.totals.totalCost.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">د.ت</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">صافي الأرباح</p>
                  <p className="text-3xl font-bold">
                    {capitalData.totals.totalProfit.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">
                    ({capitalData.totals.overallProfitMargin.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Product Details Table */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    📦 تفاصيل المنتجات ({capitalData.products.length})
                  </h2>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={capitalSearchQuery}
                      onChange={(e) => setCapitalSearchQuery(e.target.value)}
                      placeholder="🔍 ابحث عن منتج أو فئة..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      dir="rtl"
                    />
                    {capitalSearchQuery && (
                      <button
                        onClick={() => setCapitalSearchQuery('')}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {capitalLoading ? (
                  <Loader />
                ) : (() => {
                  // Filter products based on search query
                  const filteredCapitalProducts = capitalData.products.filter((item) => {
                    if (!capitalSearchQuery) return true;
                    const query = capitalSearchQuery.toLowerCase();
                    const productName = item.product.name?.toLowerCase() || '';
                    const categoryName = item.product.category?.toLowerCase() || '';
                    return productName.includes(query) || categoryName.includes(query);
                  });

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-right">المنتج</th>
                            <th className="px-4 py-3 text-right">الفئة</th>
                            <th className="px-4 py-3 text-right">المخزون الحالي</th>
                            <th className="px-4 py-3 text-right">رأس المال</th>
                            <th className="px-4 py-3 text-right">الكمية المباعة</th>
                            <th className="px-4 py-3 text-right">الإيرادات</th>
                            <th className="px-4 py-3 text-right">التكلفة</th>
                            <th className="px-4 py-3 text-right">الربح</th>
                            <th className="px-4 py-3 text-right">هامش الربح</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCapitalProducts.map((item, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold">
                              {item.product.name}
                            </td>
                            <td className="px-4 py-3">
                              {item.product.category}
                            </td>
                            <td className="px-4 py-3">
                              {item.product.baseUnitType === 'grams'
                                ? `${(item.currentStock / 1000).toFixed(2)} كغ`
                                : `${parseFloat(item.currentStock).toFixed(2)} قطعة`}
                            </td>
                            <td className="px-4 py-3 font-bold text-blue-600">
                              {item.currentCapital.toFixed(2)} د.ت
                            </td>
                            <td className="px-4 py-3">
                              {item.totalQuantitySold} {item.product.baseUnitType === 'grams' ? 'جرام' : 'قطعة'}
                            </td>
                            <td className="px-4 py-3 font-bold text-green-600">
                              {item.totalRevenue.toFixed(2)} د.ت
                            </td>
                            <td className="px-4 py-3 font-bold text-orange-600">
                              {item.totalCost.toFixed(2)} د.ت
                            </td>
                            <td className={`px-4 py-3 font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.profit.toFixed(2)} د.ت
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                item.profitMargin >= 30 ? 'bg-green-100 text-green-800' :
                                item.profitMargin >= 15 ? 'bg-yellow-100 text-yellow-800' :
                                item.profitMargin > 0 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.profitMargin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                          {filteredCapitalProducts.length === 0 && (
                            <tr>
                              <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                لا توجد منتجات تطابق البحث
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'in',
    qtyChangeBaseUnit: '',
    reason: ''
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

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setMovementData({ type: 'in', qtyChangeBaseUnit: '', reason: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      // Convert kg to grams if needed
      const qtyInBaseUnit = selectedProduct.baseUnitType === 'grams'
        ? parseFloat(movementData.qtyChangeBaseUnit) * 1000
        : parseFloat(movementData.qtyChangeBaseUnit);

      await api.post('/stock/move', {
        productId: selectedProduct._id,
        type: movementData.type,
        qtyChangeBaseUnit: qtyInBaseUnit,
        reason: movementData.reason
      });

      toast.success('تم تحديث المخزون بنجاح');
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تحديث المخزون');
    } finally {
      setSubmitting(false);
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
      <h1 className="text-3xl font-bold mb-6">إدارة المخزون</h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">المنتج</th>
                <th className="px-4 py-3 text-right">الفئة</th>
                <th className="px-4 py-3 text-right">المخزون الحالي</th>
                <th className="px-4 py-3 text-right">حد التنبيه</th>
                <th className="px-4 py-3 text-right">قيمة المخزون</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock = product.stockBaseUnit <= product.minAlertStock;
                return (
                  <tr key={product._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{product.name}</td>
                    <td className="px-4 py-3">{product.categoryId?.name}</td>
                    <td className="px-4 py-3">
                      <span className={isLowStock ? 'text-red-600 font-bold' : 'font-semibold'}>
                        {formatStock(product)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatMinAlert(product)}</td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      {product.totalStockValue?.toFixed(2)} د.ت
                    </td>
                    <td className="px-4 py-3">
                      {isLowStock ? (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ⚠️ منخفض
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✓ جيد
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => openStockModal(product)}
                        variant="primary"
                        className="text-sm"
                      >
                        📦 تحديث المخزون
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`تحديث مخزون: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold">
              المخزون الحالي: {selectedProduct && formatStock(selectedProduct)}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              نوع الحركة <span className="text-red-500">*</span>
            </label>
            <select
              value={movementData.type}
              onChange={(e) => setMovementData({ ...movementData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value="in">إضافة مخزون</option>
              <option value="out">خصم مخزون</option>
              <option value="adjustment">تعديل المخزون</option>
            </select>
          </div>

          <Input
            label={`الكمية (${selectedProduct?.baseUnitType === 'grams' ? 'كغ' : 'قطعة'})`}
            type="number"
            step="0.01"
            value={movementData.qtyChangeBaseUnit}
            onChange={(e) => setMovementData({ ...movementData, qtyChangeBaseUnit: e.target.value })}
            placeholder={`أدخل الكمية بالـ${selectedProduct?.baseUnitType === 'grams' ? 'كيلوجرام' : 'قطعة'}`}
            disabled={submitting}
            required
          />

          <Input
            label="السبب"
            value={movementData.reason}
            onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
            placeholder="سبب تحديث المخزون"
            disabled={submitting}
            required
          />

          <div className="flex gap-4 mt-6">
            <Button 
              type="submit" 
              variant="success" 
              fullWidth
              disabled={submitting}
            >
              {submitting ? 'جاري التحديث...' : 'تحديث المخزون'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
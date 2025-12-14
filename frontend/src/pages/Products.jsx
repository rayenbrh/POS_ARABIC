import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    categoryId: '',
    productType: [],
    baseUnitType: 'grams',
    stockBaseUnit: 0,
    minAlertStock: 10,
    pricePerUnit: 0,
    pricePerKg: 0,
    pricePerCup: 0,
    cupWeightGrams: 1800,
    costPrice: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentProduct({
      name: '',
      categoryId: '',
      productType: [],
      baseUnitType: 'grams',
      stockBaseUnit: 0,
      minAlertStock: 10,
      pricePerUnit: 0,
      pricePerKg: 0,
      pricePerCup: 0,
      cupWeightGrams: 1800,
      costPrice: 0
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditMode(true);
    // Convert to kg for display if grams
    // Ensure categoryId is a string (handle both populated object and ID string)
    const categoryIdValue = product.categoryId?._id || product.categoryId || '';
    const displayProduct = {
      ...product,
      categoryId: categoryIdValue,
      stockBaseUnit: product.baseUnitType === 'grams' 
        ? product.stockBaseUnit / 1000 
        : product.stockBaseUnit,
      minAlertStock: product.baseUnitType === 'grams'
        ? product.minAlertStock / 1000
        : product.minAlertStock
    };
    setCurrentProduct(displayProduct);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });
  };

  const handleProductTypeChange = (type) => {
    const types = currentProduct.productType.includes(type)
      ? currentProduct.productType.filter(t => t !== type)
      : [...currentProduct.productType, type];
    setCurrentProduct({ ...currentProduct, productType: types });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentProduct.productType.length === 0) {
      toast.error('يرجى اختيار نوع بيع واحد على الأقل');
      return;
    }

    try {
      // Convert kg to grams before sending if baseUnitType is grams
      const dataToSend = {
        ...currentProduct,
        stockBaseUnit: currentProduct.baseUnitType === 'grams'
          ? parseFloat(currentProduct.stockBaseUnit) * 1000
          : parseFloat(currentProduct.stockBaseUnit),
        minAlertStock: currentProduct.baseUnitType === 'grams'
          ? parseFloat(currentProduct.minAlertStock) * 1000
          : parseFloat(currentProduct.minAlertStock)
      };

      if (editMode) {
        await api.put(`/products/${currentProduct._id}`, dataToSend);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await api.post('/products', dataToSend);
        toast.success('تم إضافة المنتج بنجاح');
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في حفظ المنتج');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success('تم حذف المنتج بنجاح');
      fetchData();
    } catch (error) {
      toast.error('خطأ في حذف المنتج');
    }
  };

  const formatStock = (product) => {
    if (product.baseUnitType === 'grams') {
      return `${(product.stockBaseUnit / 1000).toFixed(2)} كغ`;
    }
    return `${parseFloat(product.stockBaseUnit).toFixed(2)} قطعة`;
  };

  const formatMinAlert = (product) => {
    if (product.baseUnitType === 'grams') {
      return (product.minAlertStock / 1000).toFixed(2);
    }
    return parseFloat(product.minAlertStock).toFixed(2);
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    const productName = product.name?.toLowerCase() || '';
    const categoryName = product.categoryId?.name?.toLowerCase() || '';
    
    return productName.includes(query) || categoryName.includes(query);
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة المنتجات</h1>
        <Button onClick={openAddModal}>
          ➕ إضافة منتج جديد
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ابحث عن منتج أو فئة..."
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            dir="rtl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2 text-right">
          عدد المنتجات: {filteredProducts.length} من أصل {products.length}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">الفئة</th>
                <th className="px-4 py-3 text-right">المخزون</th>
                <th className="px-4 py-3 text-right">حد التنبيه</th>
                <th className="px-4 py-3 text-right">أنواع البيع</th>
                <th className="px-4 py-3 text-right">الأسعار</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{product.name}</td>
                  <td className="px-4 py-3">{product.categoryId?.name}</td>
                  <td className="px-4 py-3">
                    <span className={product.stockBaseUnit <= product.minAlertStock ? 'text-red-600 font-bold' : ''}>
                      {formatStock(product)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatMinAlert(product)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {product.productType.map(type => (
                        <span key={type} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {type === 'kilogram' && 'كغ'}
                          {type === 'cup' && 'كوب'}
                          {type === 'unit' && 'قطعة'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {product.pricePerKg > 0 && <div>كغ: {product.pricePerKg} د.ت</div>}
                    {product.pricePerCup > 0 && <div>كوب: {product.pricePerCup} د.ت</div>}
                    {product.pricePerUnit > 0 && <div>قطعة: {product.pricePerUnit} د.ت</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditModal(product)}
                        variant="secondary"
                        className="text-sm py-1"
                      >
                        ✏️
                      </Button>
                      <Button
                        onClick={() => handleDelete(product._id)}
                        variant="danger"
                        className="text-sm py-1"
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    لا توجد منتجات تطابق البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="اسم المنتج"
              name="name"
              value={currentProduct.name}
              onChange={handleInputChange}
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                الفئة <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={currentProduct.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر الفئة</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                الوحدة الأساسية <span className="text-red-500">*</span>
              </label>
              <select
                name="baseUnitType"
                value={currentProduct.baseUnitType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grams">كيلوجرام</option>
                <option value="pieces">قطعة</option>
              </select>
            </div>

            <Input
              label={`المخزون الأساسي (${currentProduct.baseUnitType === 'grams' ? 'كغ' : 'قطعة'})`}
              type="number"
              step="0.01"
              name="stockBaseUnit"
              value={currentProduct.stockBaseUnit}
              onChange={handleInputChange}
              required
            />

            <Input
              label={`حد التنبيه (${currentProduct.baseUnitType === 'grams' ? 'كغ' : 'قطعة'})`}
              type="number"
              step="0.01"
              name="minAlertStock"
              value={currentProduct.minAlertStock}
              onChange={handleInputChange}
              required
            />

            <Input
              label={`سعر التكلفة (${currentProduct.baseUnitType === 'grams' ? 'للكيلو' : 'للقطعة'})`}
              type="number"
              step="0.01"
              name="costPrice"
              value={currentProduct.costPrice}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              أنواع البيع <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentProduct.productType.includes('unit')}
                  onChange={() => handleProductTypeChange('unit')}
                  className="w-4 h-4"
                />
                <span>بالقطعة</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentProduct.productType.includes('kilogram')}
                  onChange={() => handleProductTypeChange('kilogram')}
                  className="w-4 h-4"
                />
                <span>بالكيلوجرام</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentProduct.productType.includes('cup')}
                  onChange={() => handleProductTypeChange('cup')}
                  className="w-4 h-4"
                />
                <span>بالكوب</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentProduct.productType.includes('unit') && (
              <Input
                label="سعر القطعة"
                type="number"
                step="0.01"
                name="pricePerUnit"
                value={currentProduct.pricePerUnit}
                onChange={handleInputChange}
              />
            )}

            {currentProduct.productType.includes('kilogram') && (
              <Input
                label="سعر الكيلوجرام"
                type="number"
                step="0.01"
                name="pricePerKg"
                value={currentProduct.pricePerKg}
                onChange={handleInputChange}
              />
            )}

            {currentProduct.productType.includes('cup') && (
              <>
                <Input
                  label="سعر الكوب"
                  type="number"
                  step="0.01"
                  name="pricePerCup"
                  value={currentProduct.pricePerCup}
                  onChange={handleInputChange}
                />
                <Input
                  label="وزن الكوب (جرام)"
                  type="number"
                  name="cupWeightGrams"
                  value={currentProduct.cupWeightGrams}
                  onChange={handleInputChange}
                />
              </>
            )}
          </div>

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

export default Products;
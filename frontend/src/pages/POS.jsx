import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Loader from '../components/Loader';
import BarcodeScanner from '../components/BarcodeScanner';

const POS = () => {
  const [activeTab, setActiveTab] = useState('sale');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountGiven, setAmountGiven] = useState('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  
  // New states for enhanced features
  const [entryMode, setEntryMode] = useState('weight');
  const [priceInput, setPriceInput] = useState('');
  const [weightUnit, setWeightUnit] = useState('grams');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(p => {
        const categoryId = p.categoryId?._id || p.categoryId;
        return categoryId === selectedCategory;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const productName = p.name?.toLowerCase() || '';
        const categoryName = p.categoryId?.name?.toLowerCase() || '';
        return productName.includes(query) || categoryName.includes(query);
      });
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, products, searchQuery]);

  const fetchData = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products')
      ]);
      
      setCategories(categoriesRes.data.categories);
      setProducts(productsRes.data.products);
      setFilteredProducts(productsRes.data.products);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const res = await api.get(`/sales?startDate=${startOfDay}&endDate=${endOfDay}`);
      setSales(res.data.sales);
    } catch (error) {
      toast.error('خطأ في جلب المبيعات');
    }
  };

  const handleBarcodeScan = async (barcode) => {
    try {
      const res = await api.get(`/products/barcode/${barcode}`);
      const product = res.data.product;
      
      setShowBarcodeModal(false);
      openProductModal(product);
      
      toast.success(`تم العثور على: ${product.name}`);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('لم يتم العثور على منتج بهذا الباركود');
      } else {
        toast.error('خطأ في البحث عن المنتج');
      }
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setQuantity('');
    setPriceInput('');
    setSelectedUnit(product.productType[0]);
    setEntryMode('weight');
    setWeightUnit('grams');
    setShowProductModal(true);
  };

  const addToCart = () => {
    let qty = 0;
    let qtyBaseUnit = 0;
    let unitPrice = 0;

    if (selectedUnit === 'kilogram') {
      if (entryMode === 'price') {
        const price = parseFloat(priceInput);
        if (!price || price <= 0) {
          toast.error('يرجى إدخال السعر');
          return;
        }
        qty = price / selectedProduct.pricePerKg;
        qtyBaseUnit = qty * 1000;
        unitPrice = price;
      } else {
        qty = parseFloat(quantity);
        if (!qty || qty <= 0) {
          toast.error('يرجى إدخال الكمية');
          return;
        }
        
        if (weightUnit === 'kilos') {
          qtyBaseUnit = qty * 1000;
          unitPrice = selectedProduct.pricePerKg * qty;
        } else {
          qtyBaseUnit = qty;
          unitPrice = selectedProduct.pricePerKg * (qty / 1000);
        }
      }
    } else if (selectedUnit === 'cup') {
      qty = parseFloat(quantity);
      if (!qty || qty <= 0) {
        toast.error('يرجى إدخال الكمية');
        return;
      }
      qtyBaseUnit = qty * selectedProduct.cupWeightGrams;
      unitPrice = selectedProduct.pricePerCup * qty;
    } else if (selectedUnit === 'unit') {
      qty = parseFloat(quantity);
      if (!qty || qty <= 0) {
        toast.error('يرجى إدخال الكمية');
        return;
      }
      qtyBaseUnit = qty;
      unitPrice = selectedProduct.pricePerUnit * qty;
    }

    if (qtyBaseUnit > selectedProduct.stockBaseUnit) {
      toast.error('المخزون غير كافٍ');
      return;
    }

    let displayQty = '';
    if (selectedUnit === 'kilogram') {
      if (entryMode === 'price') {
        displayQty = `${qty.toFixed(2)} كغ (بـ ${priceInput} د.ت)`;
      } else {
        displayQty = weightUnit === 'kilos' ? `${qty} كغ` : `${qty} جرام`;
      }
    } else if (selectedUnit === 'cup') {
      displayQty = `${qty} كوب`;
    } else {
      displayQty = `${qty} قطعة`;
    }

    const cartItem = {
      productId: selectedProduct._id,
      name: selectedProduct.name,
      qtyBaseUnit,
      baseUnitType: selectedProduct.baseUnitType,
      unitPrice,
      subtotal: unitPrice,
      displayQty
    };

    setCart([...cart, cartItem]);
    setShowProductModal(false);
    toast.success('تمت الإضافة إلى السلة');
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getTotalCart = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const openPaymentModal = () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    setAmountGiven('');
    setShowPaymentModal(true);
  };

  const completeSale = async () => {
    const total = getTotalCart();
    const given = parseFloat(amountGiven) || total;
    
    if (given < total) {
      toast.error('المبلغ المدفوع غير كافٍ');
      return;
    }

    const changeReturned = given - total;

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.productId,
          qtyBaseUnit: item.qtyBaseUnit,
          baseUnitType: item.baseUnitType,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        total,
        amountGiven: given,
        changeReturned
      };

      await api.post('/sales', saleData);
      
      if (changeReturned > 0) {
        toast.success(`تمت العملية بنجاح! الباقي: ${changeReturned.toFixed(2)} د.ت`);
      } else {
        toast.success('تمت العملية بنجاح!');
      }
      
      setCart([]);
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إتمام العملية');
    }
  };

  const deleteSale = async (saleId) => {
    if (!window.confirm('هل تريد حذف هذه الفاتورة؟')) return;

    try {
      await api.delete(`/sales/${saleId}`);
      toast.success('تم حذف الفاتورة بنجاح');
      fetchSales();
    } catch (error) {
      toast.error('خطأ في حذف الفاتورة');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('sale')}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'sale'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🛒 البيع
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            fetchSales();
          }}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 سجل المبيعات
        </button>
      </div>

      {activeTab === 'sale' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
              <button
                onClick={() => setShowBarcodeModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-2xl">📷</span>
                <span>مسح الباركود</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
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
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2 text-right">
                    عدد المنتجات: {filteredProducts.length}
                  </p>
                )}
              </div>

              <h3 className="font-bold text-xl mb-4">الفئات</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  الكل
                </button>
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      selectedCategory === cat._id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-bold mb-3">المنتجات</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product._id}
                    onClick={() => openProductModal(product)}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-4 rounded-lg transition-all transform hover:scale-105"
                  >
                    <h4 className="font-bold text-sm mb-2">{product.name}</h4>
                    <p className="text-xs text-gray-600">
                      {product.baseUnitType === 'grams'
                        ? `${(product.stockBaseUnit / 1000).toFixed(2)} كغ`
                        : `${parseFloat(product.stockBaseUnit).toFixed(2)} قطعة`
                      }
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-6">
              <h3 className="font-bold mb-4 text-xl">🛒 السلة</h3>
              
              <div className="max-h-[400px] overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">السلة فارغة</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.displayQty}</span>
                        <span className="font-bold text-blue-600">
                          {item.subtotal.toFixed(2)} د.ت
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold">الإجمالي:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {getTotalCart().toFixed(2)} د.ت
                  </span>
                </div>
                
                <Button
                  onClick={openPaymentModal}
                  variant="success"
                  fullWidth
                  disabled={cart.length === 0}
                  className="text-lg py-3"
                >
                  💳 إتمام العملية
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">سجل المبيعات اليوم</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right">الوقت</th>
                  <th className="px-4 py-3 text-right">عدد المنتجات</th>
                  <th className="px-4 py-3 text-right">الإجمالي</th>
                  <th className="px-4 py-3 text-right">الكاشير</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">
                      {sale._id.slice(-6)}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(sale.createdAt).toLocaleTimeString('ar-TN')}
                    </td>
                    <td className="px-4 py-3">{sale.items.length}</td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      {sale.total.toFixed(2)} د.ت
                    </td>
                    <td className="px-4 py-3">{sale.cashierId?.name}</td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => deleteSale(sale._id)}
                        variant="danger"
                        className="text-sm py-1"
                      >
                        🗑️ حذف
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        title="مسح الباركود"
      >
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={selectedProduct?.name}
      >
        <div>
          <p className="mb-4 text-gray-600">
            المخزون المتاح: {selectedProduct?.baseUnitType === 'grams' 
              ? `${(selectedProduct?.stockBaseUnit / 1000).toFixed(2)} كغ`
              : `${parseFloat(selectedProduct?.stockBaseUnit || 0).toFixed(2)} قطعة`}
          </p>

          <div className="mb-4">
            <label className="block font-semibold mb-2">نوع البيع</label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setQuantity('');
                setPriceInput('');
                setEntryMode('weight');
              }}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {selectedProduct?.productType.map(type => (
                <option key={type} value={type}>
                  {type === 'kilogram' && 'بالكيلوجرام'}
                  {type === 'cup' && 'بالكوب'}
                  {type === 'unit' && 'بالقطعة'}
                </option>
              ))}
            </select>
          </div>

          {selectedUnit === 'kilogram' && (
            <div className="mb-4">
              <label className="block font-semibold mb-2">طريقة الإدخال</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('weight');
                    setPriceInput('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    entryMode === 'weight'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  بالوزن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('price');
                    setQuantity('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    entryMode === 'price'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  بالسعر
                </button>
              </div>
            </div>
          )}

          {selectedUnit === 'kilogram' && entryMode === 'weight' && (
            <>
              <div className="mb-4">
                <label className="block font-semibold mb-2">الوحدة</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWeightUnit('grams');
                      setQuantity('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      weightUnit === 'grams'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    جرام
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeightUnit('kilos');
                      setQuantity('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      weightUnit === 'kilos'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    كيلو
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">
                  الوزن ({weightUnit === 'grams' ? 'جرام' : 'كغ'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={`أدخل الوزن بـ${weightUnit === 'grams' ? 'الجرام' : 'الكيلو'}`}
                />
              </div>
            </>
          )}

          {selectedUnit === 'kilogram' && entryMode === 'price' && (
            <div className="mb-4">
              <label className="block font-semibold mb-2">السعر (د.ت)</label>
              <input
                type="number"
                step="0.01"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="أدخل السعر"
              />
              {priceInput && selectedProduct?.pricePerKg > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  الوزن: {(parseFloat(priceInput) / selectedProduct.pricePerKg).toFixed(2)} كغ
                </p>
              )}
            </div>
          )}

          {selectedUnit !== 'kilogram' && (
            <div className="mb-4">
              <label className="block font-semibold mb-2">الكمية</label>
              <input
                type="number"
                step={selectedUnit === 'unit' ? '1' : '0.01'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="أدخل الكمية"
              />
            </div>
          )}

          {((selectedUnit === 'kilogram' && ((entryMode === 'weight' && quantity) || (entryMode === 'price' && priceInput))) ||
            (selectedUnit !== 'kilogram' && quantity)) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-bold text-blue-600">
                السعر:{' '}
                {selectedUnit === 'kilogram' && entryMode === 'weight' && (
                  weightUnit === 'kilos'
                    ? (selectedProduct?.pricePerKg * parseFloat(quantity || 0)).toFixed(2)
                    : (selectedProduct?.pricePerKg * (parseFloat(quantity || 0) / 1000)).toFixed(2)
                )}
                {selectedUnit === 'kilogram' && entryMode === 'price' && parseFloat(priceInput || 0).toFixed(2)}
                {selectedUnit === 'cup' && (selectedProduct?.pricePerCup * parseFloat(quantity || 0)).toFixed(2)}
                {selectedUnit === 'unit' && (selectedProduct?.pricePerUnit * parseFloat(quantity || 0)).toFixed(2)}
                {' '}د.ت
              </p>
            </div>
          )}

          <Button onClick={addToCart} variant="success" fullWidth>
            إضافة إلى السلة
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="إتمام الدفع"
      >
        <div>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-center">
              المبلغ المطلوب: {getTotalCart().toFixed(2)} د.ت
            </p>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">
              المبلغ المدفوع <span className="text-sm text-gray-500">(اختياري)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amountGiven}
              onChange={(e) => setAmountGiven(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-2xl text-center"
              placeholder="اترك فارغاً للدفع الدقيق"
              autoFocus
            />
          </div>

          {amountGiven && parseFloat(amountGiven) >= getTotalCart() && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="font-bold text-green-600 text-center text-xl">
                الباقي: {(parseFloat(amountGiven) - getTotalCart()).toFixed(2)} د.ت
              </p>
            </div>
          )}

          {!amountGiven && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                سيتم تسجيل الدفع الدقيق بدون باقي
              </p>
            </div>
          )}

          <Button 
            onClick={completeSale} 
            variant="success" 
            fullWidth
            className="text-lg py-3"
          >
            ✓ تأكيد الدفع
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default POS;
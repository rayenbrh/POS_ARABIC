import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const Sidebar = ({ isOpen: externalIsOpen, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync with external state if provided
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && isOpen) {
      handleToggle(false);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: '📊', roles: ['admin', 'cashier'] },
    { path: '/pos', label: 'نقطة البيع', icon: '🛒', roles: ['admin', 'cashier'] },
    { path: '/products', label: 'المنتجات', icon: '📦', roles: ['admin'] },
    { path: '/categories', label: 'الفئات', icon: '📑', roles: ['admin'] },
    { path: '/inventory', label: 'المخزون', icon: '📋', roles: ['admin'] },
    { path: '/expenses', label: 'المصروفات', icon: '💸', roles: ['admin', 'cashier'] },
    { path: '/reports', label: 'التقارير', icon: '📈', roles: ['admin'] },
    { path: '/analytics', label: 'التحليلات المتقدمة', icon: '📊', roles: ['admin'] },
    { path: '/users', label: 'المستخدمين', icon: '👥', roles: ['admin'] },
    { path: '/deleted-tickets', label: 'الفواتير المحذوفة', icon: '🗑️', roles: ['admin'] }
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const handleToggle = (value) => {
    setIsOpen(value);
    if (onToggle) onToggle(value);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => handleToggle(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 ease-in-out shadow-2xl flex-shrink-0
          ${isMobile ? 'fixed right-0 top-0 h-full z-50' : ''}
          ${isOpen ? (isMobile ? 'w-full' : 'w-64') : 'w-0'}
          ${isMobile && !isOpen ? 'translate-x-full' : ''}
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b border-gray-700 ${isMobile ? 'w-full' : 'min-w-[256px]'}`}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">نظام نقطة البيع</h1>
            <button
              onClick={() => handleToggle(false)}
              className="text-gray-400 hover:text-white transition-colors"
              title="إخفاء القائمة"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'مدير' : 'كاشير'}</p>
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 p-4 overflow-y-auto ${isMobile ? 'w-full' : 'min-w-[256px]'}`}>
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t border-gray-700 ${isMobile ? 'w-full' : 'min-w-[256px]'}`}>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Toggle Button - يظهر عندما تكون القائمة مخفية */}
      {!isOpen && (
        <button
          onClick={() => handleToggle(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl transition-all hover:scale-110 animate-pulse"
          title="إظهار القائمة"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
};

export default Sidebar;
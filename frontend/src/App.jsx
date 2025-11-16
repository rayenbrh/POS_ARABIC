import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import DeletedTickets from './pages/DeletedTickets';
import Expenses from './pages/Expenses';
import Loader from './components/Loader';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <Loader fullScreen />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout with Sidebar
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar by default on mobile
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContentClick = () => {
    // Only close on desktop when clicking content
    if (sidebarOpen && !isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main 
        className="flex-1 overflow-y-auto w-full"
        onClick={handleContentClick}
      >
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              fontFamily: 'Cairo, Tajawal, sans-serif',
              direction: 'rtl',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <Layout>
                  <POS />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Categories />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/deleted-tickets"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <DeletedTickets />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
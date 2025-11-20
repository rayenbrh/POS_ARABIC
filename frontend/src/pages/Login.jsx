import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Loader from '../components/Loader';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(formData.email, formData.password);
    
    setLoading(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/spices-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Blur overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-md bg-black/30"
        style={{ backdropFilter: 'blur(8px)' }}
      ></div>

      {/* Login card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">نظام نقطة البيع</h1>
          <p className="text-gray-600">إدارة المخزون والمبيعات</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="البريد الإلكتروني"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            required
          />

          <Input
            label="كلمة المرور"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Button type="submit" fullWidth className="mt-6">
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;

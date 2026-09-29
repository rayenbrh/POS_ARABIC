import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Loader from '../components/Loader';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier'
  });
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users);
      setLoading(false);
    } catch (error) {
      toast.error('خطأ في جلب المستخدمين');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post('/auth/users', newUser);
      toast.success('تم إضافة المستخدم بنجاح');
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إضافة المستخدم');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/auth/users/${passwordUser._id}/password`, { password: newPassword });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordUser(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تغيير كلمة المرور');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/users/${deleteUserTarget._id}`);
      toast.success('تم حذف المستخدم بنجاح');
      setDeleteUserTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في حذف المستخدم');
      setDeleteUserTarget(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={() => setShowModal(true)}>
          ➕ إضافة مستخدم جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(user.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{user.name || 'بدون اسم'}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {user.role === 'admin' ? '👑 مدير' : '💼 كاشير'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPasswordUser(user);
                    setNewPassword('');
                  }}
                  title="تغيير كلمة المرور"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  🔑
                </button>
                <button
                  onClick={() => setDeleteUserTarget(user)}
                  title="حذف المستخدم"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="إضافة مستخدم جديد"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="الاسم الكامل"
            name="name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            name="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />

          <Input
            label="كلمة المرور"
            type="password"
            name="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              الصلاحية <span className="text-red-500">*</span>
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cashier">كاشير</option>
              <option value="admin">مدير</option>
            </select>
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="success" fullWidth>
              إضافة المستخدم
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={!!passwordUser}
        onClose={() => setPasswordUser(null)}
        title={`تغيير كلمة مرور: ${passwordUser?.name || ''}`}
      >
        <form onSubmit={handlePasswordSubmit}>
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="success" fullWidth>
              حفظ كلمة المرور
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setPasswordUser(null)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        title="تأكيد الحذف"
      >
        <p className="mb-6 text-gray-700">
          هل أنت متأكد من حذف المستخدم{' '}
          <span className="font-bold">{deleteUserTarget?.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-4">
          <Button variant="danger" fullWidth onClick={handleDelete}>
            حذف
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setDeleteUserTarget(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { Plus, Search, Edit2, Trash2, Shield, User as UserIcon, Mail, Key, X, Check, AlertCircle } from 'lucide-react';

const Users: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CASHIER' | 'STOCKKEEPER'>('CASHIER');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setPassword(''); // Don't show password
      setName(user.name);
      setRole(user.role);
    } else {
      setEditingUser(null);
      setUsername('');
      setPassword('');
      setName('');
      setRole('CASHIER');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!username || !name || (!editingUser && !password)) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (editingUser) {
      await updateUser(editingUser.id, {
        username,
        name,
        role,
        ...(password ? { password } : {})
      });
    } else {
      await addUser({
        id: `U${Date.now().toString().slice(-4)}`,
        username,
        password,
        name,
        role
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Bạn không thể xóa chính mình!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      await deleteUser(id);
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-bold">Truy cập bị từ chối</p>
        <p>Chỉ Quản trị viên mới có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Quản lý người dùng</h2>
          <p className="text-sm text-slate-500 font-medium">Thêm, sửa, xóa tài khoản nhân viên</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md"
        >
          <Plus size={20} /> Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc tài khoản..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3">Người dùng</th>
                <th className="px-6 py-3">Tài khoản</th>
                <th className="px-6 py-3">Vai trò</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400 font-medium">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">
                      {user.username}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'CASHIER' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      <Shield size={10} />
                      {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'CASHIER' ? 'Thu ngân' : 'Kho hàng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                {editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên hiển thị</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên đăng nhập</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700"
                    placeholder="admin, nhanvien01..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Mật khẩu {editingUser && '(Để trống nếu không đổi)'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vai trò</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADMIN', 'CASHIER', 'STOCKKEEPER'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        role === r 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {r === 'ADMIN' ? 'Quản trị' : r === 'CASHIER' ? 'Thu ngân' : 'Kho hàng'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Check size={20} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

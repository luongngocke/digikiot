import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Pencil, 
  ChevronDown, 
  ChevronRight,
  ShoppingCart, 
  FileText, 
  ClipboardList, 
  RotateCcw, 
  Wallet, 
  Box, 
  CheckCircle, 
  History, 
  ArrowLeftRight, 
  Truck, 
  Printer,
  Trash2, 
  ShieldCheck, 
  Package,
  Info,
  LogOut
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const MoreMenu: React.FC = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    {
      title: 'Giao dịch',
      items: [
        { label: 'Bán hàng', icon: <ShoppingCart className="text-blue-500" />, path: '/pos' },
        { label: 'Hóa đơn', icon: <FileText className="text-blue-500" />, path: '/invoices' },
        { label: 'Đặt hàng', icon: <ClipboardList className="text-blue-500" />, path: '#' },
        { label: 'Trả hàng', icon: <RotateCcw className="text-blue-500" />, path: '/return-sales' },
        { label: 'Sổ quỹ', icon: <Wallet className="text-blue-500" />, path: '/cash-ledger' },
      ]
    },
    {
      title: 'Hàng hoá',
      items: [
        { label: 'Hàng hoá', icon: <Box className="text-blue-500" />, path: '/inventory' },
        { label: 'Kiểm kho', icon: <CheckCircle className="text-blue-500" />, path: '#' },
        { label: 'Nhập hàng', icon: <History className="text-blue-500" />, path: '/import-history' },
        { label: 'Trả hàng nhập', icon: <ArrowLeftRight className="text-blue-500" />, path: '/return-import' },
        { label: 'Chuyển hàng', icon: <Truck className="text-blue-500" />, path: '#' },
        { label: 'Xuất hủy', icon: <Trash2 className="text-blue-500" />, path: '#' },
        { label: 'Phiếu bảo hành', icon: <ShieldCheck className="text-blue-500" />, path: '/maintenance' },
        { label: 'Xuất dùng nội bộ', icon: <Package className="text-blue-500" />, path: '#' },
      ]
    },
    {
      title: 'Cấu hình',
      items: [
        { label: 'Cài đặt bản in', icon: <Printer className="text-blue-500" />, path: '/print-settings' },
        { label: 'Bảng giá', icon: <Pencil className="text-blue-500" />, path: '/price-settings' },
        { label: 'Quản lý nhân viên', icon: <User className="text-blue-500" />, path: '/users' },
      ]
    }
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* User Profile Header */}
      <div className="bg-white p-4 mb-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-slate-100">
            {/* Placeholder for logo/avatar */}
            <span className="font-bold text-xl">{currentUser?.name?.charAt(0) || 'A'}</span>
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 leading-tight">{currentUser?.username || 'admin'}</h2>
            <p className="text-sm text-slate-400 font-medium">{currentUser?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-slate-50 text-slate-400 rounded-full">
            <Pencil size={18} />
          </button>
          <button className="p-2 bg-slate-50 text-slate-400 rounded-full">
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Store Info Link */}
      <Link to="#" className="bg-white px-4 py-4 mb-4 flex items-center justify-between shadow-sm active:bg-slate-50">
        <span className="font-bold text-slate-700">Thông tin cửa hàng</span>
        <ChevronRight size={18} className="text-slate-300" />
      </Link>

      {/* Sections */}
      {sections.map((section, idx) => (
        <div key={idx} className="bg-white p-4 mb-4 shadow-sm rounded-xl mx-2">
          <h3 className="font-bold text-lg text-slate-800 mb-4">{section.title}</h3>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            {section.items.map((item, iIdx) => (
              <Link key={iIdx} to={item.path} className="flex items-center gap-3 active:opacity-70">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                </div>
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <div className="px-2 mt-6">
        <button 
          onClick={handleLogout}
          className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-3 text-red-600 font-bold active:bg-red-50 transition-colors border border-red-100"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

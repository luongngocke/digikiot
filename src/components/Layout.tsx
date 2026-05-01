import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Store, Search, Truck, Bell, Settings, ChevronDown, ShoppingCart, Home, Box, FileText, Users, Package, History, RotateCcw, ClipboardList, PlusCircle, Tag, ShieldCheck, Wallet, LogOut, Menu, ArrowLeftRight, Printer, DollarSign, Wrench, Send, Wifi } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAppContext();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const getPageTitle = () => {
    const currentPath = location.pathname;
    if (currentPath === '/') return 'Tổng quan';
    if (currentPath === '/inventory') return 'Hàng hóa';
    if (currentPath === '/invoices') return 'Hóa đơn';
    if (currentPath === '/return-sales') return 'Trả hàng bán';
    if (currentPath === '/import') return 'Nhập hàng';
    if (currentPath === '/import-history') return 'Lịch sử nhập';
    if (currentPath === '/return-import') return 'Trả hàng nhập';
    if (currentPath === '/customers') return 'Khách hàng';
    if (currentPath === '/suppliers') return 'Nhà cung cấp';
    if (currentPath === '/more') return 'Nhiều hơn';
    if (currentPath === '/pos') return 'Bán hàng';
    if (currentPath === '/cash-ledger') return 'Sổ quỹ';
    if (currentPath === '/reports') return 'Báo cáo';
    if (currentPath === '/maintenance') return 'Bảo hành, sửa chữa';
    if (currentPath === '/wifi') return 'Quản lý Wifi';
    if (currentPath === '/camera') return 'Quản lý Camera';
    if (currentPath === '/price-settings') return 'Thiết lập giá';
    if (currentPath === '/users') return 'Người dùng';
    if (currentPath === '/print-settings') return 'Cài đặt bản in';
    if (currentPath === '/tasks') return 'Quản lý công việc';
    if (currentPath === '/external-serials') return 'External Serial';
    if (currentPath === '/wallets') return 'Quản lý Ví';
    return 'Hệ thống';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Tổng quan', type: 'link' },
    { 
      label: 'Hàng hóa', 
      type: 'dropdown',
      id: 'hang-hoa',
      sections: [
        {
          title: 'Hàng hóa',
          items: [
            { label: 'Danh sách hàng hóa', path: '/inventory', icon: <Box size={14} /> },
            { label: 'Thiết lập giá', path: '/price-settings', icon: <Tag size={14} /> },
            { label: 'External Serial', path: '/external-serials', icon: <Box size={14} /> },
          ]
        }
      ]
    },
    { 
      label: 'Giao dịch', 
      type: 'dropdown',
      id: 'giao-dich',
      sections: [
        {
          title: 'Bán hàng',
          items: [
            { label: 'Hóa đơn xuất bán', path: '/invoices', icon: <FileText size={14} /> },
            { label: 'Trả hàng bán', path: '/return-sales', icon: <RotateCcw size={14} /> },
          ]
        },
        {
          title: 'Nhập hàng',
          items: [
            { label: 'Nhập hàng', path: '/import-history', icon: <History size={14} /> },
            { label: 'Trả hàng nhập', path: '/return-import', icon: <RotateCcw size={14} /> },
          ]
        },
        {
          title: 'Tài chính',
          items: [
            { label: 'Sổ quỹ', path: '/cash-ledger', icon: <Wallet size={14} /> },
            { label: 'Quản lý Ví', path: '/wallets', icon: <Wallet size={14} /> },
          ]
        }
      ]
    },
    { 
      label: 'Đối tác', 
      type: 'dropdown',
      id: 'doi-tac',
      sections: [
        {
          items: [
            { label: 'Khách hàng', path: '/customers', icon: <Users size={14} /> },
            { label: 'Nhà cung cấp', path: '/suppliers', icon: <Truck size={14} /> },
          ]
        }
      ]
    },
    { 
      label: 'Dịch vụ', 
      type: 'dropdown',
      id: 'dich-vu',
      sections: [
        {
          items: [
            { label: 'Bảo hành, sửa chữa', path: '/maintenance', icon: <Wrench size={14} /> },
            { label: 'Quản lý Wifi', path: '/wifi', icon: <Wifi size={14} /> },
            { label: 'Quản lý Camera', path: '/camera', icon: <ShieldCheck size={14} /> },
          ]
        }
      ]
    },
    { path: '/tasks', label: 'Công việc', type: 'link' },
    { 
      label: 'Báo cáo', 
      type: 'dropdown',
      id: 'bao-cao',
      sections: [
        {
          items: [
            { label: 'Cuối ngày', path: '/reports?tab=end_of_day', icon: <ClipboardList size={14} /> },
            { label: 'Bán hàng', path: '/reports?tab=sales', icon: <ShoppingCart size={14} /> },
            { label: 'Đặt hàng', path: '/reports?tab=orders', icon: <Package size={14} /> },
            { label: 'Hàng hóa', path: '/reports?tab=inventory', icon: <Box size={14} /> },
            { label: 'Khách hàng', path: '/reports?tab=customers', icon: <Users size={14} /> },
          ]
        },
        {
          items: [
            { label: 'Nhà cung cấp', path: '/reports?tab=suppliers', icon: <Truck size={14} /> },
            { label: 'Nhân viên', path: '/reports?tab=staff', icon: <Users size={14} /> },
            { label: 'Kênh bán hàng', path: '/reports?tab=channels', icon: <Store size={14} /> },
            { label: 'Tài chính', path: '/reports?tab=finance', icon: <DollarSign size={14} /> },
          ]
        }
      ]
    },
    ...(currentUser?.role === 'ADMIN' ? [{
      label: 'Thiết lập',
      type: 'dropdown',
      id: 'thiet-lap',
      sections: [
        {
          items: [
            { label: 'Quản lý người dùng', path: '/users', icon: <Users size={14} /> },
            { label: 'Cài đặt bản in', path: '/print-settings', icon: <Printer size={14} /> },
            { label: 'Cấu hình gửi tin nhắn', path: '/telegram-settings', icon: <Send size={14} /> },
          ]
        }
      ]
    }] : [])
  ];

  const mobileNavItems = [
    { path: '/', label: 'Tổng quan', icon: <Home size={20} /> },
    { path: '/inventory', label: 'Hàng hóa', icon: <Box size={20} /> },
    { path: '/invoices', label: 'Bán hàng', icon: <FileText size={20} /> },
    { path: '/customers', label: 'Khách hàng', icon: <Users size={20} /> },
    { path: '/more', label: 'Nhiều hơn', icon: <Menu size={20} /> }
  ];

  return (
    <div className={`min-h-screen bg-[#f4f7fa] text-slate-800 font-sans print:bg-white print:p-0 ${location.pathname === '/pos' || location.pathname === '/import' ? 'pb-0 pt-0' : 'pb-24 pt-16'} md:pb-0 md:pt-[96px] overflow-x-hidden flex flex-col`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex flex-col shadow-sm print:hidden ${location.pathname === '/pos' || location.pathname === '/import' ? 'hidden md:flex' : ''}`}>
        {/* Top Row */}
        <div className="bg-white border-b border-slate-100 relative z-20">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
            {/* Mobile Title */}
            <div className="md:hidden flex items-center gap-2">
              <img 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdQP0PicQxdVjonWLo_k6WbJVjn2y3OVvrBw3JYpe6pIlbJStebP6OB3QBG9BVvcTWfoFj4g26FZBvUN-GefJXgjQrUA3LWRpYe2xvA3TijfQi0Llm9gQKj-eHSEfj2FFft65XBgGIWTZ9WQGnx0rVZz5PJ95PYsI6jBiKqtcTd145uKYZG5Vu_d53jWA/s1600/logo.png" 
                alt="Logo" 
                className="w-7 h-7 object-contain"
                referrerPolicy="no-referrer"
              />
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">DigiKiot</h1>
            </div>

            <Link to="/" className="hidden md:flex items-center gap-2.5 cursor-pointer">
              <img 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdQP0PicQxdVjonWLo_k6WbJVjn2y3OVvrBw3JYpe6pIlbJStebP6OB3QBG9BVvcTWfoFj4g26FZBvUN-GefJXgjQrUA3LWRpYe2xvA3TijfQi0Llm9gQKj-eHSEfj2FFft65XBgGIWTZ9WQGnx0rVZz5PJ95PYsI6jBiKqtcTd145uKYZG5Vu_d53jWA/s1600/logo.png" 
                alt="Logo" 
                className="w-9 h-9 object-contain scale-110"
                referrerPolicy="no-referrer"
              />
              <h1 className="font-bold text-slate-800 text-[19px] tracking-tight hidden md:block">Digikiot</h1>
              
              {location.pathname === '/pos' && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
                  Bán hàng
                </span>
              )}
            </Link>
            
            <div className="flex items-center gap-4 md:gap-6">
              {/* Mobile Title Replacement for Icons */}
              <div className="md:hidden">
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {getPageTitle()}
                </span>
              </div>

              <div className="hidden md:flex relative text-slate-600">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm nhanh (F3)..." 
                  className="bg-slate-100 hover:bg-slate-200/80 focus:bg-white focus:ring-2 focus:ring-blue-100 px-9 py-2.5 rounded-lg text-[13px] font-medium outline-none w-[420px] transition-all border border-slate-200/50 focus:border-blue-400" 
                />
              </div>
              <div className="hidden md:flex items-center gap-5 text-slate-500">
                <Truck className="cursor-pointer hover:text-blue-600 transition-colors" size={18} />
                <Bell className="cursor-pointer hover:text-blue-600 transition-colors" size={18} />
                <Settings className="cursor-pointer hover:text-blue-600 transition-colors" size={18} />
              </div>
              <div 
                className="hidden md:flex items-center gap-2 cursor-pointer md:border-l md:border-slate-200 md:pl-4 relative"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                  {currentUser?.name.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-xs font-bold text-slate-700 leading-none">{currentUser?.name || 'Người dùng'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{currentUser?.role === 'ADMIN' ? 'Quản trị viên' : currentUser?.role === 'CASHIER' ? 'Thu ngân' : 'Nhân viên'}</span>
                </div>
                <ChevronDown className="text-slate-400 hidden md:block" size={14} />

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:block bg-[#2563eb] relative text-[14px] z-10 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-[42px] flex items-stretch">
            {navItems.map(item => (
              <div 
                key={item.label}
                className="relative group h-full"
                onMouseEnter={() => item.type === 'dropdown' && setActiveDropdown(item.id || null)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.type === 'link' ? (
                  <Link
                    to={item.path || '/'}
                    className={`px-5 h-full flex items-center transition-all font-bold tracking-wide ${location.pathname === item.path ? 'bg-black/20 text-white' : 'text-blue-50 hover:bg-white/10'}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div className={`px-5 h-full flex items-center transition-all font-bold tracking-wide cursor-pointer ${activeDropdown === item.id ? 'bg-white text-[#2563eb]' : 'text-blue-50 hover:bg-white/10'}`}>
                    {item.label}
                    <ChevronDown size={14} className={`ml-1 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                    
                    {/* Dropdown Menu */}
                    {activeDropdown === item.id && (
                      <div className="absolute top-full left-0 bg-white shadow-xl border border-slate-100 min-w-[240px] py-2 animate-in fade-in slide-in-from-top-2 duration-200 flex rounded-b-lg">
                        {item.sections?.map((section, sIdx) => (
                          <div key={sIdx} className={`px-4 py-2 ${sIdx > 0 ? 'border-l border-slate-50 min-w-[200px]' : 'min-w-[220px]'}`}>
                            {section.title && (
                              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">{section.title}</h4>
                            )}
                            <div className="space-y-0.5">
                              {section.items.map((subItem, iIdx) => (
                                <Link
                                  key={iIdx}
                                  to={subItem.path}
                                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-[#2563eb] transition-all group/item"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400 group-hover/item:text-[#2563eb] transition-colors">{subItem.icon}</span>
                                    <span className="font-semibold text-[14px]">{subItem.label}</span>
                                  </div>
                                  {subItem.badge && (
                                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{subItem.badge}</span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <div className="ml-auto h-full flex items-center py-1.5">
              <Link to="/pos" className="h-full px-5 bg-white text-[#2563eb] font-bold rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm text-xs tracking-wider">
                <ShoppingCart size={16} /> Bán hàng
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto md:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-[68px] flex justify-around items-center px-1 z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)] print:hidden ${location.pathname === '/pos' || location.pathname === '/import' ? 'hidden' : ''}`}>
        {mobileNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-600'}`}
          >
            <div className={`p-2 rounded-lg ${location.pathname === item.path ? 'bg-blue-50' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-bold tracking-tight uppercase">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

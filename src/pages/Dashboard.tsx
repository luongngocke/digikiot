import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingCart, 
  Truck, 
  Box, 
  PieChart, 
  Users, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  RotateCcw,
  BarChart3,
  Calendar,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  Check
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatNumber } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { invoices, returnSalesOrders, cashTransactions } = useAppContext();
  const [showProfit, setShowProfit] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'this_year'>('today');

  const parseDate = (dateStr: any) => {
    if (!dateStr) return new Date(0);
    
    const str = String(dateStr);
    // Clean up the string: split by space, comma, or 'T'
    const tokens = str.split(/[\s,T]+/);
    // Find the token that looks like a date (contains / or -), fallback to first token
    const datePart = tokens.find(t => t.includes('/') || t.includes('-')) || tokens[0];
    
    let d: Date;
    // Handle DD/MM/YYYY
    if (datePart.includes('/')) {
      const parts = datePart.split('/');
      if (parts.length === 3) {
        // If first part is 4 digits, it's YYYY/MM/DD
        if (parts[0].length === 4) {
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          // Otherwise assume DD/MM/YYYY
          d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        d = new Date(str);
      }
    } else if (datePart.includes('-')) {
      // Handle YYYY-MM-DD
      const parts = datePart.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          // Assume DD-MM-YYYY
          d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        d = new Date(str);
      }
    } else {
      // Check if it's a numeric timestamp
      if (!isNaN(Number(str))) {
        d = new Date(Number(str));
      } else {
        d = new Date(str);
      }
    }

    // Return a date object set to midnight for accurate comparison
    if (isNaN(d.getTime())) return new Date(0);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Hôm nay';
      case 'yesterday': return 'Hôm qua';
      case 'last_7_days': return '7 ngày qua';
      case 'this_month': return 'Tháng này';
      case 'last_month': return 'Tháng trước';
      case 'this_year': return 'Năm nay';
      default: return 'Chọn thời gian';
    }
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const filterByRange = (items: any[]) => {
      return items.filter(item => {
        const itemDate = parseDate(item.date);
        const itemTime = itemDate.getTime();
        
        if (dateRange === 'today') {
          return itemTime === startOfToday.getTime();
        }
        if (dateRange === 'yesterday') {
          const yesterday = new Date(startOfToday);
          yesterday.setDate(yesterday.getDate() - 1);
          return itemTime === yesterday.getTime();
        }
        if (dateRange === 'last_7_days') {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days including today
          return itemTime >= sevenDaysAgo.getTime() && itemTime <= startOfToday.getTime();
        }
        if (dateRange === 'this_month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (dateRange === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
        }
        if (dateRange === 'this_year') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    };

    return {
      invoices: filterByRange(invoices),
      returns: filterByRange(returnSalesOrders),
      cashTransactions: filterByRange(cashTransactions)
    };
  }, [invoices, returnSalesOrders, cashTransactions, dateRange]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalOrders = filteredData.invoices.length;
    
    const totalCost = filteredData.invoices.reduce((sum, inv) => {
      const items = inv.items || [];
      return sum + items.reduce((iSum: number, item: any) => iSum + (item.importPriceTotal || 0), 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost;

    const totalReturns = filteredData.returns.reduce((sum, ret) => sum + (ret.total || 0), 0);
    const returnCount = filteredData.returns.length;

    const totalCashIn = filteredData.cashTransactions
      .filter(tx => tx.type === 'RECEIPT')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalCashOut = filteredData.cashTransactions
      .filter(tx => tx.type === 'PAYMENT')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return {
      totalRevenue,
      totalOrders,
      totalProfit,
      totalReturns,
      returnCount,
      totalCashIn,
      totalCashOut
    };
  }, [filteredData]);

  // Chart data - group by day (always show last 7 days for visual context, or adjust to range)
  const chartData = useMemo(() => {
    if (dateRange === 'this_year') {
      const months = [...Array(12)].map((_, i) => `T${i + 1}`);
      const dataMap: Record<string, number> = {};
      months.forEach(m => dataMap[m] = 0);

      filteredData.invoices.forEach(inv => {
        if (!inv.date) return;
        const itemDate = parseDate(inv.date);
        const monthStr = `T${itemDate.getMonth() + 1}`;
        if (dataMap[monthStr] !== undefined) {
          dataMap[monthStr] += (inv.total || 0);
        }
      });

      return months.map(m => ({
        name: m,
        revenue: dataMap[m]
      }));
    }

    const daysToShow = dateRange === 'this_month' || dateRange === 'last_month' ? 30 : 7;
    const lastDays = [...Array(daysToShow)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (daysToShow - 1 - i));
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    const dataMap: Record<string, number> = {};
    lastDays.forEach(day => dataMap[day] = 0);

    filteredData.invoices.forEach(inv => {
      if (!inv.date) return;
      const itemDate = parseDate(inv.date);
      const dayMonth = itemDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (dataMap[dayMonth] !== undefined) {
        dataMap[dayMonth] += (inv.total || 0);
      }
    });

    return lastDays.map(day => ({
      name: day,
      revenue: dataMap[day]
    }));
  }, [filteredData, dateRange]);

  const formatKilo = (val: number) => {
    return formatNumber(val);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 md:bg-transparent px-0 md:px-0 py-0 md:py-0">
      {/* Desktop View */}
      <div className="hidden md:block p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-8 rounded-xl text-white shadow-lg relative overflow-hidden group border border-blue-500/20">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-[11px] font-bold uppercase tracking-[0.2em] mb-2 opacity-90">Doanh thu hệ thống</p>
                  <h2 className="text-4xl md:text-5xl font-bold mb-10 tracking-tighter drop-shadow-md">{formatNumber(stats.totalRevenue)}đ</h2>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-[11px] font-bold uppercase tracking-[0.2em] mb-2 opacity-90">Lợi nhuận</p>
                  <h2 className="text-3xl md:text-4xl font-bold mb-10 tracking-tighter drop-shadow-md text-emerald-300">{formatNumber(stats.totalProfit)}đ</h2>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/20 shadow-xl flex-1">
                  <p className="text-[10px] font-bold uppercase opacity-70 mb-1 tracking-widest">Đơn bán</p>
                  <p className="font-bold text-2xl tracking-tighter">{stats.totalOrders}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/20 shadow-xl flex-1">
                  <p className="text-[10px] font-bold uppercase opacity-70 mb-1 tracking-widest text-emerald-200">Tiền vào (Sổ quỹ)</p>
                  <p className="font-bold text-2xl tracking-tighter text-emerald-300">+{formatNumber(stats.totalCashIn)}đ</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/20 shadow-xl flex-1">
                  <p className="text-[10px] font-bold uppercase opacity-70 mb-1 tracking-widest text-rose-200">Tiền ra (Sổ quỹ)</p>
                  <p className="font-bold text-2xl tracking-tighter text-rose-300">-{formatNumber(stats.totalCashOut)}đ</p>
                </div>
              </div>
            </div>
            <TrendingUp className="absolute bottom-0 right-0 text-white/5 translate-y-1/4 translate-x-1/4 rotate-12 transition-transform duration-1000 group-hover:scale-110" size={280} />
          </div>
          
          <div className="grid grid-rows-2 gap-4">
            <Link to="/pos" className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-5 hover:border-blue-400 hover:shadow-md transition-all active:scale-95 group shadow-sm">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center group-hover:rotate-3 transition-transform shadow-sm border border-orange-100">
                <ShoppingCart size={32} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-sm tracking-tight">Bán hàng</p>
                <p className="text-[11px] text-slate-400 font-medium">Tạo hóa đơn POS nhanh</p>
              </div>
            </Link>
            <Link to="/import" className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-5 hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 group shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-3 transition-transform shadow-sm border border-indigo-100">
                <Truck size={32} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-sm tracking-tight">Nhập hàng</p>
                <p className="text-[11px] text-slate-400 font-medium">Tạo phiếu nhập kho</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-4 p-4 pb-24">
        {/* Date Selector */}
        <div className="flex items-center justify-center relative">
          <button 
            onClick={() => setShowDateModal(true)}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-bold border border-blue-100 shadow-sm active:scale-95 transition-all"
          >
            <Calendar size={16} />
            <span>{getRangeLabel()}</span>
            <ChevronDown size={16} />
          </button>

          {showDateModal && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDateModal(false)}>
              <div className="bg-white w-full rounded-t-[2rem] p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-black text-slate-800 mb-6 text-left px-2">Thời gian</h3>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { id: 'today', label: 'Hôm nay' },
                    { id: 'yesterday', label: 'Hôm qua' },
                    { id: 'last_7_days', label: '7 ngày qua' },
                    { id: 'this_month', label: 'Tháng này' },
                    { id: 'last_month', label: 'Tháng trước' },
                    { id: 'this_year', label: 'Năm nay' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setDateRange(option.id as any);
                        setShowDateModal(false);
                      }}
                      className={`w-full p-4 rounded-xl text-base font-bold transition-all flex items-center justify-between ${dateRange === option.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-800 hover:bg-slate-50'}`}
                    >
                      {option.label}
                      {dateRange === option.id && <Check size={20} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowDateModal(false)}
                  className="w-full mt-6 p-4 bg-slate-900 text-white rounded-2xl font-bold text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 truncate">Doanh thu ({stats.totalOrders} đơn)</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tighter break-all">{formatKilo(stats.totalRevenue)}</span>
                <span className="text-xs font-bold text-slate-500">đ</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Lợi nhuận</p>
                <button onClick={() => setShowProfit(!showProfit)} className="text-slate-400">
                  {showProfit ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex items-baseline justify-end gap-1 flex-wrap">
                {showProfit ? (
                  <>
                    <span className="text-xl sm:text-2xl font-black text-emerald-500 tracking-tighter break-all">{formatKilo(stats.totalProfit)}</span>
                    <span className="text-[10px] font-bold text-slate-500">đ</span>
                  </>
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-emerald-500 tracking-widest">*** ***</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div className="min-w-0">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 truncate">Tiền vào (Sổ quỹ)</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-emerald-600 tracking-tighter break-all">+{formatKilo(stats.totalCashIn)}</span>
                <span className="text-[10px] font-bold text-slate-500">đ</span>
              </div>
            </div>
            <div className="text-right min-w-0">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 truncate">Tiền ra (Sổ quỹ)</p>
              <div className="flex items-baseline justify-end gap-1 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-rose-600 tracking-tighter break-all">-{formatKilo(stats.totalCashOut)}</span>
                <span className="text-[10px] font-bold text-slate-500">đ</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-500 overflow-hidden">
            <RotateCcw size={16} className="text-orange-400 shrink-0" />
            <span className="text-xs font-bold truncate">{stats.returnCount} đơn trả hàng - </span>
            <span className="text-xs font-black text-slate-800 truncate">{formatKilo(stats.totalReturns)} đ</span>
          </div>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-5 gap-2 py-2">
          <Link to="/reports" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-100">
              <BarChart3 size={24} />
            </div>
            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">Thống kê chi tiêu</span>
          </Link>
          <Link to="/inventory" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-sky-400 rounded-full flex items-center justify-center text-white shadow-md shadow-sky-100">
              <Box size={24} />
            </div>
            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">Hàng hóa</span>
          </Link>
          <Link to="/cash-ledger" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <Wallet size={24} />
            </div>
            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">Sổ quỹ</span>
          </Link>
          <Link to="/users" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-400 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Users size={24} />
            </div>
            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">Nhân viên</span>
          </Link>
          <Link to="/reports" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-200">
              <PieChart size={24} />
            </div>
            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">Báo cáo</span>
          </Link>
        </div>

        {/* Revenue Chart Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 tracking-tight">Doanh thu</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 p-1.5 rounded-lg">
                <BarChart3 size={18} className="text-blue-600" />
              </div>
              <ArrowUpRight size={20} className="text-slate-300" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}Tr` : value}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatNumber(value) + 'đ', 'Doanh thu']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

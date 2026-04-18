import React, { useState } from 'react';
import { Search, Plus, Filter, ChevronDown, FileText, Star, RotateCcw, X, Calendar, User, Package, Printer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ReturnSalesOrder } from '../types';
import { formatNumber } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const ReturnSales: React.FC = () => {
  const { returnSalesOrders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<ReturnSalesOrder | null>(null);

  const filteredOrders = (returnSalesOrders || []).filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGoods = filteredOrders.reduce((sum, o) => sum + o.totalGoods, 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalDue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPaid = filteredOrders.reduce((sum, o) => sum + o.paid, 0);

  return (
    <div className="h-full flex flex-col bg-slate-50 md:bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 shrink-0 bg-white border-b border-slate-200">
        <div className="flex-1 max-w-md bg-slate-100 px-4 py-2 rounded-lg border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all flex items-center gap-3">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Theo mã phiếu trả / khách hàng" 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
          <Filter className="text-slate-400 cursor-pointer hover:text-blue-600" size={18} />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/create-return-sales')}
            className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-blue-50 transition-all"
          >
            <Plus size={18} /> Trả hàng bán
          </button>
          
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-slate-50 transition-all">
            <FileText size={18} /> Xuất file <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="hidden md:block flex-1 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <tr className="text-slate-700 text-[13px] font-bold">
                <th className="p-3 w-10"></th>
                <th className="p-3">Mã trả hàng</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3 text-right">Tổng tiền hàng</th>
                <th className="p-3 text-right">Giảm giá</th>
                <th className="p-3 text-right">Cần trả khách</th>
                <th className="p-3 text-right">Đã trả khách</th>
                <th className="p-3 text-right">Trạng thái</th>
              </tr>
              <tr className="bg-slate-50/50 text-slate-800 text-[13px] font-bold border-b border-slate-100">
                <td colSpan={4}></td>
                <td className="p-3 text-right">{formatNumber(totalGoods)}</td>
                <td className="p-3 text-right">{formatNumber(totalDiscount)}</td>
                <td className="p-3 text-right">{formatNumber(totalDue)}</td>
                <td className="p-3 text-right">{formatNumber(totalPaid)}</td>
                <td></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(o => (
                <tr 
                  key={o.id} 
                  onClick={() => setSelectedOrder(o)}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer text-[13px] text-slate-600 group"
                >
                  <td className="p-3"><Star size={16} className="text-slate-300 group-hover:text-amber-400 transition-colors" /></td>
                  <td className="p-3 font-medium text-blue-600">{o.id}</td>
                  <td className="p-3">{o.date}</td>
                  <td className="p-3 font-medium text-slate-800">{o.customer}</td>
                  <td className="p-3 text-right font-bold">{formatNumber(o.totalGoods)}</td>
                  <td className="p-3 text-right">{formatNumber(o.discount)}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{formatNumber(o.total)}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{formatNumber(o.paid)}</td>
                  <td className="p-3 text-right">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded">
                      Đã nhận hàng
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RotateCcw size={48} className="mb-4 opacity-20" />
              <p className="italic">Chưa có phiếu trả hàng bán nào</p>
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {filteredOrders.map(o => (
            <div 
              key={o.id} 
              onClick={() => setSelectedOrder(o)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-600 font-bold text-sm">{o.id}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{o.date}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase">Đã nhận hàng</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-slate-700">{o.customer}</p>
                <p className="text-sm font-black text-slate-800">{formatNumber(o.total)}đ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase">Chi tiết trả hàng bán</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mã: {selectedOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 bg-white text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center shadow-sm border border-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-3">
                  <Calendar className="text-slate-400" size={18} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ngày trả hàng</p>
                    <p className="text-xs font-black text-slate-800">{selectedOrder.date}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-3">
                  <User className="text-slate-400" size={18} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{selectedOrder.customer}</p>
                  </div>
                </div>
              </div>
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Sản phẩm</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center">SL</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right">Giá trả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{item.name}</p>
                          {item.sn && <p className="text-[8px] text-orange-500 font-bold mt-0.5 font-mono uppercase">SN: {Array.isArray(item.sn) ? item.sn.join(', ') : item.sn}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-black text-slate-600">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-xs font-black text-slate-800">{formatNumber(item.price)}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng tiền hàng</span>
                  <span className="text-sm font-bold text-slate-800">{formatNumber(selectedOrder.totalGoods)}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Giảm giá</span>
                  <span className="text-sm font-bold text-slate-800">{formatNumber(selectedOrder.discount)}đ</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-sm font-black text-blue-800 uppercase tracking-widest">Cần trả khách</span>
                  <span className="text-2xl font-black text-blue-600 tracking-tighter">{formatNumber(selectedOrder.total)}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-emerald-800 uppercase tracking-widest">Đã trả khách</span>
                  <span className="text-xl font-black text-emerald-600 tracking-tighter">{formatNumber(selectedOrder.paid)}đ</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-lg uppercase text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Printer size={16} /> In phiếu
              </button>
              <button onClick={() => setSelectedOrder(null)} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-lg uppercase text-[10px] tracking-widest">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

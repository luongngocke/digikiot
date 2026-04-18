import React, { useState } from 'react';
import { Search, Plus, FileDown, Star, X, Calendar, Truck, CreditCard, Package, FileText, Printer, ExternalLink, RotateCcw, Wallet, Hash } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { ImportOrder } from '../types';
import { formatNumber } from '../lib/utils';
import { PrintTemplate } from '../components/PrintTemplate';

export const ImportHistory: React.FC = () => {
  const { importOrders, suppliers, setImportDraft, updateImportOrder, addCashTransaction } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ImportOrder | null>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handlePayment = () => {
    if (!selectedOrder) return;
    const amount = Number(paymentAmount.replace(/[^0-9]/g, ''));
    if (amount <= 0) return;
    if (amount > selectedOrder.debt) {
      alert('Số tiền thanh toán không được lớn hơn số tiền còn nợ!'); // We should use a custom alert, but for simplicity we'll just return or cap it. Let's cap it.
    }
    
    const finalAmount = Math.min(amount, selectedOrder.debt);
    
    const transactionId = `PC${Date.now().toString().slice(-6)}`;
    addCashTransaction({
      id: transactionId,
      date: new Date().toLocaleString('vi-VN'),
      type: 'PAYMENT',
      amount: finalAmount,
      category: 'IMPORT_PAYMENT',
      partner: selectedOrder.supplier,
      note: `Thanh toán thêm cho phiếu nhập ${selectedOrder.id}`,
      refId: selectedOrder.id
    });

    updateImportOrder(selectedOrder.id, {
      paid: selectedOrder.paid + finalAmount
    });

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    const newPaid = selectedOrder.paid + finalAmount;
    const newDebt = selectedOrder.debt - finalAmount;
    setSelectedOrder({ 
      ...selectedOrder, 
      paid: newPaid, 
      debt: newDebt,
      status: newDebt > 0 ? 'Còn nợ' : 'Hoàn tất'
    });
  };

  const handlePrint = (order: ImportOrder) => {
    const supplier = suppliers.find(s => s.name === order.supplier);
    setPrintData({
      title: 'PHIẾU NHẬP HÀNG',
      id: order.id,
      date: order.date,
      partner: order.supplier,
      phone: supplier?.phone || '',
      address: '', // Suppliers sheet usually has address? Let's check Supplier type. 
      items: order.items.map(i => ({ ...i, total: i.qty * i.price })),
      total: order.total,
      paid: order.paid,
      debt: order.debt,
      discount: order.discount || 0,
      type: 'PHIEU_NHAP'
    });
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintData(null), 2000);
    }, 50);
  };

  const handleOpenOrder = (order: ImportOrder) => {
    const supplier = suppliers.find(s => s.name === order.supplier);
    setImportDraft({
      cart: order.items.map(item => ({
        ...item,
        hasSerial: !!(item.sn && item.sn.length > 0),
        serials: item.sn || [],
        unit: 'Cái',
        discount: 0,
        note: ''
      })),
      selectedSupplier: supplier || { id: '', name: order.supplier, phone: '' },
      paid: order.paid
    });
    navigate('/import');
  };

  const handleReturnOrder = (order: ImportOrder) => {
    navigate('/create-return-import', { state: { preFillOrder: order } });
  };

  const filteredOrders = (importOrders || []).filter(order => 
    (order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (order.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col px-4 md:px-0 py-4 md:py-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full mx-auto w-full">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 shrink-0">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã phiếu, NCC..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm font-medium transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link to="/import" className="flex-1 md:flex-none justify-center bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2">
              <Plus size={14} /> Nhập hàng
            </Link>
            <button className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
              <FileDown size={14} /> <span className="hidden sm:inline">Xuất file</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap hidden md:table">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest w-12 text-center">
                  <input type="checkbox" className="w-3 h-3 rounded border-slate-300 text-blue-600 cursor-pointer" />
                </th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Mã phiếu</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Thời gian</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Nhà cung cấp</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-center">Trạng thái</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Tổng cộng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                    Danh sách phiếu nhập trống
                  </td>
                </tr>
              ) : (
                filteredOrders.slice().reverse().map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 text-center">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Star className="text-slate-300 hover:text-yellow-400 cursor-pointer transition-colors" size={16} />
                        <span className="font-bold text-indigo-600 uppercase group-hover:underline">{order.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-medium">{order.date}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800">{order.supplier}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {order.returned ? (
                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Đã hoàn</span>
                      ) : order.debt > 0 ? (
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Còn Nợ</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Hoàn Tất</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-800 text-sm">
                      {formatNumber(order.total)}đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                Danh sách phiếu nhập trống
              </div>
            ) : (
              filteredOrders.slice().reverse().map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 space-y-3 active:bg-indigo-50/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Star className="text-slate-300" size={16} />
                      <span className="font-bold text-sm text-indigo-600 uppercase">{order.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{order.date}</span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{order.supplier}</p>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        {order.returned ? (
                          <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Đã hoàn</span>
                        ) : order.debt > 0 ? (
                          <span className="bg-orange-100 text-orange-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Còn Nợ</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Hoàn Tất</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 text-base">
                        {formatNumber(order.total)}đ
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Truck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-800">Chi tiết phiếu nhập</h3>
                    {selectedOrder.returned ? (
                      <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Đã hoàn</span>
                    ) : selectedOrder.debt > 0 ? (
                      <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Còn Nợ</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Hoàn Tất</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mã: {selectedOrder.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrint(selectedOrder)}
                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center border border-slate-200"
                >
                  <Printer size={20} />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center border border-slate-200">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày nhập kho</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedOrder.date}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhà cung cấp</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedOrder.supplier}</p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex gap-3">
                <button 
                  onClick={() => handleOpenOrder(selectedOrder)}
                  className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                >
                  <ExternalLink size={14} /> Mở phiếu (Sửa)
                </button>
                <button 
                  onClick={() => handleReturnOrder(selectedOrder)}
                  className="flex-1 py-2.5 bg-orange-50 text-orange-600 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                >
                  <RotateCcw size={14} /> Trả hàng nhập
                </button>
              </div>

              {/* Items Table */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-2">
                  <Package size={16} className="text-slate-400" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Danh sách mặt hàng</h4>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">Sản phẩm</th>
                      <th className="p-4 text-center">SL</th>
                      <th className="p-4 text-right">Giá nhập</th>
                      <th className="p-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {selectedOrder.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sm text-slate-800 tracking-tight">{item.name}</p>
                            {item.sn && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(typeof item.sn === 'string' ? item.sn.split(',') : item.sn).map((sn: string, sIdx: number) => (
                                  <span key={sIdx} className="text-[13px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-mono font-bold border border-orange-100 uppercase">
                                    {sn.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-sm text-slate-600">{item.qty} {item.unit}</td>
                          <td className="p-4 text-right font-bold text-sm text-slate-600">{formatNumber(item.price)}đ</td>
                          <td className="p-4 text-right font-bold text-sm text-slate-800">{formatNumber(item.qty * item.price)}đ</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Box */}
              <div className="bg-white rounded-2xl border-2 border-blue-50 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tổng tiền hàng</span>
                  <span className="text-lg font-bold text-slate-800">{formatNumber(selectedOrder.total - (selectedOrder.shippingFee || 0))}đ</span>
                </div>
                
                {selectedOrder.shippingFee && (
                  <div className="flex justify-between items-center py-2 border-t border-slate-50">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Phí vận chuyển</span>
                    <span className="text-lg font-bold text-orange-600">{formatNumber(selectedOrder.shippingFee)}đ</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t-2 border-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <Wallet size={18} />
                    </div>
                    <span className="text-base font-bold text-blue-800 uppercase tracking-tight">Tổng thanh toán</span>
                  </div>
                  <span className="text-3xl font-bold text-blue-600 tracking-tighter">{formatNumber(selectedOrder.total)}đ</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Đã thanh toán</p>
                    <p className="text-base font-bold text-emerald-700 mt-1">{formatNumber(selectedOrder.paid)}đ</p>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Còn nợ</p>
                    <p className="text-base font-bold text-red-700 mt-1">{formatNumber(selectedOrder.debt)}đ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
              {selectedOrder.debt > 0 && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPaymentAmount(selectedOrder.debt.toString());
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Wallet size={20} /> Thanh toán
                </button>
              )}
              <button 
                onClick={() => handlePrint(selectedOrder)}
                className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer size={20} /> In phiếu nhập
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 120 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Thanh toán phiếu nhập</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{selectedOrder.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Số tiền còn nợ</label>
                <div className="text-2xl font-bold text-red-600">{formatNumber(selectedOrder.debt)}đ</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Số tiền thanh toán</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatNumber(Number(paymentAmount.replace(/[^0-9]/g, '')))}
                    onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-emerald-500 font-bold text-slate-800 text-lg transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                Hủy
              </button>
              <button
                onClick={handlePayment}
                disabled={!paymentAmount || Number(paymentAmount.replace(/[^0-9]/g, '')) <= 0}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {printData && <PrintTemplate {...printData} />}
    </div>
  );
};

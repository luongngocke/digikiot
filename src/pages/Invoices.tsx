import React, { useState } from 'react';
import { Search, Plus, FileDown, Star, X, Calendar, User, CreditCard, Package, FileText, Printer, RotateCcw, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { Invoice } from '../types';
import { formatNumber } from '../lib/utils';
import { PrintTemplate } from '../components/PrintTemplate';

export const Invoices: React.FC = () => {
  const { invoices, customers, addCashTransaction, updateInvoice, returnSalesOrders } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handlePayment = () => {
    if (!selectedInvoice) return;
    const amount = Number(paymentAmount.replace(/[^0-9]/g, ''));
    if (amount <= 0) return;
    if (amount > selectedInvoice.debt) {
      alert('Số tiền thanh toán không được lớn hơn số tiền còn nợ!');
    }
    
    const finalAmount = Math.min(amount, selectedInvoice.debt);
    
    const transactionId = `PT${Date.now().toString().slice(-6)}`;
    addCashTransaction({
      id: transactionId,
      date: new Date().toLocaleString('vi-VN'),
      type: 'RECEIPT',
      amount: finalAmount,
      category: 'DEBT_COLLECTION',
      partner: selectedInvoice.customer,
      note: `Thu nợ hóa đơn ${selectedInvoice.id}`,
      refId: selectedInvoice.id
    });

    updateInvoice(selectedInvoice.id, {
      paid: selectedInvoice.paid + finalAmount
    });

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setSelectedInvoice({ ...selectedInvoice, paid: selectedInvoice.paid + finalAmount, debt: selectedInvoice.debt - finalAmount });
  };

  const handlePrint = (inv: Invoice) => {
    const customer = customers.find(c => (c.name === inv.customer && c.phone === inv.phone) || c.phone === inv.phone);
    const dateOfThisInvoice = new Date(inv.date);
    
    // Calculate total debt of this customer from ALL invoices BEFORE this one
    const customerInvoices = invoices.filter(i => 
      i.customer === inv.customer && 
      (new Date(i.date) < dateOfThisInvoice || (i.date === inv.date && i.id < inv.id))
    );
    
    // Also consider returns before this invoice if any
    const customerReturns = (returnSalesOrders || []).filter(r => 
      r.customer === inv.customer && 
      new Date(r.date) < dateOfThisInvoice
    );

    const calculatedOldDebt = customerInvoices.reduce((sum, i) => sum + i.debt, 0) - 
                    customerReturns.reduce((sum, r) => sum + (r.total - r.paid), 0);
    
    const oldDebt = inv.oldDebt !== undefined ? inv.oldDebt : calculatedOldDebt;

    setPrintData({
      title: 'HÓA ĐƠN BÁN HÀNG',
      id: inv.id,
      date: inv.date,
      partner: inv.customer,
      phone: inv.phone,
      address: inv.address || customer?.address || '',
      items: inv.items.map(i => ({ ...i, total: i.qty * i.price })),
      total: inv.total,
      paid: inv.paid,
      debt: inv.debt || 0,
      oldDebt: oldDebt,
      discount: inv.discount || 0,
      type: 'HOA_DON'
    });
    
    // Use a slightly shorter delay to stay within the user activation window
    // but long enough for React to render the component to the DOM
    setTimeout(() => {
      window.print();
      // Delay clearing print data significantly to ensure browser print dialog has captured it
      setTimeout(() => setPrintData(null), 2000);
    }, 50);
  };

  const filteredInvoices = (invoices || []).filter(inv => 
    (inv.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (inv.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.phone || '').includes(searchTerm)
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
              placeholder="Tìm mã hóa đơn, SĐT..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm font-medium transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link to="/pos" className="flex-1 md:flex-none justify-center bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2">
              <Plus size={14} /> Bán hàng
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
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Mã hóa đơn</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Thời gian</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Khách hàng</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-center">Trạng thái</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Tổng cộng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                    Danh sách hóa đơn trống
                  </td>
                </tr>
              ) : (
                filteredInvoices.slice().reverse().map((inv, idx) => (
                  <tr 
                    key={`${inv.id}-${idx}`} 
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 text-center">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Star className="text-slate-300 hover:text-yellow-400 cursor-pointer transition-colors" size={16} />
                        <span className={`font-bold ${inv.total < 0 ? 'text-red-600' : 'text-blue-600'} group-hover:underline`}>{inv.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-medium">{inv.date}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800">{inv.customer}</p>
                      <p className="text-[10px] font-medium text-slate-500 tracking-wide">{inv.phone}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {inv.total < 0 ? (
                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Trả hàng</span>
                      ) : inv.debt > 0 ? (
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Còn Nợ</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Hoàn Tất</span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-right font-bold ${inv.total < 0 ? 'text-red-600' : 'text-slate-800'} text-sm`}>
                      {formatNumber(inv.total)}đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                Danh sách hóa đơn trống
              </div>
            ) : (
              filteredInvoices.slice().reverse().map((inv, idx) => (
                <div 
                  key={`${inv.id}-${idx}`} 
                  onClick={() => setSelectedInvoice(inv)}
                  className="p-4 space-y-3 active:bg-blue-50/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Star className="text-slate-300" size={16} />
                      <span className={`font-bold text-sm ${inv.total < 0 ? 'text-red-600' : 'text-blue-600'}`}>{inv.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{inv.date}</span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{inv.customer}</p>
                      <p className="text-[10px] font-medium text-slate-500 tracking-wide">{inv.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        {inv.total < 0 ? (
                          <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Trả hàng</span>
                        ) : inv.debt > 0 ? (
                          <span className="bg-orange-100 text-orange-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Còn Nợ</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-600 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Hoàn Tất</span>
                        )}
                      </div>
                      <p className={`font-bold ${inv.total < 0 ? 'text-red-600' : 'text-slate-800'} text-base`}>
                        {formatNumber(inv.total)}đ
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (() => {
        const matchingCustomer = customers.find(c => c.name === selectedInvoice.customer || (selectedInvoice.phone && c.phone === selectedInvoice.phone));
        const displayPhone = selectedInvoice.phone || matchingCustomer?.phone;
        const displayAddress = matchingCustomer?.address;
        
        const dateOfThisInvoice = new Date(selectedInvoice.date);
        const customerInvoices = invoices.filter(i => 
          i.customer === selectedInvoice.customer && 
          (new Date(i.date) < dateOfThisInvoice || (i.date === selectedInvoice.date && i.id < selectedInvoice.id))
        );
        const customerReturns = (returnSalesOrders || []).filter(r => 
          r.customer === selectedInvoice.customer && 
          new Date(r.date) < dateOfThisInvoice
        );
        const calculatedOldDebt = customerInvoices.reduce((sum, i) => sum + i.debt, 0) - 
                        customerReturns.reduce((sum, r) => sum + (r.total - r.paid), 0);
        const oldDebt = selectedInvoice.oldDebt !== undefined ? selectedInvoice.oldDebt : calculatedOldDebt;
        
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tighter">Chi tiết hóa đơn</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mã: {selectedInvoice.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrint(selectedInvoice)}
                  className="w-8 h-8 bg-white text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center shadow-sm border border-slate-100"
                >
                  <Printer size={16} />
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 bg-white text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center shadow-sm border border-slate-100">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-3">
                  <Calendar className="text-slate-400 shrink-0" size={18} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ngày lập phiếu</p>
                    <p className="text-xs font-bold text-slate-800">{selectedInvoice.date}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <User className="text-slate-400 shrink-0" size={18} />
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</p>
                      <p className="text-xs font-bold text-slate-800">{selectedInvoice.customer}</p>
                    </div>
                  </div>
                  {(displayPhone || displayAddress) && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 pl-8 space-y-1">
                      {displayPhone && (
                        <p className="text-xs text-slate-600 font-medium">
                          <span className="text-slate-400 mr-1">ĐT:</span> {displayPhone}
                        </p>
                      )}
                      {displayAddress && (
                        <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap">
                          <span className="text-slate-400 mr-1">Đ/C:</span> {displayAddress}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <Package className="text-slate-400" size={14} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh sách mặt hàng</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase">Sản phẩm</th>
                      <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase text-center">SL</th>
                      <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-800 tracking-tighter">{item.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.sn && (
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(item.sn) ? item.sn : item.sn.split(',')).map((sn: string, sIdx: number) => (
                                  <span key={sIdx} className="text-[13px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-mono font-bold border border-orange-100 uppercase">
                                    {sn.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.warrantyExpiry && (
                              <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-100 uppercase tracking-tight">
                                BH đến: {item.warrantyExpiry}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-600">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-600">{formatNumber(item.price)}đ</td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-800">{formatNumber(item.qty * item.price)}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-3">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-xs font-bold uppercase tracking-widest">Tổng tiền hàng</span>
                  <span className="text-sm font-bold">{formatNumber(selectedInvoice.total + (selectedInvoice.discount || 0))}đ</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-xs font-bold uppercase tracking-widest">Giảm giá</span>
                  <span className="text-sm font-bold">-{formatNumber(selectedInvoice.discount || 0)}đ</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-blue-600" size={18} />
                    <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">Tổng thanh toán</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 tracking-tighter">{formatNumber(selectedInvoice.total)}đ</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-blue-200">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nợ cũ</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{formatNumber(oldDebt || 0)}đ</p>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Đã thanh toán</p>
                    <p className="text-sm font-bold text-emerald-700 mt-1">{formatNumber(selectedInvoice.paid)}đ</p>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Nợ hiện tại</p>
                    <p className="text-sm font-bold text-red-700 mt-1">{formatNumber((oldDebt || 0) + selectedInvoice.debt)}đ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              {selectedInvoice.debt > 0 && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPaymentAmount(selectedInvoice.debt.toString());
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg uppercase text-[10px] tracking-widest shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet size={16} /> Thanh toán
                </button>
              )}
              <button 
                onClick={() => navigate('/create-return-sales', { state: { preFillInvoice: selectedInvoice } })}
                className="flex-1 py-3 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-lg uppercase text-[10px] tracking-widest shadow-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Trả hàng
              </button>
              <button 
                onClick={() => handlePrint(selectedInvoice)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg uppercase text-[12px] tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer size={16} /> In hóa đơn
              </button>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg uppercase text-[10px] tracking-widest shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 120 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Thanh toán hóa đơn</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{selectedInvoice.id}</p>
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
                <div className="text-2xl font-bold text-red-600">{formatNumber(selectedInvoice.debt)}đ</div>
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


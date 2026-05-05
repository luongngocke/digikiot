import React, { useState, useEffect } from 'react';
import { Search, Plus, FileDown, Star, X, Calendar, User, CreditCard, Package, FileText, Printer, RotateCcw, Wallet, ChevronLeft, ChevronRight, Edit3, Image as ImageIcon, MapPin, Phone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Invoice } from '../types';
import { formatNumber, formatDateTime } from '../lib/utils';
import { PrintTemplate } from '../components/PrintTemplate';
import { useScrollLock } from '../hooks/useScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useMobileBackModal } from '../hooks/useMobileBackModal';

export const Invoices: React.FC = () => {
  const { invoices, customers, addCashTransaction, updateInvoice, returnSalesOrders, products, wallets } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentWalletId, setPaymentWalletId] = useState('');
  
  // Lock scroll when modals are open
  useScrollLock(!!selectedInvoice || isPaymentModalOpen);

  // Handle Escape key to close modals in layers
  useEscapeKey(() => setIsPaymentModalOpen(false), isPaymentModalOpen);
  useEscapeKey(() => setSelectedInvoice(null), !!selectedInvoice);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invoiceId = params.get('id') || params.get('invoiceId');
    if (invoiceId && invoices && invoices.length > 0) {
      const inv = invoices.find(i => i.id === invoiceId);
      if (inv) {
        setSelectedInvoice(inv);
      }
    }
  }, [location.search, invoices]);

  const handlePayment = async () => {
    if (!selectedInvoice || isProcessingPayment) return;
    
    if (!paymentWalletId) {
      alert('Vui lòng chọn ví thanh toán!');
      return;
    }

    // Clean and parse the input amount
    const cleanAmountStr = paymentAmount.replace(/[^0-9]/g, '');
    if (!cleanAmountStr) return;
    const amount = parseInt(cleanAmountStr, 10);
    
    if (isNaN(amount) || amount <= 0) return;
    
    // Check if paying too much - using buffer for precision
    if (amount > selectedInvoice.debt + 1) {
       // Alert if necessary, but keep it simple
    }
    
    try {
      setIsProcessingPayment(true);
      const finalAmount = Math.min(amount, selectedInvoice.debt);
      
      const transactionId = `PT${Date.now().toString().slice(-6)}`;
      await addCashTransaction({
        id: transactionId,
        date: formatDateTime(new Date()),
        type: 'RECEIPT',
        amount: amount,
        category: 'DEBT_COLLECTION',
        partner: selectedInvoice.customer,
        note: `Thu nợ hóa đơn ${selectedInvoice.id}`,
        refId: selectedInvoice.id,
        walletId: paymentWalletId
      });

      await updateInvoice(selectedInvoice.id, {
        paid: (selectedInvoice.paid || 0) + amount
      });

      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      // selectedInvoice will be updated via context state sync in the useEffect
      // but we can also update it locally for immediate effect
      setSelectedInvoice({
        ...selectedInvoice,
        paid: (selectedInvoice.paid || 0) + amount,
        debt: Math.max(0, (selectedInvoice.debt || 0) - amount)
      });
    } catch (error) {
      console.error("Payment sync failed:", error);
      // Even if API fails, the local state might have updated if setState was called
    } finally {
      setIsProcessingPayment(false);
    }
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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const filteredInvoices = (invoices || []).filter(inv => 
    (inv.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (inv.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.phone || '').includes(searchTerm)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInvoices = filteredInvoices.slice().reverse().slice(startIndex, endIndex);


  useMobileBackModal(isPaymentModalOpen, () => setIsPaymentModalOpen(false));
  useMobileBackModal(!!selectedInvoice, () => setSelectedInvoice(null));
return (
    <div className="flex flex-col h-full bg-slate-50 md:bg-white">
      <div className="bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-200 flex flex-col mx-auto w-full h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white md:bg-slate-50/50 shrink-0">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã hóa đơn, SĐT..." 
              className="w-full bg-slate-50 md:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm font-medium transition-all"
            />
          </div>
          <div className="hidden md:flex gap-2">
            <Link to="/pos" className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2">
              <Plus size={14} /> Bán hàng
            </Link>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <table className="w-full text-left border-collapse whitespace-nowrap hidden md:table">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Mã hóa đơn</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Thời gian</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Khách hàng</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-center">Trạng thái</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Tổng cộng</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Thanh toán</th>
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
                paginatedInvoices.map((inv, idx) => (
                  <tr 
                    key={`${inv.id}-${idx}`} 
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${inv.total < 0 ? 'text-red-600' : 'text-blue-600'}`}>{inv.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-medium">{formatDateTime(inv.date)}</td>
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
                    <td className="py-4 px-4 text-right">
                      {inv.walletId ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-blue-600">{wallets.find(w => w.id === inv.walletId)?.name || 'Ví đã xóa'}</span>
                          <span className="text-[10px] text-slate-500 font-medium">({inv.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : inv.paymentMethod === 'CARD' ? 'Thẻ' : 'Tiền mặt'})</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Chưa ĐK</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden bg-slate-50 p-4 space-y-4 flex-1 overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                Danh sách hóa đơn trống
              </div>
            ) : (
              paginatedInvoices.map((inv, idx) => (
                <div 
                  key={`${inv.id}-${idx}`} 
                  onClick={() => setSelectedInvoice(inv)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 active:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-3">
                      <p className="font-bold text-slate-800 text-base leading-tight">{inv.customer}</p>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                        <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded border ${inv.total < 0 ? 'text-red-600 border-red-200 bg-red-50' : 'text-slate-600 border-slate-200 bg-slate-50'} tracking-wider`}>
                          {inv.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">· {formatDateTime(inv.date)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div>
                        {inv.total < 0 ? (
                          <span className="bg-red-50 text-red-600 text-[9px] px-2.5 py-1 rounded border border-red-100 font-bold uppercase tracking-wider inline-block">Trả hàng</span>
                        ) : inv.debt > 0 ? (
                          <span className="bg-orange-50 text-orange-600 text-[9px] px-2.5 py-1 rounded border border-orange-100 font-bold uppercase tracking-wider inline-block">Còn Nợ</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2.5 py-1 rounded border border-emerald-100 font-bold uppercase tracking-wider inline-block">Hoàn Tất</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                         <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                           {inv.items.length}
                         </span>
                         <span className="text-xs font-semibold text-slate-500">Mặt hàng</span>
                      </div>
                      {inv.walletId && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Wallet size={12} className="text-blue-500" />
                          <span className="text-[10px] font-bold text-slate-600">{wallets.find(w => w.id === inv.walletId)?.name || 'Ví đã xóa'}</span>
                        </div>
                      )}
                    </div>
                    <p className={`font-black ${inv.total < 0 ? 'text-red-600' : 'text-blue-600'} text-lg leading-none`}>
                      {formatNumber(inv.total)}đ
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-sm shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Hiển thị</span>
              <select 
                value={rowsPerPage} 
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500">dòng / trang</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-slate-500 font-medium hidden sm:inline">
                {startIndex + 1} - {Math.min(endIndex, filteredInvoices.length)} trên tổng {filteredInvoices.length}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 font-medium text-slate-700">{currentPage} / {totalPages || 1}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl md:rounded-xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
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

            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 md:space-y-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-start gap-2.5">
                  <User className="text-blue-500 shrink-0 mt-0.5" size={14} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Khách hàng</p>
                    <p className="text-xs font-black text-slate-800 leading-tight truncate">{selectedInvoice.customer}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Số điện thoại</p>
                    <p className="text-xs font-bold text-slate-700 leading-tight">{displayPhone || '---'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 md:col-span-2">
                  <MapPin className="text-orange-500 shrink-0 mt-0.5" size={14} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Địa chỉ</p>
                    <p className="text-xs font-bold text-slate-600 leading-tight line-clamp-1">{displayAddress || '---'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 md:col-span-2 pt-1 mt-1 border-t border-slate-200/50">
                  <Calendar className="text-slate-400 shrink-0 mt-0.5" size={14} />
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ngày lập:</p>
                    <p className="text-xs font-bold text-slate-700 leading-none">{formatDateTime(selectedInvoice.date)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <Package className="text-slate-400" size={14} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh sách mặt hàng</span>
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block">
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
                            <p className="text-[10px] text-slate-400 font-medium mb-1">{item.id}</p>
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

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-100 bg-white">
                  {selectedInvoice.items.map((item, idx) => {
                    const product = products.find(p => p.id === item.id);
                    return (
                    <div key={idx} className="p-4 flex gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 overflow-hidden mt-1">
                        {product?.image ? (
                          <img src={product.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 leading-snug break-words">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wide">{item.id}</p>
                        
                        {(item.sn || item.warrantyExpiry) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2 border-l-2 border-slate-200 pl-2">
                            {item.sn && (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">IMEI:</span>
                                  <div className="flex flex-wrap gap-x-1">
                                    {(Array.isArray(item.sn) ? item.sn : item.sn.split(',')).map((sn: string, sIdx: number) => (
                                      <span key={sIdx} className="text-[11px] text-slate-600 font-mono font-bold">
                                        {sn.trim()}{sIdx < (Array.isArray(item.sn) ? item.sn.length : item.sn.split(',').length) - 1 ? ',' : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                            )}
                            {item.warrantyExpiry && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100 uppercase inline-block whitespace-nowrap">
                                BH: {item.warrantyExpiry}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-sm text-slate-600 font-medium">
                            {formatNumber(item.price)} <span className="text-slate-400 text-xs mx-1">x</span> {item.qty}
                          </p>
                          <p className="font-black text-slate-800 text-base">
                            {formatNumber(item.qty * item.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-3">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[11px] font-bold">Tổng tiền hàng</span>
                  <span className="text-sm font-bold">{formatNumber(selectedInvoice.total + (selectedInvoice.discount || 0))}đ</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-[11px] font-bold">Giảm giá</span>
                  <span className="text-sm font-bold">-{formatNumber(selectedInvoice.discount || 0)}đ</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-blue-600" size={18} />
                    <span className="text-[13px] font-bold text-blue-800">Tổng thanh toán</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 tracking-tighter">{formatNumber(selectedInvoice.total)}đ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4 border-t border-blue-200">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <p className="text-[9px] font-bold text-slate-500">Nợ cũ</p>
                    <p className="text-sm font-bold text-slate-700">{formatNumber(oldDebt || 0)}đ</p>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <p className="text-[9px] font-bold text-emerald-600">
                      Đã thanh toán
                      {selectedInvoice.walletId && (
                        <span className="block text-[8px] font-medium text-emerald-500 mt-0.5">
                          ({wallets.find(w => w.id === selectedInvoice.walletId)?.name || 'Ví đã xóa'})
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-bold text-emerald-700">{formatNumber(selectedInvoice.paid)}đ</p>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex justify-between items-center">
                    <p className="text-[9px] font-bold text-red-600">Nợ hiện tại</p>
                    <p className="text-sm font-bold text-red-700">{formatNumber((oldDebt || 0) + selectedInvoice.debt)}đ</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section - Moved to bottom of scrollable content */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {selectedInvoice.debt > 0 && (
                  <button 
                    onClick={() => {
                      setPaymentAmount(selectedInvoice.debt.toString());
                      setIsPaymentModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl text-[13px] shadow-lg shadow-emerald-100 active:scale-95"
                  >
                    <Wallet size={16} /> Trả nợ
                  </button>
                )}
                <button 
                  onClick={() => navigate('/create-return-sales', { state: { preFillInvoice: selectedInvoice } })}
                  className="flex items-center justify-center gap-2 py-3 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-xl text-[13px] active:scale-95 hover:bg-orange-100"
                >
                  <RotateCcw size={16} /> Trả hàng
                </button>
                <button 
                  onClick={() => navigate('/pos', { state: { editInvoice: selectedInvoice } })}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-xl text-[13px] active:scale-95 hover:bg-blue-100 shadow-sm"
                >
                  <Edit3 size={16} /> Sửa
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 space-y-3 shrink-0">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-3 bg-[#991b1b] text-white font-bold rounded-xl text-[13px] hover:bg-[#7f1d1d] transition-colors shadow-lg shadow-red-100 active:scale-95"
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
                    value={paymentAmount ? formatNumber(Number(paymentAmount.replace(/[^0-9]/g, ''))) : ''}
                    onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-emerald-500 font-bold text-slate-800 text-lg transition-colors"
                    placeholder="Nhập số tiền..."
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ví thanh toán</label>
                <select
                  value={paymentWalletId || ''}
                  onChange={e => setPaymentWalletId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-emerald-500 font-bold text-slate-800 text-sm transition-colors cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                >
                  <option value="" disabled>Chọn ví</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
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
                disabled={isProcessingPayment || !paymentAmount || Number(paymentAmount.replace(/[^0-9]/g, '')) <= 0}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {printData && <PrintTemplate {...printData} />}
      
      {/* Mobile FAB for new sale */}
      <Link 
        to="/pos" 
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
};


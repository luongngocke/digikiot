import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Truck, X, FileText, Calendar, Wallet, ChevronRight, CreditCard, Package, Hash, Printer, Download, Upload, LayoutGrid, Settings, HelpCircle, ChevronDown, Filter, RotateCcw, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Supplier, ImportOrder, CashTransaction } from '../types';
import { formatNumber } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { PrintTemplate } from '../components/PrintTemplate';

export const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const { suppliers, addSupplier, importOrders, updateImportOrder, addCashTransaction, setImportDraft, cashTransactions } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ImportOrder | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Print State
  const [printData, setPrintData] = useState<any>(null);

  const handlePrint = (data: any) => {
    setPrintData(data);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'ALL' | 'SINGLE'>('ALL');
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  const filteredSuppliers = (suppliers || []).filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.phone || '').includes(searchTerm)
  );

  const handleSave = () => {
    if (!name || !phone) {
      alert("Vui lòng nhập đủ tên và số điện thoại");
      return;
    }
    addSupplier({ name, phone });
    setIsModalOpen(false);
    setName('');
    setPhone('');
  };

  const getSupplierStats = (supplierName: string) => {
    const orders = importOrders.filter(o => o.supplier === supplierName);
    const totalImported = orders.reduce((sum, o) => sum + o.total, 0);
    const totalDebt = orders.reduce((sum, o) => sum + (o.debt || 0), 0);
    return {
      count: orders.length,
      total: totalImported,
      debt: totalDebt,
      orders: orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  };

  const handleOpenPaymentModal = (type: 'ALL' | 'SINGLE', orderId: string | null = null, defaultAmount: number = 0) => {
    setPaymentType(type);
    setTargetOrderId(orderId);
    setPaymentAmount(defaultAmount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const executePayment = () => {
    const payValue = parseInt(paymentAmount);
    if (isNaN(payValue) || payValue <= 0) return alert('Số tiền không hợp lệ');

    const transactionId = generateId('PC', cashTransactions);
    const newTransaction: CashTransaction = {
      id: transactionId,
      date: `${paymentDate} ${new Date().toLocaleTimeString()}`,
      type: 'PAYMENT',
      amount: payValue,
      category: 'DEBT_PAYMENT',
      partner: selectedSupplier?.name || '',
      note: paymentType === 'SINGLE' ? `Thanh toán nợ đơn ${targetOrderId}` : `Thanh toán tổng nợ NCC ${selectedSupplier?.name}`,
      refId: targetOrderId || undefined
    };

    if (paymentType === 'SINGLE' && targetOrderId) {
      const order = importOrders.find(o => o.id === targetOrderId);
      if (!order) return;
      if (payValue > order.debt) return alert('Số tiền thanh toán không được lớn hơn số nợ của đơn');

      updateImportOrder(order.id, {
        paid: order.paid + payValue,
        debt: order.debt - payValue
      });
    } else if (paymentType === 'ALL' && selectedSupplier) {
      const stats = getSupplierStats(selectedSupplier.name);
      if (payValue > stats.debt) return alert('Số tiền thanh toán không được lớn hơn tổng nợ');

      let remainingPayment = payValue;
      // FIFO: Sort by date ascending (oldest first)
      const ordersWithDebt = [...stats.orders]
        .filter(o => o.debt > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      ordersWithDebt.forEach(order => {
        if (remainingPayment <= 0) return;
        const paymentForThisOrder = Math.min(order.debt, remainingPayment);
        updateImportOrder(order.id, {
          paid: order.paid + paymentForThisOrder,
          debt: order.debt - paymentForThisOrder
        });
        remainingPayment -= paymentForThisOrder;
      });
    }

    addCashTransaction(newTransaction);
    setIsPaymentModalOpen(false);
    
    if (confirm('Thanh toán thành công! Bạn có muốn in phiếu chi không?')) {
      handlePrint({
        title: 'PHIẾU CHI TIỀN',
        id: transactionId,
        date: newTransaction.date,
        partner: newTransaction.partner,
        total: newTransaction.amount,
        paid: newTransaction.amount,
        debt: 0,
        note: newTransaction.note,
        type: 'CHI'
      });
    }
  };

  const totalDebt = filteredSuppliers.reduce((sum, s) => sum + getSupplierStats(s.name).debt, 0);
  const totalBuy = filteredSuppliers.reduce((sum, s) => sum + getSupplierStats(s.name).total, 0);

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

  return (
    <div className="h-full flex flex-col bg-slate-50 md:bg-white overflow-hidden">
      {/* Print Template Container */}
      {printData && <PrintTemplate {...printData} />}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 shrink-0 bg-white border-b border-slate-200">
        {/* Left: Search */}
        <div className="flex-1 max-w-md bg-slate-100 px-4 py-2 rounded-lg border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all flex items-center gap-3">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Theo mã, tên, số điện thoại" 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
          <Filter className="text-slate-400 cursor-pointer hover:text-blue-600" size={18} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-blue-700 transition-all"
            >
              <UserPlus size={18} /> Nhà cung cấp <ChevronDown size={16} />
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-slate-50 transition-all">
              <Upload size={18} /> Import file
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-slate-50 transition-all">
              <Download size={18} /> Xuất file
            </button>
          </div>
          
          {/* Mobile Add Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="md:hidden w-full px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest active:scale-95 transition-all hover:bg-indigo-700"
          >
            <UserPlus size={16} /> Thêm NCC
          </button>

          <div className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-3 ml-1">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all">
              <LayoutGrid size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all">
              <Settings size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all">
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden md:block flex-1 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <tr className="text-slate-700 text-[13px] font-bold">
                <th className="p-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-3">Mã nhà cung cấp</th>
                <th className="p-3">Tên nhà cung cấp</th>
                <th className="p-3">Điện thoại</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-right">Nợ cần trả hiện tại</th>
                <th className="p-3 text-right">Tổng mua</th>
              </tr>
              {/* Summary Row */}
              <tr className="bg-slate-50/50 text-slate-800 text-[13px] font-bold border-b border-slate-100">
                <td colSpan={5}></td>
                <td className="p-3 text-right">{formatNumber(totalDebt)}</td>
                <td className="p-3 text-right">{formatNumber(totalBuy)}</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s, idx) => {
                const stats = getSupplierStats(s.name);
                return (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedSupplier(s)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer text-[13px] text-slate-600 group"
                  >
                    <td className="p-3"><input type="checkbox" className="rounded border-slate-300" onClick={(e) => e.stopPropagation()} /></td>
                    <td className="p-3 font-medium text-blue-600">{s.id || `NCC${idx.toString().padStart(6, '0')}`}</td>
                    <td className="p-3 font-medium text-slate-800">{s.name}</td>
                    <td className="p-3">{s.phone}</td>
                    <td className="p-3 text-slate-400">{s.email || ''}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{formatNumber(stats.debt)}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{formatNumber(stats.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Truck size={48} className="mb-4 opacity-20" />
              <p className="italic">Không tìm thấy nhà cung cấp nào</p>
            </div>
          )}
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {filteredSuppliers.length === 0 ? (
            <p className="text-center py-20 text-slate-400 italic text-sm">Chưa có nhà cung cấp.</p>
          ) : (
            filteredSuppliers.map((s, idx) => {
              const stats = getSupplierStats(s.name);
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedSupplier(s)}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6 hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 group"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Truck size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate tracking-tighter">{s.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">{s.phone}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{stats.count} đơn</span>
                      {stats.debt > 0 && (
                        <span className="text-[9px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">Nợ: {formatNumber(stats.debt)}đ</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-slate-50 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tighter">{selectedSupplier.name}</h3>
                  <p className="text-xs text-slate-500 font-bold tracking-widest">{selectedSupplier.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getSupplierStats(selectedSupplier.name).debt > 0 && (
                  <button 
                    onClick={() => handleOpenPaymentModal('ALL', null, getSupplierStats(selectedSupplier.name).debt)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-100"
                  >
                    <CreditCard size={14} /> Thanh toán nợ
                  </button>
                )}
                <button onClick={() => setSelectedSupplier(null)} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Cards */}
              {(() => {
                const stats = getSupplierStats(selectedSupplier.name);
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 text-blue-600 mb-2">
                          <FileText size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Tổng đơn nhập</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.count} <span className="text-sm text-slate-400">đơn</span></p>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 text-emerald-600 mb-2">
                          <Wallet size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Tổng tiền nhập</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{formatNumber(stats.total)} <span className="text-sm text-slate-400">đ</span></p>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 text-red-600 mb-2">
                          <Wallet size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Còn nợ NCC</span>
                        </div>
                        <p className="text-2xl font-black text-red-600 tracking-tighter">{formatNumber(stats.debt)} <span className="text-sm text-slate-400">đ</span></p>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Danh sách nhập hàng</h4>
                    <div className="space-y-3">
                      {stats.orders.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 italic text-sm">Chưa có giao dịch.</p>
                      ) : (
                        stats.orders.map(order => (
                          <div 
                            key={order.id} 
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group/order"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover/order:bg-indigo-50 group-hover/order:text-indigo-500 transition-all">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <p className="font-black text-sm text-slate-800 uppercase tracking-tighter">{order.id}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-1">
                                    <Calendar size={12} />
                                    {order.date}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tổng tiền</p>
                                  <p className="font-black text-slate-800 text-sm">{formatNumber(order.total)}đ</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Còn nợ</p>
                                  <p className={`font-black text-sm ${order.debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {formatNumber(order.debt)}đ
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {order.debt > 0 && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPaymentModal('SINGLE', order.id, order.debt);
                                      }}
                                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                      title="Thanh toán đơn này"
                                    >
                                      <CreditCard size={14} />
                                    </button>
                                  )}
                                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {order.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Chi tiết phiếu nhập</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mã: {selectedOrder.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrint({
                    title: 'PHIẾU NHẬP HÀNG',
                    id: selectedOrder.id,
                    date: selectedOrder.date,
                    partner: selectedOrder.supplier,
                    items: selectedOrder.items.map(i => ({ ...i, total: i.qty * i.price })),
                    total: selectedOrder.total,
                    paid: selectedOrder.paid,
                    debt: selectedOrder.debt,
                    type: 'PHIEU_NHAP'
                  })}
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

              {/* Action Bar (Requested by user) */}
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
                                  <span key={sIdx} className="text-[8px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-mono font-bold border border-orange-100">
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
              <button 
                onClick={() => handlePrint({
                  title: 'PHIẾU NHẬP HÀNG',
                  id: selectedOrder.id,
                  date: selectedOrder.date,
                  partner: selectedOrder.supplier,
                  items: selectedOrder.items.map(i => ({ ...i, total: i.qty * i.price })),
                  total: selectedOrder.total,
                  paid: selectedOrder.paid,
                  debt: selectedOrder.debt,
                  type: 'PHIEU_NHAP'
                })}
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
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md print:hidden">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase">Thanh toán công nợ</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Số tiền thanh toán</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-black outline-none focus:border-emerald-400 text-emerald-600 shadow-inner" 
                  placeholder="0" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ngày thanh toán</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 text-slate-700 shadow-inner" 
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-[9px] text-blue-600 font-bold leading-relaxed">
                  {paymentType === 'ALL' 
                    ? "Hệ thống sẽ tự động trừ nợ cho các đơn hàng cũ nhất trước (FIFO)."
                    : "Số tiền sẽ được trừ trực tiếp vào đơn hàng đang chọn."}
                </p>
              </div>
              <button 
                onClick={executePayment}
                className="w-full bg-emerald-600 text-white py-4 rounded-lg font-black shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest mt-2 active:scale-95 transition-all hover:bg-emerald-700"
              >
                XÁC NHẬN THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase">Thêm Nhà Cung Cấp</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 uppercase shadow-inner" 
                placeholder="Tên nhà cung cấp..." 
              />
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 uppercase shadow-inner" 
                placeholder="Số điện thoại..." 
              />
              <button 
                onClick={handleSave}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-black shadow-md shadow-indigo-200 uppercase text-[11px] tracking-widest mt-2 active:scale-95 transition-all hover:bg-indigo-700"
              >
                LƯU THÔNG TIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

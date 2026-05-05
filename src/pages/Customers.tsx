import React, { useState } from 'react';
import { Search, UserPlus, User, X, FileText, Calendar, Wallet, ChevronRight, CreditCard, Hash, Printer, Settings, HelpCircle, List, MoreHorizontal, Send, Download, SlidersHorizontal, Plus, Edit3, ChevronLeft, History, Wrench, ShieldCheck, ClipboardList, Map, MapPin, Loader2, Wifi, Camera, Phone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Customer, Invoice, CashTransaction, MaintenanceRecord } from '../types';
import { formatNumber, parseFormattedNumber, formatDateTime } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { PrintTemplate } from '../components/PrintTemplate';
import { useScrollLock } from '../hooks/useScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useMobileBackModal } from '../hooks/useMobileBackModal';

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, invoices, updateInvoice, addCashTransaction, returnSalesOrders, currentUser, cashTransactions, maintenanceRecords, tasks, wifiRecords, cameraAccounts, wallets } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'history' | 'warranty' | 'tasks'>('info');
  const [isLocating, setIsLocating] = useState(false);

  // Reset tab when selecting a new customer
  React.useEffect(() => {
    if (selectedCustomer) {
      setActiveDetailTab('info');
    }
  }, [selectedCustomer]);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = `${latitude}, ${longitude}`;
        setLocation(coords);
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'vi'
            }
          });
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Lỗi lấy vị trí.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Bạn đã từ chối quyền truy cập vị trí.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Thông tin vị trí không khả dụng.';
        else if (error.code === error.TIMEOUT) msg = 'Hết thời gian chờ lấy vị trí.';
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
  const [targetInvoiceId, setTargetInvoiceId] = useState<string | null>(null);
  const [paymentWalletId, setPaymentWalletId] = useState<string>('');

  // Lock scroll when modals are open
  useScrollLock(isModalOpen || !!selectedCustomer || !!selectedInvoice || isPaymentModalOpen);

  // Handle Escape key to close modals in layers
  useEscapeKey(() => setIsPaymentModalOpen(false), isPaymentModalOpen);
  useEscapeKey(() => setSelectedInvoice(null), !!selectedInvoice);
  useEscapeKey(() => setSelectedCustomer(null), !!selectedCustomer);
  useEscapeKey(() => { setIsModalOpen(false); resetForm(); }, isModalOpen);

  const filteredCustomers = (customers || []).filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm) ||
    (c.phone2 || '').includes(searchTerm) ||
    (c.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handleSave = () => {
    if (!name || !phone) {
      alert("Vui lòng nhập đủ tên và số điện thoại");
      return;
    }
    
    const customerData = { 
      name, 
      phone, 
      phone2,
      address, 
      location, 
      note,
      createdBy: editingCustomerId ? undefined : (currentUser?.name || 'Admin'),
      createdAt: editingCustomerId ? undefined : new Date().toLocaleString('vi-VN')
    };

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, customerData);
    } else {
      addCustomer(customerData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setPhone2('');
    setAddress('');
    setLocation('');
    setNote('');
    setEditingCustomerId(null);
  };

  const handleEdit = (customer: Customer) => {
    setName(customer.name);
    setPhone(customer.phone);
    setPhone2(customer.phone2 || '');
    setAddress(customer.address || '');
    setLocation(customer.location || '');
    setNote(customer.note || '');
    setEditingCustomerId(customer.id || null);
    setIsModalOpen(true);
  };

  const getCustomerStats = (customer: Customer) => {
    const customerInvoices = invoices.filter(inv => 
      (inv.phone && inv.phone !== '---' && inv.phone === customer.phone) || 
      (inv.customer === customer.name)
    );
    
    const customerReturns = returnSalesOrders.filter(ret => 
      ret.customer === customer.name
    );

    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalReturned = customerReturns.reduce((sum, ret) => sum + ret.total, 0);
    const totalDebt = customerInvoices.reduce((sum, inv) => sum + (inv.debt || 0), 0);
    const totalPaid = customerInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
    const avgPerOrder = customerInvoices.length > 0 ? totalSpent / customerInvoices.length : 0;
    const paymentRate = totalSpent > 0 ? (totalPaid / totalSpent) * 100 : 0;
    
    const sortedInvoices = [...customerInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastInvoiceDate = sortedInvoices[0]?.date;
    const lastReturnDate = [...customerReturns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
    
    let lastTransaction = lastInvoiceDate;
    if (lastReturnDate && (!lastTransaction || new Date(lastReturnDate) > new Date(lastTransaction))) {
      lastTransaction = lastReturnDate;
    }

    const unpaidInvoices = customerInvoices.filter(inv => inv.debt > 0).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let debtDays = 0;
    if (unpaidInvoices.length > 0) {
      const oldestUnpaidDate = new Date(unpaidInvoices[0].date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - oldestUnpaidDate.getTime());
      debtDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      count: customerInvoices.length,
      total: totalSpent,
      netTotal: totalSpent - totalReturned,
      debt: totalDebt,
      avgPerOrder,
      paymentRate,
      debtDays,
      lastTransaction,
      invoices: sortedInvoices
    };
  };

  const handleOpenPaymentModal = (type: 'ALL' | 'SINGLE', invoiceId: string | null = null, defaultAmount: number = 0) => {
    setPaymentType(type);
    setTargetInvoiceId(invoiceId);
    setPaymentAmount(formatNumber(defaultAmount));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const executePayment = () => {
    if (!paymentWalletId) {
      alert('Vui lòng chọn ví thanh toán!');
      return;
    }
    const payValue = parseFormattedNumber(paymentAmount);
    if (isNaN(payValue) || payValue <= 0) return alert('Số tiền không hợp lệ');

    const transactionId = generateId('PT', cashTransactions);
    const newTransaction: CashTransaction = {
      id: transactionId,
      date: `${paymentDate} ${new Date().toLocaleTimeString()}`,
      type: 'RECEIPT',
      amount: payValue,
      category: 'DEBT_COLLECTION',
      partner: selectedCustomer?.name || '',
      note: paymentType === 'SINGLE' ? `Thu nợ hóa đơn ${targetInvoiceId}` : `Thu nợ tổng KH ${selectedCustomer?.name}`,
      refId: targetInvoiceId || undefined,
      walletId: paymentWalletId
    };

    if (paymentType === 'SINGLE' && targetInvoiceId) {
      const invoice = invoices.find(inv => inv.id === targetInvoiceId);
      if (!invoice) return;
      if (payValue > invoice.debt) return alert('Số tiền thanh toán không được lớn hơn số nợ của hóa đơn');

      updateInvoice(invoice.id, {
        paid: invoice.paid + payValue,
        debt: invoice.debt - payValue
      });
    } else if (paymentType === 'ALL' && selectedCustomer) {
      const stats = getCustomerStats(selectedCustomer);
      if (payValue > stats.debt) return alert('Số tiền thanh toán không được lớn hơn tổng nợ');

      let remainingPayment = payValue;
      // FIFO: Sort by date ascending (oldest first)
      const invoicesWithDebt = [...stats.invoices]
        .filter(inv => inv.debt > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      invoicesWithDebt.forEach(invoice => {
        if (remainingPayment <= 0) return;
        const paymentForThisInvoice = Math.min(invoice.debt, remainingPayment);
        updateInvoice(invoice.id, {
          paid: invoice.paid + paymentForThisInvoice,
          debt: invoice.debt - paymentForThisInvoice
        });
        remainingPayment -= paymentForThisInvoice;
      });
    }

    addCashTransaction(newTransaction);
    setIsPaymentModalOpen(false);
    
    if (confirm('Thu nợ thành công! Bạn có muốn in phiếu thu không?')) {
      handlePrint({
        title: 'PHIẾU THU TIỀN',
        id: transactionId,
        date: newTransaction.date,
        partner: newTransaction.partner,
        total: newTransaction.amount,
        paid: newTransaction.amount,
        debt: 0,
        note: newTransaction.note,
        type: 'THU'
      });
    }
  };


  useMobileBackModal(isModalOpen, () => setIsModalOpen(false));
  useMobileBackModal(isPaymentModalOpen, () => setIsPaymentModalOpen(false));
  useMobileBackModal(!!selectedCustomer, () => setSelectedCustomer(null));
  useMobileBackModal(!!selectedInvoice, () => setSelectedInvoice(null));
return (
    <div className="flex flex-col px-4 md:px-0 py-4 md:py-0">
      {/* Print Template Container */}
      {printData && <PrintTemplate {...printData} />}

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 shrink-0 justify-between">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-[300px] focus-within:border-blue-400 transition-all">
          <Search className="text-slate-400" size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Theo mã, tên, số điện thoại" 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
          <SlidersHorizontal className="text-slate-400 cursor-pointer" size={16} />
        </div>
        
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex"
          >
            <Plus size={16} /> Khách hàng
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white md:border border-slate-200 md:rounded-xl md:shadow-sm">
        {/* Desktop Table */}
        <table className="w-full text-left border-collapse min-w-[1000px] hidden md:table">
          <thead className="bg-[#f0f4f8] sticky top-0 z-10">
            <tr>
              <th className="p-3 w-12 text-center border-b border-slate-200">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
              </th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200">Mã khách hàng</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200">Tên khách hàng</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200">Điện thoại</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200">Địa chỉ</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200">Khu vực</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200 text-right">Nợ hiện tại</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200 text-right">Số ngày nợ</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200 text-right">Tổng bán</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200 text-right">Tổng bán trừ trả hàng</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200">Giao dịch cuối</th>
              <th className="p-3 text-sm font-bold text-slate-700 border-b border-slate-200 text-center">Thao tác</th>
            </tr>
            <tr className="bg-white">
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 text-sm font-bold text-slate-800 border-b border-slate-200 text-right">
                {formatNumber(filteredCustomers.reduce((sum, c) => sum + getCustomerStats(c).debt, 0))}
              </td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 text-sm font-bold text-slate-800 border-b border-slate-200 text-right">
                {formatNumber(filteredCustomers.reduce((sum, c) => sum + getCustomerStats(c).total, 0))}
              </td>
              <td className="p-3 text-sm font-bold text-slate-800 border-b border-slate-200 text-right">
                {formatNumber(filteredCustomers.reduce((sum, c) => sum + getCustomerStats(c).netTotal, 0))}
              </td>
              <td className="p-3 border-b border-slate-200"></td>
              <td className="p-3 border-b border-slate-200"></td>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-10 text-center text-slate-400 italic text-sm">Chưa có khách hàng.</td>
              </tr>
            ) : (
              paginatedCustomers.map((c, idx) => {
                const stats = getCustomerStats(c);
                return (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedCustomer(c)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                    </td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100">{c.id}</td>
                    <td className="p-3 text-sm text-slate-800 border-b border-slate-100">{c.name}</td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100">
                      {c.phone}
                      {c.phone2 && <><br/><span className="text-xs text-slate-400">{c.phone2}</span></>}
                    </td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100">{c.address || '---'}</td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100">{c.location || '---'}</td>
                    <td className="p-3 text-sm font-bold text-red-600 border-b border-slate-100 text-right">{formatNumber(stats.debt)}</td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100 text-right">{stats.debtDays > 0 ? `${stats.debtDays} ngày` : '---'}</td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100 text-right">{formatNumber(stats.total)}</td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100 text-right">{formatNumber(stats.netTotal)}</td>
                    <td className="p-3 text-sm text-slate-600 border-b border-slate-100">{stats.lastTransaction || '---'}</td>
                    <td className="p-3 text-center border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleEdit(c)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedCustomers.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic text-sm">Chưa có khách hàng.</div>
          ) : (
            paginatedCustomers.map((c, idx) => {
              const stats = getCustomerStats(c);
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedCustomer(c)}
                  className="p-4 active:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">{c.name}</h4>
                    <span className={`text-sm font-bold ${stats.debt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {formatNumber(stats.debt)}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 font-medium">{c.phone}</p>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
                            <Phone size={12} className="fill-emerald-600 text-transparent" />
                          </a>
                        )}
                      </div>
                      {c.phone2 && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-400 font-medium">{c.phone2}</p>
                          <a href={`tel:${c.phone2}`} onClick={(e) => e.stopPropagation()} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
                            <Phone size={12} className="fill-emerald-600 text-transparent" />
                          </a>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{c.location || 'Chưa định vị'}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                      className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination UI */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border border-t-0 border-slate-200 rounded-b-sm shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Hiển thị</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white cursor-pointer hover:bg-slate-50"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>dòng / trang</span>
          <span className="ml-4 border-l border-slate-300 pl-4 hidden md:inline">
            Hiển thị {totalItems === 0 ? 0 : startIndex + 1} - {endIndex} trên tổng số {totalItems} khách hàng
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm px-3 font-medium">Trang {currentPage} / {totalPages || 1}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-slate-50 w-full max-w-4xl h-full md:h-[90vh] md:rounded-xl rounded-none shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tighter">{selectedCustomer.name}</h3>
                  <div className="flex flex-col">
                    <a href={`tel:${selectedCustomer.phone}`} className="text-xs text-slate-500 font-bold tracking-widest hover:text-blue-600 transition-colors">
                      {selectedCustomer.phone}
                    </a>
                    {selectedCustomer.phone2 && (
                      <a href={`tel:${selectedCustomer.phone2}`} className="text-[10px] text-slate-400 font-bold tracking-widest hover:text-blue-600 transition-colors">
                        SĐT 2: {selectedCustomer.phone2}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getCustomerStats(selectedCustomer).debt > 0 && (
                  <button 
                    onClick={() => handleOpenPaymentModal('ALL', null, getCustomerStats(selectedCustomer).debt)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-100"
                  >
                    <CreditCard size={14} /> Thu nợ khách
                  </button>
                )}
                <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar shrink-0">
              <button 
                onClick={() => setActiveDetailTab('info')}
                className={`flex-1 min-w-[120px] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${activeDetailTab === 'info' ? 'border-pink-600 text-pink-600 bg-pink-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <User size={16} /> Thông tin
              </button>
              <button 
                onClick={() => setActiveDetailTab('history')}
                className={`flex-1 min-w-[120px] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${activeDetailTab === 'history' ? 'border-pink-600 text-pink-600 bg-pink-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <History size={16} /> Lịch sử mua hàng
              </button>
              <button 
                onClick={() => setActiveDetailTab('warranty')}
                className={`flex-1 min-w-[120px] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${activeDetailTab === 'warranty' ? 'border-pink-600 text-pink-600 bg-pink-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <ShieldCheck size={16} /> Bảo hành / sửa chữa
              </button>
              <button 
                onClick={() => setActiveDetailTab('tasks')}
                className={`hidden md:flex flex-1 min-w-[120px] py-3.5 px-4 items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${activeDetailTab === 'tasks' ? 'border-pink-600 text-pink-600 bg-pink-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <ClipboardList size={16} /> Công việc
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {(() => {
                const stats = getCustomerStats(selectedCustomer);
                
                const customerTasks = tasks.filter(t => t.customerId === selectedCustomer?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                const getTaskStatusStyle = (status: string) => {
                  switch (status) {
                    case 'TODO':
                    case 'OPEN': return 'bg-slate-50 text-slate-600 border-slate-200';
                    case 'ACCEPTED':
                    case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
                    case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
                    case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-200';
                    default: return 'bg-slate-50 text-slate-600 border-slate-200';
                  }
                };

                const getTaskStatusText = (status: string) => {
                  switch (status) {
                    case 'TODO':
                    case 'OPEN': return 'MỚI TẠO';
                    case 'ACCEPTED': return 'ĐÃ NHẬN';
                    case 'IN_PROGRESS': return 'ĐANG XỬ LÝ';
                    case 'COMPLETED': return 'HOÀN THÀNH';
                    case 'CANCELLED': return 'ĐÃ HỦY';
                    default: return status;
                  }
                };

                const getPriorityStyle = (priority: string) => {
                  switch (priority) {
                    case 'LOW': return 'text-slate-500 bg-slate-100';
                    case 'MEDIUM': return 'text-blue-600 bg-blue-100';
                    case 'HIGH': return 'text-orange-600 bg-orange-100';
                    case 'CRITICAL': return 'text-rose-600 bg-rose-100';
                    default: return 'text-slate-500 bg-slate-100';
                  }
                };

                const getPriorityText = (priority: string) => {
                  switch (priority) {
                    case 'LOW': return 'Thấp';
                    case 'MEDIUM': return 'TB';
                    case 'HIGH': return 'Cao';
                    case 'CRITICAL': return 'Khẩn cấp';
                    default: return priority;
                  }
                };

                const tasksContent = (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Công việc ({customerTasks.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {customerTasks.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                            <ClipboardList size={24} />
                          </div>
                          <p className="text-slate-400 italic text-sm font-medium">Khách hàng chưa có công việc nào.</p>
                        </div>
                      ) : (
                        customerTasks.map(task => (
                          <div 
                            key={task.id} 
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group/task block"
                          >
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/task:bg-blue-50 group-hover/task:text-blue-500 transition-all shrink-0">
                                  <ClipboardList size={20} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded italic">#{task.id}</span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getTaskStatusStyle(task.status)} tracking-widest`}>
                                      {getTaskStatusText(task.status)}
                                    </span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)} tracking-widest`}>
                                      {getPriorityText(task.priority)}
                                    </span>
                                  </div>
                                  <p className="font-bold text-sm text-slate-800 mb-1">{task.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                      <Calendar size={12} />
                                      {formatDateTime(task.createdAt)}
                                    </div>
                                    {task.assignedTo && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <User size={12} />
                                        {task.assignedTo}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col justify-between md:items-end gap-2 shrink-0 md:pl-4 md:border-l border-slate-50">
                                {task.description && (
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 w-full md:w-[250px] md:max-w-xs">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Chi tiết:</p>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed truncate whitespace-break-spaces">{task.description}</p>
                                  </div>
                                )}
                                <div className="flex items-center justify-between md:justify-end gap-4 mt-auto w-full text-right">
                                   {task.dueDate && (
                                     <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Hạn chót</p>
                                       <p className={`text-xs font-black ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-600' : 'text-slate-600'}`}>
                                          {formatDateTime(task.dueDate)}
                                       </p>
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
                
                if (activeDetailTab === 'info') {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[80px]">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tổng đơn</span>
                          <p className="text-xl font-black text-slate-800 leading-none">{stats.count}</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[80px]">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tổng mua</span>
                          <p className="text-xl font-black text-slate-800 leading-none truncate">
                            {formatNumber(stats.total)} <span className="text-[10px]">đ</span>
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[80px]">
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Công nợ</span>
                          <p className="text-xl font-black text-red-600 leading-none truncate">
                            {formatNumber(stats.debt)} <span className="text-[10px]">đ</span>
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[80px]">
                          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Đơn cuối</span>
                          <p className="text-sm font-black text-slate-800 leading-tight">
                            {stats.lastTransaction ? (stats.lastTransaction.split(' ').find(p => p.includes('/')) || stats.lastTransaction.split(' ')[0]) : '---'}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[80px] sm:flex hidden">
                          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Tỷ lệ TT</span>
                          <p className="text-xl font-black text-slate-800 leading-none">
                            {Math.round(stats.paymentRate)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-pink-500 rounded-full"></div>
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Thông tin cơ bản</h4>
                          </div>
                          <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Số điện thoại</span>
                              <div className="flex items-center gap-3">
                                <a href={`tel:${selectedCustomer.phone}`} className="text-sm text-slate-800 font-black px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100">
                                  <Phone size={14} className="fill-emerald-600 text-transparent" /> {selectedCustomer.phone} (Gọi SIM)
                                </a>
                                {selectedCustomer.phone2 && (
                                  <a href={`tel:${selectedCustomer.phone2}`} className="text-sm text-slate-800 font-black px-3 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-all active:scale-95 border border-blue-100">
                                    <Phone size={14} className="fill-blue-600 text-transparent" /> {selectedCustomer.phone2} (SĐT 2)
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Địa chỉ</span>
                              <span className="text-sm text-slate-800 font-bold">{selectedCustomer.address || '---'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Khu vực</span>
                              <div className="flex flex-col gap-3">
                                <span className="text-sm text-slate-800 font-bold">{selectedCustomer.location || '---'}</span>
                                {selectedCustomer.location && (selectedCustomer.location.includes(',') || selectedCustomer.location.includes('.')) && (
                                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Map size={12} className="text-pink-500" /> BẢN ĐỒ VỊ TRÍ
                                      </span>
                                      <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.location)}`}
                                        target="_blank"
                                        rel="no-referrer"
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-tighter"
                                      >
                                        Mở Maps
                                      </a>
                                    </div>
                                    <div className="h-[150px] w-full relative bg-slate-100">
                                      <iframe
                                        title="Customer Location"
                                        width="100%"
                                        height="150"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCustomer.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                        className="grayscale hover:grayscale-0 transition-all duration-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Ghi chú</span>
                              <span className="text-sm text-slate-600 italic font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">{selectedCustomer.note || 'Không có ghi chú'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Thông tin hệ thống</h4>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                              <span className="text-xs text-slate-500 font-bold">Người tạo:</span>
                              <span className="text-xs text-slate-800 font-black">{selectedCustomer.createdBy || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                              <span className="text-xs text-slate-500 font-bold">Ngày tạo:</span>
                              <span className="text-xs text-slate-800 font-black">{selectedCustomer.createdAt || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                              <span className="text-xs text-slate-500 font-bold">Mã KH:</span>
                              <span className="text-xs text-slate-800 font-black bg-slate-100 px-2 py-0.5 rounded">{selectedCustomer.id || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-xs text-slate-500 font-bold">Nợ hiện tại:</span>
                              <span className="text-sm text-red-600 font-black">{formatNumber(stats.debt)}đ</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consolidated Services Section (Wifi & Camera) */}
                      <div className="mt-8 grid grid-cols-1 gap-6">
                        {/* Wifi Section */}
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Wifi size={16} className="text-blue-500" />
                              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                WIFI ({wifiRecords.filter(r => r.customerPhone === selectedCustomer?.phone).length})
                              </h4>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-slate-50">
                            {(() => {
                              const customerWifi = wifiRecords.filter(r => r.customerPhone === selectedCustomer?.phone);
                              return customerWifi.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic text-xs font-medium bg-white">
                                  Chưa có thông tin wifi
                                </div>
                              ) : (
                                customerWifi.map(wifi => (
                                  <div key={wifi.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="font-bold text-slate-800 text-sm">{wifi.wifiName}</span>
                                      <span className="text-[9px] text-slate-300 font-medium uppercase">{wifi.createdAt.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 rounded-xl border border-blue-100/50 group-hover:bg-blue-50 transition-colors">
                                        <span className="text-[9px] font-black text-blue-300 uppercase">PWD:</span>
                                        <span className="font-mono text-sm text-blue-700 font-bold tracking-tight">{wifi.wifiPassword || '---'}</span>
                                      </div>
                                      {wifi.note && (
                                        <div className="hidden md:block flex-[1.5] text-[10px] text-slate-400 italic line-clamp-1">
                                          {wifi.note}
                                        </div>
                                      )}
                                    </div>
                                    {wifi.note && (
                                      <div className="md:hidden mt-2 text-[10px] text-slate-400 italic">
                                        {wifi.note}
                                      </div>
                                    )}
                                  </div>
                                ))
                              );
                            })()}
                          </div>
                        </div>

                        {/* Camera Section */}
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Camera size={16} className="text-emerald-500" />
                              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                CAMERA ({cameraAccounts.filter(r => r.customerPhone === selectedCustomer?.phone).length})
                              </h4>
                            </div>
                          </div>
                          
                          <div className="divide-y divide-slate-50">
                            {(() => {
                              const customerCameras = cameraAccounts.filter(r => r.customerPhone === selectedCustomer?.phone);
                              return customerCameras.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic text-xs font-medium bg-white">
                                  Chưa có tài khoản camera
                                </div>
                              ) : (
                                customerCameras.map(cam => (
                                  <div key={cam.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{cam.accountName}</span>
                                        {cam.cameraBrand && (
                                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                            {cam.cameraBrand}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9px] text-slate-300 font-medium uppercase">{cam.createdAt.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50 group-hover:bg-emerald-50 transition-colors">
                                        <span className="text-[9px] font-black text-emerald-300 uppercase">PWD:</span>
                                        <span className="font-mono text-sm text-emerald-700 font-bold tracking-tight">{cam.accountPassword || '---'}</span>
                                      </div>
                                      {cam.note && (
                                        <div className="hidden md:block flex-[1.5] text-[10px] text-slate-400 italic line-clamp-1">
                                          {cam.note}
                                        </div>
                                      )}
                                    </div>
                                    {cam.note && (
                                      <div className="md:hidden mt-2 text-[10px] text-slate-400 italic">
                                        {cam.note}
                                      </div>
                                    )}
                                  </div>
                                ))
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (activeDetailTab === 'history') {
                  return (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Lịch sử mua hàng ({stats.invoices.length})</h4>
                        <div className="text-[10px] font-bold text-slate-400">Gần nhất lên đầu</div>
                      </div>
                      <div className="space-y-3">
                        {stats.invoices.length === 0 ? (
                          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                              <ClipboardList size={24} />
                            </div>
                            <p className="text-slate-400 italic text-sm font-medium">Chưa có giao dịch mua hàng nào.</p>
                          </div>
                        ) : (
                          stats.invoices.map(invoice => (
                            <div 
                              key={invoice.id} 
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-pink-300 transition-all cursor-pointer group/inv"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/inv:bg-pink-50 group-hover/inv:text-pink-500 transition-all shrink-0">
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm text-slate-800 tracking-tight">{invoice.id}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                                      <Calendar size={12} />
                                      {invoice.date}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-8 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                                  <div className="text-left md:text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tổng tiền</p>
                                    <p className="font-bold text-slate-900 text-sm">{formatNumber(invoice.total)}đ</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Còn nợ</p>
                                    <p className={`font-bold text-sm ${invoice.debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                      {formatNumber(invoice.debt)}đ
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {invoice.debt > 0 && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenPaymentModal('SINGLE', invoice.id, invoice.debt);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shrink-0"
                                        title="Thu nợ đơn này"
                                      >
                                        <CreditCard size={14} />
                                      </button>
                                    )}
                                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${invoice.debt === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                      {invoice.debt === 0 ? 'HOÀN TẤT' : 'CÒN NỢ'}
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover/inv:text-pink-400 transition-colors" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                }

                if (activeDetailTab === 'warranty') {
                  const customerMaintenances = maintenanceRecords.filter(m => 
                    (m.customerPhone === selectedCustomer?.phone) || 
                    (m.customerName === selectedCustomer?.name)
                  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case 'RECEIVING': return 'bg-blue-50 text-blue-600 border-blue-100';
                      case 'REPAIRING': return 'bg-orange-50 text-orange-600 border-orange-100';
                      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
                      case 'RETURNED': return 'bg-slate-50 text-slate-600 border-slate-100';
                      default: return 'bg-slate-50 text-slate-600 border-slate-100';
                    }
                  };

                  const getStatusText = (status: string) => {
                    switch (status) {
                      case 'RECEIVING': return 'MỚI TIẾP NHẬN';
                      case 'REPAIRING': return 'ĐANG XỬ LÝ';
                      case 'COMPLETED': return 'ĐÃ XỬ LÝ XONG';
                      case 'RETURNED': return 'ĐÃ TRẢ KHÁCH';
                      default: return status;
                    }
                  };

                  return (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Lịch sử bảo hành ({customerMaintenances.length})</h4>
                      </div>
                      <div className="space-y-3">
                        {customerMaintenances.length === 0 ? (
                          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                              <Wrench size={24} />
                            </div>
                            <p className="text-slate-400 italic text-sm font-medium">Khách hàng chưa có phiếu bảo hành nào.</p>
                          </div>
                        ) : (
                          customerMaintenances.map(record => (
                            <div 
                              key={record.id} 
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group/warranty"
                            >
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/warranty:bg-blue-50 group-hover/warranty:text-blue-500 transition-all shrink-0">
                                    <Wrench size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded italic">#{record.id}</span>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getStatusStyle(record.status)} tracking-widest`}>
                                        {getStatusText(record.status)}
                                      </span>
                                    </div>
                                    <p className="font-bold text-sm text-slate-800 mb-1">{record.productName}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <Calendar size={12} />
                                        {record.date}
                                      </div>
                                      {record.serialNumber && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
                                          <Hash size={12} />
                                          SN: {record.serialNumber}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col justify-between md:items-end gap-2 shrink-0 md:pl-4 md:border-l border-slate-50">
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Tình trạng lỗi:</p>
                                    <p className="text-xs text-slate-700 font-bold leading-relaxed">{record.issue}</p>
                                  </div>
                                  <div className="flex items-center justify-between md:justify-end gap-4 mt-auto">
                                    <div className="text-right">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Chi phí</p>
                                      <p className="text-xs font-black text-rose-600">{formatNumber(record.cost)}đ</p>
                                    </div>
                                    {record.transferId && (
                                      <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase italic tracking-tighter">
                                        <Send size={10} /> Đã gửi tuyến
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {record.note && (
                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-start gap-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase shrink-0 mt-0.5">Ghi chú:</div>
                                  <p className="text-[11px] text-slate-500 italic leading-relaxed">{record.note}</p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Thêm phần công việc vào tab bảo hành trên giao diện điện thoại */}
                      <div className="md:hidden mt-8 pt-6 border-t-2 border-dashed border-slate-200">
                        {tasksContent}
                      </div>
                    </div>
                  );
                }
                if (activeDetailTab === 'tasks') {
                  const customerTasks = tasks.filter(t => t.customerId === selectedCustomer?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                  const getTaskStatusStyle = (status: string) => {
                    switch (status) {
                      case 'TODO':
                      case 'OPEN': return 'bg-slate-50 text-slate-600 border-slate-200';
                      case 'ACCEPTED':
                      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
                      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
                      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-200';
                      default: return 'bg-slate-50 text-slate-600 border-slate-200';
                    }
                  };

                  const getTaskStatusText = (status: string) => {
                    switch (status) {
                      case 'TODO':
                      case 'OPEN': return 'MỚI TẠO';
                      case 'ACCEPTED': return 'ĐÃ NHẬN';
                      case 'IN_PROGRESS': return 'ĐANG XỬ LÝ';
                      case 'COMPLETED': return 'HOÀN THÀNH';
                      case 'CANCELLED': return 'ĐÃ HỦY';
                      default: return status;
                    }
                  };

                  const getPriorityStyle = (priority: string) => {
                    switch (priority) {
                      case 'LOW': return 'text-slate-500 bg-slate-100';
                      case 'MEDIUM': return 'text-blue-600 bg-blue-100';
                      case 'HIGH': return 'text-orange-600 bg-orange-100';
                      case 'CRITICAL': return 'text-rose-600 bg-rose-100';
                      default: return 'text-slate-500 bg-slate-100';
                    }
                  };

                  const getPriorityText = (priority: string) => {
                    switch (priority) {
                      case 'LOW': return 'Thấp';
                      case 'MEDIUM': return 'TB';
                      case 'HIGH': return 'Cao';
                      case 'CRITICAL': return 'Khẩn cấp';
                      default: return priority;
                    }
                  };

                  return (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Công việc ({customerTasks.length})</h4>
                      </div>
                      <div className="space-y-3">
                        {customerTasks.length === 0 ? (
                          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                              <ClipboardList size={24} />
                            </div>
                            <p className="text-slate-400 italic text-sm font-medium">Khách hàng chưa có công việc nào.</p>
                          </div>
                        ) : (
                          customerTasks.map(task => (
                            <div 
                              key={task.id} 
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group/task block"
                            >
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/task:bg-blue-50 group-hover/task:text-blue-500 transition-all shrink-0">
                                    <ClipboardList size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded italic">#{task.id}</span>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getTaskStatusStyle(task.status)} tracking-widest`}>
                                        {getTaskStatusText(task.status)}
                                      </span>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)} tracking-widest`}>
                                        {getPriorityText(task.priority)}
                                      </span>
                                    </div>
                                    <p className="font-bold text-sm text-slate-800 mb-1">{task.title}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <Calendar size={12} />
                                        {formatDateTime(task.createdAt)}
                                      </div>
                                      {task.assignedTo && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                          <User size={12} />
                                          {task.assignedTo}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col justify-between md:items-end gap-2 shrink-0 md:pl-4 md:border-l border-slate-50">
                                  {task.description && (
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 w-full md:w-[250px] md:max-w-xs">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">Chi tiết:</p>
                                      <p className="text-xs text-slate-700 font-medium leading-relaxed truncate whitespace-break-spaces">{task.description}</p>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between md:justify-end gap-4 mt-auto w-full text-right">
                                     {task.dueDate && (
                                       <div>
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Hạn chót</p>
                                         <p className={`text-xs font-black ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-600' : 'text-slate-600'}`}>
                                            {formatDateTime(task.dueDate)}
                                         </p>
                                       </div>
                                     )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0 uppercase">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-3 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center md:p-4 p-0 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-2xl md:rounded-xl rounded-none shadow-2xl overflow-hidden flex flex-col h-full md:max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-pink-600" size={20} />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Chi tiết hóa đơn {selectedInvoice.id}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrint({
                    title: 'HÓA ĐƠN BÁN HÀNG',
                    id: selectedInvoice.id,
                    date: selectedInvoice.date,
                    partner: selectedInvoice.customer,
                    phone: selectedInvoice.phone,
                    items: selectedInvoice.items.map(i => ({ ...i, total: i.qty * i.price })),
                    total: selectedInvoice.total,
                    paid: selectedInvoice.paid,
                    debt: selectedInvoice.debt,
                    type: 'HOA_DON'
                  })}
                  className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center"
                >
                  <Printer size={20} />
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Khách hàng</p>
                  <p className="font-bold text-slate-800 text-xs md:text-sm">{selectedInvoice.customer}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ngày bán</p>
                  <p className="font-black text-slate-800 text-xs md:text-sm">{selectedInvoice.date}</p>
                </div>
              </div>

              <div className="mb-4 md:mb-6 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-slate-200">
                      <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold text-slate-700 w-12 text-center">STT</th>
                      <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold text-slate-700">Tên Sản Phẩm</th>
                      <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold text-slate-700 text-center">Số Lượng</th>
                      <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold text-slate-700 text-right">Đơn Giá</th>
                      <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold text-slate-700 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-slate-50">
                          <td className="p-2 md:p-3 text-center text-[10px] md:text-sm text-slate-600 font-medium">{idx + 1}</td>
                          <td className="p-2 md:p-3">
                            <p className="font-medium text-[10px] md:text-sm text-slate-800">{item.name}</p>
                          </td>
                          <td className="p-2 md:p-3 text-center text-[10px] md:text-sm text-slate-600 font-medium">{item.qty}</td>
                          <td className="p-2 md:p-3 text-right text-[10px] md:text-sm text-slate-600 font-medium">{formatNumber(item.price)} <span className="underline">đ</span></td>
                          <td className="p-2 md:p-3 text-right text-[10px] md:text-sm text-slate-800 font-bold">{formatNumber(item.qty * item.price)} <span className="underline">đ</span></td>
                        </tr>
                        {item.sn && (
                          <tr className="bg-slate-50/30">
                            <td colSpan={5} className="p-1 px-12">
                              <div className="flex items-center gap-1.5 opacity-60">
                                <span className="text-[9px] font-mono text-slate-500">
                                  SN: {Array.isArray(item.sn) ? item.sn.join(', ') : item.sn}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3}></td>
                      <td className="p-2 md:p-3 text-right text-[10px] md:text-sm font-bold text-slate-700">Tổng:</td>
                      <td className="p-2 md:p-3 text-right text-[10px] md:text-sm font-bold text-slate-800">{formatNumber(selectedInvoice.total)} <span className="underline">đ</span></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="space-y-1.5 md:space-y-2 py-4 border-t border-slate-200">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[11px] md:text-sm text-slate-600 font-medium">Tạm tính (chưa VAT):</span>
                  <span className="font-medium text-[11px] md:text-sm text-slate-800">{formatNumber(selectedInvoice.total)} <span className="underline">đ</span></span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[11px] md:text-sm text-slate-600 font-medium">Tổng tiền hàng:</span>
                  <span className="font-medium text-[11px] md:text-sm text-slate-800">{formatNumber(selectedInvoice.total)} <span className="underline">đ</span></span>
                </div>
                
                <div className="flex justify-between items-center pt-3 mt-2 px-2 border-t border-slate-100 italic font-bold">
                  <span className="text-sm md:text-2xl font-black text-slate-800 uppercase tracking-tight">TỔNG TIỀN:</span>
                  <span className="text-sm md:text-2xl font-black text-blue-600 tracking-tighter">{formatNumber(selectedInvoice.total)} <span className="underline">đ</span></span>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-[11px] md:text-sm text-slate-600 font-medium">Đã thanh toán:</span>
                  <span className="font-bold text-[11px] md:text-sm text-emerald-600">{formatNumber(selectedInvoice.paid)} <span className="underline">đ</span></span>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-[11px] md:text-sm text-slate-600 font-medium">Còn nợ:</span>
                  <span className="font-bold text-[11px] md:text-sm text-red-600">{formatNumber(selectedInvoice.debt)} <span className="underline">đ</span></span>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 flex justify-end gap-2 md:gap-3 bg-slate-50 shrink-0">
              {selectedInvoice.debt > 0 && (
                <button 
                  onClick={() => handleOpenPaymentModal('SINGLE', selectedInvoice.id, selectedInvoice.debt)}
                  className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] md:text-xs tracking-widest shadow-md shadow-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  <CreditCard size={14} className="md:w-4 md:h-4" /> Thu nợ
                </button>
              )}
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-[#991b1b] text-white rounded-lg font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-[#7f1d1d] transition-all text-center"
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
              <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase">Thu nợ khách hàng</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Số tiền thu</label>
                <input 
                  type="text" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(formatNumber(parseFormattedNumber(e.target.value)))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold outline-none focus:border-emerald-400 text-emerald-600 shadow-inner" 
                  placeholder="0" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ngày thu</label>
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
                    ? "Hệ thống sẽ tự động trừ nợ cho các hóa đơn cũ nhất trước (FIFO)."
                    : "Số tiền sẽ được trừ trực tiếp vào hóa đơn đang chọn."}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ví thanh toán</label>
                <select
                  value={paymentWalletId || ''}
                  onChange={e => setPaymentWalletId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 text-slate-700 shadow-inner appearance-none relative"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                >
                  <option value="" disabled>Chọn ví</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={executePayment}
                className="w-full bg-emerald-600 text-white py-4 rounded-lg font-black shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest mt-2 active:scale-95 transition-all hover:bg-emerald-700"
              >
                XÁC NHẬN THU NỢ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-md md:rounded-xl rounded-none shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col h-full md:max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-black text-slate-800 tracking-tighter">
                {editingCustomerId ? 'Cập nhật Khách Hàng' : 'Thêm Khách Hàng'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1 block">Tên khách hàng</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 shadow-inner" 
                  placeholder="Tên khách hàng..." 
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1 block">Số điện thoại</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 shadow-inner" 
                  placeholder="Số điện thoại..." 
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1 block">Số điện thoại 2</label>
                <input 
                  type="text" 
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 shadow-inner" 
                  placeholder="Số điện thoại 2..." 
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1 block">Địa chỉ</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 shadow-inner" 
                  placeholder="Địa chỉ..." 
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1 block">Khu vực (Local)</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 shadow-inner" 
                    placeholder="Khu vực..." 
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-sm active:scale-90 disabled:opacity-50"
                    title="Lấy vị trí hiện tại"
                  >
                    {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1 block">Ghi chú</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:border-blue-400 shadow-inner min-h-[80px]" 
                  placeholder="Ghi chú..." 
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3 shrink-0">
              <button 
                onClick={handleSave}
                className="flex-1 bg-emerald-600 text-white py-3.5 rounded-lg font-black shadow-md shadow-emerald-200 uppercase text-[11px] tracking-widest active:scale-95 transition-all hover:bg-emerald-700"
              >
                {editingCustomerId ? 'CẬP NHẬT' : 'LƯU'}
              </button>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="flex-1 py-3.5 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] transition-colors active:scale-95 shadow-md shadow-red-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => { resetForm(); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};


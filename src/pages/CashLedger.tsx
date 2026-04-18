import React, { useState } from 'react';
import { Search, Wallet, Calendar, ArrowUpRight, ArrowDownLeft, FileText, Printer, X, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatNumber, parseFormattedNumber, parseDateString } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { PrintTemplate } from '../components/PrintTemplate';

export const CashLedger: React.FC = () => {
  const { cashTransactions, addCashTransaction } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIPT' | 'PAYMENT'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [type, setType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [amount, setAmount] = useState('');
  const [partner, setPartner] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<any>('OTHER');
  
  // Print State
  const [printData, setPrintData] = useState<any>(null);

  const handlePrint = (data: any) => {
    setPrintData(data);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredTransactions = (cashTransactions || [])
    .filter(t => {
      const matchesSearch = (t.partner || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (t.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || t.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => parseDateString(b.date) - parseDateString(a.date));

  const totalReceipts = (cashTransactions || [])
    .filter(t => t.type === 'RECEIPT')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPayments = (cashTransactions || [])
    .filter(t => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalReceipts - totalPayments;

  const handleAddTransaction = () => {
    if (!amount || !partner || !note) {
      alert('Vui lòng nhập đủ thông tin');
      return;
    }

    const now = new Date();
    const prefix = type === 'RECEIPT' ? 'PT' : 'PC';
    const id = generateId(prefix, cashTransactions);
    
    addCashTransaction({
      id,
      date: now.toLocaleString('vi-VN'),
      type,
      amount: parseFormattedNumber(amount) || 0,
      partner,
      note,
      category
    });

    setIsModalOpen(false);
    setAmount('');
    setPartner('');
    setNote('');
    setCategory('OTHER');
  };

  return (
    <div className="h-full flex flex-col px-4 md:px-0 py-4 md:py-0">
      {/* Print Template Container */}
      {printData && <PrintTemplate {...printData} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0 print:hidden">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <ArrowDownLeft size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tổng thu</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(totalReceipts)}đ</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <ArrowUpRight size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tổng chi</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(totalPayments)}đ</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Wallet size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tồn quỹ</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(balance)}đ</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 shrink-0 print:hidden">
        <div className="flex-1 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 focus-within:border-blue-400 transition-all">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm giao dịch..." 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all ${filterType === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setFilterType('RECEIPT')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all ${filterType === 'RECEIPT' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Thu
          </button>
          <button 
            onClick={() => setFilterType('PAYMENT')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all ${filterType === 'PAYMENT' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Chi
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold text-xs tracking-wide active:scale-95 transition-all hover:bg-blue-700"
        >
          <Plus size={16} /> Lập phiếu
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-6 print:hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Mã GD</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Ngày giờ</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Đối tác</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Nội dung</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider text-right">Số tiền</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic text-sm">Không tìm thấy giao dịch nào.</td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={`${t.id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <span className="font-semibold text-xs text-slate-800 tracking-tight">{t.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <Calendar size={12} />
                        {t.date}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-xs text-slate-800 tracking-tight">{t.partner}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-600 font-medium">{t.note}</p>
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider">{t.category}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold text-sm ${t.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'RECEIPT' ? '+' : '-'}{formatNumber(t.amount)}đ
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handlePrint({
                          title: t.type === 'RECEIPT' ? 'Phiếu thu tiền' : 'Phiếu chi tiền',
                          id: t.id,
                          date: t.date,
                          partner: t.partner,
                          total: t.amount,
                          paid: t.amount,
                          debt: 0,
                          note: t.note,
                          type: t.type === 'RECEIPT' ? 'THU' : 'CHI'
                        })}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                Không tìm thấy giao dịch nào
              </div>
            ) : (
              filteredTransactions.map((t, idx) => (
                <div 
                  key={`${t.id}-${idx}`} 
                  className="p-4 space-y-3 active:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 tracking-tight">{t.id}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{t.date}</span>
                    </div>
                    <button 
                      onClick={() => handlePrint({
                        title: t.type === 'RECEIPT' ? 'Phiếu thu tiền' : 'Phiếu chi tiền',
                        id: t.id,
                        date: t.date,
                        partner: t.partner,
                        total: t.amount,
                        paid: t.amount,
                        debt: 0,
                        note: t.note,
                        type: t.type === 'RECEIPT' ? 'THU' : 'CHI'
                      })}
                      className="p-2 text-slate-400 hover:text-indigo-600 active:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-800 text-sm truncate">{t.partner}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{t.note}</p>
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{t.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-base ${t.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'RECEIPT' ? '+' : '-'}{formatNumber(t.amount)}đ
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Lập phiếu thu/chi</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg w-full">
                <button 
                  onClick={() => setType('RECEIPT')}
                  className={`flex-1 text-center py-1.5 rounded-md transition-all font-semibold text-[10px] tracking-wide ${type === 'RECEIPT' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  Phiếu thu
                </button>
                <button 
                  onClick={() => setType('PAYMENT')}
                  className={`flex-1 text-center py-1.5 rounded-md transition-all font-semibold text-[10px] tracking-wide ${type === 'PAYMENT' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}
                >
                  Phiếu chi
                </button>
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Đối tác / Người nộp-nhận</label>
                <input 
                  type="text" 
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 shadow-inner focus:border-blue-400" 
                  placeholder="Tên khách hàng, NCC, nhân viên..." 
                />
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Số tiền (đ)</label>
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(formatNumber(parseFormattedNumber(e.target.value)))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 shadow-inner focus:border-blue-400" 
                  placeholder="0" 
                />
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Nội dung</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none mt-1 shadow-inner focus:border-blue-400 h-24" 
                  placeholder="Lý do thu/chi..." 
                />
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Loại thu chi</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 shadow-inner focus:border-blue-400"
                >
                  <option value="OTHER">Khác</option>
                  <option value="SALES_REVENUE">Doanh thu bán hàng</option>
                  <option value="IMPORT_PAYMENT">Chi phí nhập hàng</option>
                  <option value="DEBT_COLLECTION">Thu nợ khách hàng</option>
                  <option value="DEBT_PAYMENT">Trả nợ NCC</option>
                </select>
              </div>
              
              <button 
                onClick={handleAddTransaction}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold shadow-md shadow-blue-200 tracking-wide mt-2 active:scale-95 transition-all hover:bg-blue-700"
              >
                Lưu phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

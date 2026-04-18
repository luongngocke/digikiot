import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Truck, CheckCircle, X, Trash2, Barcode, Printer, ArrowLeft, LayoutGrid, Eye, Info, ChevronDown, Edit2, ArrowRight, UserCircle, PieChart, FileText, Package } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Product, ImportItem, Supplier, CashTransaction, ImportOrder } from '../types';
import { formatNumber, parseFormattedNumber } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { PrintTemplate } from '../components/PrintTemplate';

export const Import: React.FC = () => {
  const navigate = useNavigate();
  const { products, suppliers, importOrders, cashTransactions, addImportOrder, addSupplier, updateProduct, addSerial, addCashTransaction, importDraft, setImportDraft, serials } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState<(ImportItem & { hasSerial?: boolean; serials?: string[]; unit?: string; discount?: number; note?: string })[]>(
    (Array.isArray(importDraft?.cart) ? importDraft.cart : []).map(item => ({
      ...item,
      serials: Array.isArray(item?.serials) ? item.serials : []
    }))
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(importDraft?.selectedSupplier || null);
  const [importCode, setImportCode] = useState('Mã phiếu tự động');
  const [orderCode, setOrderCode] = useState('');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [returnCost, setReturnCost] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [note, setNote] = useState('');
  
  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isMobileProductSearchOpen, setIsMobileProductSearchOpen] = useState(false);
  const [isMobileSupplierSearchOpen, setIsMobileSupplierSearchOpen] = useState(false);
  const [isMobileCheckoutOpen, setIsMobileCheckoutOpen] = useState(false);
  const [mobileSupplierSearchTerm, setMobileSupplierSearchTerm] = useState('');
  
  // Print State
  const [printData, setPrintData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<{id: string, total: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [paidAmount, setPaidAmount] = useState<number>(importDraft?.paid as number || 0);

  useEffect(() => {
    // Only update draft if values actually changed to avoid unnecessary re-renders
    if (
      importDraft?.cart !== cart || 
      importDraft?.selectedSupplier !== selectedSupplier || 
      importDraft?.paid !== paidAmount
    ) {
      setImportDraft({ cart, selectedSupplier, paid: paidAmount });
    }
  }, [cart, selectedSupplier, paidAmount, setImportDraft, importDraft]);

  const totalGoods = cart.reduce((sum, item) => sum + (item.price * item.qty) - (item.discount || 0), 0);
  const finalTotal = totalGoods - overallDiscount + returnCost + otherCost + shippingFee;

  const handlePrint = (data: any) => {
    setPrintData(data);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Search results
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState<Supplier[]>([]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = (products || []).filter(p => 
        !p.isService && (
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setProductSuggestions(filtered);
    } else {
      setProductSuggestions([]);
    }
  }, [searchTerm, products]);

  const handleSupplierSearch = (val: string) => {
    if (val.trim()) {
      const filtered = (suppliers || []).filter(s => 
        (s.name || '').toLowerCase().includes(val.toLowerCase()) || 
        (s.phone || '').includes(val)
      );
      setSupplierSuggestions(filtered);
    } else {
      setSupplierSuggestions([]);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing && !product.hasSerial) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      if (existing && product.hasSerial) return prev;

      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.importPrice || Math.round(product.price * 0.7), 
        qty: product.hasSerial ? 0 : 1,
        hasSerial: product.hasSerial,
        serials: [],
        unit: product.unit || 'Cái',
        discount: 0,
        note: ''
      }];
    });
    setSearchTerm('');
    setProductSuggestions([]);
  };

  const updateQty = (id: string, qty: number) => {
    const product = products.find(p => p.id === id);
    if (product?.hasSerial) return;
    if (qty < 0) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
  };

  const updatePrice = (id: string, price: number) => {
    if (price < 0) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, price } : item));
  };

  const updateItemDiscount = (id: string, discount: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, discount } : item));
  };

  const updateItemNote = (id: string, note: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const addSerialToItem = (prodId: string, sn: string) => {
    if (!sn.trim()) return;
    const upperSn = sn.toUpperCase();
    
    // Check if serial already exists in the system
    const existingSerial = serials?.find(s => s.sn.toUpperCase() === upperSn);
    if (existingSerial) {
      alert(`Mã serial ${upperSn} đã tồn tại trong hệ thống!`);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === prodId) {
        if (item.serials?.includes(upperSn)) {
          alert("Mã này đã quét trong phiếu này!");
          return item;
        }
        const newSerials = [...(item.serials || []), upperSn];
        return { ...item, qty: newSerials.length, serials: newSerials };
      }
      return item;
    }));
  };

  const removeSerialFromItem = (prodId: string, sn: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === prodId) {
        const newSerials = item.serials?.filter(s => s !== sn) || [];
        return { ...item, qty: newSerials.length, serials: newSerials };
      }
      return item;
    }));
  };

  useEffect(() => {
    if (importDraft?.paid === undefined && finalTotal !== paidAmount) {
      setPaidAmount(finalTotal);
    }
  }, [finalTotal, importDraft?.paid]);

  const handleImportClick = () => {
    if (cart.length === 0) return alert('Phiếu nhập trống!');
    if (!selectedSupplier) return alert('Vui lòng chọn nhà cung cấp!');
    
    for (let item of cart) {
      if (item.hasSerial && item.qty === 0) {
        return alert(`Sản phẩm ${item.name} chưa quét mã Serial!`);
      }
    }
    setShowConfirmModal(true);
  };

  const handleImport = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const now = new Date();
      const importId = importCode === 'Mã phiếu tự động' ? generateId('NH', importOrders) : importCode;
      const dateStr = now.toLocaleString('vi-VN');

      const order: ImportOrder = {
        id: importId,
        date: dateStr,
        supplier: selectedSupplier.name,
        status: (finalTotal - paidAmount > 0) ? 'Còn nợ' : 'Hoàn tất',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          sn: item.serials,
          unit: item.unit
        })),
        total: finalTotal,
        paid: paidAmount,
        debt: finalTotal - paidAmount,
        discount: overallDiscount,
        returnCost: returnCost,
        shippingFee: shippingFee,
        otherCost: otherCost,
        note: note
      };

      // Update stock and add serials/stock cards
      for (const item of cart) {
        const p = products.find(x => x.id === item.id);
        if (p) {
          updateProduct(item.id, { 
            stock: (p.stock || 0) + item.qty,
            importPrice: item.price 
          }, true);
          
          if (item.hasSerial && item.serials) {
            for (const sn of item.serials) {
              addSerial({
                prodId: item.id,
                sn,
                supplier: selectedSupplier.name,
                importPrice: item.price,
                date: now.toLocaleDateString('vi-VN'),
                refId: importId
              });
            }
          }
        }
      }

      // Record Cash Transaction if paidAmount > 0
      if (order.paid > 0) {
        const transactionId = generateId('PC', cashTransactions);
        const newTransaction: CashTransaction = {
          id: transactionId,
          date: dateStr,
          type: 'PAYMENT',
          amount: order.paid,
          category: 'IMPORT_PAYMENT',
          partner: selectedSupplier.name,
          note: `Thanh toán phiếu nhập ${importId}`,
          refId: importId
        };
        addCashTransaction(newTransaction);
        
        if (shippingFee > 0) {
          const shipTransactionId = generateId('PC', [...cashTransactions, newTransaction]);
          const shipTransaction: CashTransaction = {
            id: shipTransactionId,
            date: dateStr,
            type: 'PAYMENT',
            amount: shippingFee,
            category: 'OTHER',
            partner: selectedSupplier.name,
            note: `Phí vận chuyển phiếu nhập ${importId}`,
            refId: importId
          };
          addCashTransaction(shipTransaction);
        }
      } else if (shippingFee > 0) {
        const shipTransactionId = generateId('PC', cashTransactions);
        const shipTransaction: CashTransaction = {
          id: shipTransactionId,
          date: dateStr,
          type: 'PAYMENT',
          amount: shippingFee,
          category: 'OTHER',
          partner: selectedSupplier.name,
          note: `Phí vận chuyển phiếu nhập ${importId}`,
          refId: importId
        };
        addCashTransaction(shipTransaction);
      }

      await addImportOrder(order);
      setCart([]);
      setSelectedSupplier(null);
      setPaidAmount(0);
      setNote('');
      setOverallDiscount(0);
      setReturnCost(0);
      setShippingFee(0);
      setOtherCost(0);
      setImportCode('Mã phiếu tự động');
      setOrderCode('');
      setImportDraft(null);
      
      // Navigate to import history after successful import
      navigate('/import-history');
    } catch (error) {
      console.error("Error creating import:", error);
      alert("Có lỗi xảy ra khi tạo phiếu nhập!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col lg:flex-row bg-slate-50 print:bg-white relative overflow-hidden">
      {/* Print Template Container */}
      {printData && <PrintTemplate {...printData} />}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Nhập kho thành công!</h3>
            <p className="text-slate-500 mb-8 font-medium">Phiếu nhập <span className="font-bold text-indigo-600">{showSuccessModal.id}</span> đã được lưu vào hệ thống.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const order = importOrders.find(o => o.id === showSuccessModal.id);
                  if (order) {
                    handlePrint({
                      title: 'PHIẾU NHẬP HÀNG',
                      id: order.id,
                      date: order.date,
                      partner: order.supplier,
                      items: order.items.map(i => ({ ...i, total: i.qty * i.price })),
                      total: order.total,
                      paid: order.total,
                      debt: 0,
                      type: 'PHIEU_NHAP'
                    });
                  }
                  setShowSuccessModal(null);
                }}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={20} /> In phiếu nhập
              </button>
              <button 
                onClick={() => setShowSuccessModal(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Tiếp tục nhập hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Column: Main Content */}
      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 bg-white border-b border-slate-100 gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-500">
            <X size={24} />
          </button>
          <h1 className="flex-1 text-lg font-bold text-slate-800">Phiếu nhập hàng mới</h1>
          <button className="text-slate-500">
            <Info size={24} />
          </button>
        </div>

        {/* Desktop Top Header */}
        <div className="hidden md:flex h-14 items-center px-4 bg-white border-b border-slate-200 shrink-0 gap-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800 whitespace-nowrap">Nhập hàng</h1>
          
          <div className="flex-1 max-w-xl relative">
            <div className="flex items-center gap-2 md:gap-3 bg-slate-50 px-3 md:px-4 py-2 rounded-lg border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm hàng (F3)" 
                className="flex-1 bg-transparent text-sm outline-none font-medium"
              />
              <div className="flex items-center gap-1 md:gap-2">
                <LayoutGrid size={18} className="text-slate-400 cursor-pointer hover:text-slate-600 hidden sm:block" />
                <Plus size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
              </div>
            </div>
            {productSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-[60] bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-[400px] overflow-y-auto">
                {productSuggestions.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className="p-4 border-b border-slate-50 hover:bg-blue-50 flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Mã: {p.id} | Tồn: {p.stock}</p>
                    </div>
                    {p.hasSerial && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold">Serial</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hidden sm:block"><Barcode size={20} /></button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hidden sm:block"><Printer size={20} /></button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Eye size={20} /></button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hidden sm:block"><Info size={20} /></button>
          </div>
        </div>

        {/* Mobile Search & Supplier */}
        <div className="md:hidden bg-white p-4 shadow-sm z-10">
          <div className="flex gap-2 mb-3">
            <div 
              className="flex-1 flex items-center bg-slate-100 rounded-xl px-3 py-2.5"
              onClick={() => setIsMobileProductSearchOpen(true)}
            >
              <Search size={18} className="text-slate-400" />
              <span className="text-slate-400 ml-2 text-sm font-medium flex-1">Tên, mã hàng, mã ...</span>
              <Plus size={18} className="text-slate-400 mr-2" />
              <Barcode size={18} className="text-slate-400" />
            </div>
            <button className="bg-slate-100 rounded-xl px-4 py-2.5 flex flex-col items-center justify-center">
              <LayoutGrid size={18} className="text-slate-600 mb-0.5" />
              <span className="text-[10px] font-medium text-slate-600">Nhóm hàng</span>
            </button>
          </div>
          <div 
            className="flex items-center gap-2 py-2"
            onClick={() => setIsMobileSupplierSearchOpen(true)}
          >
            <Truck size={20} className="text-slate-500" />
            <span className={`text-sm font-bold ${selectedSupplier ? 'text-slate-800' : 'text-slate-800'}`}>
              {selectedSupplier ? selectedSupplier.name : 'Chọn nhà cung cấp'}
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full border-collapse hidden md:table">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 p-3"></th>
                <th className="w-12 p-3 text-xs font-bold text-slate-500 text-left">STT</th>
                <th className="w-32 p-3 text-xs font-bold text-slate-500 text-left">Mã hàng</th>
                <th className="p-3 text-xs font-bold text-slate-500 text-left">Tên hàng</th>
                <th className="w-24 p-3 text-xs font-bold text-slate-500 text-center">ĐVT</th>
                <th className="w-32 p-3 text-xs font-bold text-slate-500 text-center">Số lượng</th>
                <th className="w-32 p-3 text-xs font-bold text-slate-500 text-center">Đơn giá</th>
                <th className="w-32 p-3 text-xs font-bold text-slate-500 text-center">Giảm giá</th>
                <th className="w-32 p-3 text-xs font-bold text-slate-500 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-20 text-center text-slate-400 italic text-sm">Chưa có sản phẩm nào trong phiếu nhập.</td>
                </tr>
              ) : (
                cart.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 group">
                      <td className="p-3 text-center">
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                      <td className="p-3 text-sm text-slate-600 font-medium">{index + 1}</td>
                      <td className="p-3 text-sm text-blue-600 font-semibold cursor-pointer hover:underline">{item.id}</td>
                      <td className="p-3">
                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-slate-400 italic">Ghi chú...</span>
                          <Edit2 size={10} className="text-slate-300 cursor-pointer hover:text-slate-500" />
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm text-blue-600 font-medium">{item.unit}</td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          value={item.qty}
                          disabled={item.hasSerial}
                          onChange={(e) => updateQty(item.id, Number(e.target.value) || 0)}
                          className={`w-full text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-semibold outline-none focus:border-blue-500 ${item.hasSerial ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          value={formatNumber(item.price)}
                          onChange={(e) => updatePrice(item.id, parseFormattedNumber(e.target.value))}
                          className="w-full text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          value={formatNumber(item.discount || 0)}
                          onChange={(e) => updateItemDiscount(item.id, parseFormattedNumber(e.target.value))}
                          className="w-full text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-semibold outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-3 text-right text-sm font-bold text-slate-800">
                        {formatNumber((item.price * item.qty) - (item.discount || 0))}
                      </td>
                    </tr>
                    {/* Serial Input Row */}
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <td className="p-0"></td>
                      <td className="p-0"></td>
                      <td className="p-0"></td>
                      <td colSpan={6} className="p-3">
                        <div className="flex flex-col gap-2">
                          <div className="relative max-w-md">
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text" 
                              placeholder="Nhập số Serial/Imei" 
                              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-blue-400 font-medium"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addSerialToItem(item.id, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                          </div>
                          {item.serials && item.serials.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(item.serials || []).map((sn, sIdx) => (
                                <span key={`${sn}-${sIdx}`} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-blue-100">
                                  {sn} <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => removeSerialFromItem(item.id, sn)} />
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100 pb-40">
            {cart.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
                  <FileText size={40} className="text-blue-400" />
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-300 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                  <div className="absolute top-1/2 -left-2 w-1 h-1 bg-blue-300 rounded-full"></div>
                  <div className="absolute top-1/2 -right-2 w-1 h-1 bg-blue-300 rounded-full"></div>
                </div>
                <p className="text-slate-800 font-medium text-base">Chưa có hàng trong phiếu</p>
              </div>
            ) : (
              cart.map((item, index) => {
                const product = products.find(p => p.id === item.id);
                return (
                  <div key={item.id} className="p-4 flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center">
                      <Package size={24} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-800 leading-snug">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1 -mt-1 -mr-1">
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{item.id}</p>
                      <div className="mt-1">
                        <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{item.unit || 'Cái'}</span>
                      </div>
                      
                      {item.hasSerial && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="border border-slate-300 text-slate-500 text-[10px] px-1 rounded">IMEI</span>
                          {item.serials && item.serials.length > 0 ? (
                            <span className="text-sm text-blue-600 font-medium">{item.serials.length} IMEI đã thêm</span>
                          ) : (
                            <span className="text-sm text-yellow-600 font-medium">Chưa thêm IMEI</span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-500 mt-1">
                        Tồn kho: {product?.stock || 0} • Giá: {formatNumber(item.price)}
                      </p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center border border-slate-200 rounded-lg">
                          <button 
                            className="w-10 h-8 flex items-center justify-center text-slate-600" 
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            disabled={item.hasSerial}
                          >
                            -
                          </button>
                          <input 
                            type="text" 
                            value={item.qty}
                            disabled={item.hasSerial}
                            onChange={(e) => updateQty(item.id, Number(e.target.value) || 0)}
                            className="w-10 text-center text-sm font-bold outline-none bg-transparent"
                          />
                          <button 
                            className="w-10 h-8 flex items-center justify-center text-slate-600" 
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            disabled={item.hasSerial}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-base font-bold text-slate-800">{formatNumber(item.price * item.qty)}</span>
                      </div>

                      {/* Serial input for mobile */}
                      {item.hasSerial && (
                        <div className="mt-3 space-y-2 pt-3 border-t border-slate-50">
                          <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text" 
                              placeholder="Quét Serial/Imei" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 font-medium"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addSerialToItem(item.id, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                          </div>
                          {item.serials && item.serials.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(item.serials || []).map((sn, sIdx) => (
                                <span key={`${sn}-${sIdx}`} className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-blue-100">
                                  {sn} <X size={12} onClick={() => removeSerialFromItem(item.id, sn)} />
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile Bottom Bar */}
          {cart.length > 0 && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20">
              <div className="p-4 flex justify-between items-center border-b border-slate-100">
                <div>
                  <span className="text-base font-bold text-slate-800 block">Tổng tiền hàng</span>
                  <span className="text-sm text-slate-500">{cart.length} mặt hàng</span>
                </div>
                <span className="text-lg font-bold text-slate-800">{formatNumber(totalGoods)}</span>
              </div>
              <div className="p-4 flex gap-3">
                <button 
                  onClick={() => alert('Đã lưu tạm')}
                  className="flex-1 py-3.5 rounded-xl border border-blue-600 text-blue-600 font-bold text-sm bg-white active:scale-95 transition-all"
                >
                  Lưu tạm
                </button>
                <button 
                  onClick={() => setIsMobileCheckoutOpen(true)}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  Thanh toán
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Summary Panel */}
      <div className="w-full lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 print:hidden lg:static fixed inset-y-0 right-0 transform lg:translate-x-0 translate-x-full transition-transform duration-300 ease-in-out z-[100]" id="import-summary">
        <div className="lg:hidden flex items-center p-4 border-b border-slate-100 bg-indigo-600 text-white gap-3">
          <button onClick={() => document.getElementById('import-summary')?.classList.add('translate-x-full')}>
            <ArrowLeft size={24} />
          </button>
          <h3 className="font-bold flex-1">Tổng kết nhập hàng</h3>
        </div>
        {/* Supplier Search */}
        <div className="p-4 border-b border-slate-100">
          {!selectedSupplier ? (
            <div className="relative">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-all">
                <input 
                  type="text" 
                  placeholder="Tìm nhà cung cấp" 
                  className="flex-1 bg-transparent text-sm outline-none font-medium" 
                  onChange={(e) => handleSupplierSearch(e.target.value)}
                />
                <Plus 
                  className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" 
                  size={20} 
                  onClick={() => setIsSupplierModalOpen(true)}
                />
              </div>
              {supplierSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[60] bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-[200px] overflow-y-auto">
                  {supplierSuggestions.map(s => (
                    <div 
                      key={s.phone} 
                      onClick={() => {
                        setSelectedSupplier(s);
                        setSupplierSuggestions([]);
                      }}
                      className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center"
                    >
                      <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      <span className="text-xs text-slate-500 font-medium">{s.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100 animate-in fade-in slide-in-from-top-1">
              <div>
                <p className="text-sm font-bold text-blue-800">{selectedSupplier.name}</p>
                <p className="text-xs text-blue-500 font-medium mt-0.5">{selectedSupplier.phone}</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Summary Fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Mã phiếu nhập</span>
            <input 
              type="text" 
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="w-48 text-right border-b border-slate-200 bg-transparent px-1 py-1 text-sm font-semibold outline-none focus:border-blue-500 placeholder:text-slate-300" 
              placeholder="Mã phiếu tự động"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Mã đặt hàng nhập</span>
            <span className="text-sm font-semibold text-slate-400 italic">Chưa chọn</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Trạng thái</span>
            <span className="text-sm font-bold text-slate-800">Phiếu tạm</span>
          </div>
          
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-600">Tổng tiền hàng</span>
                <Info size={14} className="text-slate-300 cursor-help" />
              </div>
              <span className="text-sm font-bold text-slate-800">{formatNumber(totalGoods)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Giảm giá</span>
              <input 
                type="text" 
                value={formatNumber(overallDiscount)}
                onChange={(e) => setOverallDiscount(parseFormattedNumber(e.target.value))}
                className="w-32 text-right border border-slate-200 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Chi phí nhập trả NCC</span>
              <input 
                type="text" 
                value={formatNumber(returnCost)}
                onChange={(e) => setReturnCost(parseFormattedNumber(e.target.value))}
                className="w-32 text-right border border-slate-200 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500 text-blue-600" 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Phí vận chuyển</span>
              <input 
                type="text" 
                value={formatNumber(shippingFee)}
                onChange={(e) => setShippingFee(parseFormattedNumber(e.target.value))}
                className="w-32 text-right border border-slate-200 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500 text-orange-600" 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Cần trả nhà cung cấp</span>
              <span className="text-base font-bold text-blue-600">{formatNumber(finalTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Đã thanh toán</span>
              <input 
                type="text" 
                value={formatNumber(paidAmount)}
                onChange={(e) => setPaidAmount(parseFormattedNumber(e.target.value))}
                className="w-32 text-right border border-slate-200 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-sm font-bold text-red-600">Còn nợ NCC</span>
              <span className="text-base font-bold text-red-600">{formatNumber(finalTotal - paidAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-600">Chi phí nhập khác</span>
                <ArrowRight size={14} className="text-blue-500 cursor-pointer" />
              </div>
              <span className="text-sm font-bold text-blue-600">0</span>
            </div>
          </div>

          <div className="pt-4">
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all h-24 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50">
          <button className="py-3 px-4 rounded-xl font-bold text-sm text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 transition-all active:scale-95 shadow-sm">
            Lưu tạm
          </button>
          <button 
            onClick={handleImportClick}
            disabled={isSubmitting}
            className={`py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-200'}`}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Hoàn thành'}
          </button>
        </div>
      </div>
    </div>

      {/* Mobile Summary Toggle */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng nhập ({cart.length})</span>
          <span className="text-lg font-bold text-indigo-600">{formatNumber(finalTotal)}đ</span>
        </div>
        <button 
          onClick={() => document.getElementById('import-summary')?.classList.remove('translate-x-full')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
        >
          Tổng kết <ChevronDown size={18} className="-rotate-90" />
        </button>
      </div>

      {/* Mobile Product Search Fullscreen */}
      {isMobileProductSearchOpen && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col md:hidden">
          <div className="flex items-center p-4 border-b border-slate-100 gap-3">
            <button onClick={() => setIsMobileProductSearchOpen(false)} className="text-slate-500">
              <X size={24} />
            </button>
            <div className="flex-1 flex items-center bg-slate-100 rounded-lg px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên, mã hàng, mã vạch..." 
                className="bg-transparent border-none outline-none flex-1 ml-2 text-sm font-medium" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(searchTerm.trim() ? productSuggestions : products.filter(p => !p.isService)).map(p => (
              <div 
                key={p.id} 
                onClick={() => {
                  addToCart(p);
                  setIsMobileProductSearchOpen(false);
                }}
                className="p-4 border-b border-slate-50 flex justify-between items-center cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Mã: {p.id} | Tồn: {p.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{formatNumber(p.price)}đ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Supplier Search Fullscreen */}
      {isMobileSupplierSearchOpen && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col md:hidden">
          <div className="flex items-center p-4 border-b border-slate-100 gap-3">
            <button onClick={() => setIsMobileSupplierSearchOpen(false)} className="text-slate-500">
              <X size={24} />
            </button>
            <div className="flex-1 flex items-center bg-slate-100 rounded-lg px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                autoFocus
                placeholder="Tìm nhà cung cấp..." 
                className="bg-transparent border-none outline-none flex-1 ml-2 text-sm font-medium" 
                onChange={(e) => setMobileSupplierSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => {
              setIsMobileSupplierSearchOpen(false);
              setIsSupplierModalOpen(true);
            }} className="text-blue-600">
              <Plus size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(mobileSupplierSearchTerm.trim() 
              ? suppliers.filter(s => s.name.toLowerCase().includes(mobileSupplierSearchTerm.toLowerCase()) || s.phone.includes(mobileSupplierSearchTerm))
              : suppliers
            ).map(s => (
              <div 
                key={s.phone} 
                onClick={() => {
                  setSelectedSupplier(s);
                  setIsMobileSupplierSearchOpen(false);
                }}
                className="p-4 border-b border-slate-50 flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-sm font-bold text-slate-800">{s.name}</span>
                <span className="text-xs text-slate-500">{s.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Checkout Modal */}
      {isMobileCheckoutOpen && (
        <div className="fixed inset-0 z-[500] bg-slate-50 flex flex-col md:hidden">
          <div className="flex items-center p-4 border-b border-slate-200 bg-white shadow-sm gap-3">
            <button onClick={() => setIsMobileCheckoutOpen(false)} className="text-slate-500">
              <ChevronDown size={24} className="rotate-90" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 flex-1">Thanh toán nhập hàng</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white p-4 mb-2 flex items-center gap-3 shadow-sm" onClick={() => {
              setIsMobileCheckoutOpen(false);
              setIsMobileSupplierSearchOpen(true);
            }}>
              <Truck size={24} className="text-slate-400" />
              <div className="flex-1">
                {selectedSupplier ? (
                  <span className="text-sm font-bold text-slate-800">{selectedSupplier.name} - {selectedSupplier.phone}</span>
                ) : (
                  <span className="text-sm font-bold text-red-500">Chọn nhà cung cấp</span>
                )}
              </div>
            </div>

            <div className="bg-white p-4 space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">Tổng tiền hàng</span>
                  <span className="w-5 h-5 rounded-full border border-blue-500 text-blue-600 flex items-center justify-center text-[10px] font-bold">{cart.length}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatNumber(totalGoods)}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">Giảm giá</span>
                <input 
                  type="text" 
                  value={formatNumber(overallDiscount)} 
                  onChange={(e) => setOverallDiscount(parseFormattedNumber(e.target.value))}
                  className="w-24 text-right bg-transparent text-sm font-bold outline-none text-slate-800" 
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">Cần trả NCC</span>
                <span className="text-lg font-bold text-blue-600">{formatNumber(finalTotal)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">Tiền trả NCC</span>
                <input 
                  type="text" 
                  value={formatNumber(paidAmount)}
                  onChange={(e) => setPaidAmount(parseFormattedNumber(e.target.value))}
                  className="w-32 text-right bg-transparent text-lg font-bold text-slate-800 outline-none" 
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => {
                setIsMobileCheckoutOpen(false);
                handleImportClick();
              }}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Thêm nhà cung cấp</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên nhà cung cấp</label>
                <input 
                  id="new-sup-name"
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all mt-1" 
                  placeholder="Nhập tên..." 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                <input 
                  id="new-sup-phone"
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-all mt-1" 
                  placeholder="Nhập số điện thoại..." 
                />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={() => {
                    const name = (document.getElementById('new-sup-name') as HTMLInputElement).value;
                    const phone = (document.getElementById('new-sup-phone') as HTMLInputElement).value;
                    if (name && phone) {
                      addSupplier({ name, phone });
                      setSelectedSupplier({ name, phone });
                      setIsSupplierModalOpen(false);
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md shadow-blue-200 text-sm active:scale-95 transition-all hover:bg-blue-700"
                >
                  Lưu thông tin
                </button>
                <button 
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Xác nhận nhập hàng</h3>
              <p className="text-slate-500 text-sm mb-6">Bạn có chắc chắn muốn hoàn thành phiếu nhập hàng này không?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đồng ý'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


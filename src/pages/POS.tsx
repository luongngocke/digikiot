import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, UserPlus, UserCircle, CheckCircle, X, Trash2, Printer, Barcode, ChevronDown, Edit3, PieChart, ShoppingCart, Tag, Image as ImageIcon, ArrowLeft, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Product, InvoiceItem, Customer, CashTransaction } from '../types';
import { formatNumber, parseFormattedNumber } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { PrintTemplate } from '../components/PrintTemplate';

export const POS: React.FC = () => {
  const navigate = useNavigate();
  const { products, customers, invoices, cashTransactions, addInvoice, addCustomer, updateProduct, serials, addStockCard, addCashTransaction, posDraft, setPOSDraft, returnSalesOrders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize from draft or defaults
  const [tabs, setTabs] = useState(() => {
    if (posDraft?.tabs && posDraft.tabs.length > 0) {
      return posDraft.tabs;
    }
    return [{ 
      id: 1, 
      name: 'Hóa đơn 1',
      cart: [],
      discount: 0,
      paid: '' as string,
      selectedCustomer: null as Customer | null,
      note: '',
      paymentMethod: 'CASH' as 'CASH' | 'TRANSFER' | 'CARD' | 'WALLET'
    }];
  });
  const [activeTab, setActiveTab] = useState(posDraft?.activeTab || 0);

  // Sync to draft
  useEffect(() => {
    setPOSDraft({ activeTab, tabs });
  }, [activeTab, tabs]);

  // Current tab helper
  const currentTab = tabs[activeTab] || tabs[0];
  const { cart, discount, paid, selectedCustomer, note, paymentMethod } = currentTab;

  // Setters for current tab
  const updateCurrentTab = (updates: Partial<typeof currentTab>) => {
    setTabs(prev => prev.map((t, i) => i === activeTab ? { ...t, ...updates } : t));
  };

  const setCart = (newCart: any) => {
    const nextCart = typeof newCart === 'function' ? newCart(cart) : newCart;
    updateCurrentTab({ cart: nextCart });
  };

  const setDiscount = (val: number) => updateCurrentTab({ discount: val });
  const setPaid = (val: string) => updateCurrentTab({ paid: val });
  const setSelectedCustomer = (val: Customer | null) => updateCurrentTab({ selectedCustomer: val });
  const setNote = (val: string) => updateCurrentTab({ note: val });
  const setPaymentMethod = (val: 'CASH' | 'TRANSFER' | 'CARD' | 'WALLET') => updateCurrentTab({ paymentMethod: val });

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isMobileCustomerSearchOpen, setIsMobileCustomerSearchOpen] = useState(false);
  const [isMobileProductSearchOpen, setIsMobileProductSearchOpen] = useState(false);
  const [isMobileCheckoutOpen, setIsMobileCheckoutOpen] = useState(false);
  const [mobileCustomerSearchTerm, setMobileCustomerSearchTerm] = useState('');
  const [activeSerialProduct, setActiveSerialProduct] = useState<Product | null>(null);
  
  // Quick Add Form State
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('');

  const { addProduct } = useAppContext();

  const handleQuickAdd = () => {
    if (!quickAddName || !quickAddPrice) return alert('Vui lòng nhập tên và giá!');
    
    const id = 'P' + Date.now().toString().slice(-4);
    const newProduct: Product = {
      id,
      name: quickAddName,
      price: parseFormattedNumber(quickAddPrice),
      importPrice: 0,
      stock: 0,
      hasSerial: false,
      isService: false,
      color: 'bg-blue-600'
    };
    
    addProduct(newProduct);
    addToCart(newProduct);
    setIsQuickAddModalOpen(false);
    setQuickAddName('');
    setQuickAddPrice('');
  };
  
  // Print State
  const [printData, setPrintData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<{id: string, total: number} | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  useEffect(() => {
    if (posDraft?.tabs && posDraft.tabs.some(t => t.cart.length > 0)) {
      setShowDraftPrompt(true);
    }
  }, []);

  const addTab = () => {
    const newId = tabs.length > 0 ? Math.max(...tabs.map(t => t.id)) + 1 : 1;
    const newTab = { 
      id: newId, 
      name: `Hóa đơn ${newId}`,
      cart: [],
      discount: 0,
      paid: '' as string,
      selectedCustomer: null,
      note: '',
      paymentMethod: 'CASH' as 'CASH' | 'TRANSFER' | 'CARD' | 'WALLET'
    };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  };

  const removeTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTab >= newTabs.length) setActiveTab(newTabs.length - 1);
  };

  const handlePrint = (data: any) => {
    setPrintData(data);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintData(null), 2000);
    }, 50);
  };

  // Search results
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = (products || []).filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProductSuggestions(filtered);
    } else {
      setProductSuggestions([]);
    }
  }, [searchTerm, products]);

  const handleCustomerSearch = (val: string) => {
    if (val.trim()) {
      const filtered = (customers || []).filter(c => 
        (c.name || '').toLowerCase().includes(val.toLowerCase()) || 
        (c.phone || '').includes(val)
      );
      setCustomerSuggestions(filtered);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const addToCart = (product: Product, sn?: string) => {
    if (!product.isService && product.stock !== null && product.stock <= 0 && !sn) {
      alert("Sản phẩm tạm hết hàng trong kho!");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (product.hasSerial) {
        if (!sn) {
          setActiveSerialProduct(product);
          setIsSerialModalOpen(true);
          return prev;
        }

        if (existing) {
          if (existing.serials?.includes(sn)) {
            alert("Serial đã chọn!");
            return prev;
          }
          return prev.map(item => item.id === product.id ? { 
            ...item, 
            qty: item.qty + 1, 
            serials: [...(item.serials || []), sn] 
          } : item);
        }

        return [...prev, { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          qty: 1, 
          hasSerial: true,
          serials: [sn],
          importPriceTotal: product.importPrice 
        }];
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }

      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        qty: 1, 
        importPriceTotal: product.importPrice 
      }];
    });
    
    setSearchTerm('');
    setProductSuggestions([]);
  };

  const updateQty = (id: string, qty: number) => {
    const product = products.find(p => p.id === id);
    if (product?.hasSerial) return;
    if (qty < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
  };

  const updatePrice = (id: string, price: number) => {
    if (price < 0) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, price } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const removeSerialFromItem = (prodId: string, sn: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === prodId) {
        const newSerials = item.serials?.filter(s => s !== sn) || [];
        if (newSerials.length === 0) return null as any;
        return { ...item, qty: newSerials.length, serials: newSerials };
      }
      return item;
    }).filter(Boolean));
  };

  const totalGoods = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = Math.max(0, totalGoods - discount);
  const paidAmount = parseFormattedNumber(paid);
  const debt = paidAmount - finalTotal;

  const handleCheckout = async (autoPrint: boolean = false) => {
    if (cart.length === 0) return alert('Giỏ hàng trống!');
    
    const now = new Date();
    const invoiceId = generateId('HD', invoices);
    const dateStr = now.toLocaleString('vi-VN');
    const customerName = selectedCustomer ? selectedCustomer.name : 'Khách lẻ';

    const invoice = {
      id: invoiceId,
      date: dateStr,
      customer: customerName,
      phone: selectedCustomer ? selectedCustomer.phone : '---',
      address: selectedCustomer?.address || '',
      total: finalTotal,
      paid: paidAmount,
      debt: debt < 0 ? Math.abs(debt) : 0,
      discount: discount,
      items: cart.map(item => {
        const p = products.find(prod => prod.id === item.id);
        let warrantyExpiry = undefined;
        if (p?.warrantyMonths) {
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + p.warrantyMonths);
          warrantyExpiry = expiryDate.toLocaleDateString('vi-VN');
        }
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          sn: item.serials?.join(', '),
          importPriceTotal: item.importPriceTotal ? item.importPriceTotal * item.qty : 0,
          warrantyExpiry
        };
      })
    };

    // Update stock and add stock cards
    for (const item of cart) {
      const p = products.find(x => x.id === item.id);
      if (p && !p.isService) {
        updateProduct(item.id, { stock: (p.stock || 0) - item.qty }, true);
      }
    }

    // Record Cash Transaction if paid > 0
    if (invoice.paid > 0) {
      const transactionId = generateId('PT', cashTransactions);
      const newTransaction: CashTransaction = {
        id: transactionId,
        date: dateStr,
        type: 'RECEIPT',
        amount: invoice.paid,
        category: 'SALES_REVENUE',
        partner: customerName,
        note: `Thu tiền hóa đơn ${invoiceId}`,
        refId: invoiceId
      };
      addCashTransaction(newTransaction);
    }

    const savedInvoice = await addInvoice(invoice);
    
    if (autoPrint && savedInvoice) {
      handlePrint({
        title: 'HÓA ĐƠN BÁN HÀNG',
        id: savedInvoice.id,
        date: savedInvoice.date,
        partner: savedInvoice.customer,
        phone: savedInvoice.phone,
        address: savedInvoice.address || selectedCustomer?.address || '',
        items: savedInvoice.items.map(i => ({ ...i, total: i.qty * i.price })),
        total: savedInvoice.total,
        paid: savedInvoice.paid,
        debt: savedInvoice.debt || 0,
        oldDebt: savedInvoice.oldDebt || 0,
        discount: savedInvoice.discount || 0,
        type: 'HOA_DON'
      });
    }

    setCart([]);
    setDiscount(0);
    setPaid('');
    setSelectedCustomer(null);
    setNote('');
    setPaymentMethod('CASH');
    setIsMobileCheckoutOpen(false);
    
    setShowSuccessModal({ id: invoiceId, total: invoice.total });
  };

  const handleSaveDraft = () => {
    setPOSDraft({ activeTab, tabs });
    alert("Đã lưu tạm đơn hàng!");
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 font-sans overflow-hidden">
      {/* Print Template Container */}
      {printData && <PrintTemplate {...printData} />}

      {/* Draft Prompt Modal */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Đơn hàng chưa hoàn thành</h3>
            <p className="text-slate-500 mb-6 text-sm">Có một đơn hàng chưa hoàn thành, bạn có muốn tiếp tục không?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setTabs([{ 
                    id: 1, 
                    name: 'Hóa đơn 1',
                    cart: [],
                    discount: 0,
                    paid: '',
                    selectedCustomer: null,
                    note: '',
                    paymentMethod: 'CASH'
                  }]);
                  setActiveTab(0);
                  setPOSDraft(null);
                  setShowDraftPrompt(false);
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50"
              >
                Bỏ qua
              </button>
              <button 
                onClick={() => setShowDraftPrompt(false)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header Bar */}
      <div className="hidden md:flex bg-blue-600 h-14 md:h-12 items-center px-4 gap-2 md:gap-4 shrink-0 shadow-md z-20">
        <div className="flex-1 md:w-[400px] md:flex-none relative">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-blue-400 shadow-inner">
            <Search className="text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm hàng (F3)" 
              className="flex-1 bg-transparent text-sm outline-none font-medium"
            />
            <Barcode className="text-blue-500 hidden sm:block" size={18} />
          </div>
          {productSuggestions.length > 0 ? (
            <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-[400px] overflow-y-auto">
              {productSuggestions.map((p, idx) => (
                <div 
                  key={`${p.id}-${idx}`} 
                  onClick={() => addToCart(p)}
                  className="p-3 border-b border-slate-50 hover:bg-blue-50 flex justify-between items-center cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mã: {p.id} | Tồn: {p.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{formatNumber(p.price)}đ</p>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() && (
            <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 p-4 text-center">
              <p className="text-xs text-slate-500 mb-3">Không tìm thấy sản phẩm "{searchTerm}"</p>
              <button 
                onClick={() => {
                  setQuickAddName(searchTerm);
                  setIsQuickAddModalOpen(true);
                  setSearchTerm('');
                }}
                className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Thêm nhanh sản phẩm này
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center h-full overflow-x-auto no-scrollbar gap-0.5">
          <div className="flex items-center h-full gap-0.5">
            <div className="h-full flex items-center px-3 text-white/80 hover:bg-white/10 cursor-pointer">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 flex flex-col gap-0.5">
                  <div className="h-0.5 bg-current w-full"></div>
                  <div className="h-0.5 bg-current w-full"></div>
                </div>
              </div>
            </div>
            {tabs.map((tab, idx) => (
              <div 
                key={`${tab.id}-${idx}`}
                onClick={() => setActiveTab(idx)}
                className={`h-9 px-4 flex items-center gap-2 rounded-t-lg transition-all cursor-pointer text-xs font-bold relative group ${activeTab === idx ? 'bg-slate-100 text-blue-700' : 'text-white hover:bg-white/10'}`}
              >
                {tab.name}
                <X 
                  size={12} 
                  className={`opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ${activeTab === idx ? 'opacity-100' : ''}`} 
                  onClick={(e) => removeTab(tab.id, e)}
                />
              </div>
            ))}
            <button onClick={addTab} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer hover:bg-white/10 p-1.5 rounded">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-bold px-1 rounded-full">{cart.length}</span>
            </div>
            <Printer className="cursor-pointer hover:bg-white/10 p-1.5 rounded" size={20} />
            <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded">
              <span className="text-xs font-bold">vinba</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        {/* Main Cart Area */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-2 py-3 w-10"></th>
                    <th className="px-4 py-3">Mã hàng</th>
                    <th className="px-4 py-3">Tên hàng</th>
                    <th className="px-4 py-3 w-20 text-center">ĐVT</th>
                    <th className="px-4 py-3 w-32 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-20 text-center text-slate-400 italic text-sm">
                        Chưa có sản phẩm nào trong giỏ hàng
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <React.Fragment key={`${item.id}-${idx}`}>
                        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-2 py-4">
                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-600">{item.id}</td>
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold text-slate-800">{item.name}</p>
                            {item.hasSerial && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.serials?.map((sn, sIdx) => (
                                  <span key={`${sn}-${sIdx}`} className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                    {sn} <X size={10} className="cursor-pointer hover:text-red-200" onClick={() => removeSerialFromItem(item.id, sn)} />
                                  </span>
                                ))}
                                <button 
                                  onClick={() => {
                                    const p = products.find(x => x.id === item.id);
                                    if (p) {
                                      setActiveSerialProduct(p);
                                      setIsSerialModalOpen(true);
                                    }
                                  }}
                                  className="text-[9px] font-bold text-blue-600 hover:underline"
                                >
                                  Chọn IMEI
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-xs text-slate-500">Cái</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {!item.hasSerial ? (
                                <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                                  <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 bg-slate-50 flex items-center justify-center hover:bg-slate-100">-</button>
                                  <input 
                                    type="number" 
                                    value={item.qty} 
                                    onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                                    className="w-10 text-center text-xs font-bold outline-none"
                                  />
                                  <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 bg-slate-50 flex items-center justify-center hover:bg-slate-100">+</button>
                                </div>
                              ) : (
                                <span className="font-bold text-xs">{item.qty}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-xs font-bold text-slate-600">
                            <input 
                              type="text" 
                              value={formatNumber(item.price)}
                              onChange={(e) => updatePrice(item.id, parseFormattedNumber(e.target.value))}
                              className="w-24 text-right bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-bold text-slate-800">{formatNumber(item.price * item.qty)}</td>
                          <td className="px-4 py-4">
                            <button className="text-slate-300 hover:text-blue-500">
                              <Plus size={16} />
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Note Bar */}
          <div className="h-12 bg-white border-t border-slate-200 flex items-center px-4 gap-2 shrink-0">
            <div className="flex items-center gap-2 text-slate-400 w-full">
              <Edit3 size={16} />
              <input 
                type="text" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú đơn hàng" 
                className="flex-1 bg-transparent text-xs outline-none italic"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Checkout Panel */}
        <div className="w-full lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-xl z-10 lg:static fixed inset-y-0 right-0 transform lg:translate-x-0 translate-x-full transition-transform duration-300 ease-in-out" id="checkout-panel">
          <div className="lg:hidden flex items-center p-4 border-b border-slate-100 bg-blue-600 text-white gap-3">
            <button onClick={() => document.getElementById('checkout-panel')?.classList.add('translate-x-full')}>
              <ArrowLeft size={24} />
            </button>
            <h3 className="font-bold flex-1">Thanh toán</h3>
          </div>
          <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
            {/* Customer Selection */}
            <div className="flex flex-col gap-2">
              {!selectedCustomer ? (
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded border border-slate-200 focus-within:border-blue-400 transition-all">
                    <Search className="text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Tìm khách hàng (F4)" 
                      className="flex-1 bg-transparent text-xs outline-none font-medium" 
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                    />
                    <Plus className="text-blue-500 cursor-pointer" size={18} onClick={() => setIsCustomerModalOpen(true)} />
                  </div>
                  {customerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[110] bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-[200px] overflow-y-auto">
                      {customerSuggestions.map((c, idx) => (
                        <div 
                          key={`${c.id || c.phone}-${idx}`} 
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSuggestions([]);
                          }}
                          className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center"
                        >
                          <span className="text-xs font-bold text-slate-800">{c.name}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100 animate-in fade-in slide-in-from-top-1">
                  <div>
                    <p className="text-sm font-bold text-blue-800">{selectedCustomer.name}</p>
                    <p className="text-xs text-blue-500 font-medium mt-0.5">{selectedCustomer.phone}</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Pricing Details */}
            <div className="space-y-4 py-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Tổng tiền hàng</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{cart.length}</span>
                  <span className="text-sm font-bold text-slate-800">{formatNumber(totalGoods)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Giảm giá</span>
                <input 
                  type="text" 
                  value={formatNumber(discount)} 
                  onChange={(e) => setDiscount(parseFormattedNumber(e.target.value))}
                  className="w-24 text-right border-b border-slate-200 bg-transparent px-1 py-0.5 text-sm font-semibold outline-none focus:border-blue-500" 
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Mã coupon</span>
                <input 
                  type="text" 
                  placeholder="Nhập mã"
                  className="w-24 text-right border-b border-slate-200 bg-transparent px-1 py-0.5 text-sm font-semibold outline-none focus:border-blue-500 placeholder:font-normal placeholder:text-slate-300" 
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Thu khác</span>
                <span className="text-sm font-semibold text-slate-800">0</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-800">Khách cần trả</span>
                <span className="text-lg font-bold text-blue-600">{formatNumber(finalTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">Khách thanh toán</span>
                  <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-200">
                    <PieChart size={12} />
                  </div>
                </div>
                <input 
                  type="text" 
                  value={paid}
                  onChange={(e) => setPaid(formatNumber(parseFormattedNumber(e.target.value)))}
                  className="w-32 text-right border-b border-blue-500 bg-transparent px-1 py-0.5 text-lg font-bold text-blue-600 outline-none" 
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-wrap gap-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'CASH'} 
                  onChange={() => setPaymentMethod('CASH')}
                  className="w-4 h-4 text-blue-600 accent-blue-600"
                />
                <span className={`text-xs font-bold ${paymentMethod === 'CASH' ? 'text-slate-800' : 'text-slate-400'}`}>Tiền mặt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'TRANSFER'} 
                  onChange={() => setPaymentMethod('TRANSFER')}
                  className="w-4 h-4 text-blue-600 accent-blue-600"
                />
                <span className={`text-xs font-bold ${paymentMethod === 'TRANSFER' ? 'text-slate-800' : 'text-slate-400'}`}>Chuyển khoản</span>
              </label>
            </div>

            {/* Quick Payment Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[500000, 1000000, 2000000, 5000000].map(val => (
                <button 
                  key={val}
                  onClick={() => setPaid(formatNumber(val))}
                  className="py-1.5 border border-slate-200 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {formatNumber(val)}
                </button>
              ))}
              <button onClick={() => setPaid(formatNumber(finalTotal))} className="py-1.5 border border-blue-200 bg-blue-50 rounded text-[11px] font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
                Đúng số tiền
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto p-4 flex gap-2 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={() => handleCheckout(true)}
              className="flex-1 h-12 bg-slate-500 text-white font-semibold rounded shadow-md hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Printer size={18} /> <span className="hidden sm:inline">In</span>
            </button>
            <button onClick={() => handleCheckout(false)} className="flex-[3] h-12 bg-blue-600 text-white font-semibold rounded shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-lg">
              Thanh toán
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full bg-slate-50 relative">
        {/* Mobile Header */}
        <div className="flex items-center p-4 bg-white border-b border-slate-100 gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-500">
            <X size={24} />
          </button>
          <h1 className="flex-1 text-lg font-bold text-slate-800">Bán hàng</h1>
          <button className="text-slate-500">
            <Info size={24} />
          </button>
        </div>

        {/* Header: Search, Add, Barcode */}
        <div className="p-3 bg-white flex items-center gap-2 shadow-sm z-10">
          <div 
            className="flex-1 flex items-center bg-slate-100 rounded-lg px-3 py-2"
            onClick={() => setIsMobileProductSearchOpen(true)}
          >
            <Search size={18} className="text-slate-400" />
            <span className="text-slate-400 ml-2 text-sm font-medium">Tên, mã hàng, mã vạch...</span>
          </div>
          <button onClick={() => setIsQuickAddModalOpen(true)} className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
            <Plus size={20} />
          </button>
          <button className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
            <Barcode size={20} />
          </button>
        </div>

        {/* Customer List */}
        <div className="bg-white px-4 py-1 shadow-sm z-10">
          <div className="flex items-center justify-between py-3" onClick={() => setIsMobileCustomerSearchOpen(true)}>
            <div className="flex items-center gap-3">
              <UserCircle size={20} className="text-slate-400" />
              {selectedCustomer ? (
                <span className="text-sm font-medium text-slate-800">{selectedCustomer.name} - {selectedCustomer.phone}</span>
              ) : (
                <span className="text-sm font-medium text-red-500">Khách lẻ</span>
              )}
            </div>
            <ChevronDown size={18} className="text-slate-400" />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {cart.length === 0 ? (
            <div className="py-20 text-center text-slate-400 italic text-sm">
              Chưa có sản phẩm nào trong giỏ hàng
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="bg-white p-3 rounded-xl shadow-sm flex gap-3 relative">
                <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1">
                  <X size={16} />
                </button>
                <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center text-blue-200 shrink-0">
                  <ImageIcon size={24} />
                </div>
                <div className="flex-1 flex flex-col justify-between pr-6">
                  <div className="text-sm font-medium text-slate-800 leading-tight">{item.name}</div>
                  
                  {item.hasSerial && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.serials?.map((sn, sIdx) => (
                        <span key={`${sn}-${sIdx}`} className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                          IMEI {sn} <X size={10} onClick={() => removeSerialFromItem(item.id, sn)} className="cursor-pointer" />
                        </span>
                      ))}
                      <button 
                        onClick={() => {
                          const p = products.find(x => x.id === item.id);
                          if (p) {
                            setActiveSerialProduct(p);
                            setIsSerialModalOpen(true);
                          }
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        + Chọn IMEI
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm font-bold text-blue-600">
                      <input 
                        type="text" 
                        value={formatNumber(item.price)}
                        onChange={(e) => updatePrice(item.id, parseFormattedNumber(e.target.value))}
                        className="w-24 bg-transparent outline-none border-b border-dashed border-blue-300 focus:border-blue-600 text-blue-600"
                      />
                    </div>
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button className="w-8 h-8 flex items-center justify-center text-slate-500" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button className="w-8 h-8 flex items-center justify-center text-slate-500" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Bar */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Tổng tiền hàng</span>
                <span className="w-6 h-6 rounded-full border border-blue-500 text-blue-600 flex items-center justify-center text-xs font-bold">{cart.length}</span>
              </div>
              <span className="text-lg font-bold text-slate-800">{formatNumber(totalGoods)}</span>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border border-blue-600 text-blue-600 font-bold text-sm bg-white" onClick={handleSaveDraft}>Lưu tạm</button>
              <button className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm" onClick={() => setIsMobileCheckoutOpen(true)}>Thanh toán</button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Thành công!</h3>
            <p className="text-slate-500 mb-8 font-medium">Hóa đơn <span className="font-bold text-blue-600">{showSuccessModal.id}</span> đã được lưu vào hệ thống.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const inv = invoices.find(i => i.id === showSuccessModal.id);
                  if (inv) {
                    const customer = customers.find(c => (c.name === inv.customer && c.phone === inv.phone) || c.phone === inv.phone);
                    
                    // Old debt calculation
                    const customerInvoices = invoices.filter(i => 
                      i.customer === inv.customer && 
                      (new Date(i.date) < new Date(inv.date) || (i.date === inv.date && i.id < inv.id))
                    );
                    const customerReturns = (returnSalesOrders || []).filter(r => 
                      r.customer === inv.customer && 
                      new Date(r.date) < new Date(inv.date)
                    );
                    const calculatedOldDebt = customerInvoices.reduce((sum, i) => sum + i.debt, 0) - 
                                    customerReturns.reduce((sum, r) => sum + (r.total - r.paid), 0);
                    const oldDebt = inv.oldDebt !== undefined ? inv.oldDebt : calculatedOldDebt;

                    handlePrint({
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
                  }
                  setShowSuccessModal(null);
                }}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={20} /> In hóa đơn
              </button>
              <button 
                onClick={() => setShowSuccessModal(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Tiếp tục bán hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serial Selection Modal */}
      {isSerialModalOpen && activeSerialProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 tracking-tighter">Chọn IMEI/Serial</h3>
              <button onClick={() => setIsSerialModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-blue-600 mb-4 tracking-tighter">{activeSerialProduct.name}</p>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                {serials
                  .filter(s => s.prodId === activeSerialProduct.id && s.status !== 'SOLD' && !cart.find(item => item.id === activeSerialProduct.id)?.serials?.includes(s.sn))
                  .map((s, sIdx) => (
                    <button 
                      key={`${s.sn}-${sIdx}`}
                      onClick={() => {
                        addToCart(activeSerialProduct, s.sn);
                        setIsSerialModalOpen(false);
                      }}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 text-left transition-all flex justify-between items-center"
                    >
                      <span className="font-mono font-bold text-slate-800 text-xs">{s.sn}</span>
                      <Plus size={16} className="text-blue-600" />
                    </button>
                  ))
                }
                {serials.filter(s => s.prodId === activeSerialProduct.id && s.status !== 'SOLD' && !cart.find(item => item.id === activeSerialProduct.id)?.serials?.includes(s.sn)).length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-10 font-bold uppercase tracking-widest">Hết IMEI khả dụng trong kho</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Customer Search Fullscreen */}
      {isMobileCustomerSearchOpen && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col md:hidden">
          <div className="flex items-center p-4 border-b border-slate-100 gap-3">
            <button onClick={() => setIsMobileCustomerSearchOpen(false)} className="text-slate-500">
              <X size={24} />
            </button>
            <div className="flex-1 flex items-center bg-slate-100 rounded-lg px-3 py-2">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                autoFocus
                value={mobileCustomerSearchTerm}
                placeholder="Tìm khách hàng..." 
                className="bg-transparent border-none outline-none flex-1 ml-2 text-sm font-medium" 
                onChange={(e) => setMobileCustomerSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => {
              setIsMobileCustomerSearchOpen(false);
              setIsCustomerModalOpen(true);
            }} className="text-blue-600">
              <Plus size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div 
              onClick={() => {
                setSelectedCustomer(null);
                setIsMobileCustomerSearchOpen(false);
              }}
              className="p-4 border-b border-slate-50 flex items-center gap-3 cursor-pointer"
            >
              <UserCircle size={24} className="text-red-500" />
              <span className="text-sm font-bold text-red-500">Khách lẻ</span>
            </div>
            {(mobileCustomerSearchTerm.trim() 
              ? customers.filter(c => c.name.toLowerCase().includes(mobileCustomerSearchTerm.toLowerCase()) || c.phone.includes(mobileCustomerSearchTerm))
              : customers
            ).map(c => (
              <div 
                key={c.phone} 
                onClick={() => {
                  setSelectedCustomer(c);
                  setIsMobileCustomerSearchOpen(false);
                }}
                className="p-4 border-b border-slate-50 flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-sm font-bold text-slate-800">{c.name}</span>
                <span className="text-xs text-slate-500">{c.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {(searchTerm.trim() ? productSuggestions : products).map((p, idx) => (
              <div 
                key={`${p.id}-${idx}`} 
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
            {searchTerm && productSuggestions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 mb-4">Không tìm thấy sản phẩm "{searchTerm}"</p>
                <button 
                  onClick={() => {
                    setQuickAddName(searchTerm);
                    setIsQuickAddModalOpen(true);
                    setIsMobileProductSearchOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Thêm nhanh sản phẩm này
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Thêm khách hàng</h3>
            <div className="space-y-4">
              <input 
                id="new-cust-name"
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 shadow-inner" 
                placeholder="Tên khách hàng..." 
              />
              <input 
                id="new-cust-phone"
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 shadow-inner" 
                placeholder="Số điện thoại..." 
              />
              <input 
                id="new-cust-address"
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400 shadow-inner" 
                placeholder="Địa chỉ..." 
              />
              <button 
                onClick={() => {
                  const name = (document.getElementById('new-cust-name') as HTMLInputElement).value;
                  const phone = (document.getElementById('new-cust-phone') as HTMLInputElement).value;
                  const address = (document.getElementById('new-cust-address') as HTMLInputElement).value;
                  if (name && phone) {
                    addCustomer({ name, phone, address });
                    setSelectedCustomer({ name, phone, address });
                    setIsCustomerModalOpen(false);
                  }
                }}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold shadow-md shadow-blue-200 text-[11px] tracking-wide mt-2 active:scale-95 transition-all"
              >
                Lưu thông tin
              </button>
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-lg font-semibold text-[11px] tracking-wide mt-1"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Thêm nhanh sản phẩm</h3>
              <button onClick={() => setIsQuickAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm</label>
                <input 
                  type="text" 
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400" 
                  placeholder="Tên sản phẩm..." 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giá bán (đ)</label>
                <input 
                  type="text" 
                  value={quickAddPrice}
                  onChange={(e) => setQuickAddPrice(formatNumber(parseFormattedNumber(e.target.value)))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400" 
                  placeholder="0" 
                />
              </div>
              <button 
                onClick={handleQuickAdd}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 mt-2"
              >
                Lưu và Thêm vào giỏ
              </button>
            </div>
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
            <h2 className="text-lg font-bold text-slate-800 flex-1">Thanh toán</h2>
            <div className="flex gap-4 text-slate-500">
              <Printer size={20} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Customer Info */}
            <div className="bg-white p-4 mb-2 flex items-center gap-3 shadow-sm" onClick={() => {
              setIsMobileCheckoutOpen(false);
              setIsMobileCustomerSearchOpen(true);
            }}>
              <UserCircle size={24} className="text-slate-400" />
              <div className="flex-1">
                {selectedCustomer ? (
                  <span className="text-sm font-bold text-slate-800">{selectedCustomer.name} - {selectedCustomer.phone}</span>
                ) : (
                  <span className="text-sm font-bold text-red-500">Khách lẻ</span>
                )}
              </div>
            </div>

            {/* Cart summary */}
            <div className="bg-white p-4 mb-2 flex justify-between items-center shadow-sm" onClick={() => setIsMobileCheckoutOpen(false)}>
              <span className="text-sm font-bold text-slate-800">Xem hàng trong đơn</span>
              <ChevronDown size={20} className="-rotate-90 text-slate-400" />
            </div>

            {/* Payment Details */}
            <div className="bg-white p-4 space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">Tổng tiền hàng</span>
                  <span className="w-5 h-5 rounded-full border border-blue-500 text-blue-600 flex items-center justify-center text-[10px] font-bold">{cart.length}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatNumber(totalGoods)}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">Giảm giá (%)</span>
                <input 
                  type="text" 
                  value={formatNumber(discount)} 
                  onChange={(e) => setDiscount(parseFormattedNumber(e.target.value))}
                  className="w-24 text-right bg-transparent text-sm font-bold outline-none text-slate-800" 
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">Thu khác</span>
                <span className="text-sm font-bold text-slate-800">0</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-800">Khách cần trả</span>
                <span className="text-lg font-bold text-blue-600">{formatNumber(finalTotal)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800">Khách thanh toán</span>
                <input 
                  type="text" 
                  value={paid}
                  onChange={(e) => setPaid(formatNumber(parseFormattedNumber(e.target.value)))}
                  className="w-32 text-right bg-transparent text-lg font-bold text-slate-800 outline-none" 
                  placeholder="0"
                />
              </div>

              {/* Payment Methods */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                <button 
                  onClick={() => setPaymentMethod('CASH')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${paymentMethod === 'CASH' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-transparent'}`}
                >
                  Tiền mặt
                </button>
                <button 
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${paymentMethod === 'TRANSFER' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-transparent'}`}
                >
                  Chuyển khoản
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button 
              onClick={handleCheckout}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


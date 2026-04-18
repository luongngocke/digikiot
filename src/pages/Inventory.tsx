import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Box, Wrench, Barcode, X, ArrowDownLeft, ArrowUpRight, FileText, Calendar, User, Package, CreditCard, Truck, Star, Settings, HelpCircle, LayoutGrid, Download, Upload, ChevronDown, Filter, Edit3, Image as ImageIcon, RotateCcw, ExternalLink, Printer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Product, Invoice, ImportOrder, ReturnImportOrder, ReturnSalesOrder } from '../types';
import { formatNumber, parseFormattedNumber } from '../lib/utils';
import { generateId } from '../lib/idUtils';

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, stockCards, invoices, importOrders, serials, updateProduct, suppliers, setImportDraft, returnImportOrders, returnSalesOrders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<'stock' | 'serial'>('stock');
  
  // Detail modals for transactions
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingImport, setViewingImport] = useState<ImportOrder | null>(null);
  const [viewingReturnImport, setViewingReturnImport] = useState<ReturnImportOrder | null>(null);
  const [viewingReturnSales, setViewingReturnSales] = useState<ReturnSalesOrder | null>(null);

  // Serial filtering state
  const [serialSearchTerm, setSerialSearchTerm] = useState('');
  const [serialStatusTab, setSerialStatusTab] = useState<'ALL' | 'IN_STOCK' | 'SOLD'>('IN_STOCK');

  // Form state
  const [pType, setPType] = useState<'product' | 'service'>('product');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [hasSerial, setHasSerial] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [expectedOutOfStock, setExpectedOutOfStock] = useState('');

  const filteredProducts = (products || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!name || !price) {
      alert('Vui lòng nhập đủ tên và giá bán');
      return;
    }

    const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-emerald-500', 'bg-rose-500'];
    
    if (selectedProduct) {
      // Update existing product
      updateProduct(selectedProduct.id, {
        name,
        price: parseFormattedNumber(price),
        importPrice: parseFormattedNumber(cost) || 0,
        stock: pType === 'service' ? null : Number(stock) || 0,
        hasSerial: pType === 'service' ? false : hasSerial,
        isService: pType === 'service',
        warrantyMonths: Number(warrantyMonths) || 0,
        unit,
        category,
        brand,
        expectedOutOfStock
      });
    } else {
      // Add new product
      const prefix = pType === 'service' ? 'SV' : 'SP';
      const id = generateId(prefix, products);
      addProduct({
        id,
        name,
        price: parseFormattedNumber(price),
        importPrice: parseFormattedNumber(cost) || 0,
        stock: pType === 'service' ? null : Number(stock) || 0,
        hasSerial: pType === 'service' ? false : hasSerial,
        isService: pType === 'service',
        color: pType === 'service' ? 'bg-emerald-600' : colors[products.length % colors.length],
        warrantyMonths: Number(warrantyMonths) || 0,
        unit,
        category,
        brand,
        expectedOutOfStock
      });
    }

    setIsModalOpen(false);
    setSelectedProduct(null);
    setName('');
    setPrice('');
    setCost('');
    setStock('');
    setHasSerial(false);
    setWarrantyMonths('');
    setUnit('');
    setCategory('');
    setBrand('');
    setExpectedOutOfStock('');
  };

  const productStockHistory = useMemo(() => {
    if (!selectedProduct) return [];
    
    // Start with explicit stock cards
    let history = stockCards.filter(card => card.prodId === selectedProduct.id);
    
    // If history is empty, try to derive from imports and invoices
    if (history.length === 0) {
      const importHistory = importOrders.flatMap(order => 
        (order.items || []).filter(item => item.id === selectedProduct.id).map(item => ({
          prodId: item.id,
          type: 'NHAP' as const,
          qty: item.qty,
          partner: order.supplier,
          date: order.date,
          price: item.price,
          refId: order.id,
          sn: item.sn || []
        }))
      );
      
      const invoiceHistory = invoices.flatMap(inv => 
        (inv.items || []).filter(item => item.id === selectedProduct.id).map(item => ({
          prodId: item.id,
          type: 'XUAT' as const,
          qty: item.qty,
          partner: inv.customer,
          date: inv.date,
          price: item.price,
          refId: inv.id,
          sn: inv.sn ? inv.sn.split(',').map(s => s.trim()) : []
        }))
      );

      const returnImportHistory = returnImportOrders.flatMap(order => 
        (order.items || []).filter(item => item.id === selectedProduct.id).map(item => ({
          prodId: item.id,
          type: 'TRA_NHAP' as const,
          qty: item.qty,
          partner: order.supplier,
          date: order.date,
          price: item.price,
          refId: order.id,
          sn: item.sn || []
        }))
      );

      const returnSalesHistory = returnSalesOrders.flatMap(order => 
        (order.items || []).filter(item => item.id === selectedProduct.id).map(item => ({
          prodId: item.id,
          type: 'TRA_BAN' as const,
          qty: item.qty,
          partner: order.customer,
          date: order.date,
          price: item.price,
          refId: order.id,
          sn: item.sn ? (typeof item.sn === 'string' ? item.sn.split(',') : item.sn) : []
        }))
      );
      
      history = [...importHistory, ...invoiceHistory, ...returnImportHistory, ...returnSalesHistory];
    }
    
    return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedProduct, stockCards, importOrders, invoices, returnImportOrders, returnSalesOrders]);

  const handleRefClick = (refId: string) => {
    if (refId.startsWith('HD')) {
      const inv = invoices.find(i => i.id === refId);
      if (inv) setViewingInvoice(inv);
    } else if (refId.startsWith('NH')) {
      const imp = importOrders.find(i => i.id === refId);
      if (imp) setViewingImport(imp);
    } else if (refId.startsWith('THN')) {
      const ret = returnImportOrders.find(r => r.id === refId);
      if (ret) setViewingReturnImport(ret);
    } else if (refId.startsWith('THB')) {
      const ret = returnSalesOrders.find(r => r.id === refId);
      if (ret) setViewingReturnSales(ret);
    }
  };

  const handleOpenImport = (order: ImportOrder) => {
    const supplier = suppliers.find(s => s.name === order.supplier) || null;
    setImportDraft({
      cart: order.items.map(item => {
        const product = products.find(p => p.id === item.id);
        const snArray = typeof (item as any).sn === 'string' 
          ? (item as any).sn.split(',').map((s: string) => s.trim()).filter(Boolean) 
          : (Array.isArray(item.sn) ? item.sn : []);
        return {
          ...item,
          serials: snArray,
          hasSerial: product?.hasSerial || false
        };
      }) as any,
      selectedSupplier: supplier,
      paid: order.paid
    });
    navigate('/import');
  };

  const totalStock = filteredProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

  return (
    <div className="h-full flex flex-col bg-slate-50 md:bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 shrink-0 bg-white border-b border-slate-200">
        {/* Left: Search */}
        <div className="flex-1 max-w-md bg-slate-100 px-4 py-2 rounded-lg border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all flex items-center gap-3">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Theo mã, tên hàng" 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
          <Filter className="text-slate-400 cursor-pointer hover:text-blue-600" size={18} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <button 
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-blue-700 transition-all"
            >
              <Plus size={18} /> Tạo mới <ChevronDown size={16} />
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
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="md:hidden w-full px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold text-xs tracking-wide active:scale-95 transition-all hover:bg-blue-700"
          >
            <Plus size={16} /> Thêm mới
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
                <th className="p-3 w-10"></th>
                <th className="p-3 w-12"></th>
                <th className="p-3">Mã hàng</th>
                <th className="p-3">Tên hàng</th>
                <th className="p-3">ĐVT</th>
                <th className="p-3">Nhóm hàng</th>
                <th className="p-3">Thương hiệu</th>
                <th className="p-3 text-right">Giá bán</th>
                <th className="p-3 text-right">Giá vốn</th>
                <th className="p-3 text-right">Tồn kho</th>
                <th className="p-3 text-right">Khách đặt</th>
                <th className="p-3 text-right">Thời gian tạo</th>
                <th className="p-3 text-right">Dự kiến hết hàng</th>
              </tr>
              {/* Summary Row */}
              <tr className="bg-slate-50/50 text-slate-800 text-[13px] font-bold border-b border-slate-100">
                <td colSpan={7}></td>
                <td className="p-3 text-right">{formatNumber(totalStock)}</td>
                <td className="p-3 text-right">0</td>
                <td colSpan={2}></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => (
                <tr 
                  key={`${p.id}-${idx}`} 
                  onClick={() => { setSelectedProduct(p); setSerialStatusTab('IN_STOCK'); }}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer text-[13px] text-slate-600 group"
                >
                  <td className="p-3"><input type="checkbox" className="rounded border-slate-300" onClick={(e) => e.stopPropagation()} /></td>
                  <td className="p-3"><Star size={16} className="text-slate-300 group-hover:text-amber-400 transition-colors" /></td>
                  <td className="p-3">
                    <div className={`w-8 h-8 ${p.color} rounded flex items-center justify-center text-white shadow-sm`}>
                      {p.hasSerial ? <Barcode size={14} /> : (p.isService ? <Wrench size={14} /> : <ImageIcon size={14} />)}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-blue-600">{p.id}</td>
                  <td className="p-3 font-medium text-slate-800 max-w-xs truncate">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.unit || '---'}</td>
                  <td className="p-3 text-slate-500">{p.category || '---'}</td>
                  <td className="p-3 text-slate-500">{p.brand || '---'}</td>
                  <td className="p-3 text-right font-bold">{formatNumber(p.price)}</td>
                  <td className="p-3 text-right">{formatNumber(p.importPrice || 0)}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{p.stock ?? '---'}</td>
                  <td className="p-3 text-right">0</td>
                  <td className="p-3 text-right text-slate-400">11/02/2026 21:00</td>
                  <td className="p-3 text-right text-slate-400">{p.expectedOutOfStock || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="italic">Không tìm thấy hàng hóa nào</p>
            </div>
          )}
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {filteredProducts.length === 0 ? (
            <p className="text-center py-20 text-slate-400 italic text-sm">Chưa có sản phẩm trong kho.</p>
          ) : (
            filteredProducts.map((p, idx) => (
              <div 
                key={`${p.id}-${idx}`} 
                onClick={() => { setSelectedProduct(p); setSerialStatusTab('IN_STOCK'); }}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
              >
                <div className={`w-16 h-16 ${p.color} rounded-lg flex items-center justify-center text-white shadow-lg`}>
                  {p.hasSerial ? <Barcode size={24} /> : (p.isService ? <Wrench size={24} /> : <Box size={24} />)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {p.isService && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded">Dịch vụ</span>}
                  </div>
                  <p className="font-semibold text-sm text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-blue-600 font-semibold tracking-wide mt-1">{formatNumber(p.price)}đ</p>
                </div>
                <div className="text-right pl-2 border-l border-slate-100">
                  <p className="text-[8px] text-slate-400 font-bold tracking-widest mb-1">{p.isService ? 'Trạng thái' : 'Tồn kho'}</p>
                  <p className={`font-bold ${p.isService ? 'text-emerald-500 text-sm' : 'text-slate-800 text-xl'}`}>
                    {p.isService ? 'Sẵn sàng' : p.stock}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800">{selectedProduct.name}</h3>
                  <button 
                    onClick={() => {
                      setPType(selectedProduct.isService ? 'service' : 'product');
                      setName(selectedProduct.name);
                      setPrice(formatNumber(selectedProduct.price));
                      setCost(formatNumber(selectedProduct.importPrice || 0));
                      setStock(selectedProduct.stock?.toString() || '');
                      setHasSerial(selectedProduct.hasSerial || false);
                      setWarrantyMonths(selectedProduct.warrantyMonths?.toString() || '');
                      setUnit(selectedProduct.unit || '');
                      setCategory(selectedProduct.category || '');
                      setBrand(selectedProduct.brand || '');
                      setExpectedOutOfStock(selectedProduct.expectedOutOfStock || '');
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Edit3 size={14} /> Sửa
                  </button>
                </div>
                <p className="text-sm font-medium text-blue-600 mt-1">SKU: {selectedProduct.id}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tồn kho</p>
                  <p className="text-xl font-bold text-slate-800">
                    {selectedProduct.isService ? '---' : selectedProduct.stock}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Giá bán</p>
                  <p className="text-xl font-bold text-blue-600">{formatNumber(selectedProduct.price)}đ</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bảo hành</p>
                  <p className="text-xl font-bold text-slate-800">
                    {selectedProduct.warrantyMonths ? `${selectedProduct.warrantyMonths}T` : '---'}
                  </p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Đơn vị</p>
                  <p className="text-sm font-bold text-slate-700">{selectedProduct.unit || '---'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Nhóm hàng</p>
                  <p className="text-sm font-bold text-slate-700">{selectedProduct.category || '---'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Thương hiệu</p>
                  <p className="text-sm font-bold text-slate-700">{selectedProduct.brand || '---'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Dự kiến hết</p>
                  <p className="text-sm font-bold text-slate-700">{selectedProduct.expectedOutOfStock || '---'}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button 
                  onClick={() => setDetailTab('stock')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${detailTab === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Thẻ kho
                </button>
                <button 
                  onClick={() => setDetailTab('serial')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${detailTab === 'serial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Danh sách Serial
                </button>
              </div>
              
              <div className="space-y-4">
                {detailTab === 'stock' ? (
                  <div key="stock-tab" className="space-y-4">
                    {productStockHistory.length === 0 ? (
                      <p className="text-center py-12 text-slate-400 italic text-sm">
                        {selectedProduct.isService ? 'Dịch vụ không quản lý thẻ kho' : 'Sản phẩm chưa có giao dịch'}
                      </p>
                    ) : (
                      productStockHistory.map((h, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleRefClick(h.refId)}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${h.type === 'NHAP' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {h.type === 'NHAP' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{h.partner}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                              {h.date} | Mã: <span className="text-blue-600 font-bold hover:underline group-hover:underline">{h.refId}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              <span className={h.type === 'NHAP' ? 'text-green-600' : 'text-red-600'}>
                                {h.type === 'NHAP' ? '+' : '-'}{h.qty}
                              </span>
                              <span className="text-slate-400 font-normal ml-2">x {formatNumber(h.price || 0)}</span>
                            </p>
                          </div>
                        </div>
                    ))
                  )}
                </div>
              ) : (
                <div key="serial-tab" className="space-y-4">
                  {/* Serial Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={serialSearchTerm}
                        onChange={(e) => setSerialSearchTerm(e.target.value)}
                        placeholder="Tìm IMEI/Serial..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button 
                        onClick={() => setSerialStatusTab('ALL')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${serialStatusTab === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Tất cả
                      </button>
                      <button 
                        onClick={() => setSerialStatusTab('IN_STOCK')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${serialStatusTab === 'IN_STOCK' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Tồn kho
                      </button>
                      <button 
                        onClick={() => setSerialStatusTab('SOLD')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${serialStatusTab === 'SOLD' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Đã bán
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const filteredSerials = (serials || [])
                      .filter(s => s.prodId === selectedProduct.id)
                      .filter(s => {
                        if (serialStatusTab === 'IN_STOCK') return s.status !== 'SOLD';
                        if (serialStatusTab === 'SOLD') return s.status === 'SOLD';
                        return true;
                      })
                      .filter(s => (s.sn || '').toLowerCase().includes(serialSearchTerm.toLowerCase()));

                    if (filteredSerials.length === 0) {
                      return <p className="text-center py-12 text-slate-400 italic text-sm">Không tìm thấy serial nào</p>;
                    }

                    return filteredSerials.map((s, idx) => {
                      const relatedInvoice = s.status === 'SOLD' 
                        ? invoices.find(inv => inv.items.some(item => {
                            if (!item.sn) return false;
                            const sns = typeof item.sn === 'string' 
                              ? item.sn.split(',').map(x => x.trim()) 
                              : (Array.isArray(item.sn) ? item.sn : [String(item.sn)]);
                            return sns.includes(s.sn);
                          }))
                        : null;

                      return (
                        <div 
                          key={`${s.sn}-${idx}`} 
                          className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <Barcode size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-mono font-bold text-slate-700 flex items-center gap-2">
                                {s.sn}
                                {s.status === 'SOLD' ? (
                                  <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest">Đã bán</span>
                                ) : (
                                  <span className="bg-green-100 text-green-600 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest">Tồn kho</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase">
                                {s.supplier} - {s.date}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-600">Vốn: {formatNumber(selectedProduct.importPrice || 0)}đ</p>
                            <div className="flex flex-col items-end gap-1 mt-1">
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
                                <span>Nhập:</span>
                                <button 
                                  onClick={() => s.refId && handleRefClick(s.refId)}
                                  className="text-blue-600 font-bold hover:underline"
                                >
                                  {s.refId}
                                </button>
                              </div>
                              {relatedInvoice && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
                                  <span>Bán:</span>
                                  <button 
                                    onClick={() => handleRefClick(relatedInvoice.id)}
                                    className="text-emerald-600 font-bold hover:underline"
                                  >
                                    {relatedInvoice.id}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal (Shared) */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tighter uppercase">Chi tiết hóa đơn</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mã: {viewingInvoice.id}</p>
                </div>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="w-8 h-8 bg-white text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center shadow-sm border border-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-3">
                  <Calendar className="text-slate-400" size={18} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ngày lập phiếu</p>
                    <p className="text-xs font-black text-slate-800">{viewingInvoice.date}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-3">
                  <User className="text-slate-400" size={18} />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{viewingInvoice.customer}</p>
                  </div>
                </div>
              </div>
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Sản phẩm</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center">SL</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewingInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{item.name}</p>
                          {item.sn && <p className="text-[8px] text-orange-500 font-bold mt-0.5 font-mono uppercase">SN: {item.sn}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-black text-slate-600">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-xs font-black text-slate-800">{formatNumber(item.qty * (item.price || 0))}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-sm font-black text-blue-800 uppercase tracking-widest">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-blue-600 tracking-tighter">{formatNumber(viewingInvoice.total || 0)}đ</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setViewingInvoice(null)} className="w-full py-3 bg-blue-600 text-white font-black rounded-lg uppercase text-[10px] tracking-widest">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Detail Modal (Shared) */}
      {viewingImport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Chi Tiết Nhập Kho</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-500">{viewingImport.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    viewingImport.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {viewingImport.status === 'DONE' ? 'Hoàn thành' : 'Phiếu tạm'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingImport(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Supplier & Date Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase">{viewingImport.supplier}</span>
                <span className="text-xs text-slate-500">{viewingImport.date}</span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {viewingImport.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-800 uppercase">{item.name}</h4>
                      <span className="text-blue-600 font-bold">{formatNumber(item.price * item.qty)}đ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">SL: {item.qty}</span>
                      <span className="text-xs text-slate-400">Giá: {formatNumber(item.price)}đ</span>
                    </div>
                    {item.sn && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(typeof item.sn === 'string' ? item.sn.split(',') : item.sn).map((sn: string, sIdx: number) => (
                          <span key={`${sn}-${sIdx}`} className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded border border-orange-100">
                            {sn.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-500 mb-1">Vốn nhập:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(viewingImport.total || 0)}đ</p>
                    {viewingImport.debt > 0 && (
                      <p className="text-xs font-bold text-red-500 mt-1">Nợ NCC: {formatNumber(viewingImport.debt)}đ</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 grid grid-cols-3 gap-3">
              <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                <RotateCcw size={18} /> Trả hàng
              </button>
              <button 
                onClick={() => handleOpenImport(viewingImport)}
                className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={18} /> Mở phiếu
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md">
                <Printer size={18} /> In phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Import Detail Modal */}
      {viewingReturnImport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Chi Tiết Trả Hàng Nhập</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-500">{viewingReturnImport.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-red-100 text-red-700">
                    {viewingReturnImport.status === 'DONE' ? 'Hoàn thành' : 'Phiếu tạm'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingReturnImport(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase">{viewingReturnImport.supplier}</span>
                <span className="text-xs text-slate-500">{viewingReturnImport.date}</span>
              </div>

              <div className="space-y-3">
                {viewingReturnImport.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-800 uppercase">{item.name}</h4>
                      <span className="text-red-600 font-bold">{formatNumber(item.price * item.qty)}đ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">SL: {item.qty}</span>
                      <span className="text-xs text-slate-400">Giá: {formatNumber(item.price)}đ</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-500 mb-1">Tổng tiền trả:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{formatNumber(viewingReturnImport.total)}đ</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Đã nhận: {formatNumber(viewingReturnImport.received)}đ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button 
                onClick={() => setViewingReturnImport(null)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Sales Detail Modal */}
      {viewingReturnSales && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Chi Tiết Khách Trả Hàng</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-500">{viewingReturnSales.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-orange-100 text-orange-700">
                    {viewingReturnSales.status === 'DONE' ? 'Hoàn thành' : 'Phiếu tạm'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingReturnSales(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase">{viewingReturnSales.customer}</span>
                <span className="text-xs text-slate-500">{viewingReturnSales.date}</span>
              </div>

              <div className="space-y-3">
                {viewingReturnSales.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-800 uppercase">{item.name}</h4>
                      <span className="text-orange-600 font-bold">{formatNumber(item.price * item.qty)}đ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">SL: {item.qty}</span>
                      <span className="text-xs text-slate-400">Giá: {formatNumber(item.price)}đ</span>
                    </div>
                    {item.sn && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(typeof item.sn === 'string' ? item.sn.split(',') : item.sn).map((sn: string, sIdx: number) => (
                          <span key={sIdx} className="text-[8px] bg-white border border-slate-200 px-1 rounded text-slate-500 font-mono">
                            {sn.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-500 mb-1">Tổng tiền trả khách:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{formatNumber(viewingReturnSales.total)}đ</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Đã trả: {formatNumber(viewingReturnSales.paid)}đ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button 
                onClick={() => setViewingReturnSales(null)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Thêm mặt hàng</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-3 md:p-4 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-full shrink-0">
                <button 
                  onClick={() => setPType('product')}
                  className={`flex-1 text-center py-1 rounded-md transition-all font-semibold text-[10px] tracking-wide ${pType === 'product' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  Hàng hóa
                </button>
                <button 
                  onClick={() => setPType('service')}
                  className={`flex-1 text-center py-1 rounded-md transition-all font-semibold text-[10px] tracking-wide ${pType === 'service' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  Dịch vụ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1 uppercase">Tên hàng / Dịch vụ</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="VD: SSD SAMSUNG 1TB..." 
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1 uppercase">Giá bán lẻ (đ)</label>
                  <input 
                    type="text" 
                    value={price}
                    onChange={(e) => setPrice(formatNumber(parseFormattedNumber(e.target.value)))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1 uppercase">Giá vốn (đ)</label>
                  <input 
                    type="text" 
                    value={cost}
                    onChange={(e) => setCost(formatNumber(parseFormattedNumber(e.target.value)))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-blue-600 outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="0" 
                  />
                </div>

                {pType === 'product' && (
                  <>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tồn đầu kỳ</label>
                      <input 
                        type="number" 
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                        placeholder="0" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                      <div>
                        <p className="text-[9px] font-bold text-slate-700 uppercase">Quản lý Serial</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">IMEI, SN</p>
                      </div>
                      <button 
                        onClick={() => setHasSerial(!hasSerial)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${hasSerial ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${hasSerial ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bảo hành (tháng)</label>
                  <input 
                    type="number" 
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="0" 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="Cái, Bộ..." 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nhóm hàng</label>
                  <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="Linh kiện..." 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Thương hiệu</label>
                  <input 
                    type="text" 
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                    placeholder="Samsung, Dell..." 
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dự kiến hết hàng</label>
                  <input 
                    type="date" 
                    value={expectedOutOfStock}
                    onChange={(e) => setExpectedOutOfStock(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none mt-0.5 shadow-inner focus:border-blue-400" 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button 
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold shadow-md shadow-blue-200 tracking-wide active:scale-95 transition-all hover:bg-blue-700"
              >
                Lưu vào hệ thống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Box, Wrench, Barcode, X, ArrowDownLeft, ArrowUpRight, FileText, Calendar, User, Package, CreditCard, Truck, Star, Settings, HelpCircle, LayoutGrid, Download, Upload, ChevronDown, Filter, Edit3, Image as ImageIcon, RotateCcw, ExternalLink, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Product, Invoice, ImportOrder, ReturnImportOrder, ReturnSalesOrder } from '../types';
import { formatNumber, parseFormattedNumber } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { useScrollLock } from '../hooks/useScrollLock';
import { useMobileBackModal } from '../hooks/useMobileBackModal';
import { useEscapeKey } from '../hooks/useEscapeKey';

import { NumericFormat } from 'react-number-format';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ImageLibraryModal } from '../components/ImageLibraryModal';
import { AnimatePresence } from 'motion/react';

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, stockCards, invoices, importOrders, serials, updateProduct, suppliers, setImportDraft, returnImportOrders, returnSalesOrders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useMobileBackModal(isModalOpen, () => setIsModalOpen(false));
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  useMobileBackModal(!!selectedProduct, () => setSelectedProduct(null));
  
  const [detailTab, setDetailTab] = useState<'stock' | 'serial'>('stock');
  
  // Detail modals for transactions
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingImport, setViewingImport] = useState<ImportOrder | null>(null);
  const [viewingReturnImport, setViewingReturnImport] = useState<ReturnImportOrder | null>(null);
  const [viewingReturnSales, setViewingReturnSales] = useState<ReturnSalesOrder | null>(null);
  
  useMobileBackModal(!!viewingInvoice, () => setViewingInvoice(null));
  useMobileBackModal(!!viewingImport, () => setViewingImport(null));
  useMobileBackModal(!!viewingReturnImport, () => setViewingReturnImport(null));
  useMobileBackModal(!!viewingReturnSales, () => setViewingReturnSales(null));
  
  // Use scroll lock for all modals in Inventory
  useScrollLock(isModalOpen || !!selectedProduct || !!viewingInvoice || !!viewingInvoice || !!viewingReturnImport || !!viewingReturnSales);

  const hasChanges = () => {
    if (selectedProduct) {
      return (
        name !== selectedProduct.name ||
        pType !== (selectedProduct.isService ? 'service' : 'product') ||
        parseFormattedNumber(price) !== selectedProduct.price ||
        parseFormattedNumber(cost) !== (selectedProduct.importPrice || 0) ||
        stock !== (selectedProduct.stock?.toString() || '') ||
        hasSerial !== (selectedProduct.hasSerial || false) ||
        warrantyMonths !== (selectedProduct.warrantyMonths?.toString() || '') ||
        unit !== (selectedProduct.unit || '') ||
        category !== (selectedProduct.category || '') ||
        brand !== (selectedProduct.brand || '') ||
        expectedOutOfStock !== (selectedProduct.expectedOutOfStock || '') ||
        image !== selectedProduct.image
      );
    }
    return (
      name !== '' ||
      price !== '' ||
      cost !== '' ||
      stock !== '' ||
      unit !== '' ||
      category !== '' ||
      brand !== '' ||
      image !== undefined
    );
  };

  const handleCloseModal = () => {
    if (hasChanges()) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng mà không lưu không?')) {
        setIsModalOpen(false);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  // Handle Escape key to close modals in layers
  useEscapeKey(() => setViewingReturnSales(null), !!viewingReturnSales);
  useEscapeKey(() => setViewingReturnImport(null), !!viewingReturnImport);
  useEscapeKey(() => setViewingImport(null), !!viewingImport);
  useEscapeKey(() => setViewingInvoice(null), !!viewingInvoice);
  useEscapeKey(() => setSelectedProduct(null), !!selectedProduct);
  useEscapeKey(handleCloseModal, isModalOpen);

  // Serial filtering state
  const [serialSearchTerm, setSerialSearchTerm] = useState('');
  const [serialStatusTab, setSerialStatusTab] = useState<'ALL' | 'IN_STOCK' | 'SOLD'>('IN_STOCK');

  // Form state
  const [pType, setPType] = useState<'product' | 'service'>('product');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
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
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products || [];
    return (products || []).filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const resetForm = () => {
    setPType('product');
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
    setImage(undefined);
  };

  const handleSave = () => {
    if (!name || !price) {
      alert('Vui lòng nhập đủ tên và giá bán');
      return;
    }

    const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-emerald-500', 'bg-rose-500'];
    
    if (selectedProduct) {
      // Update existing product - background API call
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
        expectedOutOfStock,
        image
      });
    } else {
      // Add new product - background API call
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
        expectedOutOfStock,
        image
      });
    }

    // Close Edit Modal
    setIsModalOpen(false);

    // If we're editing, update the selectedProduct state so the detail modal stays open with updated info
    if (selectedProduct) {
      setSelectedProduct({
        ...selectedProduct,
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
        expectedOutOfStock,
        image
      });
    } else {
      setSelectedProduct(null);
    }

    // Reset form
    resetForm();
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
      paid: order.paid,
      isExplicitIntent: true
    });
    navigate('/import');
  };

  const totalStock = filteredProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

  return (
    <div className="flex flex-col bg-slate-50 md:bg-white">
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
        <div className="flex items-center gap-2 hidden md:flex">
          <div className="flex items-center gap-2 mr-2">
            <button 
              onClick={() => {
                setSelectedProduct(null);
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm flex items-center gap-2 font-bold text-sm hover:bg-blue-700 transition-all"
            >
              <Plus size={18} /> Tạo mới
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden md:block flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <tr className="text-slate-700 text-sm font-bold">
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
              {paginatedProducts.map((p, idx) => (
                <tr 
                  key={`${p.id}-${idx}`} 
                  onClick={() => { setSelectedProduct(p); setSerialStatusTab('IN_STOCK'); }}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer text-[13px] text-slate-600 group"
                >
                  <td className="p-3"><input type="checkbox" className="rounded border-slate-300" onClick={(e) => e.stopPropagation()} /></td>
                  <td className="p-3"><Star size={16} className="text-slate-300 group-hover:text-amber-400 transition-colors" /></td>
                  <td className="p-3">
                    <div className={`w-8 h-8 ${p.color} rounded flex items-center justify-center text-white shadow-sm overflow-hidden`}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        p.hasSerial ? <Barcode size={14} /> : (p.isService ? <Wrench size={14} /> : <ImageIcon size={14} />)
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-blue-600">{p.id}</td>
                  <td className="p-3 font-medium text-slate-800 max-w-xs">{p.name}</td>
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
            paginatedProducts.map((p, idx) => (
              <div 
                key={`${p.id}-${idx}`} 
                onClick={() => { setSelectedProduct(p); setSerialStatusTab('IN_STOCK'); }}
                className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 sm:gap-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${p.color} rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0`}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    p.hasSerial ? <Barcode size={24} /> : (p.isService ? <Wrench size={24} /> : <Box size={24} />)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {p.isService && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded">Dịch vụ</span>}
                  </div>
                  <p className="font-semibold text-sm text-slate-800 break-words leading-tight">{p.name}</p>
                  <p className="text-[10px] text-blue-600 font-semibold tracking-wide mt-1">{formatNumber(p.price)}đ</p>
                </div>
                <div className="text-right pl-3 border-l border-slate-100 shrink-0 min-w-[65px]">
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest mb-1">{p.isService ? 'Trạng thái' : 'Tồn kho'}</p>
                  <p className={`font-bold ${p.isService ? 'text-emerald-500 text-xs sm:text-sm' : 'text-slate-800 text-lg sm:text-xl'}`}>
                    {p.isService ? 'Sẵn sàng' : p.stock}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
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
                {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} trên tổng {filteredProducts.length}
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={(p) => {
            setPType(p.isService ? 'service' : 'product');
            setName(p.name);
            setPrice(p.price.toString());
            setCost((p.importPrice || 0).toString());
            setStock(p.stock?.toString() || '');
            setHasSerial(p.hasSerial || false);
            setWarrantyMonths(p.warrantyMonths?.toString() || '');
            setUnit(p.unit || '');
            setCategory(p.category || '');
            setBrand(p.brand || '');
            setExpectedOutOfStock(p.expectedOutOfStock || '');
            setImage(p.image);
            setIsModalOpen(true);
          }}
          onRefClick={handleRefClick}
        />
      )}

      {/* Invoice Detail Modal (Shared) */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl md:rounded-xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
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
              <button onClick={() => setViewingInvoice(null)} className="w-full py-3 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Detail Modal (Shared) */}
      {viewingImport && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl md:rounded-xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
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
            <div className="p-6 border-t border-slate-100 grid grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50/50 shrink-0">
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
              <button 
                onClick={() => setViewingImport(null)}
                className="col-span-3 md:col-span-1 py-2.5 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] shadow-lg shadow-red-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Import Detail Modal */}
      {viewingReturnImport && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl md:rounded-xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
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

            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button 
                onClick={() => setViewingReturnImport(null)}
                className="w-full py-3 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] transition-colors shadow-lg shadow-red-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Sales Detail Modal */}
      {viewingReturnSales && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl md:rounded-xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
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

            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button 
                onClick={() => setViewingReturnSales(null)}
                className="w-full py-3 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] transition-colors shadow-lg shadow-red-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl md:rounded-xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:max-h-[95vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{selectedProduct ? 'Cập nhật mặt hàng' : 'Thêm mặt hàng'}</h3>
              <button onClick={handleCloseModal} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Image URL Row */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className={`w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white bg-white shadow-sm relative group`}>
                  {image && !image.startsWith('data:') ? (
                    <>
                      <img src={image} alt="Product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setImage(undefined)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-medium text-slate-500">Link ảnh sản phẩm</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={image || ''}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Dán link ảnh tại đây..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400 shadow-sm"
                      />
                      <ExternalLink size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    </div>
                    <button 
                      onClick={() => setIsLibraryOpen(true)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={14} /> Chọn ảnh
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Nhập địa chỉ URL hoặc chọn ảnh từ thư viện Drive.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-xl w-full shrink-0">
                <button 
                  onClick={() => setPType('product')}
                  className={`flex-1 text-center py-2 rounded-lg transition-all font-bold text-sm ${pType === 'product' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Hàng hóa
                </button>
                <button 
                  onClick={() => setPType('service')}
                  className={`flex-1 text-center py-2 rounded-lg transition-all font-bold text-sm ${pType === 'service' ? 'bg-emerald-600 shadow-md text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Dịch vụ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-500 ml-1">Tên hàng / dịch vụ</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="VD: SSD SAMSUNG 1TB..." 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Giá bán lẻ (đ)</label>
                  <NumericFormat 
                    value={price}
                    onValueChange={(values) => setPrice(values.value)}
                    thousandSeparator="."
                    decimalSeparator=","
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Giá vốn (đ)</label>
                  <NumericFormat 
                    value={cost}
                    onValueChange={(values) => setCost(values.value)}
                    thousandSeparator="."
                    decimalSeparator=","
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-blue-600 outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="0" 
                  />
                </div>

                {pType === 'product' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-500 ml-1">Tồn hàng ban đầu</label>
                      <input 
                        type="number" 
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                        placeholder="0" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm mt-1">
                      <div>
                        <p className="text-xs font-medium text-slate-700">Quản lý Serial / IMEI</p>
                        <p className="text-[10px] text-slate-400">Dùng cho sản phẩm có mã riêng</p>
                      </div>
                      <button 
                        onClick={() => setHasSerial(!hasSerial)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${hasSerial ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${hasSerial ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Thời gian bảo hành (tháng)</label>
                  <input 
                    type="number" 
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="0" 
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="Cái, Bộ..." 
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Nhóm hàng</label>
                  <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="Linh kiện..." 
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Thương hiệu</label>
                  <input 
                    type="text" 
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="Samsung, Dell..." 
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Dự kiến hết hàng</label>
                  <input 
                    type="date" 
                    value={expectedOutOfStock}
                    onChange={(e) => setExpectedOutOfStock(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none mt-1 focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0 flex gap-3">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 text-white py-3 md:py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all hover:bg-emerald-700 disabled:bg-slate-400 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {saveStatus || 'Đang xử lý...'}
                  </>
                ) : (
                  'Lưu'
                )}
              </button>
              <button 
                onClick={handleCloseModal}
                className="flex-1 py-3 md:py-4 bg-[#991b1b] text-white font-black rounded-lg uppercase text-[10px] tracking-widest hover:bg-[#7f1d1d] transition-colors active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB for Add */}
      <button 
        onClick={() => {
          setSelectedProduct(null);
          resetForm();
          setIsModalOpen(true);
        }}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      <AnimatePresence>
        {isLibraryOpen && (
          <ImageLibraryModal 
            onClose={() => setIsLibraryOpen(false)}
            onSelect={(url) => {
              setImage(url);
              setIsLibraryOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};



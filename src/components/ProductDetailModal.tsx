import React, { useState, useMemo, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Barcode, Search, Edit3, Image as ImageIcon, Wrench, Package } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Product, Invoice, ImportOrder, ReturnImportOrder, ReturnSalesOrder } from '../types';
import { formatNumber } from '../lib/utils';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onRefClick?: (refId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  onClose, 
  onEdit,
  onRefClick 
}) => {
  const { stockCards, invoices, importOrders, returnImportOrders, returnSalesOrders, serials } = useAppContext();
  
  const [detailTab, setDetailTab] = useState<'info' | 'stock' | 'serial'>('info');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [serialSearchTerm, setSerialSearchTerm] = useState('');
  const [serialStatusTab, setSerialStatusTab] = useState<'ALL' | 'IN_STOCK' | 'SOLD'>('IN_STOCK');

  const productStockHistory = useMemo(() => {
    // ... logic remains the same ...
    let history = stockCards.filter(card => card.prodId === product.id);
    
    if (history.length === 0) {
      const importHistory = importOrders.flatMap(order => 
        (order.items || []).filter(item => item.id === product.id).map(item => ({
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
        (inv.items || []).filter(item => item.id === product.id).map(item => ({
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
        (order.items || []).filter(item => item.id === product.id).map(item => ({
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
        (order.items || []).filter(item => item.id === product.id).map(item => ({
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
  }, [product, stockCards, importOrders, invoices, returnImportOrders, returnSalesOrders]);

  const stockStats = useMemo(() => {
    return productStockHistory.reduce((acc, curr) => {
      if (curr.type === 'NHAP' || curr.type === 'TRA_BAN') {
        acc.totalIn += curr.qty;
      } else if (curr.type === 'XUAT' || curr.type === 'TRA_NHAP') {
        acc.totalOut += curr.qty;
      }
      return acc;
    }, { totalIn: 0, totalOut: 0 });
  }, [productStockHistory]);

  const filteredHistory = useMemo(() => {
    if (stockFilter === 'ALL') return productStockHistory;
    if (stockFilter === 'IN') return productStockHistory.filter(h => h.type === 'NHAP' || h.type === 'TRA_BAN');
    if (stockFilter === 'OUT') return productStockHistory.filter(h => h.type === 'XUAT' || h.type === 'TRA_NHAP');
    return productStockHistory;
  }, [productStockHistory, stockFilter]);

  const filteredSerials = useMemo(() => {
    return (serials || [])
      .filter(s => s.prodId === product.id)
      .filter(s => {
        if (serialStatusTab === 'IN_STOCK') return s.status !== 'SOLD';
        if (serialStatusTab === 'SOLD') return s.status === 'SOLD';
        return true;
      })
      .filter(s => (s.sn || '').toLowerCase().includes(serialSearchTerm.toLowerCase()));
  }, [product, serials, serialStatusTab, serialSearchTerm]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center md:p-4 p-0 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl md:rounded-2xl rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-full md:h-auto md:max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{product.name}</h3>
            <p className="text-sm font-medium text-blue-600 mt-1">Mã: {product.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* Main Tabs Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setDetailTab('info')}
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${detailTab === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Thông tin
            </button>
            <button 
              onClick={() => setDetailTab('stock')}
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${detailTab === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Thẻ kho
            </button>
            {product.hasSerial && (
              <button 
                onClick={() => setDetailTab('serial')}
                className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${detailTab === 'serial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Danh sách Serial
              </button>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {detailTab === 'info' && (
              <div className="flex flex-col md:flex-row gap-6 mb-2">
                {/* Image section */}
                <div className="shrink-0 flex justify-center md:block">
                  <div className="w-32 h-32 md:w-64 md:h-64 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="text-slate-300" size={48} />
                    )}
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-[#f0fff4] px-4 py-3 rounded-xl border border-[#dcfce7] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Tồn kho</span>
                    <p className="text-xl font-black text-emerald-700 leading-none truncate">
                      {product.isService ? '---' : product.stock}
                    </p>
                  </div>
                  
                  <div className="bg-[#f0f7ff] px-4 py-3 rounded-xl border border-[#dbeafe] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Giá bán</span>
                    <p className="text-xl font-black text-blue-700 leading-none truncate">
                      {formatNumber(product.price)}<span className="text-xs ml-0.5">đ</span>
                    </p>
                  </div>

                  <div className="bg-[#fffaf0] px-4 py-3 rounded-xl border border-[#ffedd5] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Bảo hành</span>
                    <p className="text-sm font-black text-orange-700 leading-none truncate">
                      {product.warrantyMonths ? `${product.warrantyMonths} Tháng` : '---'}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đơn vị tính</span>
                    <p className="text-sm font-black text-slate-700 leading-none truncate">
                      {product.unit || '---'}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nhóm hàng</span>
                    <p className="text-sm font-black text-slate-700 leading-none truncate">
                      {product.category || '---'}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thương hiệu</span>
                    <p className="text-sm font-black text-slate-700 leading-none truncate">
                      {product.brand || '---'}
                    </p>
                  </div>

                  <div className="bg-[#f0fdfa] px-4 py-3 rounded-xl border border-[#ccfbf1] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Tổng nhập</span>
                    <p className="text-base font-black text-teal-700 leading-none truncate">
                      {stockStats.totalIn}
                    </p>
                  </div>

                  <div className="bg-[#fff5f5] px-4 py-3 rounded-xl border border-[#fee2e2] flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Tổng bán</span>
                    <p className="text-base font-black text-rose-700 leading-none truncate">
                      {stockStats.totalOut}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dự kiến hết</span>
                    <p className="text-sm font-black text-slate-700 leading-none truncate">
                      {product.expectedOutOfStock || '---'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'stock' && (
              <div key="stock-tab" className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="bg-white p-1 rounded-lg border border-slate-200 w-full md:w-auto flex">
                    <button 
                      onClick={() => setStockFilter('ALL')}
                      className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${stockFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Tất cả
                    </button>
                    <button 
                      onClick={() => setStockFilter('IN')}
                      className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${stockFilter === 'IN' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Nhập hàng
                    </button>
                    <button 
                      onClick={() => setStockFilter('OUT')}
                      className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${stockFilter === 'OUT' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Đã bán
                    </button>
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 italic text-sm">
                    {product.isService ? 'Dịch vụ không quản lý thẻ kho' : 'Sản phẩm chưa có giao dịch phù hợp'}
                  </p>
                ) : (
                  filteredHistory.map((h, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => onRefClick?.(h.refId)}
                      className={`flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group ${onRefClick ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${h.type === 'NHAP' || h.type === 'TRA_BAN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {h.type === 'NHAP' || h.type === 'TRA_BAN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
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
                          <span className={h.type === 'NHAP' || h.type === 'TRA_BAN' ? 'text-green-600' : 'text-red-600'}>
                            {h.type === 'NHAP' || h.type === 'TRA_BAN' ? '+' : '-'}{h.qty}
                          </span>
                          <span className="text-slate-400 font-normal ml-2">x {formatNumber(h.price || 0)}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'serial' && product.hasSerial && (
              <div key="serial-tab" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
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
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${serialStatusTab === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Tất cả
                    </button>
                    <button 
                      onClick={() => setSerialStatusTab('IN_STOCK')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${serialStatusTab === 'IN_STOCK' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Tồn kho
                    </button>
                    <button 
                      onClick={() => setSerialStatusTab('SOLD')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${serialStatusTab === 'SOLD' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Đã bán
                    </button>
                  </div>
                </div>

                {filteredSerials.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 italic text-sm">Không tìm thấy serial nào</p>
                ) : (
                  filteredSerials.map((s, idx) => (
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
                              <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded font-medium">Đã bán</span>
                            ) : (
                              <span className="bg-green-100 text-green-600 text-[9px] px-2 py-0.5 rounded font-medium">Tồn kho</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {s.supplier} - {s.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-600">Vốn: {formatNumber(product.importPrice || 0)}đ</p>
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
                            <span>Nhập:</span>
                            <button 
                              onClick={() => s.refId && onRefClick?.(s.refId)}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              {s.refId}
                            </button>
                          </div>
                          {s.status === 'SOLD' && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase">
                              <span>Xuất:</span>
                              {(() => {
                                const sale = invoices.find(inv => 
                                  inv.items.some(item => 
                                    item.id === product.id && 
                                    (item.sn || '').split(',').map(snPart => snPart.trim()).includes(s.sn)
                                  )
                                );
                                return sale ? (
                                  <button 
                                    onClick={() => onRefClick?.(sale.id)}
                                    className="text-emerald-600 font-bold hover:underline"
                                  >
                                    {sale.id}
                                  </button>
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 shrink-0 flex gap-4">
          {onEdit && (
            <button 
              onClick={() => onEdit(product)}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
            >
              <Edit3 size={16} /> Sửa mặt hàng
            </button>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl uppercase text-xs tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

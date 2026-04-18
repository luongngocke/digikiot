import React, { useState } from 'react';
import { Search, Save, Edit3, Tag, DollarSign, ArrowUpDown, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatNumber, parseFormattedNumber } from '../lib/utils';

export const PriceSettings: React.FC = () => {
  const { products, updateProduct } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrices, setEditingPrices] = useState<{[key: string]: {price: string, cost: string}}>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePriceChange = (id: string, field: 'price' | 'cost', rawValue: string) => {
    const numericValue = parseFormattedNumber(rawValue);
    const formattedValue = formatNumber(numericValue);
    
    const current = editingPrices[id] || { 
      price: formatNumber(products.find(p => p.id === id)?.price || 0),
      cost: formatNumber(products.find(p => p.id === id)?.importPrice || 0)
    };
    setEditingPrices({
      ...editingPrices,
      [id]: { ...current, [field]: formattedValue }
    });
  };

  const handleSaveAll = () => {
    Object.keys(editingPrices).forEach(id => {
      const values = editingPrices[id];
      updateProduct(id, {
        price: parseFormattedNumber(values.price),
        importPrice: parseFormattedNumber(values.cost)
      });
    });
    setEditingPrices({});
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col px-4 md:px-0 py-4 md:py-0">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 shrink-0">
        <div className="flex-1 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 focus-within:border-blue-400 transition-all">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm sản phẩm để thiết lập giá..." 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={Object.keys(editingPrices).length === 0}
          className={`w-full md:w-auto px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold text-xs tracking-wide transition-all ${Object.keys(editingPrices).length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          <Save size={16} /> Lưu tất cả thay đổi
        </button>
      </div>

      {showSuccess && (
        <div className="mb-4 p-3 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle size={18} />
          <span className="text-xs font-semibold tracking-wide">Đã cập nhật bảng giá thành công!</span>
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-6">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider w-1/3">Sản phẩm</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Giá vốn hiện tại</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Giá bán hiện tại</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Giá vốn mới</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Giá bán mới</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 italic text-sm">Không tìm thấy sản phẩm nào.</td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const draft = editingPrices[p.id];
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-xs text-slate-800 tracking-tight">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium tracking-wide mt-1">ID: {p.id}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-400">{formatNumber(p.importPrice)}đ</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-800">{formatNumber(p.price)}đ</span>
                      </td>
                      <td className="p-4">
                        <div className="relative max-w-[150px]">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <input 
                            type="text" 
                            value={draft?.cost ?? formatNumber(p.importPrice)}
                            onChange={(e) => handlePriceChange(p.id, 'cost', e.target.value)}
                            className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-semibold outline-none transition-all ${draft?.cost !== undefined ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 focus:border-blue-400'}`}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="relative max-w-[150px]">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <input 
                            type="text" 
                            value={draft?.price ?? formatNumber(p.price)}
                            onChange={(e) => handlePriceChange(p.id, 'price', e.target.value)}
                            className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-semibold outline-none transition-all ${draft?.price !== undefined ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 focus:border-blue-400'}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                Không tìm thấy sản phẩm nào
              </div>
            ) : (
              filteredProducts.map(p => {
                const draft = editingPrices[p.id];
                return (
                  <div key={p.id} className="p-4 space-y-4">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium tracking-wide">ID: {p.id}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Giá vốn mới</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <input 
                            type="text" 
                            value={draft?.cost ?? formatNumber(p.importPrice)}
                            onChange={(e) => handlePriceChange(p.id, 'cost', e.target.value)}
                            className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-semibold outline-none transition-all ${draft?.cost !== undefined ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 focus:border-blue-400'}`}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium italic">Hiện tại: {formatNumber(p.importPrice)}đ</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Giá bán mới</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <input 
                            type="text" 
                            value={draft?.price ?? formatNumber(p.price)}
                            onChange={(e) => handlePriceChange(p.id, 'price', e.target.value)}
                            className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-semibold outline-none transition-all ${draft?.price !== undefined ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 focus:border-blue-400'}`}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium italic">Hiện tại: {formatNumber(p.price)}đ</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

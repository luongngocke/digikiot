import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Wrench, Clock, CheckCircle, ArrowLeftRight, X, User, Phone, Tag, AlertCircle, ShoppingBag, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MaintenanceRecord } from '../types';
import { formatNumber, parseFormattedNumber } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { apiService } from '../services/api';

export const Maintenance: React.FC = () => {
  const { maintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, customers, invoices, externalSerials, addExternalSerial, currentUser } = useAppContext();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'repair') {
      setIsModalOpen(true);
    }
  }, [location.search]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [productName, setProductName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issue, setIssue] = useState('');
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');

  const [deviceSource, setDeviceSource] = useState<'STORE'|'EXTERNAL'>('STORE');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [storeDevices, setStoreDevices] = useState<any[]>([]);
  const [externalDeviceSearch, setExternalDeviceSearch] = useState('');
  const [externalDeviceSuggestions, setExternalDeviceSuggestions] = useState<any[]>([]);
  
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [newExtProduct, setNewExtProduct] = useState('');
  const [newExtSn, setNewExtSn] = useState('');
  const [newExtSource, setNewExtSource] = useState('');
  
  const [deviceWarrantyStatus, setDeviceWarrantyStatus] = useState<{isExpired: boolean, days: number, text: string} | null>(null);

  const filteredRecords = (maintenanceRecords || [])
    .filter(r => 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerPhone.includes(searchTerm) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = async () => {
    if (!customerName || !customerPhone || !productName || !issue) {
      alert('Vui lòng nhập đủ thông tin bắt buộc');
      return;
    }

    const now = new Date();
    const id = generateId('BH', maintenanceRecords);

    await addMaintenanceRecord({
      id,
      date: now.toLocaleString('vi-VN'),
      customerName,
      customerPhone,
      productName,
      serialNumber,
      issue,
      status: 'RECEIVING',
      cost: parseFormattedNumber(cost) || 0,
      note
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleAddExternalSerial = async () => {
    if (!newExtProduct) {
      alert('Vui lòng nhập tên sản phẩm.');
      return;
    }
    const payload = {
      id: generateId('EX', externalSerials || []),
      date: new Date().toLocaleString('vi-VN'),
      product: newExtProduct,
      sn: newExtSn,
      source: newExtSource,
      customer: customerName, // Link to current customer
      createdBy: currentUser?.name || 'Admin',
    };
    try {
      await addExternalSerial(payload);
      setExternalDeviceSearch(payload.product);
      setProductName(payload.product);
      setSerialNumber(payload.sn);
      setIsExternalModalOpen(false);
      setExternalDeviceSuggestions([]);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi thêm thiết bị.');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setProductName('');
    setSerialNumber('');
    setIssue('');
    setCost('');
    setNote('');
    setDeviceSource('STORE');
    setStoreDevices([]);
    setCustomerSuggestions([]);
    setDeviceWarrantyStatus(null);
    setExternalDeviceSearch('');
    setExternalDeviceSuggestions([]);
  };

  const handleCustomerChange = (val: string) => {
    setCustomerName(val);
    if (val.trim()) {
      setCustomerSuggestions(customers.filter(c => c.name.toLowerCase().includes(val.toLowerCase()) || (c.phone && c.phone.includes(val))));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handleSelectCustomer = (c: any) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerAddress(c.address || '');
    setCustomerSuggestions([]);
    
    // Load store devices
    const custInvoices = invoices.filter(inv => inv.customer === c.name || (c.phone && inv.phone === c.phone));
    let devs: any[] = [];
    custInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (item.sn) {
           const sns = Array.isArray(item.sn) ? item.sn : item.sn.split(',').map((s:string) => s.trim());
           sns.forEach((s:string) => {
             devs.push({ name: item.name, sn: s, date: inv.date, warrantyExpiry: item.warrantyExpiry });
           });
        } else {
           devs.push({ name: item.name, sn: '', date: inv.date, warrantyExpiry: item.warrantyExpiry });
        }
      });
    });
    setStoreDevices(devs);

    // Auto-fill external devices to suggestions if they exist for this customer
    const custExternalSerials = (externalSerials || []).filter(s => s.customer === c.name);
    if (custExternalSerials.length > 0) {
      setExternalDeviceSuggestions(custExternalSerials);
      setDeviceSource('EXTERNAL');
    }
  };

  const handleSerialNumberChange = (val: string) => {
    setSerialNumber(val);
    
    // Auto-complete if full exact match (opt-in automatic)
    if (val.trim()) {
      const matchedExternal = (externalSerials || []).find(s => s.sn.toLowerCase() === val.toLowerCase());
      if (matchedExternal) {
        setProductName(matchedExternal.product);
        setExternalDeviceSearch(matchedExternal.product);
        setDeviceSource('EXTERNAL');
      }
    }
  };

  const calculateWarranty = (expiryStr: string | undefined | null) => {
    if (!expiryStr) {
      setDeviceWarrantyStatus(null);
      return;
    }
    
    // Parse DD/MM/YYYY text
    const parts = expiryStr.split(/[\s,]+/);
    const datePart = parts.find(p => p.includes('/'));
    if (!datePart) {
      setDeviceWarrantyStatus(null);
      return;
    }
    
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) {
      setDeviceWarrantyStatus(null);
      return;
    }
    
    const expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
    const now = new Date();
    
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      setDeviceWarrantyStatus({
        isExpired: false,
        days: diffDays,
        text: `Còn bảo hành ${diffDays} ngày (đến ${expiryStr})`
      });
    } else {
      setDeviceWarrantyStatus({
        isExpired: true,
        days: Math.abs(diffDays),
        text: `Ngoài bảo hành (hết hạn ${expiryStr})`
      });
    }
  };

  const handleExternalSearch = (val: string) => {
    setExternalDeviceSearch(val);
    setProductName(val);
    if (val.trim()) {
      setExternalDeviceSuggestions((externalSerials || []).filter(s => 
        s.product.toLowerCase().includes(val.toLowerCase()) || 
        (s.sn && s.sn.toLowerCase().includes(val.toLowerCase()))
      ));
    } else {
      setExternalDeviceSuggestions([]);
    }
  };

  const handleSelectExternalDevice = (dev: any) => {
    setExternalDeviceSearch(dev.product);
    setProductName(dev.product);
    setSerialNumber(dev.sn || '');
    setExternalDeviceSuggestions([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVING': return 'bg-blue-100 text-blue-700';
      case 'REPAIRING': return 'bg-orange-100 text-orange-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'RETURNED': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVING': return 'Tiếp nhận';
      case 'REPAIRING': return 'Đang sửa';
      case 'COMPLETED': return 'Đã xong';
      case 'RETURNED': return 'Đã trả khách';
      default: return status;
    }
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
            placeholder="Tìm kiếm phiếu bảo hành/sửa chữa..." 
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold text-xs tracking-wide active:scale-95 transition-all hover:bg-blue-700"
        >
          <Plus size={16} /> Tiếp nhận máy
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Mã phiếu</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Khách hàng</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Thiết bị</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider">Tình trạng</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider text-center">Trạng thái</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 tracking-wider text-right">Chi phí</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic text-sm">Chưa có phiếu bảo hành nào.</td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr 
                    key={r.id} 
                    onClick={() => setSelectedRecord(r)}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <span className="font-semibold text-xs text-slate-800 tracking-tight">{r.id}</span>
                      <p className="text-[9px] text-slate-400 font-medium mt-1">{r.date}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-xs text-slate-800 tracking-tight">{r.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{r.customerPhone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-xs text-slate-800 tracking-tight">{r.productName}</p>
                      {r.serialNumber && <p className="text-[9px] text-orange-500 font-medium tracking-wide font-mono">SN: {r.serialNumber}</p>}
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-600 font-medium line-clamp-1">{r.issue}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wide ${getStatusColor(r.status)}`}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-sm text-slate-800">{formatNumber(r.cost)}đ</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic text-sm">Chưa có phiếu bảo hành nào.</div>
            ) : (
              filteredRecords.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedRecord(r)}
                  className="p-4 space-y-3 active:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-xs text-slate-800">{r.id}</span>
                      <p className="text-[10px] text-slate-400 font-medium">{r.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wide ${getStatusColor(r.status)}`}>
                      {getStatusText(r.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">{r.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{r.customerPhone}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-700">{r.productName}</p>
                    {r.serialNumber && <p className="text-[9px] text-orange-500 font-semibold font-mono mt-0.5">SN: {r.serialNumber}</p>}
                    <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 italic">"{r.issue}"</p>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dự kiến chi phí</span>
                    <span className="font-bold text-sm text-blue-600">{formatNumber(r.cost)}đ</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Tiếp nhận bảo hành / sửa chữa</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="relative">
                <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Tên khách hàng</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 shadow-inner focus:border-blue-400" 
                  placeholder="Nguyễn Văn A..." 
                />
                {customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {customerSuggestions.map((c, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectCustomer(c)}
                        className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.address}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-600">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 shadow-inner focus:border-blue-400" 
                    placeholder="090..." 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Địa chỉ</label>
                  <input 
                    type="text" 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none mt-1 shadow-inner focus:border-blue-400" 
                    placeholder="Địa chỉ khách hàng..." 
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="deviceSource" 
                      checked={deviceSource === 'STORE'}
                      onChange={() => setDeviceSource('STORE')}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><ShoppingBag size={14} className="text-slate-400" /> Đã mua tại shop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="deviceSource" 
                      checked={deviceSource === 'EXTERNAL'}
                      onChange={() => {
                        setDeviceSource('EXTERNAL');
                        setProductName('');
                        setSerialNumber('');
                      }}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Globe size={14} className="text-slate-400" /> Máy nơi khác</span>
                  </label>
                </div>

                {deviceSource === 'STORE' ? (
                  <div className="space-y-3">
                    {storeDevices.length > 0 ? (
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1 mb-1 block">Chọn máy đã mua</label>
                        <select 
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none shadow-sm focus:border-blue-400"
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const idx = parseInt(e.target.value);
                            const d = storeDevices[idx];
                            if (d) {
                               setProductName(d.name);
                               setSerialNumber(d.sn || '');
                               calculateWarranty(d.warrantyExpiry);
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>-- Chọn thiết bị trong lịch sử mua hàng --</option>
                          {storeDevices.map((d, idx) => (
                            <option key={idx} value={idx}>
                              {d.name} {d.sn && `(SN: ${d.sn})`} - Mua: {d.date.split(' ')[0]}
                            </option>
                          ))}
                        </select>

                        {deviceWarrantyStatus && (
                          <div className={`mt-3 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border ${deviceWarrantyStatus.isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                            {deviceWarrantyStatus.isExpired ? <AlertCircle size={16} className="text-red-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
                            <span>{deviceWarrantyStatus.text}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500 italic">
                        {customerName ? 'Khách hàng này chưa có lịch sử mua máy tại cửa hàng.' : 'Vui lòng chọn khách hàng để tra cứu lịch sử mua.'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Tên thiết bị ngoài</label>
                      <input 
                        type="text" 
                        value={externalDeviceSearch}
                        onFocus={() => {
                          if (!externalDeviceSearch) handleExternalSearch('');
                        }}
                        onChange={(e) => handleExternalSearch(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none shadow-sm focus:border-blue-400" 
                        placeholder="Tìm máy đã thêm hoặc nhập tên mới..." 
                      />
                      {(externalDeviceSuggestions.length > 0 || externalDeviceSearch) && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 flex flex-col overflow-hidden">
                          <div className="overflow-y-auto flex-1">
                            {externalDeviceSuggestions.map((dev, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => handleSelectExternalDevice(dev)}
                                className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <p className="text-sm font-bold text-slate-800">{dev.product}</p>
                                {dev.sn && <p className="text-[10px] text-slate-500 font-mono mt-0.5">SN: {dev.sn}</p>}
                                {dev.source && <p className="text-[10px] text-slate-400 mt-0.5">Nơi bán: {dev.source}</p>}
                              </div>
                            ))}
                          </div>
                          
                          <div 
                            onClick={() => {
                              setNewExtProduct(externalDeviceSearch);
                              setNewExtSn('');
                              setNewExtSource('');
                              setIsExternalModalOpen(true);
                              setExternalDeviceSuggestions([]);
                            }}
                            className="p-3 bg-blue-50 text-blue-700 font-bold text-sm text-center cursor-pointer hover:bg-blue-100 transition-colors border-t border-blue-100 flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Thêm mới thiết bị "{externalDeviceSearch || 'ngoài'}"
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Số Serial / IMEI (nếu có)</label>
                      <input 
                        type="text" 
                        value={serialNumber}
                        onChange={(e) => handleSerialNumberChange(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none shadow-sm focus:border-blue-400" 
                        placeholder="Nhập SN để tìm nhanh thiết bị ngoài..." 
                      />
                      {serialNumber && (externalSerials || []).filter(s => s.sn.toLowerCase().includes(serialNumber.toLowerCase()) && s.sn.toLowerCase() !== serialNumber.toLowerCase()).length > 0 && (
                         <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                            {(externalSerials || []).filter(s => s.sn.toLowerCase().includes(serialNumber.toLowerCase()) && s.sn.toLowerCase() !== serialNumber.toLowerCase()).map((dev, idx) => (
                               <div 
                                 key={idx} 
                                 onClick={() => {
                                    setSerialNumber(dev.sn);
                                    setProductName(dev.product);
                                    setExternalDeviceSearch(dev.product);
                                    setDeviceSource('EXTERNAL');
                                 }}
                                 className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                               >
                                 <p className="text-[11px] text-slate-500 font-mono font-bold">SN: {dev.sn}</p>
                                 <p className="text-xs font-semibold text-slate-800 mt-0.5">{dev.product}</p>
                               </div>
                            ))}
                         </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Tình trạng / Lỗi</label>
                <textarea 
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none mt-1 shadow-inner focus:border-blue-400 h-20" 
                  placeholder="Mô tả lỗi của máy..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 tracking-wider ml-1">Dự kiến chi phí (đ)</label>
                  <input 
                    type="text" 
                    value={cost}
                    onChange={(e) => setCost(formatNumber(parseFormattedNumber(e.target.value)))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 shadow-inner focus:border-blue-400" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ghi chú thêm</label>
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none mt-1 shadow-inner focus:border-blue-400" 
                  placeholder="Phụ kiện đi kèm, mật khẩu máy..." 
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100">
              <button 
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold shadow-md shadow-blue-200 tracking-wide active:scale-95 transition-all hover:bg-blue-700"
              >
                Tạo phiếu tiếp nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Chi tiết phiếu {selectedRecord.id}</h3>
              <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 tracking-tight">{selectedRecord.customerName}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedRecord.customerPhone}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Tag className="text-slate-400 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">Thiết bị</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedRecord.productName}</p>
                    {selectedRecord.serialNumber && <p className="text-xs text-orange-500 font-semibold font-mono">SN: {selectedRecord.serialNumber}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-slate-400 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">Tình trạng lỗi</p>
                    <p className="text-sm font-medium text-slate-600">{selectedRecord.issue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="text-slate-400 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">Trạng thái hiện tại</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(['RECEIVING', 'REPAIRING', 'COMPLETED', 'RETURNED'] as const).map(s => (
                        <button 
                          key={s}
                          onClick={() => {
                            updateMaintenanceRecord(selectedRecord.id, { status: s });
                            setSelectedRecord({...selectedRecord, status: s});
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-bold tracking-wide transition-all ${selectedRecord.status === s ? getStatusColor(s) + ' shadow-sm scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {getStatusText(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider">Chi phí dự kiến</span>
                  <span className="text-lg font-semibold text-slate-800">{formatNumber(selectedRecord.cost)}đ</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setSelectedRecord(null)} className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg text-[10px] tracking-wide">Đóng chi tiết</button>
            </div>
          </div>
        </div>
      )}
      {/* Add External Serial Modal */}
      {isExternalModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className="bg-white md:rounded-2xl shadow-xl w-full h-full md:h-auto md:max-w-sm flex flex-col md:overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Globe size={16} className="text-blue-600" />
                Thêm máy ngoài
              </h3>
              <button onClick={() => setIsExternalModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm *</label>
                <input 
                  type="text" 
                  value={newExtProduct}
                  onChange={(e) => setNewExtProduct(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 focus:border-blue-400" 
                  placeholder="Ex: iPhone 12 Pro..." 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số Serial / IMEI</label>
                <input 
                  type="text" 
                  value={newExtSn}
                  onChange={(e) => setNewExtSn(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none mt-1 focus:border-blue-400" 
                  placeholder="Nhập SN/IMEI nếu có..." 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nơi bán / Nguồn gốc</label>
                <input 
                  type="text" 
                  value={newExtSource}
                  onChange={(e) => setNewExtSource(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none mt-1 focus:border-blue-400" 
                  placeholder="FPT Shop, TGDĐ..." 
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0 mb-4 md:mb-0">
              <button 
                onClick={() => setIsExternalModalOpen(false)} 
                className="flex-1 py-3 bg-white text-slate-600 font-semibold rounded-lg text-xs border border-slate-200 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddExternalSerial}
                className="flex-[2] py-3 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 shadow shadow-blue-200"
              >
                Lưu vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

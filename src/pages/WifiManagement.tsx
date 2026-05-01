import React, { useState, useMemo } from 'react';
import { Search, Plus, Wifi, User, Phone, MapPin, Calendar, Trash2, Edit3, MoreHorizontal, X, Save, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { WifiRecord } from '../types';
import { generateId } from '../lib/idUtils';

export const WifiManagement: React.FC = () => {
  const { customers, wifiRecords, addWifiRecord, updateWifiRecord, deleteWifiRecord, currentUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WifiRecord | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [note, setNote] = useState('');
  
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredRecords = useMemo(() => {
    return wifiRecords.filter(r => 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerPhone.includes(searchTerm) ||
      r.wifiName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [wifiRecords, searchTerm]);

  const handleCustomerSearch = (val: string) => {
    setCustomerName(val);
    if (val.length > 1) {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase()) || 
        c.phone.includes(val)
      ).slice(0, 5);
      setCustomerSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address || '');
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setWifiName('');
    setWifiPassword('');
    setNote('');
    setEditingRecord(null);
  };

  const handleSave = () => {
    if (!customerName || !wifiName) {
      alert('Vui lòng nhập tên khách hàng và tên wifi');
      return;
    }

    const recordData = {
      customerName,
      customerPhone,
      customerAddress,
      wifiName,
      wifiPassword,
      note,
      updatedAt: new Date().toLocaleString('vi-VN')
    };

    if (editingRecord) {
      updateWifiRecord(editingRecord.id, recordData);
    } else {
      const newRecord: WifiRecord = {
        ...recordData,
        id: generateId('WF', wifiRecords),
        createdAt: new Date().toLocaleString('vi-VN'),
        createdBy: currentUser?.name || 'Admin'
      };
      addWifiRecord(newRecord);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (record: WifiRecord) => {
    setEditingRecord(record);
    setCustomerName(record.customerName);
    setCustomerPhone(record.customerPhone);
    setCustomerAddress(record.customerAddress);
    setWifiName(record.wifiName);
    setWifiPassword(record.wifiPassword || '');
    setNote(record.note || '');
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      deleteWifiRecord(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Wifi</h1>
          <p className="text-slate-500 text-sm">Lưu trữ thông tin cấu hình wifi khách hàng</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          Thêm wifi mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm khách hàng, SĐT, tên wifi..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Tổng cộng: <span className="text-blue-600 font-bold">{filteredRecords.length}</span> bản ghi
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Wifi / Mật khẩu</th>
                <th className="px-6 py-4">Thông tin bổ sung</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm border border-blue-100">
                        {record.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-700">{record.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {record.customerPhone}
                        </div>
                        {record.customerAddress && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 max-w-[200px] truncate">
                            <MapPin size={10} /> {record.customerAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Wifi size={16} className="text-blue-500" />
                      {record.wifiName}
                    </div>
                    {record.wifiPassword && (
                      <div className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">
                        Pass: {record.wifiPassword}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="max-w-[200px] truncate">{record.note || '---'}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Bởi: {record.createdBy}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {record.createdAt}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="md:hidden">
                      <MoreHorizontal size={18} className="text-slate-400" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Không tìm thấy dữ liệu wifi nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingRecord ? <Edit3 size={20} className="text-blue-500" /> : <Plus size={24} className="text-blue-500" />}
                {editingRecord ? 'Chỉnh sửa Wifi' : 'Thêm Wifi mới'}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Customer Search */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tên khách hàng</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none text-[15px] font-medium transition-all"
                    placeholder="Nhập tên hoặc SĐT khách..."
                    value={customerName}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    onFocus={() => customerName && setShowSuggestions(true)}
                  />
                  
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {customerSuggestions.map(c => (
                        <div 
                          key={c.id} 
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                          onClick={() => selectCustomer(c)}
                        >
                          <div className="font-bold text-slate-700">{c.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone size={12} /> {c.phone} | <MapPin size={12} /> {c.address}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none text-[15px] font-medium transition-all"
                      placeholder="09xx..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tên Wifi</label>
                  <div className="relative">
                    <Wifi size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none text-[15px] font-medium transition-all"
                      placeholder="SSID..."
                      value={wifiName}
                      onChange={(e) => setWifiName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Địa chỉ</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none text-[15px] font-medium transition-all"
                    placeholder="Địa chỉ thi công/lắp đặt..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mật khẩu Wifi</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none text-[15px] font-mono font-medium transition-all"
                    placeholder="Mật khẩu..."
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Ghi chú</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-400 outline-none text-[15px] font-medium transition-all resize-none h-24"
                  placeholder="Vị trí đặt modem, loại thiết bị..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white transition-all active:scale-95"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                <Save size={20} />
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

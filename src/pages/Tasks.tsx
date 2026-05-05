import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  Send, 
  X,
  Lock,
  Bell,
  Settings,
  ArrowRight,
  ClipboardList,
  ShoppingCart,
  ShoppingBag,
  Wrench,
  Phone,
  MapPin,
  ExternalLink,
  Navigation,
  FileText,
  History
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Task, TelegramSettings, Customer, Invoice, MaintenanceRecord } from '../types';
import { formatDateTime, parseDateString } from '../lib/utils';
import { generateId } from '../lib/idUtils';
import { useMobileBackModal } from '../hooks/useMobileBackModal';
import { motion, AnimatePresence } from 'motion/react';

export const Tasks: React.FC = () => {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    users, 
    currentUser, 
    telegramSettings, 
    updateTelegramSettings,
    customers,
    invoices,
    maintenanceRecords
  } = useAppContext();

  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'ALL' | 'NOT_COMPLETED'>('NOT_COMPLETED');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ task: Task, newStatus: Task['status'] } | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('TODO');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const navigate = useNavigate();

  const resetForm = () => {
    setDescription('');
    setStatus('TODO');
    setPriority('MEDIUM');
    setDueDate('');
    setAssignedTo('');
    setCustomerId('');
    setEditingTask(null);
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

  // Helper to format duration/time remaining
  const getTimeRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const dueDate = new Date(dateStr);
      const now = new Date();
      const diffInMs = dueDate.getTime() - now.getTime();
      
      if (diffInMs < 0) {
        return { text: 'Đã quá hạn', color: 'text-red-600' };
      }

      const diffInSecs = Math.floor(diffInMs / 1000);
      const diffInMins = Math.floor(diffInSecs / 60);
      const diffInHours = Math.floor(diffInMins / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) {
        return { text: `Còn ${diffInDays} ngày ${diffInHours % 24} giờ`, color: 'text-rose-600' };
      }
      
      const seconds = diffInSecs % 60;
      const minutes = diffInMins % 60;
      const hours = diffInHours % 24;

      return { 
        text: `Còn ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 
        color: 'text-rose-600' 
      };
    } catch (e) {
      return null;
    }
  };

  // State for real-time clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format time ago
  const getTimeAgo = (dateStr: string) => {
    try {
      let date: Date;
      if (dateStr.includes('/')) {
        // Handle HH:mm:ss DD/MM/YYYY
        const [time, datePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, min, sec] = time.split(':');
        date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
      } else {
        date = new Date(dateStr);
      }

      const diffInMs = now.getTime() - date.getTime();
      const diffInSecs = Math.floor(diffInMs / 1000);
      const diffInMins = Math.floor(diffInSecs / 60);
      const diffInHours = Math.floor(diffInMins / 60);

      const color = diffInHours < 24 ? 'text-emerald-500' : 'text-red-500';

      if (diffInMins < 1) return { text: `${diffInSecs} giây trước`, color };
      if (diffInMins < 60) return { text: `${diffInMins} phút ${diffInSecs % 60} giây trước`, color };
      
      if (diffInHours < 24) return { text: `${diffInHours} giờ trước`, color };
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) return { text: `${diffInDays} ngày trước`, color };
      
      return { text: date.toLocaleDateString('vi-VN'), color };
    } catch (e) {
      return { text: dateStr, color: 'text-slate-400' };
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setAssignedTo(task.assignedTo || '');
    setCustomerId(task.customerId || '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const customer = customers.find(c => c.id === customerId);
    const finalTitle = customer ? customer.name : 'Công việc mới';

    const taskData: Task = {
      id: editingTask?.id || generateId('CV', tasks),
      title: finalTitle,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      customerId,
      customerPhone: customer?.phone || '',
      customerAddress: customer?.address || customer?.location || '',
      taskType: editingTask?.taskType || 'GENERAL',
      relatedId: editingTask?.relatedId || '',
      purchaseId: editingTask?.purchaseId || '',
      repairId: editingTask?.repairId || '',
      createdBy: editingTask?.createdBy || currentUser?.name || 'Admin',
      createdAt: editingTask?.createdAt || new Date().toLocaleString('vi-VN'),
      completedAt: status === 'COMPLETED' ? (editingTask?.completedAt || new Date().toLocaleString('vi-VN')) : (status !== 'COMPLETED' ? '' : editingTask?.completedAt)
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const getPriorityWeight = (p: Task['priority']) => {
    switch (p) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' 
      ? true 
      : statusFilter === 'NOT_COMPLETED' 
        ? t.status !== 'COMPLETED' 
        : t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    
    return parseDateString(b.createdAt) - parseDateString(a.createdAt);
  });

  const getPriorityColor = (p: Task['priority']) => {
    switch(p) {
      case 'LOW': return 'bg-slate-100 text-slate-600';
      case 'MEDIUM': return 'bg-blue-50 text-blue-600';
      case 'HIGH': return 'bg-orange-50 text-orange-600';
      case 'CRITICAL': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusIcon = (s: Task['status']) => {
    if (s === 'COMPLETED') {
      return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
          <CheckCircle2 size={12} className="fill-emerald-600 text-white" />
          <span className="text-[9px] font-black uppercase">Hoàn thành</span>
        </div>
      );
    }
    return <MapPin size={16} fill="currentColor" className="text-rose-500" />;
  };

  useMobileBackModal(isModalOpen, () => setIsModalOpen(false)); // auto-injected
  useMobileBackModal(showCustomerResults, () => setShowCustomerResults(false)); // auto-injected
  useMobileBackModal(!!selectedTaskDetail, () => setSelectedTaskDetail(null));
  useMobileBackModal(!!statusConfirm, () => setStatusConfirm(null));
  useMobileBackModal(!!editingTask, () => setEditingTask(null));

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="hidden md:flex text-2xl font-black text-slate-800 tracking-tighter items-center gap-2">
            Quản lý công việc
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold ml-2">
              {tasks.length}
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <button 
              onClick={() => setStatusFilter('NOT_COMPLETED')}
              className="text-[10px] font-black text-rose-600 uppercase tracking-tight flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <ClipboardList size={12} />
              {tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length} việc chưa xong
            </button>
            <button 
              onClick={() => setStatusFilter('TODO')}
              className="text-[10px] font-black text-orange-500 uppercase tracking-tight flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <AlertCircle size={12} />
              {tasks.filter(t => t.status === 'TODO').length} việc chưa nhận
            </button>
            <button 
              onClick={() => setStatusFilter('ACCEPTED')}
              className="text-[10px] font-black text-blue-500 uppercase tracking-tight flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <MapPin size={12} />
              {tasks.filter(t => t.status === 'ACCEPTED').length} việc chưa check-in
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..." 
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-medium w-full md:w-[250px] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="hidden md:flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={18} /> Thêm mới
          </button>
        </div>
      </div>

      {/* Filters Bar - Compact for Mobile */}
      <div className="bg-white border-b border-slate-100 px-4 md:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 scroll-smooth no-scrollbar">
        <button 
          onClick={() => setStatusFilter('NOT_COMPLETED')}
          className={`px-3 py-1.5 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black whitespace-nowrap transition-all ${statusFilter === 'NOT_COMPLETED' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          CÒN LẠI ({tasks.filter(t => t.status !== 'COMPLETED').length})
        </button>  
        <button 
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black whitespace-nowrap transition-all ${statusFilter === 'ALL' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          TẤT CẢ ({tasks.length})
        </button>
        {[
          { label: 'CHƯA NHẬN', val: 'TODO' },
          { label: 'ĐÃ NHẬN', val: 'ACCEPTED' },
          { label: 'CHECK-IN', val: 'IN_PROGRESS' },
          { label: 'XONG', val: 'COMPLETED' },
          { label: 'HỦY', val: 'CANCELLED' },
        ].map(f => (
          <button 
            key={f.val}
            onClick={() => setStatusFilter(f.val as any)}
            className={`px-3 py-1.5 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black whitespace-nowrap transition-all ${statusFilter === f.val ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {f.label} ({tasks.filter(t => t.status === f.val).length})
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <ClipboardList size={40} />
                </div>
                <p className="text-lg font-bold italic">Chưa có công việc nào</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Tạo công việc đầu tiên
                </button>
              </div>
            ) : (
              filteredTasks.map(task => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={task.id} 
                  className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-default relative overflow-hidden"
                >
                  {/* Priority Indicator */}
                  <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center translate-x-4 -translate-y-4 rotate-45 ${getPriorityColor(task.priority)} shadow-sm opacity-50`}></div>

                  <div className="flex justify-between items-start mb-1 relative">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded italic">#{task.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(task)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => { if(confirm('Xóa công việc này?')) deleteTask(task.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setSelectedTaskDetail(task);
                      if (task.status === 'TODO') {
                        updateTask(task.id, { ...task, status: 'ACCEPTED' });
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <h3 className="font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-700 transition-colors tracking-tight">{task.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium">
                      {task.description || 'Không có mô tả chi tiết'}
                    </p>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {task.customerId ? (
                      <>
                        <a 
                          href={`tel:${customers.find(c => c.id === task.customerId)?.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Phone size={12} /> Gọi khách
                        </a>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customers.find(c => c.id === task.customerId)?.location || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation size={12} /> Chỉ đường
                        </a>
                      </>
                    ) : (
                      <div className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black text-center italic">
                        Chưa gắn khách hàng
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                       <div className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-1.5 text-slate-400">
                           <Calendar size={12} />
                           <span>{task.dueDate ? formatDateTime(task.dueDate) : 'Không thời hạn'}</span>
                         </div>
                         {task.status !== 'COMPLETED' && task.dueDate && (
                           <div className={`text-[9px] font-black italic flex items-center gap-1 ${getTimeRemaining(task.dueDate)?.color}`}>
                             <Clock size={10} />
                             {getTimeRemaining(task.dueDate)?.text}
                           </div>
                         )}
                       </div>
                       <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${getPriorityColor(task.priority)}`}>
                         {task.priority === 'CRITICAL' ? 'Khẩn cấp' : task.priority === 'HIGH' ? 'Cao' : task.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-white">
                          <User size={12} />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 truncate max-w-[80px]">
                          {task.assignedTo || 'Chưa giao'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 text-[9px] font-black italic ${getTimeAgo(task.createdAt).color}`}>
                        {getTimeAgo(task.createdAt).text} ({formatDateTime(task.createdAt)})
                      </div>
                    </div>
                  </div>
                  {task.description && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <p className="text-xs font-medium text-slate-400 italic line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button 
        onClick={() => { resetForm(); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[90] ring-4 ring-blue-50"
      >
        <Plus size={28} />
      </button>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-none md:rounded-3xl overflow-hidden shadow-2xl h-full md:h-auto md:max-h-[90vh] flex flex-col"
          >
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tighter">
                    {editingTask ? 'Cập nhật công việc' : 'Tạo công việc mới'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold italic leading-none mt-0.5">Điền thông tin chi tiết nhiệm vụ</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 md:max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-slate-400 ml-1">Gắn với khách hàng</label>
                
                {customerId ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">
                          {customers.find(c => c.id === customerId)?.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 italic">
                          {customers.find(c => c.id === customerId)?.phone}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setCustomerId(''); setCustomerSearchTerm(''); }}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          setShowCustomerResults(true);
                        }}
                        onFocus={() => setShowCustomerResults(true)}
                        placeholder="Tìm theo tên hoặc số điện thoại..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-blue-500 transition-all font-bold"
                      />
                    </div>

                    <AnimatePresence>
                      {showCustomerResults && customerSearchTerm.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-[101] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar"
                        >
                          {customers.filter(c => 
                            c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
                            c.phone.includes(customerSearchTerm)
                          ).length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs font-bold italic">Không tìm thấy khách hàng</div>
                          ) : (
                            customers.filter(c => 
                              c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
                              c.phone.includes(customerSearchTerm)
                            ).map(c => (
                              <button 
                                key={c.id}
                                onClick={() => {
                                  setCustomerId(c.id || '');
                                  setShowCustomerResults(false);
                                  setCustomerSearchTerm('');
                                }}
                                className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-all text-left"
                              >
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                  <User size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{c.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{c.phone}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {customerId && customers.find(c => c.id === customerId)?.location && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                      <MapPin className="text-red-500 shrink-0" size={16} />
                      <p className="text-[10px] font-bold text-slate-500 italic truncate flex-1">
                        {customers.find(c => c.id === customerId)?.address || customers.find(c => c.id === customerId)?.location}
                      </p>
                    </div>
                    <div className="aspect-video bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(customers.find(c => c.id === customerId)?.location || '')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-slate-400 ml-1">Nội dung công việc</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả công việc cần xử lý..." 
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1">Mức độ ưu tiên</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="CRITICAL">Khẩn cấp</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1">Trạng thái</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="DRAFT">Nháp</option>
                    <option value="TODO">Chưa bắt đầu (Đã giao)</option>
                    <option value="ACCEPTED">Đã nhận việc</option>
                    <option value="IN_PROGRESS">Đã Check-in</option>
                    <option value="COMPLETED">Đã hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1">Người nhận việc</label>
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1">Hạn chót</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 bg-white text-slate-500 rounded-2xl font-black text-[11px] border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight size={14} />
                </div>
                {editingTask ? 'Cập nhật ngay' : 'Xác nhận tạo việc'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTaskDetail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full md:h-[90vh]"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${getPriorityColor(selectedTaskDetail.priority)} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tighter">
                      Chi tiết công việc #{selectedTaskDetail.id}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-bold">{formatDateTime(selectedTaskDetail.createdAt)}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-[10px] text-blue-600 font-black">Bởi {selectedTaskDetail.createdBy}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTaskDetail(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Status and Actions */}
                <section className="space-y-4">
                  <div className="flex flex-col gap-4">
                    {selectedTaskDetail.status === 'ACCEPTED' && (
                      <button 
                        onClick={() => {
                          const updated = { ...selectedTaskDetail, status: 'IN_PROGRESS' as const };
                          updateTask(selectedTaskDetail.id, updated);
                          setSelectedTaskDetail(updated);
                        }}
                        className="w-fit px-8 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-emerald-200 flex items-center gap-3 animate-bounce"
                      >
                        <MapPin size={20} /> NHẤN VÀO ĐÂY ĐỂ CHECK-IN TẠI NHÀ KHÁCH
                      </button>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-[10px] font-black text-slate-400 w-full mb-1">Cập nhật nhanh trạng thái</label>
                      {[
                        { label: 'Chưa làm', val: 'TODO', color: 'bg-orange-50 text-orange-600' },
                        { label: 'Đã nhận', val: 'ACCEPTED', color: 'bg-blue-50 text-blue-600' },
                        { label: 'Đã Check-in', val: 'IN_PROGRESS', color: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Xong', val: 'COMPLETED', color: 'bg-emerald-600 text-white' },
                        { label: 'Hủy', val: 'CANCELLED', color: 'bg-slate-100 text-slate-500' },
                      ].map(st => (
                        <button 
                          key={st.val}
                          onClick={() => {
                            setStatusConfirm({ task: selectedTaskDetail, newStatus: st.val as any });
                          }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${selectedTaskDetail.status === st.val ? 'border-blue-500 ' + (selectedTaskDetail.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : st.color) : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Content */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-slate-400">Nội dung chi tiết</h4>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedTaskDetail.title}</h2>
                      <p className="text-base text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mt-2">
                        {selectedTaskDetail.description || 'Không có mô tả chi tiết'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-400 leading-none">Hạn chót</p>
                         <div className="flex items-center gap-2 mt-1 text-slate-700 font-bold">
                            <Calendar size={14} className="text-blue-500" />
                            <span>{selectedTaskDetail.dueDate ? formatDateTime(selectedTaskDetail.dueDate) : 'Không thời hạn'}</span>
                         </div>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-400 leading-none">Nhân viên</p>
                         <div className="flex items-center gap-2 mt-1 text-slate-700 font-bold">
                            <User size={14} className="text-blue-500" />
                            <span>{selectedTaskDetail.assignedTo || 'Chưa giao'}</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Customer Info & Map */}
                  <div className="space-y-4 pt-4 md:pt-0">
                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200">
                      <h4 className="text-[11px] font-black text-slate-400 mb-3">Khách hàng liên quan</h4>
                      {selectedTaskDetail.customerId ? (
                        (() => {
                          const customer = customers.find(c => c.id === selectedTaskDetail.customerId);
                          if (!customer) return <p className="text-xs text-slate-400 font-bold italic">Không tìm thấy khách hàng</p>;
                          return (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-black text-slate-800 leading-none">{customer.name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                                    <Phone size={12} /> {customer.phone}
                                  </a>
                                </div>
                              </div>
                              
                              <div className="space-y-2 pt-2 border-t border-slate-200">
                                <div className="flex items-start gap-2 text-xs font-medium text-slate-500 italic">
                                  <MapPin size={14} className="text-red-500 shrink-0" />
                                  <span>{customer.address || customer.location || 'Chưa cập nhật địa chỉ'}</span>
                                </div>
                                
                                {customer.location && (
                                  <div className="space-y-2 mt-4">
                                    <div className="aspect-video bg-white rounded-2xl border border-slate-200 overflow-hidden relative group">
                                      <iframe 
                                        width="100%" 
                                        height="100%" 
                                        frameBorder="0" 
                                        style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(customer.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                        allowFullScreen
                                      ></iframe>
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <p className="text-white text-[10px] font-black">Xem bản đồ chi tiết</p>
                                      </div>
                                    </div>
                                    <a 
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.location)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                      <Navigation size={14} /> Chỉ đường tới nhà khách
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-xs text-slate-400 font-bold italic">Chưa gắn thẻ khách hàng</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Sales & Maintenance History */}
                {selectedTaskDetail.customerId && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-slate-400">Kết quả thực hiện tại việc này</h4>
                      {selectedTaskDetail.status === 'IN_PROGRESS' || selectedTaskDetail.status === 'COMPLETED' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/pos?customerId=${selectedTaskDetail.customerId}&taskId=${selectedTaskDetail.id}`)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <ShoppingCart size={12} /> Tạo đơn bán hàng
                          </button>
                          <button 
                            onClick={() => navigate(`/maintenance?type=repair&customerId=${selectedTaskDetail.customerId}&taskId=${selectedTaskDetail.id}`)}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-black hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Wrench size={12} /> Tạo phiếu sửa chữa
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                          <Lock size={12} className="text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 italic">Check-in để mở khóa chức năng</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Linked Results */}
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl overflow-hidden">
                           <div className="px-4 py-2 bg-emerald-100/50 border-b border-emerald-100 flex items-center gap-2 text-emerald-700">
                              <ShoppingBag size={14} />
                              <span className="text-[10px] font-black uppercase">Đơn bán trong công việc</span>
                           </div>
                           <div className="p-2">
                              {invoices.filter(inv => inv.taskId === selectedTaskDetail.id).length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic p-4 text-center font-bold">Chưa tạo đơn bán cho công việc này</p>
                              ) : (
                                invoices
                                  .filter(inv => inv.taskId === selectedTaskDetail.id)
                                  .map(inv => (
                                    <div key={inv.id} className="p-3 bg-white hover:border-emerald-200 rounded-xl border border-transparent shadow-sm flex justify-between items-center transition-all mb-2 last:mb-0">
                                       <div>
                                          <p className="text-[11px] font-black text-slate-800">{inv.id}</p>
                                          <p className="text-[9px] font-bold text-slate-400 italic leading-none mt-1">{formatDateTime(inv.date)}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-sm font-black text-emerald-600 leading-none">{inv.total.toLocaleString()}đ</p>
                                          <p className="text-[10px] font-bold text-slate-400 italic mt-1">{inv.items.length} mặt hàng</p>
                                       </div>
                                    </div>
                                  ))
                              )}
                           </div>
                        </div>

                        <div className="bg-orange-50/30 border border-orange-100 rounded-2xl overflow-hidden">
                           <div className="px-4 py-2 bg-orange-100/50 border-b border-orange-100 flex items-center gap-2 text-orange-700">
                              <Wrench size={14} />
                              <span className="text-[10px] font-black uppercase">Phiếu sửa trong công việc</span>
                           </div>
                           <div className="p-2">
                              {maintenanceRecords.filter(m => m.taskId === selectedTaskDetail.id).length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic p-4 text-center font-bold">Chưa tạo phiếu sửa cho công việc này</p>
                              ) : (
                                maintenanceRecords
                                  .filter(m => m.taskId === selectedTaskDetail.id)
                                  .map(m => (
                                    <div key={m.id} className="p-3 bg-white hover:border-orange-200 rounded-xl border border-transparent shadow-sm flex justify-between items-center transition-all mb-2 last:mb-0">
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <p className="text-[11px] font-black text-slate-800">{m.id}</p>
                                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${m.status === 'COMPLETED' || m.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {getStatusText(m.status)}
                                             </span>
                                          </div>
                                          <p className="text-[10px] font-bold text-slate-700 mt-1">{m.productName}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-sm font-black text-orange-600 leading-none">{m.cost.toLocaleString()}đ</p>
                                          <p className="text-[9px] font-bold text-slate-400 italic mt-1">{formatDateTime(m.date)}</p>
                                       </div>
                                    </div>
                                  ))
                              )}
                           </div>
                        </div>
                      </div>

                    </div>
                  </section>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
                {currentUser?.role === 'Admin' && (
                  <button 
                    onClick={() => handleEdit(selectedTaskDetail)}
                    className="flex-1 py-3 bg-white text-blue-600 rounded-2xl font-black text-[11px] border border-blue-100 hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} />Chỉnh sửa công việc
                  </button>
                )}
                <button 
                  onClick={() => setSelectedTaskDetail(null)}
                  className="flex-[2] py-3 bg-slate-800 text-white rounded-2xl font-black text-[11px] shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Confirmation Modal */}
      <AnimatePresence>
        {statusConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8"
            >
              <div className="text-center space-y-4">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Xác nhận</h3>
                <p className="text-sm font-medium text-slate-500 px-4">
                  Bạn có đồng ý đổi trạng thái sang {' '}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-block
                    ${statusConfirm.newStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                      statusConfirm.newStatus === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700' : 
                      statusConfirm.newStatus === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                      statusConfirm.newStatus === 'CANCELLED' ? 'bg-slate-200 text-slate-700' : 
                      'bg-orange-100 text-orange-700'}
                  `}>
                    {statusConfirm.newStatus === 'COMPLETED' ? 'Đã xong' : 
                     statusConfirm.newStatus === 'IN_PROGRESS' ? 'Đã Check-in' : 
                     statusConfirm.newStatus === 'ACCEPTED' ? 'Đã nhận việc' :
                     statusConfirm.newStatus === 'CANCELLED' ? 'Đã hủy' : 'Chưa làm'}
                  </span>?
                </p>

                <div className="bg-slate-50/80 rounded-2xl p-5 text-left space-y-4 border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 leading-none">KHÁCH HÀNG</p>
                    <p className="text-sm font-black text-slate-700 leading-tight">
                      {customers.find(c => c.id === statusConfirm.task.customerId)?.name || '-- Không có --'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400  leading-none">THIẾT BỊ / CÔNG VIỆC</p>
                    <p className="text-sm font-black text-slate-700 leading-tight">{statusConfirm.task.title}</p>
                  </div>
                  {statusConfirm.task.description && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 leading-none">GHI CHÚ / TÌNH TRẠNG</p>
                      <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                        {statusConfirm.task.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => setStatusConfirm(null)}
                    className="py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[13px] font-black hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={() => {
                      const now = new Date().toLocaleString('vi-VN');
                      updateTask(statusConfirm.task.id, { 
                        ...statusConfirm.task, 
                        status: statusConfirm.newStatus,
                        completedAt: statusConfirm.newStatus === 'COMPLETED' ? now : (statusConfirm.task.status === 'COMPLETED' && statusConfirm.newStatus !== 'COMPLETED' ? '' : statusConfirm.task.completedAt)
                      });
                      if (selectedTaskDetail && selectedTaskDetail.id === statusConfirm.task.id) {
                        setSelectedTaskDetail({ 
                          ...selectedTaskDetail, 
                          status: statusConfirm.newStatus,
                          completedAt: statusConfirm.newStatus === 'COMPLETED' ? now : (selectedTaskDetail.status === 'COMPLETED' && statusConfirm.newStatus !== 'COMPLETED' ? '' : selectedTaskDetail.completedAt)
                        });
                      }
                      setStatusConfirm(null);
                    }}
                    className="py-4 bg-blue-600 text-white rounded-2xl text-[13px] font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    Đồng ý
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

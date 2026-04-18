import React from 'react';
import { PieChart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Reports: React.FC = () => {
  const { invoices } = useAppContext();

  const months: Record<string, { rev: number; cost: number; profit: number; orders: number }> = {};

  (invoices || []).forEach(inv => {
    let dateStr = inv.date || '';
    // Find the part that looks like a date (contains '/')
    const datePart = dateStr.split(/[\s,]+/).find(part => part.includes('/'));
    if (!datePart) return;
    
    // datePart is likely DD/MM/YYYY
    const parts = datePart.split('/');
    if (parts.length < 3) return;
    
    const monthKey = `${parts[1]}/${parts[2]}`; // MM/YYYY
    
    if (!months[monthKey]) months[monthKey] = { rev: 0, cost: 0, profit: 0, orders: 0 };
    
    if (inv.total > 0) {
      months[monthKey].rev += inv.total;
      months[monthKey].orders += 1;
      let invCost = inv.items.reduce((s, it) => s + (it.importPriceTotal || 0), 0); 
      months[monthKey].cost += invCost;
    } else {
      months[monthKey].rev += inv.total;
      let refundCost = inv.items.reduce((s, it) => s + (it.importPriceTotal || 0), 0);
      months[monthKey].cost -= refundCost;
    }
    months[monthKey].profit = months[monthKey].rev - months[monthKey].cost;
  });

  const sortedMonths = Object.keys(months).sort((a, b) => b.localeCompare(a));
  const totalProfit = Object.values(months).reduce((s, m) => s + m.profit, 0);

  return (
    <div className="h-full overflow-y-auto px-4 md:px-0 py-4 md:py-0">
      <div className="max-w-4xl mx-auto space-y-6 pb-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 text-center relative overflow-hidden">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lợi nhuận gộp hệ thống</p>
          <h2 className="text-4xl font-black text-emerald-600 tracking-tighter">{totalProfit.toLocaleString()}đ</h2>
          <div className="absolute top-0 right-0 p-6 opacity-5 text-8xl">
            <PieChart size={120} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sortedMonths.length === 0 ? (
            <p className="col-span-full text-center py-24 italic text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
              Hệ thống chưa ghi nhận đơn
            </p>
          ) : (
            sortedMonths.map(m => (
              <div key={m} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-4 mb-5">
                  <span className="font-black text-slate-800 tracking-tighter text-base uppercase">Tháng {m}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl font-black uppercase tracking-widest border border-blue-100">
                    {months[m].orders} Giao dịch
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng doanh thu</p>
                    <p className="font-black text-slate-800 text-2xl tracking-tighter">{months[m].rev.toLocaleString()}đ</p>
                  </div>
                  <div className="border-l border-slate-100 pl-4">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Lợi nhuận gộp</p>
                    <p className="font-black text-emerald-600 text-2xl tracking-tighter">{months[m].profit.toLocaleString()}đ</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

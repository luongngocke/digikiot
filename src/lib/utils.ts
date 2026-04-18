export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount).replace('₫', 'đ');
};

export const formatNumber = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const parseFormattedNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  return Number(value.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const parseDateString = (dateStr: string): number => {
  if (!dateStr) return 0;
  
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;

  const parts = dateStr.split(/[\s,]+/);
  const datePart = parts.find(p => p.includes('/'));
  const timePart = parts.find(p => p.includes(':'));

  if (datePart) {
    const [d, m, y] = datePart.split('/');
    if (y && m && d) {
       return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${timePart || '00:00:00'}`).getTime();
    }
  }
  return 0;
};

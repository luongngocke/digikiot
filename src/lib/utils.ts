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

export const formatDateTime = (dateStr?: string | number | Date) => {
  if (!dateStr) return '';
  try {
    let date: Date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else if (typeof dateStr === 'number') {
      date = new Date(dateStr);
    } else if (typeof dateStr === 'string') {
      if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        date = new Date(dateStr);
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split(/[\s,]+/);
        const datePart = parts.find(p => p.includes('/'));
        const timePart = parts.find(p => p.includes(':'));
        if (datePart) {
          const [d, m, y] = datePart.split('/');
          const [h, min] = (timePart || '00:00').split(':');
          date = new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0));
        } else {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr as any);
    }

    if (isNaN(date.getTime())) return String(dateStr);

    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${hh}:${mm} ${dd}/${mo}/${yyyy}`;
  } catch (e) {
    return String(dateStr);
  }
};

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

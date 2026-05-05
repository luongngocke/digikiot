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
          // Support handling hh:mm or hh:mm:ss
          const timeTokens = (timePart || '00:00:00').split(':');
          const h = timeTokens[0] || '0';
          const min = timeTokens[1] || '0';
          const sec = timeTokens[2] || '0';
          date = new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0), Number(sec || 0));
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
    const ss = date.getSeconds().toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${dd}/${mo}/${yyyy} ${hh}:${mm}:${ss}`;
  } catch (e) {
    return String(dateStr);
  }
};

export const padPhone = (phone?: string | number) => {
  if (!phone) return '';
  let p = String(phone).trim();
  p = p.replace(/^'/, ''); // remove any leading apostrophe from Sheets
  if (p && !p.startsWith('0') && p !== '---') {
    p = '0' + p;
  }
  return p;
};

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

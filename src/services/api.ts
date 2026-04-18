const API_URL = 'https://script.google.com/macros/s/AKfycbyF_Lx9HTS4ujYXPWMeOTovUz-7tVG8KhXrKdzwKqJeNj7OXEPIbWSHn27DN_RGaVJu/exec';

export const apiService = {
  // Đọc dữ liệu từ 1 sheet
  readSheet: async (sheetName: string) => {
    try {
      const response = await fetch(`${API_URL}?action=read&sheet=${sheetName}`);
      const result = await response.json();
      console.log(`[API] readSheet(${sheetName}) response:`, result);
      
      if (result.success === true || result.status === 'success') {
        return result.data || [];
      }
      console.error(`Error reading ${sheetName}:`, result.message || result.error || 'Unknown error');
      return [];
    } catch (error) {
      console.error(`Fetch error on ${sheetName}:`, error);
      return [];
    }
  },

  // Thêm mới 1 dòng
  createRecord: async (sheetName: string, data: any) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'create', sheet: sheetName, data }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      return await response.json();
    } catch (error) {
      console.error(`Create error on ${sheetName}:`, error);
      return { success: false };
    }
  },

  // Cập nhật 1 dòng
  updateRecord: async (sheetName: string, id: string, data: any) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'update', sheet: sheetName, id, data }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      return await response.json();
    } catch (error) {
      console.error(`Update error on ${sheetName}:`, error);
      return { success: false };
    }
  },

  // Xóa 1 dòng
  deleteRecord: async (sheetName: string, id: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', sheet: sheetName, id }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      return await response.json();
    } catch (error) {
      console.error(`Delete error on ${sheetName}:`, error);
      return { success: false };
    }
  }
};

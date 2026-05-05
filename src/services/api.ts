const API_URL = 'https://script.google.com/macros/s/AKfycbw9fB9wBGPiHkoO4qmVxyBl69VcDHyhObmYZnq8vew6wBoXn72AILTGw3KBWOuSvjGLnQ/exec';
const IMAGE_API_URL = 'https://script.google.com/macros/s/AKfycbxd7cJ1aMqNOkw0qwHT4pzVZQ59xilIa_IpR5gkvSTAnKOQVXpWNoiHtGA6NnplRgzdew/exec';
const IMAGE_SHEET_ID = '1BvCMwAq5zItV3fEqAy1saP7eTMQ66orrZ4CG6H_ecgM';

export const apiService = {
  // Đọc dữ liệu từ 1 sheet
  readSheet: async (sheetName: string) => {
    try {
      // Use IMAGE_API_URL for Image sheet requests, otherwise main API_URL
      const url = sheetName === 'Image' 
        ? `${IMAGE_API_URL}?sheetId=${IMAGE_SHEET_ID}&page=1&pageSize=100` 
        : `${API_URL}?action=read&sheet=${sheetName}`;
        
      const response = await fetch(url, { redirect: "follow" });
      const textResponse = await response.text();
      let result;
      try {
        result = JSON.parse(textResponse);
      } catch (e) {
        if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
          console.warn(`[API] Expected JSON but got HTML for ${sheetName}. The sheet might not exist in your Google Spreadsheet or there was a server error.`);
          return [];
        }
        console.error(`Failed to parse JSON for ${sheetName}. Response was:`, textResponse.substring(0, 100));
        return [];
      }
      console.log(`[API] readSheet(${sheetName}) response:`, result);
      
      if (result.success === true || result.status === 'success' || result.data) {
        return result.data || [];
      }
      
      // Nếu là lỗi không tìm thấy sheet, chỉ log cảnh báo thay vì lỗi nghiêm trọng
      if (result.message && result.message.includes('Sheet not found')) {
        console.warn(`[API] ${result.message}. App will use default values.`);
      } else {
        console.error(`Error reading ${sheetName}:`, result.message || result.error || 'Unknown error');
      }
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
  },

  // Upload ảnh lên Drive và lưu vào sheet Image (Kế thừa từ dự án Photo mới)
  uploadImage: async (base64: string, filename: string, category: string) => {
    try {
      // Structure based on user's project doPost
      const payload = {
        fileName: filename,
        fileType: 'image/jpeg', // Default or derived
        base64: base64.includes('base64,') ? base64.split('base64,')[1] : base64,
        sheetId: IMAGE_SHEET_ID,
        category: category
      };

      const response = await fetch(IMAGE_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      
      // Note: GAS doPost typically returns a JSON string, but if mode: 'no-cors' is used, we can't read it.
      // However, our fetch above doesn't use no-cors, so we should be able to read if configured.
      return await response.json();
    } catch (error) {
      console.error(`Upload error:`, error);
      return { success: false, message: 'Lỗi kết nối server' };
    }
  }
};

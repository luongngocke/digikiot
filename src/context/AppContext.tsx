import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, Product, Customer, Supplier, Invoice, ImportOrder, CashTransaction, POSDraft, ImportDraft, MaintenanceRecord, ReturnImportOrder, ReturnSalesOrder, User, Serial, StockCard, PrintSettings, ExternalSerial } from '../types';
import { apiService } from '../services/api';
import { generateId } from '../lib/idUtils';

interface AppContextProps extends AppState {
  login: (user: User) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>, skipStockCard?: boolean) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addSupplier: (supplier: Supplier) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  addImportOrder: (order: ImportOrder) => void;
  updateImportOrder: (id: string, updates: Partial<ImportOrder>) => void;
  addReturnImportOrder: (order: ReturnImportOrder) => void;
  addReturnSalesOrder: (order: ReturnSalesOrder) => void;
  addStockCard: (card: StockCard) => void;
  addSerial: (serial: Serial) => void;
  removeSerial: (sn: string) => void;
  addCashTransaction: (transaction: CashTransaction) => void;
  setPOSDraft: (draft: POSDraft) => void;
  setImportDraft: (draft: ImportDraft) => void;
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  addExternalSerial: (serial: ExternalSerial) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updatePrintSettings: (settings: PrintSettings) => void;
}

const defaultPrintSettings: PrintSettings = {
  storeName: 'TIN HỌC CƯỜNG TÍN - ĐẮK SONG',
  address: 'Số 22, Thôn Tân Bình - xã Đắk Song - tỉnh Lâm Đồng',
  phone: '0931.113.048',
  email: 'hotro@cuongtin.vn',
  bankInfo: 'VPBank - STK: 9790357 - Chủ thể Lê Ngọc Cường',
  footNote: 'Cảm ơn quý khách đã sử dụng dịch vụ & sản phẩm Cường Tín!'
};

const initialState: AppState = {
  currentUser: null,
  users: [],
  products: [],
  customers: [],
  suppliers: [],
  invoices: [],
  importOrders: [],
  returnImportOrders: [],
  returnSalesOrders: [],
  cashTransactions: [],
  maintenanceRecords: [],
  serials: [],
  stockCards: [],
  externalSerials: [],
  printSettings: defaultPrintSettings
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('cuongtin_erp_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          // Ensure arrays exist and are actually arrays
          users: Array.isArray(parsed.users) ? parsed.users : [],
          cashTransactions: Array.isArray(parsed.cashTransactions) ? parsed.cashTransactions : [],
          serials: Array.isArray(parsed.serials) ? parsed.serials : initialState.serials,
          stockCards: Array.isArray(parsed.stockCards) ? parsed.stockCards : initialState.stockCards,
          importOrders: Array.isArray(parsed.importOrders) ? parsed.importOrders : initialState.importOrders,
          returnImportOrders: Array.isArray(parsed.returnImportOrders) ? parsed.returnImportOrders : [],
          returnSalesOrders: Array.isArray(parsed.returnSalesOrders) ? parsed.returnSalesOrders : [],
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : initialState.invoices,
          products: Array.isArray(parsed.products) ? parsed.products : initialState.products,
          customers: Array.isArray(parsed.customers) ? parsed.customers : initialState.customers,
          suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : initialState.suppliers,
          maintenanceRecords: Array.isArray(parsed.maintenanceRecords) ? parsed.maintenanceRecords : [],
        };
      }
    } catch (e) {
      console.error("Error loading state from localStorage", e);
    }
    return initialState;
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('cuongtin_erp_state', JSON.stringify(state));
  }, [state]);

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    const loadDataFromAPI = async () => {
      try {
        setIsLoading(true);
        // Fetch core data in parallel
        const [
          apiProducts, 
          apiCustomers, 
          apiSuppliers, 
          apiSerials, 
          apiStockCards,
          apiInvoices,
          apiInvoiceDetails,
          apiImports,
          apiImportDetails,
          apiReturnImports,
          apiReturnImportDetails,
          apiReturnSales,
          apiReturnSalesDetails,
          apiCash,
          apiMaintenance,
          apiUsers,
          apiSettings,
          apiExternalSerials
        ] = await Promise.all([
          apiService.readSheet('Products'),
          apiService.readSheet('Customers'),
          apiService.readSheet('Suppliers'),
          apiService.readSheet('Serials'),
          apiService.readSheet('StockCards'),
          apiService.readSheet('Invoices'),
          apiService.readSheet('InvoiceDetails'),
          apiService.readSheet('Imports'),
          apiService.readSheet('ImportDetails'),
          apiService.readSheet('ReturnImports'),
          apiService.readSheet('ReturnImportDetails'),
          apiService.readSheet('ReturnSales'),
          apiService.readSheet('ReturnSalesDetails'),
          apiService.readSheet('CashLedger'),
          apiService.readSheet('Maintenance'),
          apiService.readSheet('Users'),
          apiService.readSheet('Settings'),
          apiService.readSheet('ExternalSerials')
        ]);

        const mappedProducts = apiProducts.length > 0 ? apiProducts.map((p: any) => ({
          id: String(p.id || ''),
          name: String(p.name || ''),
          price: Number(p.salePrice) || 0,
          importPrice: Number(p.costPrice) || 0,
          stock: Number(p.stock) || 0,
          hasSerial: p.hasSerial === true || p.hasSerial === 'TRUE' || p.hasSerial === 'true' || p.hasSerial === 1,
          isService: p.isService === true || p.isService === 'TRUE' || p.isService === 'true' || p.isService === 1,
          color: 'bg-blue-600',
          category: String(p.category || ''),
          unit: String(p.unit || ''),
          warrantyMonths: p.warrantyMonths || p.warranty || p.BaoHanh || p.warranty_months || p.wa ? Number(p.warrantyMonths || p.warranty || p.BaoHanh || p.warranty_months || p.wa) : undefined
        })) : [];

        const extractItems = (record: any, details: any[], parentIdKeys: string[]) => {
          const recordId = String(record.id || '');
          const matchingDetails = details.filter((d: any) => {
            const parentId = parentIdKeys.map(k => d[k]).find(v => v !== undefined);
            return String(parentId || '') === recordId;
          });

          if (matchingDetails.length > 0) {
            return matchingDetails.map((d: any) => {
              const prodId = String(d.productId || d.productID || d.ProductID || d.productid || '');
              const product = mappedProducts.find((p: any) => p.id === prodId);
              const qty = Number(d.quantity || d.qty || d.Quantity || d.Qty || 0);
              return {
                id: prodId,
                name: product?.name || 'Sản phẩm',
                price: Number(d.price || d.Price || 0),
                qty: qty,
                sn: (d.sn || d.SN || d.serial || d.Serial || d.serials || d.Serials) ? String(d.sn || d.SN || d.serial || d.Serial || d.serials || d.Serials) : undefined,
                unit: d.unit || d.Unit || undefined,
                warrantyExpiry: d.warrantyExpiry || d.WarrantyExpiry || undefined,
                importPriceTotal: Number(d.importPriceTotal || d.ImportPriceTotal || (product?.importPrice || 0) * qty)
              };
            });
          }

          const itemsKey = Object.keys(record).find(k => k.toLowerCase().includes('item') || k.toLowerCase().includes('chitiet'));
          if (itemsKey && record[itemsKey] && record[itemsKey] !== '') {
            try {
              const parsed = typeof record[itemsKey] === 'string' ? JSON.parse(record[itemsKey]) : record[itemsKey];
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.error('Parse items error', e);
            }
          }
          return [];
        };

        const mappedInvoices = apiInvoices.length > 0 ? apiInvoices.map((inv: any) => {
            const total = Number(inv.finalAmount || inv.total || 0);
            const paid = Number(inv.paidAmount || inv.paid || 0);
            const debt = inv.debt !== undefined ? Number(inv.debt) : (total - paid);
            return {
              id: String(inv.id || ''),
              date: String(inv.createdAt || inv.date || ''),
              customer: String(inv.customerID || inv.customer || ''),
              phone: String(inv.phone || ''),
              address: String(inv.address || ''),
              total,
              paid,
              debt,
              oldDebt: inv.oldDebt !== undefined ? Number(inv.oldDebt) : undefined,
              totalDebt: inv.totalDebt !== undefined ? Number(inv.totalDebt) : undefined,
              discount: Number(inv.discount || 0),
              note: String(inv.note || ''),
              items: extractItems(inv, apiInvoiceDetails, ['invoiceID', 'invoiceId', 'InvoiceID', 'invoiceid'])
            };
          }) : [];

        const mappedReturnSales = apiReturnSales.length > 0 ? apiReturnSales.map((ret: any) => {
            return {
              id: String(ret.id || ''),
              date: String(ret.createdAt || ret.date || ''),
              customer: String(ret.customerID || ret.customer || ''),
              totalGoods: Number(ret.totalGoods || 0),
              discount: Number(ret.discount || 0),
              total: Number(ret.totalAmount || ret.totalRefund || ret.total || 0),
              paid: Number(ret.paidAmount || ret.paid || 0),
              status: ret.status || 'DONE',
              note: String(ret.note || ''),
              items: extractItems(ret, apiReturnSalesDetails, ['returnID', 'returnId', 'ReturnID', 'returnid', 'returnSalesId'])
            };
          }) : [];

        const mappedReturnImports = apiReturnImports.length > 0 ? apiReturnImports.map((ret: any) => {
            return {
              id: String(ret.id || ''),
              date: String(ret.createdAt || ret.date || ''),
              supplier: String(ret.supplierId || ret.supplier || ''),
              totalGoods: Number(ret.totalGoods || 0),
              discount: Number(ret.discount || 0),
              total: Number(ret.totalAmount || ret.totalRefund || ret.total || 0),
              received: Number(ret.receivedAmount || ret.received || 0),
              status: ret.status || 'DONE',
              note: String(ret.note || ''),
              items: extractItems(ret, apiReturnImportDetails, ['returnID', 'returnId', 'ReturnID', 'returnid', 'returnImportId'])
            };
          }) : [];

        const soldSerials = new Set<string>();
        mappedInvoices.forEach((inv: any) => {
          inv.items.forEach((item: any) => {
            if (item.sn && typeof item.sn === 'string') {
              item.sn.split(',').forEach((s: string) => soldSerials.add(s.trim()));
            }
          });
        });

        mappedReturnImports.forEach((ret: any) => {
          ret.items.forEach((item: any) => {
            if (item.sn && typeof item.sn === 'string') {
              item.sn.split(',').forEach((s: string) => soldSerials.add(s.trim()));
            }
          });
        });

        mappedReturnSales.forEach((ret: any) => {
          ret.items.forEach((item: any) => {
            if (item.sn && typeof item.sn === 'string') {
              item.sn.split(',').forEach((s: string) => soldSerials.delete(s.trim()));
            }
          });
        });

        setState(prev => ({
          ...prev,
          products: mappedProducts,
          customers: apiCustomers.length > 0 ? apiCustomers.map((c: any) => ({
            id: String(c.id || ''),
            name: String(c.name || ''),
            phone: String(c.phone || ''),
            address: String(c.address || ''),
            location: String(c.location || ''),
            note: String(c.note || ''),
            createdBy: String(c.createdBy || ''),
            createdAt: String(c.createdAt || ''),
            totalSpent: Number(c.totalSpent) || 0,
            debt: Number(c.debt) || 0
          })) : [],
          suppliers: apiSuppliers.length > 0 ? apiSuppliers.map((s: any) => ({
            id: String(s.id || ''),
            name: String(s.name || ''),
            phone: String(s.phone || ''),
            totalDebt: Number(s.debt) || 0
          })) : [],
          serials: apiSerials.length > 0 ? apiSerials.map((s: any) => {
            const sn = String(s.sn || '').trim();
            return {
              prodId: String(s.prodId || ''),
              sn,
              supplier: String(s.supplier || ''),
              importPrice: Number(s.importPrice) || 0,
              date: String(s.date || ''),
              refId: String(s.refId || ''),
              status: soldSerials.has(sn) ? 'SOLD' : 'AVAILABLE'
            };
          }) : [],
          stockCards: apiStockCards.length > 0 ? apiStockCards.map((c: any) => ({
            ...c,
            sn: c.sn ? (typeof c.sn === 'string' ? c.sn.split(',') : c.sn) : []
          })) : [],
          invoices: mappedInvoices,
          importOrders: apiImports.length > 0 ? apiImports.map((imp: any) => {
            const total = Number(imp.totalAmount || imp.total || 0);
            const paid = Number(imp.paidAmount || imp.paid || 0);
            // Calculate debt based on total and paid, ignore the debt field from API if it's 0 but total > paid
            let debt = total - paid;
            if (imp.debt !== undefined && imp.debt !== '' && imp.debt !== null) {
                const apiDebt = Number(imp.debt);
                // Only use API debt if it makes sense (e.g., if total is 0, or if apiDebt is not 0 when total > paid)
                if (apiDebt !== 0 || total === paid) {
                    debt = apiDebt;
                }
            }
            
            return {
              id: String(imp.id || ''),
              date: String(imp.createdAt || imp.date || ''),
              supplier: String(imp.supplierId || imp.supplier || ''),
              status: imp.status || 'DONE',
              total,
              paid,
              debt,
              discount: Number(imp.discount || 0),
              returnCost: Number(imp.returnCost || 0),
              shippingFee: Number(imp.shippingFee || 0),
              otherCost: Number(imp.otherCost || 0),
              note: String(imp.note || ''),
              items: extractItems(imp, apiImportDetails, ['importID', 'importId', 'ImportID', 'importid']).map((item: any) => ({
                ...item,
                sn: typeof item.sn === 'string' ? item.sn.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(item.sn) ? item.sn : [])
              }))
            };
          }) : [],
          returnImportOrders: mappedReturnImports.map((ret: any) => ({
            ...ret,
            items: ret.items.map((item: any) => ({
              ...item,
              sn: typeof item.sn === 'string' ? item.sn.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(item.sn) ? item.sn : [])
            }))
          })),
          returnSalesOrders: mappedReturnSales,
          cashTransactions: apiCash.length > 0 ? apiCash.map((c: any) => ({
            id: String(c.id || ''),
            date: String(c.createdAt || c.date || ''),
            type: c.type as 'RECEIPT' | 'PAYMENT',
            amount: Number(c.amount || 0),
            category: c.category as any,
            partner: String(c.partner || ''),
            note: String(c.note || ''),
            refId: String(c.referenceId || c.refId || '')
          })) : [],
          maintenanceRecords: apiMaintenance.length > 0 ? apiMaintenance.map((m: any) => ({
            id: String(m.id || ''),
            date: String(m.createdAt || m.date || ''),
            customerName: String(m.customerName || ''),
            customerPhone: String(m.customerPhone || ''),
            productName: String(m.productName || ''),
            serialNumber: String(m.serialNumber || ''),
            issue: String(m.issue || ''),
            status: m.status || 'RECEIVING',
            cost: Number(m.cost || 0),
            note: String(m.note || ''),
            returnDate: String(m.returnDate || '')
          })) : [],
          externalSerials: apiExternalSerials && apiExternalSerials.length > 0 ? apiExternalSerials.map((e: any) => ({
            id: String(e.id || ''),
            date: String(e.date || ''),
            customer: String(e.customer || ''),
            product: String(e.product || ''),
            sn: String(e.sn || ''),
            source: String(e.source || ''),
            createdBy: String(e.createdBy || ''),
            note: String(e.note || '')
          })) : [],
          users: apiUsers.length > 0 ? apiUsers : [],
          printSettings: apiSettings.length > 0 ? {
            storeName: apiSettings[0].storeName || defaultPrintSettings.storeName,
            address: apiSettings[0].address || defaultPrintSettings.address,
            phone: apiSettings[0].phone || defaultPrintSettings.phone,
            email: apiSettings[0].email || defaultPrintSettings.email,
            bankInfo: apiSettings[0].bankInfo || defaultPrintSettings.bankInfo,
            footNote: apiSettings[0].footNote || defaultPrintSettings.footNote
          } : prev.printSettings,
        }));
      } catch (error) {
        console.error("Failed to load data from Google Sheets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromAPI();
  }, []);

  const login = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addProduct = async (product: Product) => {
    // Optimistic update
    setState(prev => ({ ...prev, products: [...(prev.products || []), product] }));
    // API Call
    await apiService.createRecord('Products', {
      id: product.id,
      name: product.name,
      salePrice: product.price,
      costPrice: product.importPrice,
      stock: product.stock,
      hasSerial: product.hasSerial,
      isService: product.isService,
      category: product.category || '',
      unit: product.unit || '',
      brand: product.brand || '',
      warranty: product.warrantyMonths || 0,
      expectedOutOfStock: product.expectedOutOfStock || ''
    });
  };

  const updateProduct = async (id: string, updates: Partial<Product>, skipStockCard?: boolean) => {
    const product = state.products.find(p => p.id === id);
    
    setState(prev => ({
      ...prev,
      products: (prev.products || []).map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    
    // Record stock adjustment if stock changed manually and skipStockCard is not true
    if (!skipStockCard && updates.stock !== undefined && product && product.stock !== updates.stock) {
      const diff = updates.stock - (product.stock || 0);
      const card: StockCard = {
        prodId: id,
        type: diff > 0 ? 'NHAP' : 'XUAT',
        qty: Math.abs(diff),
        partner: 'Điều chỉnh kho',
        date: new Date().toLocaleString('vi-VN'),
        price: product.importPrice || 0,
        refId: 'ADJ' + Date.now().toString().slice(-6),
        sn: []
      };
      
      const cardWithId = { ...card, id: `SC${Date.now()}` };
      setState(prev => ({ ...prev, stockCards: [...(prev.stockCards || []), cardWithId] }));
      apiService.createRecord('StockCards', {
        ...cardWithId,
        productName: product.name,
        sn: ''
      });
    }
    
    // Convert updates to API format
    const apiUpdates: any = {};
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.price !== undefined) apiUpdates.salePrice = updates.price;
    if (updates.importPrice !== undefined) apiUpdates.costPrice = updates.importPrice;
    if (updates.stock !== undefined) apiUpdates.stock = updates.stock;
    if (updates.hasSerial !== undefined) apiUpdates.hasSerial = updates.hasSerial;
    if (updates.isService !== undefined) apiUpdates.isService = updates.isService;
    if (updates.category !== undefined) apiUpdates.category = updates.category;
    if (updates.unit !== undefined) apiUpdates.unit = updates.unit;
    if (updates.brand !== undefined) apiUpdates.brand = updates.brand;
    if (updates.warrantyMonths !== undefined) apiUpdates.warranty = updates.warrantyMonths;
    if (updates.expectedOutOfStock !== undefined) apiUpdates.expectedOutOfStock = updates.expectedOutOfStock;

    await apiService.updateRecord('Products', id, apiUpdates);
  };

  const updateCustomerStats = async (customerName: string) => {
    setState(prev => {
      const customer = prev.customers.find(c => c.name === customerName);
      if (!customer) return prev;

      const customerInvoices = prev.invoices.filter(inv => inv.customer === customerName);
      const customerReturns = prev.returnSalesOrders.filter(ret => ret.customer === customerName);
      
      const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0) - 
                         customerReturns.reduce((sum, ret) => sum + ret.total, 0);
      
      const debt = customerInvoices.reduce((sum, inv) => sum + inv.debt, 0) - 
                   customerReturns.reduce((sum, ret) => sum + (ret.total - ret.paid), 0);

      const updatedCustomer = { ...customer, totalSpent, debt };

      // Sync to API in background
      if (customer.id) {
        apiService.updateRecord('Customers', customer.id, { totalSpent, debt });
      }

      return {
        ...prev,
        customers: prev.customers.map(c => c.name === customerName ? updatedCustomer : c)
      };
    });
  };

  const addCustomer = async (customer: Customer) => {
    const newCustomer = { 
      ...customer, 
      id: customer.id || generateId('KH', state.customers || []),
      createdAt: customer.createdAt || new Date().toLocaleString('vi-VN'),
      createdBy: customer.createdBy || state.currentUser?.name || 'Admin'
    };
    setState(prev => ({ ...prev, customers: [...(prev.customers || []), newCustomer] }));
    await apiService.createRecord('Customers', {
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address || '',
      location: newCustomer.location || '',
      note: newCustomer.note || '',
      createdBy: newCustomer.createdBy,
      createdAt: newCustomer.createdAt,
      totalSpent: 0,
      debt: 0
    });
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setState(prev => ({
      ...prev,
      customers: (prev.customers || []).map(c => c.id === id ? { ...c, ...updates } : c)
    }));
    await apiService.updateRecord('Customers', id, updates);
  };

  const addSupplier = async (supplier: Supplier) => {
    const newSupplier = { ...supplier, id: supplier.id || generateId('NCC', state.suppliers || []) };
    setState(prev => ({ ...prev, suppliers: [...(prev.suppliers || []), newSupplier] }));
    await apiService.createRecord('Suppliers', {
      id: newSupplier.id,
      name: newSupplier.name,
      phone: newSupplier.phone
    });
  };

  const addInvoice = async (invoice: Invoice) => {
    // Find current customer to get old debt
    const customer = state.customers.find(c => c.name === invoice.customer);
    const oldDebt = customer?.debt || 0;
    const totalDebt = oldDebt + invoice.debt;

    const newInvoice = {
      ...invoice,
      id: invoice.id || generateId('HD', state.invoices || []),
      oldDebt,
      totalDebt
    };

    // Optimistic update
    setState(prev => {
      const soldSns = new Set<string>();
      newInvoice.items.forEach(item => {
        if (item.sn && typeof item.sn === 'string') {
          item.sn.split(',').forEach(s => soldSns.add(s.trim()));
        }
      });
      
      const newStockCards: StockCard[] = newInvoice.items.map(item => ({
        prodId: item.id,
        type: 'XUAT',
        qty: item.qty,
        partner: newInvoice.customer,
        date: newInvoice.date,
        price: item.price,
        refId: newInvoice.id,
        sn: item.sn ? item.sn.split(',').map(s => s.trim()) : []
      }));

      return { 
        ...prev, 
        invoices: [...(prev.invoices || []), newInvoice],
        serials: (prev.serials || []).map(s => soldSns.has(s.sn) ? { ...s, status: 'SOLD' } : s),
        stockCards: [...(prev.stockCards || []), ...newStockCards]
      };
    });
    
    // Background sync
    (async () => {
      try {
        // Save main invoice
        await apiService.createRecord('Invoices', {
          id: newInvoice.id,
          createdAt: newInvoice.date,
          customerID: newInvoice.customer,
          totalAmount: newInvoice.total + (newInvoice.discount || 0),
          totalQuantity: newInvoice.items.reduce((sum, item) => sum + item.qty, 0),
          itemCount: newInvoice.items.length,
          discount: newInvoice.discount || 0,
          finalAmount: newInvoice.total,
          paidAmount: newInvoice.paid,
          debt: newInvoice.debt,
          oldDebt: newInvoice.oldDebt,
          totalDebt: newInvoice.totalDebt,
          paymentMethod: 'CASH',
          status: newInvoice.debt > 0 ? 'Còn nợ' : 'Hoàn tất',
          note: newInvoice.note || '',
          items: JSON.stringify(newInvoice.items)
        });

        // Save invoice details and stock cards
        for (let i = 0; i < newInvoice.items.length; i++) {
          const item = newInvoice.items[i];
          await apiService.createRecord('InvoiceDetails', {
            id: `${newInvoice.id}_${i}`,
            invoiceID: newInvoice.id,
            productId: item.id,
            productName: item.name,
            quantity: item.qty,
            price: item.price,
            subTotal: item.qty * item.price,
            sn: item.sn || '',
            warrantyExpiry: item.warrantyExpiry || ''
          });

          await apiService.createRecord('StockCards', {
            id: `SC${Date.now()}${i}`,
            prodId: item.id,
            productName: item.name,
            type: 'XUAT',
            qty: item.qty,
            partner: newInvoice.customer,
            date: newInvoice.date,
            price: item.price,
            refId: newInvoice.id,
            sn: item.sn || ''
          });
        }
      } catch (error) {
        console.error("Failed to sync invoice to cloud:", error);
      }
    })();

    updateCustomerStats(newInvoice.customer);
    return newInvoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const currentInvoice = state.invoices?.find(inv => inv.id === id);
    let calculatedDebt: number | undefined;

    if (currentInvoice) {
      const newTotal = updates.total !== undefined ? updates.total : currentInvoice.total;
      const newPaid = updates.paid !== undefined ? updates.paid : currentInvoice.paid;
      calculatedDebt = newTotal - newPaid;
    }

    setState(prev => {
      const invoices = prev.invoices || [];
      return {
        ...prev,
        invoices: invoices.map(inv => {
          if (inv.id === id) {
            const newDebt = calculatedDebt !== undefined ? calculatedDebt : inv.debt;
            return { ...inv, ...updates, debt: newDebt };
          }
          return inv;
        })
      };
    });
    
    // Map updates to sheet headers
    const apiUpdates: any = {};
    if (updates.date) apiUpdates.createdAt = updates.date;
    if (updates.customer) apiUpdates.customerID = updates.customer;
    if (updates.total !== undefined) apiUpdates.finalAmount = updates.total;
    if (updates.paid !== undefined) apiUpdates.paidAmount = updates.paid;
    if (updates.discount !== undefined) apiUpdates.discount = updates.discount;
    if (updates.note !== undefined) apiUpdates.note = updates.note;

    if (calculatedDebt !== undefined) {
      apiUpdates.debt = calculatedDebt;
      apiUpdates.status = calculatedDebt > 0 ? 'Còn nợ' : 'Hoàn tất';
    } else if (updates.debt !== undefined) {
      apiUpdates.debt = updates.debt;
      apiUpdates.status = updates.debt > 0 ? 'Còn nợ' : 'Hoàn tất';
    }

    await apiService.updateRecord('Invoices', id, apiUpdates);
    if (currentInvoice) {
      updateCustomerStats(currentInvoice.customer);
    }
  };

  const addImportOrder = async (order: ImportOrder) => {
    const newOrder = {
      ...order,
      id: order.id || generateId('NH', state.importOrders || [])
    };

    const newStockCards: StockCard[] = newOrder.items.map(item => ({
      prodId: item.id,
      type: 'NHAP',
      qty: item.qty,
      partner: newOrder.supplier,
      date: newOrder.date,
      price: item.price,
      refId: newOrder.id,
      sn: item.sn || []
    }));

    setState(prev => ({ 
      ...prev, 
      importOrders: [...(prev.importOrders || []), newOrder],
      stockCards: [...(prev.stockCards || []), ...newStockCards]
    }));
    
    (async () => {
      try {
        await apiService.createRecord('Imports', {
          id: newOrder.id,
          createdAt: newOrder.date,
          supplierId: newOrder.supplier,
          totalAmount: newOrder.total,
          totalQuantity: newOrder.items.reduce((sum, item) => sum + item.qty, 0),
          itemCount: newOrder.items.length,
          discount: newOrder.discount || 0,
          returnCost: newOrder.returnCost || 0,
          shippingFee: newOrder.shippingFee || 0,
          otherCost: newOrder.otherCost || 0,
          paidAmount: newOrder.paid,
          debt: newOrder.debt,
          status: newOrder.status,
          note: newOrder.note || '',
          items: JSON.stringify(newOrder.items)
        });

        for (let i = 0; i < newOrder.items.length; i++) {
          const item = newOrder.items[i];
          await apiService.createRecord('ImportDetails', {
            id: `${newOrder.id}_${i}`,
            importID: newOrder.id,
            productId: item.id,
            productName: item.name,
            quantity: item.qty,
            price: item.price,
            subTotal: item.qty * item.price,
            sn: item.sn ? item.sn.join(',') : ''
          });

          await apiService.createRecord('StockCards', {
            id: `SC${Date.now()}${i}`,
            prodId: item.id,
            productName: item.name,
            type: 'NHAP',
            qty: item.qty,
            partner: newOrder.supplier,
            date: newOrder.date,
            price: item.price,
            refId: newOrder.id,
            sn: item.sn ? item.sn.join(',') : ''
          });
        }
      } catch (error) {
        console.error("Failed to sync import to cloud:", error);
      }
    })();
  };

  const updateImportOrder = async (id: string, updates: Partial<ImportOrder>) => {
    const currentOrder = state.importOrders?.find(o => o.id === id);
    let calculatedDebt: number | undefined;

    if (currentOrder) {
      const newTotal = updates.total !== undefined ? updates.total : currentOrder.total;
      const newPaid = updates.paid !== undefined ? updates.paid : currentOrder.paid;
      calculatedDebt = newTotal - newPaid;
    }

    setState(prev => {
      return {
        ...prev,
        importOrders: (prev.importOrders || []).map(o => {
          if (o.id === id) {
            const newDebt = calculatedDebt !== undefined ? calculatedDebt : o.debt;
            return { ...o, ...updates, debt: newDebt, status: newDebt > 0 ? 'Còn nợ' : 'Hoàn tất' };
          }
          return o;
        })
      };
    });
    
    const apiUpdates: any = {};
    if (updates.date) apiUpdates.createdAt = updates.date;
    if (updates.supplier) apiUpdates.supplierId = updates.supplier;
    if (updates.total !== undefined) apiUpdates.totalAmount = updates.total;
    if (updates.paid !== undefined) apiUpdates.paidAmount = updates.paid;
    if (updates.discount !== undefined) apiUpdates.discount = updates.discount;
    if (updates.returnCost !== undefined) apiUpdates.returnCost = updates.returnCost;
    if (updates.shippingFee !== undefined) apiUpdates.shippingFee = updates.shippingFee;
    if (updates.otherCost !== undefined) apiUpdates.otherCost = updates.otherCost;
    if (updates.note !== undefined) apiUpdates.note = updates.note;

    if (calculatedDebt !== undefined) {
      apiUpdates.debt = calculatedDebt;
      apiUpdates.status = calculatedDebt > 0 ? 'Còn nợ' : 'Hoàn tất';
    } else if (updates.debt !== undefined) {
      apiUpdates.debt = updates.debt;
      apiUpdates.status = updates.debt > 0 ? 'Còn nợ' : 'Hoàn tất';
    } else if (updates.status !== undefined) {
      apiUpdates.status = updates.status;
    }
    
    await apiService.updateRecord('Imports', id, apiUpdates);
  };

  const addReturnImportOrder = async (order: ReturnImportOrder) => {
    setState(prev => {
      const returnedSns = new Set<string>();
      order.items.forEach(item => {
        if (item.sn) {
          item.sn.forEach(s => returnedSns.add(s.trim()));
        }
      });
      
      const newStockCards: StockCard[] = order.items.map(item => ({
        prodId: item.id,
        type: 'TRA_NHAP',
        qty: item.qty,
        partner: order.supplier,
        date: order.date,
        price: item.price,
        refId: order.id,
        sn: item.sn || []
      }));

      return { 
        ...prev, 
        returnImportOrders: [...(prev.returnImportOrders || []), order],
        serials: (prev.serials || []).map(s => returnedSns.has(s.sn) ? { ...s, status: 'SOLD' } : s),
        stockCards: [...(prev.stockCards || []), ...newStockCards]
      };
    });
    
    (async () => {
      try {
        await apiService.createRecord('ReturnImports', {
          id: order.id,
          createdAt: order.date,
          date: order.date, // Fallback
          supplierId: order.supplier,
          totalGoods: order.totalGoods,
          discount: order.discount,
          totalAmount: order.total,
          totalRefund: order.total, // Match user's sheet
          receivedAmount: order.received,
          status: order.status,
          note: order.note || '',
          items: JSON.stringify(order.items)
        });

        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          await apiService.createRecord('ReturnImportDetails', {
            id: `${order.id}_${i}`,
            returnID: order.id,
            returnImportId: order.id, // Match user's sheet
            productId: item.id,
            quantity: item.qty,
            price: item.price,
            subTotal: item.qty * item.price,
            sn: item.sn ? item.sn.join(',') : ''
          });

          await apiService.createRecord('StockCards', {
            id: `SC${Date.now()}${i}`,
            prodId: item.id,
            type: 'TRA_NHAP',
            qty: item.qty,
            partner: order.supplier,
            date: order.date,
            price: item.price,
            refId: order.id,
            sn: item.sn ? item.sn.join(',') : ''
          });
        }
      } catch (error) {
        console.error("Failed to sync return import to cloud:", error);
      }
    })();
  };

  const addReturnSalesOrder = async (order: ReturnSalesOrder) => {
    setState(prev => {
      const returnedSns = new Set<string>();
      order.items.forEach(item => {
        if (item.sn && typeof item.sn === 'string') {
          item.sn.split(',').forEach(s => returnedSns.add(s.trim()));
        }
      });
      
      const newStockCards: StockCard[] = order.items.map(item => ({
        prodId: item.id,
        type: 'TRA_BAN',
        qty: item.qty,
        partner: order.customer,
        date: order.date,
        price: item.price,
        refId: order.id,
        sn: item.sn ? item.sn.split(',').map(s => s.trim()) : []
      }));

      return { 
        ...prev, 
        returnSalesOrders: [...(prev.returnSalesOrders || []), order],
        serials: (prev.serials || []).map(s => returnedSns.has(s.sn) ? { ...s, status: 'AVAILABLE' } : s),
        stockCards: [...(prev.stockCards || []), ...newStockCards]
      };
    });
    
    (async () => {
      try {
        await apiService.createRecord('ReturnSales', {
          id: order.id,
          createdAt: order.date,
          date: order.date, // Fallback
          customerID: order.customer,
          totalGoods: order.totalGoods,
          discount: order.discount,
          totalAmount: order.total,
          totalRefund: order.total, // Fallback
          paidAmount: order.paid,
          status: order.status,
          note: order.note || '',
          items: JSON.stringify(order.items)
        });

        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          await apiService.createRecord('ReturnSalesDetails', {
            id: `${order.id}_${i}`,
            returnID: order.id,
            returnSalesId: order.id, // Fallback
            productId: item.id,
            quantity: item.qty,
            price: item.price,
            subTotal: item.qty * item.price,
            sn: item.sn || ''
          });

          await apiService.createRecord('StockCards', {
            id: `SC${Date.now()}${i}`,
            prodId: item.id,
            type: 'TRA_BAN',
            qty: item.qty,
            partner: order.customer,
            date: order.date,
            price: item.price,
            refId: order.id,
            sn: item.sn || ''
          });
        }
      } catch (error) {
        console.error("Failed to sync return sales to cloud:", error);
      }
    })();

    updateCustomerStats(order.customer);
  };

  const addStockCard = async (card: StockCard) => {
    const cardWithId = { ...card, id: `SC${Date.now()}${Math.floor(Math.random() * 1000)}` };
    setState(prev => ({ ...prev, stockCards: [...(prev.stockCards || []), cardWithId] }));
    await apiService.createRecord('StockCards', {
      ...cardWithId,
      sn: card.sn ? card.sn.join(',') : ''
    });
  };

  const addSerial = async (serial: Serial) => {
    setState(prev => ({ ...prev, serials: [...(prev.serials || []), serial] }));
    await apiService.createRecord('Serials', { ...serial, id: serial.sn });
  };

  const removeSerial = async (sn: string) => {
    setState(prev => ({ ...prev, serials: (prev.serials || []).filter(s => s.sn !== sn) }));
    // Note: deleteRecord usually needs an ID, but Serials might not have a unique ID other than SN
    // For now, we'll just update local state or assume SN is the ID if the API supports it
    await apiService.deleteRecord('Serials', sn);
  };

  const addCashTransaction = async (transaction: CashTransaction) => {
    setState(prev => ({ ...prev, cashTransactions: [...(prev.cashTransactions || []), transaction] }));
    await apiService.createRecord('CashLedger', { 
      id: transaction.id || `CT${Date.now()}`,
      createdAt: transaction.date,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      referenceId: transaction.refId || '',
      partner: transaction.partner || '',
      note: transaction.note || ''
    });

    if (transaction.category === 'DEBT_COLLECTION' && transaction.partner) {
      updateCustomerStats(transaction.partner);
    }
  };

  const setPOSDraft = React.useCallback((draft: POSDraft) => {
    setState(prev => ({ ...prev, posDraft: draft }));
  }, []);

  const setImportDraft = React.useCallback((draft: ImportDraft) => {
    setState(prev => ({ ...prev, importDraft: draft }));
  }, []);

  const addMaintenanceRecord = async (record: MaintenanceRecord) => {
    setState(prev => ({ ...prev, maintenanceRecords: [...(prev.maintenanceRecords || []), record] }));
    
    apiService.createRecord('Maintenance', {
      id: record.id,
      createdAt: record.date,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      productName: record.productName,
      serialNumber: record.serialNumber || '',
      issue: record.issue,
      status: record.status,
      cost: record.cost,
      note: record.note,
      returnDate: record.returnDate || ''
    });
  };

  const updateMaintenanceRecord = async (id: string, updates: Partial<MaintenanceRecord>) => {
    setState(prev => ({
      ...prev,
      maintenanceRecords: (prev.maintenanceRecords || []).map(r => r.id === id ? { ...r, ...updates } : r)
    }));
    
    const apiUpdates: any = {};
    if (updates.date) apiUpdates.createdAt = updates.date;
    if (updates.customerName) apiUpdates.customerName = updates.customerName;
    if (updates.customerPhone) apiUpdates.customerPhone = updates.customerPhone;
    if (updates.productName) apiUpdates.productName = updates.productName;
    if (updates.serialNumber !== undefined) apiUpdates.serialNumber = updates.serialNumber;
    if (updates.issue) apiUpdates.issue = updates.issue;
    if (updates.status) apiUpdates.status = updates.status;
    if (updates.cost !== undefined) apiUpdates.cost = updates.cost;
    if (updates.note !== undefined) apiUpdates.note = updates.note;
    if (updates.returnDate !== undefined) apiUpdates.returnDate = updates.returnDate;

    apiService.updateRecord('Maintenance', id, apiUpdates);
  };

  const addExternalSerial = async (serial: ExternalSerial) => {
    setState(prev => ({ ...prev, externalSerials: [...(prev.externalSerials || []), serial] }));
    await apiService.createRecord('ExternalSerials', {
      id: serial.id,
      date: serial.date,
      product: serial.product,
      sn: serial.sn,
      customer: serial.customer || '',
      source: serial.source || '',
      createdBy: serial.createdBy || ''
    });
  };

  const addUser = async (user: User) => {
    setState(prev => ({ ...prev, users: [...(prev.users || []), user] }));
    await apiService.createRecord('Users', user);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === id ? { ...u, ...updates } : u)
    }));
    await apiService.updateRecord('Users', id, updates);
  };

  const deleteUser = async (id: string) => {
    setState(prev => ({ ...prev, users: (prev.users || []).filter(u => u.id !== id) }));
    await apiService.deleteRecord('Users', id);
  };

  const updatePrintSettings = async (settings: PrintSettings) => {
    setState(prev => ({ ...prev, printSettings: settings }));
    
    // Save to Google Sheets
    try {
      // Assuming Settings sheet exists and settings are stored in the first row (ID: main_settings)
      await apiService.updateRecord('Settings', 'main_settings', {
        id: 'main_settings',
        storeName: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        bankInfo: settings.bankInfo,
        footNote: settings.footNote
      });
      console.log('Successfully saved settings to Google Sheets');
    } catch (e) {
      console.error('Error saving settings to Google Sheets', e);
    }
  };

  return (
    <AppContext.Provider value={{ 
      ...state, 
      login,
      logout,
      addProduct, 
      updateProduct,
      addCustomer, 
      updateCustomer,
      addSupplier,
      addInvoice, 
      updateInvoice,
      addImportOrder,
      updateImportOrder,
      addReturnImportOrder,
      addReturnSalesOrder,
      addStockCard,
      addSerial,
      removeSerial,
      addCashTransaction,
      setPOSDraft,
      setImportDraft,
      addMaintenanceRecord,
      updateMaintenanceRecord,
      addExternalSerial,
      addUser,
      updateUser,
      deleteUser,
      updatePrintSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};


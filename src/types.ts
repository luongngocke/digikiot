export interface Product {
  id: string;
  name: string;
  price: number;
  importPrice: number;
  stock: number | null;
  hasSerial: boolean;
  isService: boolean;
  color: string;
  warrantyMonths?: number;
  unit?: string;
  category?: string;
  brand?: string;
  expectedOutOfStock?: string;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address?: string;
  location?: string;
  note?: string;
  createdBy?: string;
  createdAt?: string;
  totalSpent?: number;
  debt?: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalBuy?: number;
  totalDebt?: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  sn?: string;
  importPriceTotal?: number;
  warrantyExpiry?: string;
}

export interface Invoice {
  id: string;
  date: string;
  customer: string;
  phone: string;
  address?: string;
  total: number;
  paid: number;
  debt: number;
  oldDebt?: number;
  totalDebt?: number;
  items: InvoiceItem[];
  discount?: number;
  note?: string;
}

export interface ImportItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  sn?: string[];
  unit?: string;
}

export interface ImportOrder {
  id: string;
  date: string;
  supplier: string;
  status: 'DRAFT' | 'DONE' | 'Còn nợ' | 'Hoàn tất';
  items: ImportItem[];
  total: number;
  paid: number;
  debt: number;
  discount?: number;
  returnCost?: number;
  shippingFee?: number;
  otherCost?: number;
  note?: string;
  returned?: boolean;
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'RECEIPT' | 'PAYMENT'; // THU | CHI
  amount: number;
  category: 'SALE' | 'IMPORT' | 'DEBT_COLLECTION' | 'DEBT_PAYMENT' | 'SALES_REVENUE' | 'IMPORT_PAYMENT' | 'OTHER';
  partner: string;
  note: string;
  refId?: string; // ID of Invoice or ImportOrder
}

export interface POSDraft {
  activeTab: number;
  tabs: {
    id: number;
    name: string;
    cart: (InvoiceItem & { hasSerial?: boolean; serials?: string[] })[];
    discount: number;
    paid: number | '';
    selectedCustomer: Customer | null;
    note: string;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'WALLET';
  }[];
}

export interface ImportDraft {
  cart: ImportItem[];
  selectedSupplier: Supplier | null;
  paid: number | '';
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  serialNumber?: string;
  issue: string;
  status: 'RECEIVING' | 'REPAIRING' | 'COMPLETED' | 'RETURNED';
  cost: number;
  note: string;
  returnDate?: string;
}

export interface ReturnImportOrder {
  id: string;
  date: string;
  supplier: string;
  items: ImportItem[];
  totalGoods: number;
  discount: number;
  total: number; // NCC cần trả
  received: number; // NCC đã trả
  status: 'DONE' | 'DRAFT';
  note?: string;
}

export interface ReturnSalesOrder {
  id: string;
  date: string;
  customer: string;
  items: InvoiceItem[];
  totalGoods: number;
  discount: number;
  total: number; // Cần trả khách
  paid: number; // Đã trả khách
  status: 'DONE' | 'DRAFT';
  note?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'ADMIN' | 'CASHIER' | 'STOCKKEEPER';
}

export interface Serial {
  prodId: string;
  sn: string;
  supplier: string;
  importPrice: number;
  date: string;
  refId: string;
  status?: 'AVAILABLE' | 'SOLD';
}

export interface StockCard {
  prodId: string;
  type: 'NHAP' | 'XUAT' | 'TRA_NHAP' | 'TRA_BAN';
  qty: number;
  partner: string;
  date: string;
  price: number;
  refId: string;
  sn: string[];
}

export interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  bankInfo: string;
  footNote: string;
}

export interface ExternalSerial {
  id: string;
  date: string;
  product: string;
  sn: string;
  customer?: string;
  source?: string;
  createdBy?: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  importOrders: ImportOrder[];
  returnImportOrders: ReturnImportOrder[];
  returnSalesOrders: ReturnSalesOrder[];
  cashTransactions: CashTransaction[];
  maintenanceRecords: MaintenanceRecord[];
  serials: Serial[];
  stockCards: StockCard[];
  externalSerials: ExternalSerial[];
  posDraft?: POSDraft;
  importDraft?: ImportDraft;
  printSettings: PrintSettings;
}

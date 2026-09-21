export type OrderStatus =
  | 'جديد'
  | 'لم يتم التواصل'
  | 'تم فتح واتساب'
  | 'تم إرسال التأكيد'
  | 'تم التأكيد'
  | 'طلب تعديل البيانات'
  | 'لا يرد'
  | 'ملغي';

export interface ProductItem {
  code: string;
  name?: string;
  quantity: number;
  price?: number;
}

export interface OrderItem {
  id: string; // Unique internal ID
  orderId: string; // e.g. ORD-1052
  customerName: string;
  phone: string; // Raw input phone
  cleanPhone: string; // WhatsApp formatted phone (e.g. 201012345678)
  address: string;
  governorate?: string;
  products: ProductItem[];
  productsSummary: string; // Multiline or comma separated codes
  totalPrice: number;
  notes?: string;
  status: OrderStatus;
  customMessage?: string; // Specific message override for this order
  lastActionDate?: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  duplicateWithOrderId?: string;
  validationErrors: string[];
  rawRow?: Record<string, any>; // Original row data for clean export
}

export interface ColumnMapping {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  productCode: string;
  quantity: string;
  price: string;
  notes: string;
  governorate: string;
}

export interface AppSettings {
  storeName: string;
  defaultCountryCode: string; // e.g. "20"
  messageTemplate: string;
  autoAdvanceInQuickMode: boolean;
}

export type ActiveTab = 'dashboard' | 'orders' | 'quick-confirm' | 'upload' | 'settings';

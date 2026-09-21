import { OrderItem, AppSettings, ColumnMapping } from '../types';
import { DEFAULT_MESSAGE_TEMPLATE, DEFAULT_STORE_NAME } from './messageUtils';

const STORAGE_KEYS = {
  ORDERS: 'order_wa_orders_data_v1',
  SETTINGS: 'order_wa_settings_v1',
  MAPPING: 'order_wa_mapping_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: DEFAULT_STORE_NAME,
  defaultCountryCode: '20',
  messageTemplate: DEFAULT_MESSAGE_TEMPLATE,
  autoAdvanceInQuickMode: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

export function loadOrders(): OrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load orders from storage', e);
  }
  return [];
}

export function saveOrders(orders: OrderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to storage', e);
  }
}

export function loadMapping(): ColumnMapping | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAPPING);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load mapping from storage', e);
  }
  return null;
}

export function saveMapping(mapping: ColumnMapping): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MAPPING, JSON.stringify(mapping));
  } catch (e) {
    console.error('Failed to save mapping to storage', e);
  }
}

export function clearAllStoredData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.MAPPING);
  } catch (e) {
    console.error('Failed to clear stored data', e);
  }
}

/**
 * Generates initial demo orders for quick exploration matching the prompt example
 */
export function getInitialDemoOrders(): OrderItem[] {
  return [
    {
      id: 'demo_1',
      orderId: 'ORD-1052',
      customerName: 'محمد أحمد',
      phone: '01012345678',
      cleanPhone: '201012345678',
      address: 'القاهرة - مدينة نصر - شارع عباس العقاد',
      governorate: 'القاهرة',
      products: [
        { code: 'BAG-115', quantity: 1, price: 424.5 },
        { code: 'BAG-210', quantity: 1, price: 424.5 },
      ],
      productsSummary: 'BAG-115\nBAG-210',
      totalPrice: 849,
      notes: 'الاتصال قبل المجيء بساعة - الدور الثالث',
      status: 'جديد',
      validationErrors: [],
    },
    {
      id: 'demo_2',
      orderId: 'ORD-1053',
      customerName: 'سارة محمود خليل',
      phone: '01123456789',
      cleanPhone: '201123456789',
      address: 'الجيزة - الدقي - شارع مصدق أمام سينما التحرير',
      governorate: 'الجيزة',
      products: [{ code: 'BAG-304-BLK', quantity: 1, price: 620 }],
      productsSummary: 'BAG-304-BLK',
      totalPrice: 620,
      notes: 'توصيل مسائي بعد 4 عصراً',
      status: 'جديد',
      validationErrors: [],
    },
    {
      id: 'demo_3',
      orderId: 'ORD-1054',
      customerName: 'أحمد السيد البدوي',
      phone: '01234567890',
      cleanPhone: '201234567890',
      address: 'الإسكندرية - سموحة - برج النصر الدور الرابع',
      governorate: 'الإسكندرية',
      products: [{ code: 'BAG-770-BRN', quantity: 2, price: 1150 }],
      productsSummary: 'BAG-770-BRN (×2)',
      totalPrice: 1150,
      notes: 'دفع كاش عند الاستلام',
      status: 'تم فتح واتساب',
      lastActionDate: 'اليوم، 10:30 ص',
      validationErrors: [],
    },
    {
      id: 'demo_4',
      orderId: 'ORD-1055',
      customerName: 'نورهان عبد الرحمن',
      phone: '٠١٥٩٨٧٦٥٤٣٢',
      cleanPhone: '201598765432',
      address: 'الشرقية - الزقازيق - القومية بجوار مستشفى الجامعة',
      governorate: 'الشرقية',
      products: [{ code: 'BAG-108-PINK', quantity: 1, price: 490 }],
      productsSummary: 'BAG-108-PINK',
      totalPrice: 490,
      notes: 'تغليف هدية ومرفق كارت إهداء',
      status: 'تم التأكيد',
      lastActionDate: 'اليوم، 11:15 ص',
      validationErrors: [],
    },
    {
      id: 'demo_5',
      orderId: 'ORD-1056',
      customerName: 'كريم حسام',
      phone: '+201098765432',
      cleanPhone: '201098765432',
      address: 'القليوبية - بنها - الفلل شارع الكورنيش',
      governorate: 'القليوبية',
      products: [{ code: 'BAG-902', quantity: 1, price: 730 }],
      productsSummary: 'BAG-902',
      totalPrice: 730,
      notes: '',
      status: 'لا يرد',
      lastActionDate: 'اليوم، 09:45 ص',
      validationErrors: [],
    },
    {
      id: 'demo_6',
      orderId: 'ORD-1057',
      customerName: 'ياسمين مصطفى',
      phone: '01000112233',
      cleanPhone: '201000112233',
      address: 'الدقهلية - المنصورة - المشاية السفلية',
      governorate: 'الدقهلية',
      products: [{ code: 'BAG-550-GOLD', quantity: 1, price: 980 }],
      productsSummary: 'BAG-550-GOLD',
      totalPrice: 980,
      notes: 'تأكيد المقاس قبل الشحن',
      status: 'جديد',
      validationErrors: [],
    },
    {
      id: 'demo_7',
      orderId: 'ORD-1058',
      customerName: 'عمرو زكي',
      phone: '01012345678', // Same phone as Mohamed Ahmed
      cleanPhone: '201012345678',
      address: 'القاهرة - التجمع الخامس - البنفسج 4',
      governorate: 'القاهرة',
      products: [{ code: 'BAG-115', quantity: 1, price: 849 }],
      productsSummary: 'BAG-115',
      totalPrice: 849,
      notes: 'تكرار نفس رقم الهاتف',
      status: 'جديد',
      isDuplicate: true,
      duplicateReason: 'تكرار نفس رقم الهاتف والمنتج والسعر',
      duplicateWithOrderId: 'ORD-1052',
      validationErrors: [],
    },
    {
      id: 'demo_8',
      orderId: 'ORD-1059',
      customerName: 'محمود عبد الفتاح',
      phone: '0101234', // invalid short phone
      cleanPhone: '',
      address: 'البحيرة - دمنهور - شارع عبد السلام الشاذلي',
      governorate: 'البحيرة',
      products: [{ code: 'BAG-404', quantity: 1, price: 550 }],
      productsSummary: 'BAG-404',
      totalPrice: 550,
      notes: 'الرقم ناقص للتجربة',
      status: 'جديد',
      validationErrors: ['رقم الموبايل المصري يجب أن يكون 11 رقماً'],
    },
  ];
}

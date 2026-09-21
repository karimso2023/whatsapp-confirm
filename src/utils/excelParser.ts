import * as XLSX from 'xlsx';
import { OrderItem, ColumnMapping, ProductItem, OrderStatus } from '../types';
import { processPhoneNumber, normalizeDigits } from './phoneUtils';

export const EGYPTIAN_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'القليوبية',
  'كفر الشيخ',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'الإسماعيلية',
  'بورسعيد',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'دمياط',
];

/**
 * Normalizes text for header matching (lowercases, trims, strips extra spaces and punctuation)
 */
function normalizeHeader(str: string): string {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ');
}

/**
 * Smart Column Identification
 */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    orderId: '',
    customerName: '',
    phone: '',
    address: '',
    productCode: '',
    quantity: '',
    price: '',
    notes: '',
    governorate: '',
  };

  const patterns: Record<keyof ColumnMapping, string[]> = {
    orderId: [
      'كود الأوردر',
      'رقم الأوردر',
      'كود الاوردر',
      'رقم الاوردر',
      'order id',
      'order code',
      'order number',
      'order no',
      'order_id',
      'order',
      'رقم الطلب',
      'كود الطلب',
      'الطلب',
      'id',
      'reference',
      'ref',
    ],
    customerName: [
      'اسم العميل',
      'الاسم',
      'اسم الزبون',
      'المستلم',
      'اسم المستلم',
      'customer name',
      'customer',
      'client name',
      'client',
      'full name',
      'name',
    ],
    phone: [
      'رقم الهاتف',
      'الموبايل',
      'رقم الموبايل',
      'الهاتف',
      'تليفون',
      'رقم التليفون',
      'الجوال',
      'رقم الجوال',
      'phone number',
      'phone',
      'mobile number',
      'mobile',
      'telephone',
      'tel',
      'whatsapp',
      'واتساب',
    ],
    address: [
      'العنوان',
      'عنوان العميل',
      'تفاصيل العنوان',
      'الشارع',
      'عنوان الشحن',
      'customer address',
      'shipping address',
      'address',
      'street',
      'location',
    ],
    productCode: [
      'كود الشنطة',
      'كود المنتج',
      'كود',
      'المنتج',
      'اسم المنتج',
      'الصنف',
      'الموديل',
      'السلعة',
      'product code',
      'item code',
      'product',
      'sku',
      'item',
      'bag code',
      'model',
    ],
    quantity: [
      'الكمية',
      'العدد',
      'الكميه',
      'quantity',
      'qty',
      'count',
      'amount_items',
    ],
    price: [
      'السعر',
      'الإجمالي',
      'الاجمالي',
      'المبلغ',
      'قيمة الأوردر',
      'قيمة الطلب',
      'المجموع',
      'total price',
      'total',
      'price',
      'amount',
      'order total',
      'cost',
    ],
    notes: [
      'ملاحظات',
      'الملاحظات',
      'تعليق',
      'ملاحظات الشحن',
      'notes',
      'note',
      'comments',
      'comment',
      'remark',
    ],
    governorate: [
      'المحافظة',
      'المحافظه',
      'المدينة',
      'المنطقة',
      'governorate',
      'city',
      'province',
      'state',
      'region',
    ],
  };

  const assigned = new Set<string>();

  // Check each field against headers
  for (const [key, searchPatterns] of Object.entries(patterns) as [keyof ColumnMapping, string[]][]) {
    for (const pattern of searchPatterns) {
      const match = headers.find((h) => {
        if (assigned.has(h)) return false;
        const normH = normalizeHeader(h);
        const normP = normalizeHeader(pattern);
        return normH === normP || normH.includes(normP);
      });

      if (match) {
        mapping[key] = match;
        assigned.add(match);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Cleans numerical price value from strings (e.g. "850 ج.م" -> 850)
 */
export function cleanPrice(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  
  const str = normalizeDigits(String(value)).trim();
  // Remove currency words
  const cleanStr = str.replace(/[^\d.,]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Cleans quantity value
 */
export function cleanQuantity(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 1 : Math.max(1, Math.round(value));
  if (!value) return 1;
  const str = normalizeDigits(String(value)).trim();
  const parsed = parseInt(str.replace(/[^\d]/g, ''), 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

/**
 * Detects Egyptian governorate from text
 */
export function detectGovernorate(text: string): string | undefined {
  if (!text) return undefined;
  for (const gov of EGYPTIAN_GOVERNORATES) {
    if (text.includes(gov)) {
      return gov;
    }
  }
  return undefined;
}

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ColumnMapping;
  orders: OrderItem[];
  error?: string;
}

/**
 * Parses an Excel or CSV file buffer and builds grouped orders
 */
export async function parseExcelFile(
  file: File,
  customMapping?: ColumnMapping,
  defaultCountryCode = '20'
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return resolve({
            headers: [],
            rawRows: [],
            detectedMapping: guessColumnMapping([]),
            orders: [],
            error: 'الملف لا يحتوي على أي صفحات عمل (Sheets)',
          });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({
            headers: [],
            rawRows: [],
            detectedMapping: guessColumnMapping([]),
            orders: [],
            error: 'ملف Excel فارغ تماماً',
          });
        }

        // Identify header row (first row with at least 2 non-empty values)
        let headerRowIndex = 0;
        while (
          headerRowIndex < rawJson.length &&
          rawJson[headerRowIndex].filter((c) => String(c).trim() !== '').length < 2
        ) {
          headerRowIndex++;
        }

        if (headerRowIndex >= rawJson.length) {
          return resolve({
            headers: [],
            rawRows: [],
            detectedMapping: guessColumnMapping([]),
            orders: [],
            error: 'لم نتمكن من العثور على صف أسماء الأعمدة في الملف',
          });
        }

        const rawHeaderRow = rawJson[headerRowIndex];
        const headers: string[] = rawHeaderRow
          .map((h: any, idx: number) => String(h || '').trim() || `عمود ${idx + 1}`)
          .filter((h: string) => h.length > 0);

        // Convert rows to objects
        const rawRows: Record<string, any>[] = [];
        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const rowData = rawJson[r];
          if (!rowData || rowData.every((val: any) => String(val).trim() === '')) {
            continue; // skip completely empty rows
          }
          const rowObj: Record<string, any> = {};
          headers.forEach((header, colIdx) => {
            rowObj[header] = rowData[colIdx] !== undefined ? rowData[colIdx] : '';
          });
          rawRows.push(rowObj);
        }

        if (rawRows.length === 0) {
          return resolve({
            headers,
            rawRows: [],
            detectedMapping: guessColumnMapping(headers),
            orders: [],
            error: 'الملف لا يحتوي على أي صفوف بيانات للأوردرات',
          });
        }

        const mapping = customMapping || guessColumnMapping(headers);
        const orders = groupAndProcessRows(rawRows, mapping, defaultCountryCode);

        resolve({
          headers,
          rawRows,
          detectedMapping: mapping,
          orders,
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'حدث خطأ أثناء قراءة ملف Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('فشل قراءة الملف من الجهاز'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Groups multiple product rows by Order ID (or Phone + Name if orderId missing)
 * and generates clean OrderItem array
 */
export function groupAndProcessRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  defaultCountryCode = '20'
): OrderItem[] {
  // Map to group order items
  const orderGroups = new Map<string, {
    orderId: string;
    customerName: string;
    phone: string;
    address: string;
    governorate?: string;
    products: ProductItem[];
    priceValues: number[];
    notesList: string[];
    rawRows: Record<string, any>[];
  }>();

  rows.forEach((row, index) => {
    const rawOrderId = mapping.orderId ? String(row[mapping.orderId] || '').trim() : '';
    const rawCustomerName = mapping.customerName ? String(row[mapping.customerName] || '').trim() : '';
    const rawPhone = mapping.phone ? String(row[mapping.phone] || '').trim() : '';
    const rawAddress = mapping.address ? String(row[mapping.address] || '').trim() : '';
    const rawProduct = mapping.productCode ? String(row[mapping.productCode] || '').trim() : '';
    const rawQty = mapping.quantity ? cleanQuantity(row[mapping.quantity]) : 1;
    const rawPrice = mapping.price ? cleanPrice(row[mapping.price]) : 0;
    const rawNotes = mapping.notes ? String(row[mapping.notes] || '').trim() : '';
    const rawGov = mapping.governorate ? String(row[mapping.governorate] || '').trim() : '';

    // Grouping key: orderId if available; else phone + customerName; else unique row index
    let groupKey = '';
    if (rawOrderId) {
      groupKey = `order_${rawOrderId.toUpperCase()}`;
    } else if (rawPhone && rawCustomerName) {
      groupKey = `phone_name_${rawPhone}_${rawCustomerName}`;
    } else if (rawPhone) {
      groupKey = `phone_${rawPhone}`;
    } else {
      groupKey = `row_${index}`;
    }

    if (!orderGroups.has(groupKey)) {
      orderGroups.set(groupKey, {
        orderId: rawOrderId || `ORD-${1000 + index}`,
        customerName: rawCustomerName,
        phone: rawPhone,
        address: rawAddress,
        governorate: rawGov || detectGovernorate(rawAddress),
        products: [],
        priceValues: [],
        notesList: [],
        rawRows: [],
      });
    }

    const group = orderGroups.get(groupKey)!;

    // Fill in missing details from other rows if current row has better data
    if (!group.customerName && rawCustomerName) group.customerName = rawCustomerName;
    if (!group.phone && rawPhone) group.phone = rawPhone;
    if (!group.address && rawAddress) {
      group.address = rawAddress;
      group.governorate = group.governorate || detectGovernorate(rawAddress);
    }
    if (!group.governorate && rawGov) group.governorate = rawGov;

    if (rawProduct) {
      // Check if product already added in this group
      const existingProd = group.products.find((p) => p.code === rawProduct);
      if (existingProd) {
        existingProd.quantity += rawQty;
      } else {
        group.products.push({
          code: rawProduct,
          quantity: rawQty,
          price: rawPrice,
        });
      }
    }

    if (rawPrice > 0) {
      group.priceValues.push(rawPrice);
    }

    if (rawNotes && !group.notesList.includes(rawNotes)) {
      group.notesList.push(rawNotes);
    }

    group.rawRows.push(row);
  });

  const orders: OrderItem[] = [];
  const seenKeys = new Map<string, string>(); // for duplicate tracking

  let internalCounter = 1;

  for (const [, group] of orderGroups.entries()) {
    const internalId = `item_${Date.now()}_${internalCounter++}`;

    // Process Phone
    const phoneRes = processPhoneNumber(group.phone, defaultCountryCode);

    // Calculate Price:
    // If every row had the same total price (e.g. repeated in sheet), take the max/first;
    // If different prices and multiple products, sum them.
    let calculatedTotalPrice = 0;
    if (group.priceValues.length > 0) {
      const allEqual = group.priceValues.every((p) => p === group.priceValues[0]);
      if (allEqual) {
        // e.g. An order with 2 items where total price is entered on each row
        calculatedTotalPrice = group.priceValues[0];
      } else {
        // Different prices per row -> sum
        calculatedTotalPrice = group.priceValues.reduce((a, b) => a + b, 0);
      }
    }

    // Default fallback product if no products found in sheet
    if (group.products.length === 0) {
      group.products.push({
        code: 'طلب عام',
        quantity: 1,
        price: calculatedTotalPrice,
      });
    }

    // Summary of products
    const productsSummary = group.products
      .map((p) => (p.quantity > 1 ? `${p.code} (×${p.quantity})` : p.code))
      .join('\n');

    // Validation
    const validationErrors: string[] = [];
    if (!group.customerName) {
      validationErrors.push('اسم العميل مفقود');
    }
    if (!group.phone) {
      validationErrors.push('رقم الهاتف مفقود');
    } else if (!phoneRes.isValid) {
      validationErrors.push(phoneRes.error || 'رقم الهاتف غير صالح');
    }
    if (!group.address) {
      validationErrors.push('العنوان مفقود');
    }
    if (calculatedTotalPrice <= 0) {
      validationErrors.push('السعر غير محدد');
    }

    const orderItem: OrderItem = {
      id: internalId,
      orderId: group.orderId,
      customerName: group.customerName,
      phone: group.phone,
      cleanPhone: phoneRes.cleanPhone,
      address: group.address,
      governorate: group.governorate,
      products: group.products,
      productsSummary,
      totalPrice: calculatedTotalPrice,
      notes: group.notesList.join(' | '),
      status: 'جديد',
      validationErrors,
      rawRow: group.rawRows[0],
    };

    orders.push(orderItem);
  }

  // Check for duplicates across orders
  orders.forEach((order) => {
    // Check collision criteria
    const phoneAndOrderKey = `PO:${order.cleanPhone}_${order.orderId.toLowerCase()}`;
    const phoneProductPriceKey = `PPP:${order.cleanPhone}_${order.productsSummary}_${order.totalPrice}`;

    if (order.cleanPhone) {
      if (seenKeys.has(phoneAndOrderKey)) {
        order.isDuplicate = true;
        order.duplicateReason = 'تكرار نفس رقم الهاتف وكود الأوردر';
        order.duplicateWithOrderId = seenKeys.get(phoneAndOrderKey);
      } else if (seenKeys.has(phoneProductPriceKey)) {
        order.isDuplicate = true;
        order.duplicateReason = 'تكرار نفس رقم الهاتف والمنتجات والسعر';
        order.duplicateWithOrderId = seenKeys.get(phoneProductPriceKey);
      } else {
        seenKeys.set(phoneAndOrderKey, order.orderId);
        seenKeys.set(phoneProductPriceKey, order.orderId);
      }
    }
  });

  return orders;
}

/**
 * Generates and downloads a sample Excel file with realistic Egyptian test orders
 */
export function downloadSampleExcel(): void {
  const sampleData = [
    {
      'كود الأوردر': 'ORD-1052',
      'اسم العميل': 'محمد أحمد',
      'رقم الهاتف': '01012345678',
      'العنوان': 'القاهرة - مدينة نصر - شارع عباس العقاد',
      'كود الشنطة': 'BAG-115',
      'الكمية': 1,
      'السعر': 849,
      'الملاحظات': 'يرجى الاتصال قبل التوصيل بنصف ساعة',
    },
    {
      'كود الأوردر': 'ORD-1052',
      'اسم العميل': 'محمد أحمد',
      'رقم الهاتف': '01012345678',
      'العنوان': 'القاهرة - مدينة نصر - شارع عباس العقاد',
      'كود الشنطة': 'BAG-210',
      'الكمية': 1,
      'السعر': 849,
      'الملاحظات': 'نفس أوردر محمد أحمد (منتج ثاني)',
    },
    {
      'كود الأوردر': 'ORD-1053',
      'اسم العميل': 'سارة محمود خليل',
      'رقم الهاتف': '01123456789',
      'العنوان': 'الجيزة - الدقي - شارع مصدق أمام سينما التحرير',
      'كود الشنطة': 'BAG-304-BLK',
      'الكمية': 1,
      'السعر': 620,
      'الملاحظات': 'توصيل مسائي بعد 4 عصراً',
    },
    {
      'كود الأوردر': 'ORD-1054',
      'اسم العميل': 'أحمد السيد البدوي',
      'رقم الهاتف': '01234567890',
      'العنوان': 'الإسكندرية - سموحة - برج النصر الدور الرابع',
      'كود الشنطة': 'BAG-770-BRN',
      'الكمية': 2,
      'السعر': 1150,
      'الملاحظات': 'دفع كاش عند الاستلام',
    },
    {
      'كود الأوردر': 'ORD-1055',
      'اسم العميل': 'نورهان عبد الرحمن',
      'رقم الهاتف': '٠١٥٩٨٧٦٥٤٣٢', // Arabic numerals test
      'العنوان': 'الشرقية - الزقازيق - القومية بجوار مستشفى الجامعة',
      'كود الشنطة': 'BAG-108-PINK',
      'الكمية': 1,
      'السعر': 490,
      'الملاحظات': 'تغليف هدية إن أمكن',
    },
    {
      'كود الأوردر': 'ORD-1056',
      'اسم العميل': 'كريم حسام',
      'رقم الهاتف': '+201098765432',
      'العنوان': 'القليوبية - بنها - الفلل شارع الكورنيش',
      'كود الشنطة': 'BAG-902',
      'الكمية': 1,
      'السعر': 730,
      'الملاحظات': '',
    },
    {
      'كود الأوردر': 'ORD-1057',
      'اسم العميل': 'ياسمين مصطفى',
      'رقم الهاتف': '01000112233',
      'العنوان': 'الدقهلية - المنصورة - المشاية السفلية',
      'كود الشنطة': 'BAG-550-GOLD',
      'الكمية': 1,
      'السعر': 980,
      'الملاحظات': 'تأكيد المقاس قبل الشحن',
    },
    {
      'كود الأوردر': 'ORD-1058',
      'اسم العميل': 'عمرو زكي',
      'رقم الهاتف': '01012345678', // duplicate phone test!
      'العنوان': 'القاهرة - التجمع الخامس - البنفسج',
      'كود الشنطة': 'BAG-115',
      'الكمية': 1,
      'السعر': 849,
      'الملاحظات': 'أوردر مكرر للتجربة',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الأوردرات');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 38 },
    { wch: 16 },
    { wch: 8 },
    { wch: 12 },
    { wch: 32 },
  ];

  XLSX.writeFile(workbook, 'نموذج_أوردرات_تجريبي.xlsx');
}

/**
 * Exports current orders back to Excel with WhatsApp status and audit columns
 */
export function exportOrdersToExcel(orders: OrderItem[], filename = 'تقرير_أوردرات_واتساب.xlsx'): void {
  const exportRows = orders.map((o) => {
    // Preserve original row keys if possible, plus confirmation status columns
    const base: Record<string, any> = o.rawRow ? { ...o.rawRow } : {};

    return {
      'رقم الأوردر': o.orderId,
      'اسم العميل': o.customerName,
      'رقم الهاتف الأصلي': o.phone,
      'رقم واتساب المنسق': o.cleanPhone,
      'حالة التواصل': o.status,
      'العنوان': o.address,
      'المحافظة': o.governorate || '',
      'المنتجات': o.productsSummary,
      'إجمالي السعر': o.totalPrice,
      'تاريخ آخر إجراء': o.lastActionDate || '',
      'أوردر مكرر؟': o.isDuplicate ? `نعم (${o.duplicateReason || ''})` : 'لا',
      'ملاحظات': o.notes || '',
      'رسالة مخصصة': o.customMessage || '',
      ...base,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الأوردرات');

  XLSX.writeFile(workbook, filename);
}

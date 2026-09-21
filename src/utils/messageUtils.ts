import { OrderItem } from '../types';

export const DEFAULT_STORE_NAME = 'My Store';

export const DEFAULT_MESSAGE_TEMPLATE = `أهلاً يا {{customer_name}} 👋

معاك فريق {{store_name}} ❤️

بنأكد مع حضرتك بيانات الأوردر:

🧾 رقم الأوردر: {{order_id}}

👜 المنتج / الكود:
{{products}}

💰 إجمالي الأوردر: {{total_price}} جنيه

📍 العنوان:
{{address}}

📞 رقم الموبايل:
{{phone}}

لو البيانات كلها صحيحة، ياريت تبعتلنا:
"تم التأكيد ✅"

ولو محتاج تعدل أي بيانات ابعتهالنا قبل الشحن.

شكرًا لثقتك في {{store_name}} ❤️`;

export interface TemplateVariableInfo {
  tag: string;
  name: string;
  example: string;
}

export const TEMPLATE_VARIABLES: TemplateVariableInfo[] = [
  { tag: '{{customer_name}}', name: 'اسم العميل', example: 'محمد أحمد' },
  { tag: '{{store_name}}', name: 'اسم المتجر', example: 'My Store' },
  { tag: '{{order_id}}', name: 'رقم الأوردر', example: 'ORD-1052' },
  { tag: '{{products}}', name: 'قائمة المنتجات والأكواد', example: 'BAG-115\nBAG-210' },
  { tag: '{{product_code}}', name: 'كود المنتج الأول', example: 'BAG-115' },
  { tag: '{{total_price}}', name: 'إجمالي السعر', example: '849' },
  { tag: '{{price}}', name: 'السعر', example: '849' },
  { tag: '{{quantity}}', name: 'إجمالي الكمية', example: '2' },
  { tag: '{{address}}', name: 'العنوان', example: 'القاهرة - مدينة نصر' },
  { tag: '{{phone}}', name: 'رقم الهاتف المعروض', example: '01012345678' },
  { tag: '{{notes}}', name: 'ملاحظات الأوردر', example: 'التسليم بعد الساعة 5' },
];

/**
 * Compiles a WhatsApp confirmation message for a given order using the template
 */
export function compileMessage(
  template: string,
  order: OrderItem,
  storeName: string
): string {
  if (order.customMessage && order.customMessage.trim().length > 0) {
    return order.customMessage;
  }

  const primaryProductCode = order.products[0]?.code || '';
  const totalQty = order.products.reduce((acc, p) => acc + (p.quantity || 1), 0);

  const replacements: Record<string, string> = {
    '{{customer_name}}': order.customerName || 'عميلنا العزيز',
    '{{store_name}}': storeName || 'فريق العمل',
    '{{order_id}}': order.orderId || 'غير محدد',
    '{{products}}': order.productsSummary || primaryProductCode || 'المنتجات المطلوبة',
    '{{product_code}}': primaryProductCode,
    '{{total_price}}': order.totalPrice ? order.totalPrice.toLocaleString('ar-EG') : '0',
    '{{price}}': order.totalPrice ? order.totalPrice.toString() : '0',
    '{{quantity}}': totalQty.toString(),
    '{{address}}': order.address || 'العنوان المسجل',
    '{{phone}}': order.phone || '',
    '{{notes}}': order.notes || 'لا توجد ملاحظات',
  };

  let message = template;
  for (const [key, value] of Object.entries(replacements)) {
    // Replace all occurrences of the tag
    message = message.split(key).join(value);
  }

  return message;
}

/**
 * Generates the wa.me link with fully encoded message
 */
export function generateWhatsAppLink(cleanPhone: string, message: string): string {
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Inserts text at the cursor position in a textarea element
 */
export function insertAtCursor(
  textarea: HTMLTextAreaElement,
  textToInsert: string,
  currentValue: string,
  onChange: (newValue: string) => void
): void {
  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;
  
  const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
  onChange(newValue);

  // Restore cursor right after the inserted text
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
  }, 0);
}

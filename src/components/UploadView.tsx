import React, { useState, useRef } from 'react';
import { ColumnMapping, OrderItem } from '../types';
import {
  parseExcelFile,
  guessColumnMapping,
  groupAndProcessRows,
  downloadSampleExcel,
} from '../utils/excelParser';
import { getInitialDemoOrders } from '../utils/storage';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Sparkles,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface UploadViewProps {
  onOrdersImported: (orders: OrderItem[], mapping: ColumnMapping) => void;
  defaultCountryCode: string;
  savedMapping?: ColumnMapping | null;
  onNavigateToOrders: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onOrdersImported,
  defaultCountryCode,
  savedMapping,
  onNavigateToOrders,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staged file state for mapping review
  const [fileName, setFileName] = useState<string>('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(
    savedMapping || {
      orderId: '',
      customerName: '',
      phone: '',
      address: '',
      productCode: '',
      quantity: '',
      price: '',
      notes: '',
      governorate: '',
    }
  );
  const [previewOrders, setPreviewOrders] = useState<OrderItem[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setError('نوع الملف غير مدعوم. يرجى رفع ملف بصيغة .xlsx أو .xls أو .csv');
      setIsProcessing(false);
      return;
    }

    try {
      const res = await parseExcelFile(file, undefined, defaultCountryCode);
      if (res.error) {
        setError(res.error);
        setIsProcessing(false);
        return;
      }

      setFileName(file.name);
      setFileHeaders(res.headers);
      setRawRows(res.rawRows);

      // Use detected mapping or saved mapping merged with detected
      const effectiveMapping = {
        ...res.detectedMapping,
        ...(savedMapping || {}),
      };
      // Keep detected if saved field is not in this file's headers
      Object.keys(effectiveMapping).forEach((key) => {
        const k = key as keyof ColumnMapping;
        if (effectiveMapping[k] && !res.headers.includes(effectiveMapping[k])) {
          effectiveMapping[k] = res.detectedMapping[k] || '';
        }
      });

      setMapping(effectiveMapping);
      setPreviewOrders(res.orders.slice(0, 5));
      setStep('mapping');
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء معالجة الملف.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    if (rawRows.length > 0) {
      const updatedOrders = groupAndProcessRows(rawRows, updated, defaultCountryCode);
      setPreviewOrders(updatedOrders.slice(0, 5));
    }
  };

  const handleConfirmImport = () => {
    if (rawRows.length === 0) return;
    const finalOrders = groupAndProcessRows(rawRows, mapping, defaultCountryCode);
    onOrdersImported(finalOrders, mapping);
    onNavigateToOrders();
  };

  const handleLoadDemoData = () => {
    const demos = getInitialDemoOrders();
    const demoMapping: ColumnMapping = {
      orderId: 'كود الأوردر',
      customerName: 'اسم العميل',
      phone: 'رقم الهاتف',
      address: 'العنوان',
      productCode: 'كود الشنطة',
      quantity: 'الكمية',
      price: 'السعر',
      notes: 'الملاحظات',
      governorate: '',
    };
    onOrdersImported(demos, demoMapping);
    onNavigateToOrders();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            رفع ومعالجة ملف الأوردرات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ارفع شيت أوردرات المتجر (.xlsx, .xls, .csv). تتم المعالجة محلياً في متصفحك للحفاظ على سرية وخصوصية بيانات العملاء.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-download-sample-excel"
            onClick={downloadSampleExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تحميل شيت تجريبي (.xlsx)</span>
          </button>

          <button
            id="btn-load-demo-orders"
            onClick={handleLoadDemoData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>تجربة ببيانات افتراضية</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">خطأ في معالجة الملف: </span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            إغلاق
          </button>
        </div>
      )}

      {step === 'upload' ? (
        /* Upload Area */
        <div className="space-y-6">
          <div
            id="excel-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/70 shadow-xs'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 shadow-xs">
              <Upload className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">
              اسحب وأسقط ملف الأوردرات هنا، أو اضغط للاختيار
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              يدعم ملفات Excel و CSV (.xlsx, .xls, .csv)
            </p>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                .XLSX
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                .XLS
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                .CSV
              </span>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-xs">
                <div className="flex items-center gap-3 text-emerald-700 font-semibold text-sm">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>جاري قراءة ومعالجة الملف محلياً...</span>
                </div>
              </div>
            )}
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تعرف ذكي على الأعمدة</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                يتعرف تلقائياً على اسم العميل، الهاتف، العنوان، الأكواد، والأسعار بأي تسمية عربية أو إنجليزية.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تجميع منتجات نفس الأوردر</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                إذا كان العميل طالب أكثر من شنطة أو منتج في صفوف منفصلة، يجمعهم تلقائياً في أوردر ورسالة واحدة.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تنظيف أرقام الهواتف المصرية</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                يحول 010 و 011 و 012 و 015 إلى صيغة WhatsApp الدولية 201... ويزيل المسافات والأرقام العربية.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Column Mapping Screen */
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  تمت قراءة الملف بنجاح: {fileName}
                </h3>
                <p className="text-xs text-slate-600">
                  تم العثور على {rawRows.length} صف و {fileHeaders.length} أعمدة. راجع مطابقة الأعمدة أدناه.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-reupload-file"
                onClick={() => setStep('upload')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                تغيير الملف
              </button>

              <button
                id="btn-confirm-import-top"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <span>تأكيد واستيراد الأوردرات</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              مطابقة أعمدة الشيت (Smart Column Mapping)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              حدد أي عمود في ملفك يطابق الحقل المطلوب. يمكنك تعديل أي حقل إذا لم يكن التطبيق قد حدده بدقة.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Order ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>كود / رقم الأوردر *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Order ID</span>
                </label>
                <select
                  id="select-mapping-order-id"
                  value={mapping.orderId}
                  onChange={(e) => handleMappingChange('orderId', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختر العمود --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>اسم العميل *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Customer Name</span>
                </label>
                <select
                  id="select-mapping-customer-name"
                  value={mapping.customerName}
                  onChange={(e) => handleMappingChange('customerName', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختر العمود --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>رقم الهاتف / الموبايل *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Phone / Mobile</span>
                </label>
                <select
                  id="select-mapping-phone"
                  value={mapping.phone}
                  onChange={(e) => handleMappingChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختر العمود --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>العنوان *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Address</span>
                </label>
                <select
                  id="select-mapping-address"
                  value={mapping.address}
                  onChange={(e) => handleMappingChange('address', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختر العمود --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>كود الشنطة / المنتج</span>
                  <span className="text-[10px] text-slate-400 font-normal">Product Code / SKU</span>
                </label>
                <select
                  id="select-mapping-product"
                  value={mapping.productCode}
                  onChange={(e) => handleMappingChange('productCode', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختياري أو محدد --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>الكمية</span>
                  <span className="text-[10px] text-slate-400 font-normal">Quantity</span>
                </label>
                <select
                  id="select-mapping-qty"
                  value={mapping.quantity}
                  onChange={(e) => handleMappingChange('quantity', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- افتراضي (1) --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>السعر / الإجمالي</span>
                  <span className="text-[10px] text-slate-400 font-normal">Total / Price</span>
                </label>
                <select
                  id="select-mapping-price"
                  value={mapping.price}
                  onChange={(e) => handleMappingChange('price', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختياري --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>ملاحظات الشيت</span>
                  <span className="text-[10px] text-slate-400 font-normal">Notes</span>
                </label>
                <select
                  id="select-mapping-notes"
                  value={mapping.notes}
                  onChange={(e) => handleMappingChange('notes', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- لا توجد ملاحظات --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Governorate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>المحافظة (إن وجدت منفصلة)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Governorate</span>
                </label>
                <select
                  id="select-mapping-gov"
                  value={mapping.governorate}
                  onChange={(e) => handleMappingChange('governorate', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- استخراج تلقائي من العنوان --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Preview Table of Parsed Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  معاينة أول {previewOrders.length} أوردرات بعد المطابقة والتجميع:
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                إجمالي الأوردرات الناتجة: {previewOrders.length > 0 ? `${rawRows.length} صف تم تجميعهم` : ''}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="px-3 py-2.5">كود الأوردر</th>
                    <th className="px-3 py-2.5">اسم العميل</th>
                    <th className="px-3 py-2.5">الهاتف الأصلي</th>
                    <th className="px-3 py-2.5">رقم واتساب</th>
                    <th className="px-3 py-2.5">المنتجات</th>
                    <th className="px-3 py-2.5">السعر</th>
                    <th className="px-3 py-2.5">العنوان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-mono font-semibold text-emerald-700">
                        {o.orderId}
                      </td>
                      <td className="px-3 py-2 font-medium">{o.customerName}</td>
                      <td className="px-3 py-2 font-mono">{o.phone}</td>
                      <td className="px-3 py-2 font-mono text-emerald-600">
                        {o.cleanPhone ? `+${o.cleanPhone}` : 'غير صالح'}
                      </td>
                      <td className="px-3 py-2 whitespace-pre-line text-[11px] font-mono">
                        {o.productsSummary}
                      </td>
                      <td className="px-3 py-2 font-bold">{o.totalPrice} ج.م</td>
                      <td className="px-3 py-2 max-w-[200px] truncate text-slate-500">
                        {o.address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button
                id="btn-confirm-import-bottom"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
              >
                <span>تأكيد واستيراد الأوردرات إلى النظام</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

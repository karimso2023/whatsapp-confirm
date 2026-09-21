import React, { useState, useRef } from 'react';
import { AppSettings, OrderItem } from '../types';
import {
  DEFAULT_MESSAGE_TEMPLATE,
  DEFAULT_STORE_NAME,
  TEMPLATE_VARIABLES,
  compileMessage,
  insertAtCursor,
} from '../utils/messageUtils';
import {
  Save,
  RotateCcw,
  Store,
  Globe,
  Sliders,
  Sparkles,
  Trash2,
  Check,
  CheckCheck,
  Info,
  Smartphone,
  Eye,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearAllData: () => void;
  ordersCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearAllData,
  ordersCount,
}) => {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [defaultCountryCode, setDefaultCountryCode] = useState(
    settings.defaultCountryCode || '20'
  );
  const [template, setTemplate] = useState(settings.messageTemplate);
  const [autoAdvance, setAutoAdvance] = useState(settings.autoAdvanceInQuickMode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sampleOrder: OrderItem = {
    id: 'sample',
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
    notes: 'التسليم بعد الساعة 5',
    status: 'جديد',
    validationErrors: [],
  };

  const compiledPreview = compileMessage(template, sampleOrder, storeName);

  const handleInsertVariable = (tag: string) => {
    if (!textareaRef.current) return;
    insertAtCursor(textareaRef.current, tag, template, (val) => setTemplate(val));
  };

  const handleResetToDefaultTemplate = () => {
    if (window.confirm('هل تريد استعادة قالب الرسالة الافتراضي الأصلي؟')) {
      setTemplate(DEFAULT_MESSAGE_TEMPLATE);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      storeName: storeName.trim() || DEFAULT_STORE_NAME,
      defaultCountryCode: defaultCountryCode.replace(/\+/g, '').trim() || '20',
      messageTemplate: template,
      autoAdvanceInQuickMode: autoAdvance,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            إعدادات المتجر وقالب رسالة WhatsApp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            خصص اسم متجرك، صغ رسالة تأكيد احترافية بمتغيرات ديناميكية، وتحكم في سلوك التطبيق
          </p>
        </div>

        <button
          id="btn-save-settings"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>تم حفظ التعديلات بنجاح!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Store Name */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>اسم المتجر (Store Name)</span>
            </div>
            <input
              id="input-store-name"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="مثال: My Store"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400">
              يظهر في المتغير <code className="text-emerald-700 font-mono font-bold">{`{{store_name}}`}</code>
            </p>
          </div>

          {/* Country Code */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>كود الدولة الافتراضي</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">+</span>
              <input
                id="input-default-country-code"
                type="text"
                value={defaultCountryCode}
                onChange={(e) => setDefaultCountryCode(e.target.value)}
                placeholder="20"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-slate-800 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              افتراضي: 20 (مصر) لتحويل الأرقام 010... إلى 2010...
            </p>
          </div>

          {/* Quick Mode Behavior */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>وضع التأكيد السريع</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                الانتقال للأوردر التالي تلقائياً بعد تغيير الحالة
              </span>
            </label>
            <p className="text-[11px] text-slate-400">
              لتسريع مراجعة مئات الأوردرات بدون الحاجة للضغط على التالي يدوياً
            </p>
          </div>
        </div>

        {/* Message Template Editor + Live WhatsApp Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template Editor (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  قالب رسالة تأكيد الأوردر (WhatsApp Message Template)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اضغط على أي من المتغيرات أدناه لإضافتها فوراً في مكان مؤشر الكتابة داخل الرسالة
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDefaultTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                title="إرجاع القالب إلى النص الافتراضي الأصلي"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </button>
            </div>

            {/* Variable Pills Toolbar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">
                المتغيرات المتاحة (اضغط للإدراج عند المؤشر):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition active:scale-95"
                    title={`مثال: ${v.example}`}
                  >
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-emerald-600 font-sans">
                      ({v.name})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                محرر نص الرسالة:
              </label>
              <textarea
                ref={textareaRef}
                id="template-textarea"
                rows={16}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4 text-xs font-sans leading-relaxed text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                dir="rtl"
              />
            </div>
          </div>

          {/* Live WhatsApp Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  معاينة حية للرسالة (Live Preview):
                </h4>
              </div>

              {/* Chat frame */}
              <div className="overflow-hidden rounded-xl border border-emerald-900/10 shadow-inner bg-[#efeae2]">
                <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      م
                    </div>
                    <div>
                      <div className="text-xs font-bold">محمد أحمد</div>
                      <div className="text-[10px] text-emerald-200">+201012345678</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-100">
                    {storeName}
                  </span>
                </div>

                <div className="p-4 min-h-[320px] max-h-[460px] overflow-y-auto space-y-2">
                  <div className="flex justify-center">
                    <span className="rounded bg-white/80 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                      معاينة مباشرة
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <div className="relative max-w-[90%] rounded-2xl rounded-tr-none bg-[#dcf8c6] p-3.5 text-slate-800 shadow-2xs border border-emerald-200/50">
                      <p className="whitespace-pre-wrap text-xs leading-relaxed font-sans select-text">
                        {compiledPreview}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-slate-500">
                        <span>12:00 م</span>
                        <CheckCheck className="h-3 w-3 text-[#34b7f1]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Security Note */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>خصوصية وأمان البيانات:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                جميع ملفات Excel وروابط WhatsApp يتم توليدها محلياً 100% في متصفحك. لا يتم إرسال أرقام أو أسماء عملائك إلى أي خادم خارجي.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-900">
              مسح وتفريغ قاعدة بيانات الأوردرات الحالية
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              يوجد حالياً {ordersCount} أوردر مخزن في متصفحك. عند المسح سيتم تفريغ الأوردرات المستوردة لتبدأ من جديد.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `هل أنت متأكد من مسح جميع الأوردرات (${ordersCount} أوردر)؟ لن يمكن التراجع عن هذا الإجراء.`
                )
              ) {
                onClearAllData();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>مسح جميع الأوردرات المخزنة</span>
          </button>
        </div>
      </form>
    </div>
  );
};

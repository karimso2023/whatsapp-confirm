import React, { useState, useEffect } from 'react';
import { OrderItem, OrderStatus, AppSettings } from '../types';
import { StatusBadge } from './StatusBadge';
import { compileMessage, generateWhatsAppLink } from '../utils/messageUtils';
import confetti from 'canvas-confetti';
import {
  Send,
  CheckCircle2,
  PhoneMissed,
  XCircle,
  FileEdit,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
  CheckCheck,
  Zap,
  Filter,
} from 'lucide-react';

interface QuickConfirmationViewProps {
  orders: OrderItem[];
  settings: AppSettings;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onOpenWhatsApp: (order: OrderItem) => void;
  onSaveCustomMessage: (orderId: string, message: string) => void;
}

export const QuickConfirmationView: React.FC<QuickConfirmationViewProps> = ({
  orders,
  settings,
  onUpdateOrderStatus,
  onOpenWhatsApp,
  onSaveCustomMessage,
}) => {
  const [filterMode, setFilterMode] = useState<'uncontacted' | 'all' | 'new'>('uncontacted');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isEditingMsg, setIsEditingMsg] = useState<boolean>(false);
  const [customMsgText, setCustomMsgText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Filter orders based on user choice
  const activeOrders = React.useMemo(() => {
    if (filterMode === 'new') {
      return orders.filter((o) => o.status === 'جديد');
    }
    if (filterMode === 'uncontacted') {
      return orders.filter(
        (o) => o.status === 'جديد' || o.status === 'لم يتم التواصل'
      );
    }
    return orders;
  }, [orders, filterMode]);

  const currentOrder = activeOrders[currentIndex] || null;

  // Reset index if out of range
  useEffect(() => {
    if (currentIndex >= activeOrders.length) {
      setCurrentIndex(Math.max(0, activeOrders.length - 1));
    }
  }, [activeOrders.length, currentIndex]);

  useEffect(() => {
    if (currentOrder) {
      const msg =
        currentOrder.customMessage ||
        compileMessage(settings.messageTemplate, currentOrder, settings.storeName);
      setCustomMsgText(msg);
      setIsEditingMsg(false);
      setCopied(false);
    }
  }, [currentOrder, settings]);

  const handleNext = () => {
    if (currentIndex < activeOrders.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === 'ArrowRight') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeOrders.length]);

  const handleSetStatus = (status: OrderStatus) => {
    if (!currentOrder) return;
    onUpdateOrderStatus(currentOrder.id, status);

    if (status === 'تم التأكيد') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // confetti fallback
      }
    }

    if (settings.autoAdvanceInQuickMode && currentIndex < activeOrders.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 300);
    }
  };

  const handleOpenWA = () => {
    if (!currentOrder || !currentOrder.cleanPhone) return;
    onOpenWhatsApp(currentOrder);
  };

  const handleCopyMessage = async () => {
    if (!currentOrder) return;
    const msg = isEditingMsg
      ? customMsgText
      : (currentOrder.customMessage ||
        compileMessage(settings.messageTemplate, currentOrder, settings.storeName));
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleSaveCustomMessage = () => {
    if (!currentOrder) return;
    onSaveCustomMessage(currentOrder.id, customMsgText);
    setIsEditingMsg(false);
  };

  if (activeOrders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-3xl mx-auto shadow-xs" dir="rtl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          رائع! لا توجد أوردرات بانتظار التأكيد في هذا القسم
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {filterMode === 'uncontacted'
            ? 'لقد قمت بالتواصل مع جميع الأوردرات الجديدة بنجاح!'
            : 'لا توجد أوردرات متطابقة مع الفلتر الحالي.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setFilterMode('all')}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            عرض كل الأوردرات ({orders.length})
          </button>
        </div>
      </div>
    );
  }

  const standardMsg = currentOrder
    ? compileMessage(settings.messageTemplate, currentOrder, settings.storeName)
    : '';
  const messageToShow = isEditingMsg
    ? customMsgText
    : (currentOrder?.customMessage || standardMsg);
  const hasPhoneError = !currentOrder?.cleanPhone;

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir="rtl">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>وضع التأكيد السريع</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                أوردر {currentIndex + 1} من {activeOrders.length}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              استخدم الأسهم ◀ ▶ في لوحة المفاتيح للتنقل بين الأوردرات بسرعة
            </p>
          </div>
        </div>

        {/* Filter and Navigation */}
        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value as any);
              setCurrentIndex(0);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-500"
          >
            <option value="uncontacted">الأوردرات الجديدة وغير المتواصل معها</option>
            <option value="new">الجديدة فقط</option>
            <option value="all">كل الأوردرات ({orders.length})</option>
          </select>

          <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 disabled:opacity-30 transition shadow-2xs"
              title="الأوردر السابق (سهم يمين)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === activeOrders.length - 1}
              className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 disabled:opacity-30 transition shadow-2xs"
              title="الأوردر التالي (سهم يسار)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {currentOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Order Details Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Customer & Order Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400">كود الأوردر</span>
                  <div className="text-xl font-black font-mono text-emerald-700">
                    {currentOrder.orderId}
                  </div>
                </div>
                <StatusBadge status={currentOrder.status} size="lg" />
              </div>

              {/* Duplicate alert if duplicate */}
              {currentOrder.isDuplicate && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">محتمل أوردر مكرر: </span>
                    <span>{currentOrder.duplicateReason}</span>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">اسم العميل</span>
                  <div className="text-base font-bold text-slate-900">
                    {currentOrder.customerName || 'بدون اسم'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">رقم الهاتف</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {currentOrder.phone}
                    </span>
                    {currentOrder.cleanPhone ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-mono text-emerald-700 font-semibold border border-emerald-200">
                        +{currentOrder.cleanPhone}
                      </span>
                    ) : (
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 font-semibold border border-rose-200">
                        رقم غير صالح
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">العنوان</span>
                  <div className="rounded-xl bg-slate-50 p-3 text-slate-800 leading-relaxed font-medium">
                    {currentOrder.address}
                    {currentOrder.governorate && (
                      <span className="mr-2 inline-block rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {currentOrder.governorate}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">
                    المنتجات المطلوبة
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 font-mono text-slate-800 whitespace-pre-line text-xs font-bold leading-relaxed">
                    {currentOrder.productsSummary}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-bold text-sm">
                    إجمالي قيمة الأوردر
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {currentOrder.totalPrice.toLocaleString('ar-EG')} جنيه
                  </span>
                </div>

                {currentOrder.notes && (
                  <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-3 text-[11px] text-amber-900">
                    <span className="font-bold block mb-0.5">ملاحظات الشيت:</span>
                    <span>{currentOrder.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                تحديث حالة الأوردر:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-quick-confirm-yes"
                  onClick={() => handleSetStatus('تم التأكيد')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم التأكيد ✅</span>
                </button>

                <button
                  id="btn-quick-no-response"
                  onClick={() => handleSetStatus('لا يرد')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2.5 text-xs font-bold hover:bg-rose-100 transition cursor-pointer active:scale-98"
                >
                  <PhoneMissed className="w-4 h-4 text-rose-600" />
                  <span>لا يرد</span>
                </button>

                <button
                  id="btn-quick-edit-data"
                  onClick={() => handleSetStatus('طلب تعديل البيانات')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2.5 text-xs font-bold hover:bg-orange-100 transition cursor-pointer active:scale-98"
                >
                  <FileEdit className="w-4 h-4 text-orange-600" />
                  <span>تعديل البيانات</span>
                </button>

                <button
                  id="btn-quick-cancel-order"
                  onClick={() => handleSetStatus('ملغي')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-2.5 text-xs font-bold hover:bg-zinc-200 transition cursor-pointer active:scale-98"
                >
                  <XCircle className="w-4 h-4 text-zinc-600" />
                  <span>إلغاء الأوردر</span>
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Chat Preview Right Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* WhatsApp Mock Header */}
              <div className="flex items-center justify-between bg-[#075e54] px-5 py-3.5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                    {currentOrder.customerName.charAt(0) || 'ع'}
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">
                      {currentOrder.customerName}
                    </div>
                    <div className="text-xs text-emerald-200/80 leading-tight">
                      {currentOrder.cleanPhone ? `+${currentOrder.cleanPhone}` : 'رقم غير صالح'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingMsg(!isEditingMsg)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition flex items-center gap-1 text-emerald-100"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>{isEditingMsg ? 'معاينة' : 'تعديل الرسالة'}</span>
                  </button>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="bg-[#efeae2] p-5 sm:p-6 min-h-[380px]">
                {isEditingMsg ? (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-700 block">
                      تعديل نص الرسالة لـ {currentOrder.customerName}:
                    </label>
                    <textarea
                      rows={12}
                      value={customMsgText}
                      onChange={(e) => setCustomMsgText(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                      dir="rtl"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingMsg(false)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleSaveCustomMessage}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        حفظ التعديل
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <span className="rounded-md bg-white/80 px-3 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                        رسالة تأكيد الأوردر
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <div className="relative max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-tr-none bg-[#dcf8c6] p-4 text-slate-800 shadow-2xs border border-emerald-200/50">
                        {currentOrder.customMessage && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            رسالة معدلة خصيصاً لهذا العميل
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed font-sans select-text">
                          {messageToShow}
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                          <span>الآن</span>
                          <CheckCheck className="h-3.5 w-3.5 text-[#34b7f1]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Bottom Bar with Big WhatsApp CTA */}
              <div className="border-t border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  onClick={handleCopyMessage}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>نسخ الرسالة</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-quick-open-wa"
                  onClick={handleOpenWA}
                  disabled={hasPhoneError}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition ${
                    hasPhoneError
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-[#25D366] hover:bg-[#20ba59] active:scale-98 shadow-emerald-500/25 cursor-pointer'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>فتح واتساب مع العميل</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === activeOrders.length - 1}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition shadow-2xs"
                >
                  <span>الأوردر التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

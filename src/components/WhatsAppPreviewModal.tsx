import React, { useState, useEffect } from 'react';
import { OrderItem, AppSettings } from '../types';
import { compileMessage, generateWhatsAppLink } from '../utils/messageUtils';
import {
  X,
  Send,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Smartphone,
  CheckCheck,
} from 'lucide-react';

interface WhatsAppPreviewModalProps {
  order: OrderItem | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp: (order: OrderItem, customMsg?: string) => void;
  onSaveCustomMessage: (orderId: string, message: string) => void;
  onResetCustomMessage: (orderId: string) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  order,
  settings,
  isOpen,
  onClose,
  onOpenWhatsApp,
  onSaveCustomMessage,
  onResetCustomMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order) {
      const msg = order.customMessage || compileMessage(settings.messageTemplate, order, settings.storeName);
      setEditedMessage(msg);
      setIsEditing(false);
      setCopied(false);
    }
  }, [order, settings]);

  if (!isOpen || !order) return null;

  const standardMsg = compileMessage(settings.messageTemplate, order, settings.storeName);
  const activeMessage = isEditing ? editedMessage : (order.customMessage || standardMsg);
  const waLink = order.cleanPhone ? generateWhatsAppLink(order.cleanPhone, activeMessage) : '#';
  const hasPhoneError = !order.cleanPhone;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleSaveEdit = () => {
    onSaveCustomMessage(order.id, editedMessage);
    setIsEditing(false);
  };

  const handleResetEdit = () => {
    onResetCustomMessage(order.id);
    setEditedMessage(standardMsg);
    setIsEditing(false);
  };

  const handleOpenWA = () => {
    if (hasPhoneError) return;
    onOpenWhatsApp(order, isEditing ? editedMessage : order.customMessage);
  };

  const currentTimeStr = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="whatsapp-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="whatsapp-preview-modal-container"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                معاينة رسالة الواتساب للطلب ({order.orderId})
              </h3>
              <p className="text-xs text-slate-500">
                العميل: {order.customerName} • {order.phone}
              </p>
            </div>
          </div>
          <button
            id="btn-close-wa-preview"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Warning if phone invalid */}
        {order.validationErrors.length > 0 && (
          <div className="bg-amber-50 border-y border-amber-200 px-6 py-2.5 flex items-center gap-2 text-amber-800 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>تنبيه: {order.validationErrors.join(' | ')}</span>
          </div>
        )}

        {/* Content Body: Two modes (Preview vs Edit) */}
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  تعديل نص الرسالة لهذا العميل فقط:
                </label>
                <span className="text-xs text-slate-400">
                  التعديل لا يؤثر على القالب العام
                </span>
              </div>
              <textarea
                id="custom-message-textarea"
                rows={12}
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-sans leading-relaxed"
                dir="rtl"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  id="btn-save-custom-msg"
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  حفظ التعديل للعميل
                </button>
                <button
                  id="btn-cancel-custom-msg"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* WhatsApp Mockup Frame */}
              <div className="overflow-hidden rounded-xl border border-emerald-700/20 shadow-inner bg-[#efeae2]">
                {/* WhatsApp Chat Top Header */}
                <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                      {order.customerName.charAt(0) || 'ع'}
                    </div>
                    <div>
                      <div className="text-sm font-bold leading-tight">
                        {order.customerName || 'عميل المتجر'}
                      </div>
                      <div className="text-[11px] text-emerald-100/80 leading-tight">
                        {order.cleanPhone ? `+${order.cleanPhone}` : 'رقم غير صالح'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-800/60 px-2 py-0.5 rounded text-emerald-100">
                    {settings.storeName}
                  </span>
                </div>

                {/* WhatsApp Chat Background with Wallpaper feel */}
                <div className="p-4 sm:p-6 min-h-[220px] max-h-[380px] overflow-y-auto space-y-3">
                  {/* Date chip */}
                  <div className="flex justify-center">
                    <span className="rounded-md bg-white/80 px-3 py-0.5 text-[10px] font-medium text-slate-600 shadow-xs">
                      اليوم
                    </span>
                  </div>

                  {/* Outgoing Message Bubble (Right aligned in LTR, Left in RTL for chat app feel or clean bubble) */}
                  <div className="flex justify-end">
                    <div className="relative max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tr-none bg-[#dcf8c6] p-4 text-slate-800 shadow-xs border border-emerald-200/50">
                      {order.customMessage && (
                        <div className="mb-2 inline-flex items-center gap-1 rounded bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          <Edit3 className="w-3 h-3" />
                          رسالة مخصصة لهذا العميل
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-slate-800 select-text">
                        {activeMessage}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                        <span>{currentTimeStr}</span>
                        <CheckCheck className="h-3.5 w-3.5 text-[#34b7f1]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-modal-edit-msg"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>تعديل لهذا العميل فقط</span>
                  </button>

                  {order.customMessage && (
                    <button
                      id="btn-modal-reset-custom-msg"
                      onClick={handleResetEdit}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      title="الرجوع للقالب العام"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة القالب الأصلي</span>
                    </button>
                  )}

                  <button
                    id="btn-modal-copy-msg"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>نسخ الرسالة</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  id="btn-modal-open-whatsapp"
                  onClick={handleOpenWA}
                  disabled={hasPhoneError}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition ${
                    hasPhoneError
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-[#25D366] hover:bg-[#20ba59] active:scale-98 shadow-emerald-500/20'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>فتح واتساب</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

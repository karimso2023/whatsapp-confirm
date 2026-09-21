import React from 'react';
import { OrderItem, OrderStatus, AppSettings } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Package,
  Sparkles,
  Send,
  CheckCircle2,
  PhoneMissed,
  XCircle,
  Coins,
  Percent,
  AlertTriangle,
  Zap,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface DashboardViewProps {
  orders: OrderItem[];
  settings: AppSettings;
  onNavigateToQuickConfirm: () => void;
  onNavigateToOrders: (statusFilter?: string) => void;
  onOpenWhatsApp: (order: OrderItem) => void;
  onOpenPreview: (order: OrderItem) => void;
  onNavigateToUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  settings,
  onNavigateToQuickConfirm,
  onNavigateToOrders,
  onOpenWhatsApp,
  onOpenPreview,
  onNavigateToUpload,
}) => {
  const totalOrders = orders.length;

  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).length;

  const newCount = countByStatus('جديد');
  const contactedCount =
    countByStatus('تم فتح واتساب') + countByStatus('تم إرسال التأكيد');
  const confirmedCount = countByStatus('تم التأكيد');
  const noResponseCount = countByStatus('لا يرد');
  const cancelledCount = countByStatus('ملغي');
  const editRequestedCount = countByStatus('طلب تعديل البيانات');
  const duplicatesCount = orders.filter((o) => o.isDuplicate).length;

  const totalValue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const confirmedValue = orders
    .filter((o) => o.status === 'تم التأكيد')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const confirmationRate =
    totalOrders > 0 ? Math.round((confirmedCount / totalOrders) * 100) : 0;
  const contactedRate =
    totalOrders > 0
      ? Math.round(((contactedCount + confirmedCount) / totalOrders) * 100)
      : 0;

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Top Welcome & Quick CTA Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>متجر: {settings.storeName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              لوحة تحكم تأكيد الأوردرات عبر WhatsApp
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              راجع حالة الأوردرات، افتح محادثات واتساب بنقرة واحدة برسالة جاهزة باللهجة المصرية، وأكد بيانات الشحن بسرعة وسهولة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {totalOrders > 0 ? (
              <button
                id="btn-dash-quick-confirm"
                onClick={onNavigateToQuickConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25 active:scale-98 cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>بدء وضع التأكيد السريع</span>
              </button>
            ) : (
              <button
                id="btn-dash-upload-empty"
                onClick={onNavigateToUpload}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Package className="h-4 w-4" />
                <span>رفع أول ملف أوردرات</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative subtle background gradient blur */}
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div
          onClick={() => onNavigateToOrders()}
          className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الأوردرات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalOrders}
            </span>
            <span className="text-xs text-slate-400 font-medium">أوردر</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">في قاعدة البيانات الحالية</p>
        </div>

        {/* New Orders */}
        <div
          onClick={() => onNavigateToOrders('جديد')}
          className="cursor-pointer rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-xs transition hover:border-sky-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800">أوردرات جديدة</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-900">
              {newCount}
            </span>
            <span className="text-xs text-sky-600 font-medium">بانتظار التواصل</span>
          </div>
          <p className="mt-1 text-[11px] text-sky-600/80">تحتاج فتح واتساب</p>
        </div>

        {/* Contacted */}
        <div
          onClick={() => onNavigateToOrders('تم فتح واتساب')}
          className="cursor-pointer rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs transition hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">تم التواصل</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">
              {contactedCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              ({totalOrders > 0 ? Math.round((contactedCount / totalOrders) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/80">تم فتح المحادثة أو إرسال التأكيد</p>
        </div>

        {/* Confirmed */}
        <div
          onClick={() => onNavigateToOrders('تم التأكيد')}
          className="cursor-pointer rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">تم التأكيد ✅</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900">
              {confirmedCount}
            </span>
            <span className="text-xs text-emerald-700 font-bold">
              ({confirmationRate}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600/80">جاهز للشحن الفوري</p>
        </div>

        {/* Total Value */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي قيمة الأوردرات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalValue.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">جنيه</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            المؤكد منها: {confirmedValue.toLocaleString('ar-EG')} جنيه
          </p>
        </div>

        {/* Confirmation Rate */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">نسبة التأكيد العامة</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {confirmationRate}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${confirmationRate}%` }}
            />
          </div>
        </div>

        {/* No Response */}
        <div
          onClick={() => onNavigateToOrders('لا يرد')}
          className="cursor-pointer rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 shadow-xs transition hover:border-rose-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">لا يرد</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <PhoneMissed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-900">
              {noResponseCount}
            </span>
            <span className="text-xs text-rose-600 font-medium">أوردر</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80">يحتاج إعادة محاولة التواصل</p>
        </div>

        {/* Cancelled & Duplicates */}
        <div
          onClick={() => onNavigateToOrders('ملغي')}
          className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ملغي أو تعديل</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-700">
              {cancelledCount + editRequestedCount}
            </span>
            {duplicatesCount > 0 && (
              <span className="text-xs text-amber-600 font-bold">
                ({duplicatesCount} مكرر)
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {cancelledCount} ملغي • {editRequestedCount} طلب تعديل
          </p>
        </div>
      </div>

      {/* Duplicate Warning Box if any duplicates */}
      {duplicatesCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                تنبيه: تم اكتشاف {duplicatesCount} أوردر محتمل تكراره!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                تكرار نفس رقم الهاتف مع كود أوردر آخر أو نفس المنتجات والسعر. تم تعليمهم بشارة "محتمل مكرر" لمراجعتهم قبل الإرسال.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToOrders('مكرر')}
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
          >
            عرض الأوردرات المكررة
          </button>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              آخر الأوردرات المستوردة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              عرض سريع للأوردرات مع إمكانية فتح محادثة WhatsApp مباشرة
            </p>
          </div>
          <button
            id="btn-dash-view-all-orders"
            onClick={() => onNavigateToOrders()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            <span>استعراض كل الأوردرات ({totalOrders})</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <h4 className="mt-3 text-sm font-bold text-slate-700">
              لا توجد أوردرات حتى الآن
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              قم برفع ملف Excel أو استخدام البيانات التجريبية للبدء
            </p>
            <button
              onClick={onNavigateToUpload}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <Package className="w-4 h-4" />
              <span>رفع ملف الأوردرات</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3">كود الأوردر</th>
                  <th className="px-5 py-3">العميل</th>
                  <th className="px-5 py-3">رقم الهاتف</th>
                  <th className="px-5 py-3">المنتجات</th>
                  <th className="px-5 py-3">الإجمالي</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3 text-left">إجراء سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const hasError = !order.cleanPhone;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-mono font-semibold text-emerald-700">
                        {order.orderId}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {order.address}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <div>{order.phone}</div>
                        {order.cleanPhone && (
                          <div className="text-[10px] text-emerald-600">
                            +{order.cleanPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-pre-line font-mono text-[11px]">
                        {order.productsSummary}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {order.totalPrice.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenPreview(order)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                            title="معاينة الرسالة"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button
                            onClick={() => onOpenWhatsApp(order)}
                            disabled={hasError}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-xs transition ${
                              hasError
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-[#25D366] hover:bg-[#20ba59]'
                            }`}
                          >
                            <span>فتح واتساب</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

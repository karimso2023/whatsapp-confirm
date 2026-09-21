import React, { useState, useMemo } from 'react';
import { OrderItem, OrderStatus, AppSettings } from '../types';
import { StatusBadge, ALL_STATUSES } from './StatusBadge';
import { EGYPTIAN_GOVERNORATES, exportOrdersToExcel } from '../utils/excelParser';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  PhoneCall,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  Copy,
  Edit2,
} from 'lucide-react';

interface OrdersTableViewProps {
  orders: OrderItem[];
  settings: AppSettings;
  onOpenWhatsApp: (order: OrderItem) => void;
  onOpenPreview: (order: OrderItem) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onDeleteMultipleOrders: (orderIds: string[]) => void;
  onUpdateOrderNotes: (orderId: string, notes: string) => void;
  initialStatusFilter?: string;
}

export const OrdersTableView: React.FC<OrdersTableViewProps> = ({
  orders,
  settings,
  onOpenWhatsApp,
  onOpenPreview,
  onUpdateOrderStatus,
  onDeleteOrder,
  onDeleteMultipleOrders,
  onUpdateOrderNotes,
  initialStatusFilter = 'all',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [govFilter, setGovFilter] = useState<string>('all');
  const [duplicateOnly, setDuplicateOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'id' | 'price_asc' | 'price_desc' | 'name'>('id');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Quick inline notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Extract unique product codes for filter
  const allProductCodes = useMemo(() => {
    const codes = new Set<string>();
    orders.forEach((o) => {
      o.products.forEach((p) => {
        if (p.code) codes.add(p.code);
      });
    });
    return Array.from(codes);
  }, [orders]);

  const [productCodeFilter, setProductCodeFilter] = useState<string>('all');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = order.customerName.toLowerCase().includes(query);
        const matchPhone = order.phone.includes(query) || order.cleanPhone.includes(query);
        const matchOrder = order.orderId.toLowerCase().includes(query);
        const matchAddress = order.address.toLowerCase().includes(query);
        const matchProduct = order.products.some((p) => p.code.toLowerCase().includes(query));
        if (!matchName && !matchPhone && !matchOrder && !matchAddress && !matchProduct) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'مكرر') {
          if (!order.isDuplicate) return false;
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      // Duplicate
      if (duplicateOnly && !order.isDuplicate) {
        return false;
      }

      // Governorate
      if (govFilter !== 'all') {
        if (order.governorate !== govFilter) return false;
      }

      // Product Code
      if (productCodeFilter !== 'all') {
        if (!order.products.some((p) => p.code === productCodeFilter)) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, duplicateOnly, govFilter, productCodeFilter]);

  // Sorted orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      if (sortBy === 'price_asc') return a.totalPrice - b.totalPrice;
      if (sortBy === 'price_desc') return b.totalPrice - a.totalPrice;
      if (sortBy === 'name') return a.customerName.localeCompare(b.customerName, 'ar');
      return a.orderId.localeCompare(b.orderId);
    });
  }, [filteredOrders, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk status update
  const handleBulkStatus = (status: OrderStatus) => {
    selectedOrderIds.forEach((id) => onUpdateOrderStatus(id, status));
    setSelectedOrderIds([]);
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedOrderIds.length} أوردر محدد؟`)) {
      onDeleteMultipleOrders(selectedOrderIds);
      setSelectedOrderIds([]);
    }
  };

  // Bulk export
  const handleExportSelected = () => {
    const exportList = orders.filter((o) => selectedOrderIds.includes(o.id));
    exportOrdersToExcel(exportList.length > 0 ? exportList : sortedOrders);
  };

  const startEditNotes = (order: OrderItem) => {
    setEditingNotesId(order.id);
    setTempNotes(order.notes || '');
  };

  const saveNotes = (orderId: string) => {
    onUpdateOrderNotes(orderId, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto" dir="rtl">
      {/* Header & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            جدول إدارة الأوردرات ({orders.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            البحث والفلترة، تغيير الحالات، فتح واتساب مباشرة، وتصدير التقارير إلى Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-excel-table"
            onClick={() => exportOrdersToExcel(sortedOrders)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel ({sortedOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-orders-search"
              type="text"
              placeholder="ابحث بالاسم، الموبايل، كود الأوردر، كود المنتج، أو العنوان..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Status Select */}
          <div className="flex items-center gap-2">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">كل الحالات ({orders.length})</option>
              <option value="جديد">جديد</option>
              <option value="تم فتح واتساب">تم فتح واتساب</option>
              <option value="تم إرسال التأكيد">تم إرسال التأكيد</option>
              <option value="تم التأكيد">تم التأكيد ✅</option>
              <option value="طلب تعديل البيانات">طلب تعديل البيانات</option>
              <option value="لا يرد">لا يرد</option>
              <option value="ملغي">ملغي</option>
              <option value="مكرر">المكرر فقط</option>
            </select>

            {/* Governorate Select */}
            <select
              id="select-gov-filter"
              value={govFilter}
              onChange={(e) => {
                setGovFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">كل المحافظات</option>
              {EGYPTIAN_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              id="select-sort-order"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="id">ترتيب الأوردر</option>
              <option value="price_desc">الأعلى سعراً</option>
              <option value="price_asc">الأقل سعراً</option>
              <option value="name">اسم العميل (أ-ي)</option>
            </select>
          </div>
        </div>

        {/* Secondary filters row (Product code & duplicates toggle) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={duplicateOnly}
                onChange={(e) => setDuplicateOnly(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>إظهار الأوردرات المحتمل تكرارها فقط</span>
            </label>

            {allProductCodes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span>تصفية بالمنتج:</span>
                <select
                  value={productCodeFilter}
                  onChange={(e) => setProductCodeFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="all">كل المنتجات</option>
                  {allProductCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <span>عرض </span>
            <span className="font-bold text-slate-800">{sortedOrders.length}</span>
            <span> من أصل </span>
            <span className="font-bold text-slate-800">{orders.length}</span>
            <span> أوردر</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar if items selected */}
      {selectedOrderIds.length > 0 && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم تحديد {selectedOrderIds.length} أوردر</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600">تعيين الحالة:</span>
            <button
              onClick={() => handleBulkStatus('تم التأكيد')}
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700"
            >
              تم التأكيد ✅
            </button>
            <button
              onClick={() => handleBulkStatus('لا يرد')}
              className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700"
            >
              لا يرد
            </button>
            <button
              onClick={() => handleBulkStatus('ملغي')}
              className="rounded-lg bg-zinc-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-zinc-700"
            >
              ملغي
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              onClick={handleExportSelected}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              تصدير المحددة فقط
            </button>

            <button
              onClick={handleBulkDelete}
              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              حذف المحددة
            </button>
          </div>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Filter className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-700">
              لم يتم العثور على أوردرات مطابقة للتصفية
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              جرب تغيير كلمات البحث أو إعادة ضبط خيارات الفلترة
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setGovFilter('all');
                setDuplicateOnly(false);
                setProductCodeFilter('all');
              }}
              className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-700">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold select-none">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedOrders.length > 0 &&
                        paginatedOrders.every((o) => selectedOrderIds.includes(o.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3.5">كود الأوردر</th>
                  <th className="px-4 py-3.5">العميل والمحافظة</th>
                  <th className="px-4 py-3.5">رقم الهاتف</th>
                  <th className="px-4 py-3.5">المنتجات</th>
                  <th className="px-4 py-3.5">السعر</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-4 py-3.5">ملاحظات</th>
                  <th className="px-4 py-3.5 text-left">إجراءات WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const hasPhoneError = !order.cleanPhone;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      } ${order.isDuplicate ? 'bg-amber-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(order.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Order Code */}
                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{order.orderId}</span>
                        </div>
                        {order.isDuplicate && (
                          <div
                            className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 mt-1"
                            title={order.duplicateReason}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>محتمل مكرر</span>
                          </div>
                        )}
                      </td>

                      {/* Customer Name & Address */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{order.customerName || 'بدون اسم'}</span>
                          {order.governorate && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {order.governorate}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[11px] text-slate-500 truncate mt-0.5"
                          title={order.address}
                        >
                          {order.address}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        <div className="text-slate-800 font-semibold">{order.phone}</div>
                        {order.cleanPhone ? (
                          <div className="text-[11px] text-emerald-600 font-medium">
                            +{order.cleanPhone}
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>رقم غير صالح</span>
                          </div>
                        )}
                      </td>

                      {/* Products */}
                      <td className="px-4 py-3.5 whitespace-pre-line font-mono text-[11px] max-w-[160px]">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-1.5 font-semibold text-slate-700">
                          {order.productsSummary}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {order.totalPrice.toLocaleString('ar-EG')} ج.م
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="rounded-full border border-slate-200 bg-white py-1 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-hidden"
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                        {order.lastActionDate && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {order.lastActionDate}
                          </div>
                        )}
                      </td>

                      {/* Notes / Inline Editor */}
                      <td className="px-4 py-3.5 max-w-[160px]">
                        {editingNotesId === order.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              className="w-full rounded border border-emerald-400 px-2 py-1 text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => saveNotes(order.id)}
                              className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditNotes(order)}
                            className="group flex items-center justify-between cursor-pointer rounded p-1 hover:bg-slate-100 text-slate-500"
                            title="اضغط للتعديل"
                          >
                            <span className="truncate text-[11px]">
                              {order.notes || '—'}
                            </span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 shrink-0" />
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-left whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Message */}
                          <button
                            onClick={() => onOpenPreview(order)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                            title="معاينة الرسالة والدردشة"
                          >
                            <MessageCircle className="w-4 h-4 text-slate-600" />
                          </button>

                          {/* Open WhatsApp */}
                          <button
                            id={`btn-open-wa-${order.id}`}
                            onClick={() => onOpenWhatsApp(order)}
                            disabled={hasPhoneError}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-xs transition ${
                              hasPhoneError
                                ? 'bg-slate-300 cursor-not-allowed opacity-60'
                                : 'bg-[#25D366] hover:bg-[#20ba59] active:scale-98 shadow-emerald-500/20'
                            }`}
                            title={hasPhoneError ? 'رقم الهاتف غير صالح' : 'فتح محادثة WhatsApp'}
                          >
                            <span>فتح واتساب</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="حذف هذا الأوردر"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-6 py-3.5 gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>أوردر في كل صفحة</span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                صفحة {currentPage} من {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import {
  Menu,
  Upload,
  Download,
  Package,
  Store,
} from 'lucide-react';
import { exportOrdersToExcel } from '../utils/excelParser';
import { OrderItem } from '../types';

interface HeaderProps {
  orders: OrderItem[];
  storeName: string;
  onOpenMobileSidebar: () => void;
  onNavigateToUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orders,
  storeName,
  onOpenMobileSidebar,
  onNavigateToUpload,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu-toggle"
          onClick={onOpenMobileSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800 tracking-tight hidden sm:inline">
            Order WhatsApp Confirmation Manager
          </span>
          <span className="text-sm font-bold text-slate-800 tracking-tight sm:hidden">
            تأكيد أوردرات WhatsApp
          </span>

          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            {orders.length} أوردر
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Store badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
          <Store className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-700">{storeName}</span>
        </div>

        {/* Upload new file button */}
        <button
          id="btn-top-upload-file"
          onClick={onNavigateToUpload}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">رفع ملف جديد</span>
          <span className="sm:hidden">رفع ملف</span>
        </button>

        {/* Export Excel button */}
        {orders.length > 0 && (
          <button
            id="btn-top-export-excel"
            onClick={() => exportOrdersToExcel(orders)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
            title="تصدير جميع الأوردرات إلى ملف Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير Excel</span>
            <span className="sm:hidden">تصدير</span>
          </button>
        )}
      </div>
    </header>
  );
};

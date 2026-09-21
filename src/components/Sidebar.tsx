import React from 'react';
import { ActiveTab, OrderItem } from '../types';
import {
  LayoutDashboard,
  TableProperties,
  Zap,
  UploadCloud,
  Settings,
  X,
  MessageSquareShare,
  PackageCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  orders: OrderItem[];
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  storeName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  orders,
  isMobileOpen,
  setIsMobileOpen,
  storeName,
}) => {
  const newCount = orders.filter((o) => o.status === 'جديد').length;
  const confirmedCount = orders.filter((o) => o.status === 'تم التأكيد').length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'الرئيسية',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'orders' as ActiveTab,
      label: 'الأوردرات',
      icon: TableProperties,
      badge: orders.length > 0 ? orders.length : null,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'quick-confirm' as ActiveTab,
      label: 'التأكيد السريع',
      icon: Zap,
      badge: newCount > 0 ? `${newCount} جديد` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'upload' as ActiveTab,
      label: 'رفع ملف',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'الإعدادات',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 right-0 z-40 h-screen w-64 border-l border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        <div>
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md shadow-emerald-500/20">
                <MessageSquareShare className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-black tracking-tight text-slate-800 block leading-tight">
                  Order WhatsApp
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 block leading-tight">
                  Confirmation Manager
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              القائمة الرئيسية
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-extrabold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition ${
                        isActive
                          ? 'text-emerald-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">المتجر:</span>
              <span className="font-bold text-slate-800 truncate max-w-[110px]">
                {storeName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">تم التأكيد:</span>
              <span className="font-bold text-emerald-600">
                {confirmedCount} أوردر
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${
                    orders.length > 0
                      ? Math.round((confirmedCount / orders.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

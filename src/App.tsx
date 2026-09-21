/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  OrderItem,
  OrderStatus,
  AppSettings,
  ColumnMapping,
  ActiveTab,
} from './types';
import {
  loadOrders,
  saveOrders,
  loadSettings,
  saveSettings,
  loadMapping,
  saveMapping,
  clearAllStoredData,
  getInitialDemoOrders,
} from './utils/storage';
import { generateWhatsAppLink, compileMessage } from './utils/messageUtils';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrdersTableView } from './components/OrdersTableView';
import { QuickConfirmationView } from './components/QuickConfirmationView';
import { UploadView } from './components/UploadView';
import { SettingsView } from './components/SettingsView';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';

export default function App() {
  // App State with localStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    const stored = loadOrders();
    if (stored && stored.length > 0) return stored;
    // On first load, provide realistic demo orders matching prompt specifications
    return getInitialDemoOrders();
  });
  const [savedMapping, setSavedMapping] = useState<ColumnMapping | null>(() =>
    loadMapping()
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [selectedPreviewOrder, setSelectedPreviewOrder] = useState<OrderItem | null>(
    null
  );
  const [statusFilterForOrders, setStatusFilterForOrders] = useState<string>('all');

  // Sync to storage whenever orders or settings change
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Helper for Arabic formatted action timestamp
  const getTimestamp = (): string => {
    const d = new Date();
    return d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  /**
   * Opens WhatsApp chat in a new tab with prefilled encoded message,
   * automatically moves status to "تم فتح واتساب" and stamps action date
   */
  const handleOpenWhatsApp = (order: OrderItem, customMsg?: string) => {
    if (!order.cleanPhone) {
      alert('لا يمكن فتح WhatsApp: رقم الهاتف غير صالح أو غير مكتمل.');
      return;
    }

    const message =
      customMsg ||
      order.customMessage ||
      compileMessage(settings.messageTemplate, order, settings.storeName);

    const waUrl = generateWhatsAppLink(order.cleanPhone, message);

    // Open WhatsApp in new tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Automatically update status to "تم فتح واتساب" if it was "جديد" or "لم يتم التواصل"
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            status: o.status === 'جديد' ? 'تم فتح واتساب' : o.status,
            lastActionDate: getTimestamp(),
          };
        }
        return o;
      })
    );
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            lastActionDate: getTimestamp(),
          };
        }
        return o;
      })
    );
  };

  const handleSaveCustomMessage = (orderId: string, customMessage: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            customMessage,
            lastActionDate: getTimestamp(),
          };
        }
        return o;
      })
    );
  };

  const handleResetCustomMessage = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          const { customMessage, ...rest } = o;
          return { ...rest, lastActionDate: getTimestamp() };
        }
        return o;
      })
    );
  };

  const handleUpdateOrderNotes = (orderId: string, notes: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, notes } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('هل تريد حذف هذا الأوردر نهائياً من القائمة؟')) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedPreviewOrder?.id === orderId) {
        setSelectedPreviewOrder(null);
      }
    }
  };

  const handleDeleteMultipleOrders = (orderIds: string[]) => {
    setOrders((prev) => prev.filter((o) => !orderIds.includes(o.id)));
  };

  const handleOrdersImported = (
    newOrders: OrderItem[],
    mapping: ColumnMapping
  ) => {
    setOrders(newOrders);
    setSavedMapping(mapping);
    saveMapping(mapping);
  };

  const handleClearAllData = () => {
    clearAllStoredData();
    setOrders([]);
    setSavedMapping(null);
  };

  const navigateToOrdersWithFilter = (statusFilter?: string) => {
    if (statusFilter) {
      setStatusFilterForOrders(statusFilter);
    } else {
      setStatusFilterForOrders('all');
    }
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex" dir="rtl">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orders={orders}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        storeName={settings.storeName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          orders={orders}
          storeName={settings.storeName}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateToUpload={() => setActiveTab('upload')}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              settings={settings}
              onNavigateToQuickConfirm={() => setActiveTab('quick-confirm')}
              onNavigateToOrders={navigateToOrdersWithFilter}
              onOpenWhatsApp={handleOpenWhatsApp}
              onOpenPreview={(order) => setSelectedPreviewOrder(order)}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTableView
              orders={orders}
              settings={settings}
              onOpenWhatsApp={handleOpenWhatsApp}
              onOpenPreview={(order) => setSelectedPreviewOrder(order)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onDeleteMultipleOrders={handleDeleteMultipleOrders}
              onUpdateOrderNotes={handleUpdateOrderNotes}
              initialStatusFilter={statusFilterForOrders}
            />
          )}

          {activeTab === 'quick-confirm' && (
            <QuickConfirmationView
              orders={orders}
              settings={settings}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onOpenWhatsApp={handleOpenWhatsApp}
              onSaveCustomMessage={handleSaveCustomMessage}
            />
          )}

          {activeTab === 'upload' && (
            <UploadView
              onOrdersImported={handleOrdersImported}
              defaultCountryCode={settings.defaultCountryCode}
              savedMapping={savedMapping}
              onNavigateToOrders={() => setActiveTab('orders')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={setSettings}
              onClearAllData={handleClearAllData}
              ordersCount={orders.length}
            />
          )}
        </main>
      </div>

      {/* WhatsApp Message Preview & Customer Override Modal */}
      <WhatsAppPreviewModal
        order={selectedPreviewOrder}
        settings={settings}
        isOpen={Boolean(selectedPreviewOrder)}
        onClose={() => setSelectedPreviewOrder(null)}
        onOpenWhatsApp={(order, customMsg) => {
          handleOpenWhatsApp(order, customMsg);
          setSelectedPreviewOrder(null);
        }}
        onSaveCustomMessage={handleSaveCustomMessage}
        onResetCustomMessage={handleResetCustomMessage}
      />
    </div>
  );
}

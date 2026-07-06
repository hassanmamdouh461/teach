import React, { useMemo, useState } from 'react';
import { ShoppingBag, DollarSign, Utensils, PlusCircle, FileText, Coffee, CheckCircle2, AlertTriangle, Clock, Languages } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useAnalytics } from '../hooks/useAnalytics';
import { NewOrderModal } from '../components/orders/NewOrderModal';
import { OrderItem } from '../types/order';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  // ── Unified analytics — fixed to 'Today' period ────────────────────────────
  // Numbers here = BASELINE['Today'] + real completed orders today.
  // When Reports.tsx is on 'Today', every number matches this exactly.
  const analytics = useAnalytics('Today');
  const { addOrder } = useOrders();          // mutation only — no extra fetch
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => [
    {
      label: t('Total Orders'),
      value: analytics.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      trend: analytics.realOrders > 0 ? `+${analytics.realOrders} ${t('today')}` : t('Daily total'),
      color: 'blue',
    },
    {
      label: t("Today's Revenue (incl. tax)"),
      value: `$${analytics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: analytics.realRevenue > 0 ? `+$${analytics.realRevenue.toFixed(2)} ${t('live')}` : t('Daily total'),
      color: 'green',
    },
    {
      label: t('Menu Items'),
      value: analytics.menuItemsCount.toString(),
      icon: Utensils,
      trend: `${analytics.availableMenuItemsCount} ${t('available')}`,
      color: 'purple',
    },
  ], [analytics, t]);

  // ── Recent activity: live feed of newest 5 orders app-wide ─────────────────
  const recentActivity = useMemo(() => {
    const iconMap: Record<string, { icon: any; color: string }> = {
      Completed: { icon: CheckCircle2,  color: 'text-green-500 bg-green-50' },
      New:       { icon: Coffee,        color: 'text-mocha-700 bg-mocha-50' },
      Preparing: { icon: Clock,         color: 'text-amber-500 bg-amber-50' },
      Ready:     { icon: AlertTriangle, color: 'text-blue-500 bg-blue-50'   },
      Cancelled: { icon: AlertTriangle, color: 'text-red-500 bg-red-50'     },
    };
    return analytics.recentOrders.map(o => {
      const summary = o.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ');
      const more    = o.items.length > 2 ? ` +${o.items.length - 2} ${t('more')}` : '';
      const elapsed = Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000);
      const time    = elapsed < 1 ? t('just now') : elapsed < 60 ? `${elapsed} ${t('min ago')}` : `${Math.round(elapsed / 60)} ${t('h ago')}`;
      const label   = o.status === 'New' ? t('New order') : t(o.status);
      const { icon, color } = iconMap[o.status] ?? iconMap.New;
      return { icon, color, text: `${label} #${o.orderNumber} — ${summary}${more}`, time };
    });
  }, [analytics.recentOrders, t]);

  const handleCreateOrder = async (tableId: string, items: OrderItem[]) => {
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await addOrder({
      orderNumber: '',
      tableId,
      items,
      status: 'New',
      paymentStatus: 'Unpaid',
      totalAmount,
      createdAt: new Date().toISOString(),
    });
  };

  const menuItems = analytics.menuItems; // exposed by hook — no extra useMenu() needed

  const quickActions = [
    { label: t('New Order'), icon: PlusCircle, color: 'bg-mocha-700', hover: 'hover:bg-mocha-800', action: () => setIsNewOrderOpen(true) },
    { label: t('Manage Menu'), icon: Coffee, color: 'bg-caramel', hover: 'hover:bg-caramel-dark', action: () => navigate('/menu') },
    { label: t('View Reports'), icon: FileText, color: 'bg-mocha-600', hover: 'hover:bg-mocha-700', action: () => navigate('/reports') },
    { label: t('Payment'), icon: DollarSign, color: 'bg-coffee', hover: 'hover:bg-coffee-dark', action: () => navigate('/payment') },
  ];

  return (
    <>
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">{t('Dashboard')}</h1>
          <p className="text-xs md:text-base text-gray-500">{t("Welcome back, here's what's happening today.")}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:text-gray-900 shadow-sm transition-all active:scale-95"
            title="Toggle Language / تغيير اللغة"
          >
            <Languages size={16} className="text-mocha-600" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400">{t("Today's Date")}</p>
            <p className="font-semibold text-gray-900 text-xs md:text-sm">{new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8">
        <div className="lg:col-span-2 bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-3 md:mb-6">{t('Quick Actions')}</h2>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`mobile-touch-target ${action.color} ${action.hover} text-white p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-2 md:gap-3 transition-all shadow-lg shadow-gray-200 active:scale-95 tap-highlight-none`}
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="font-semibold text-sm md:text-base">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-3 md:mb-6">{t('Recent Activity')}</h2>
          <div className="space-y-3 md:space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t('No recent activity')}</p>
            ) : recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${activity.color} shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    <NewOrderModal
      isOpen={isNewOrderOpen}
      onClose={() => setIsNewOrderOpen(false)}
      menuItems={menuItems}
      onSubmit={handleCreateOrder}
    />
  </>
  );
}

/**
 * Reports & Analytics page
 *
 * All data sourced from useAnalytics(dateRange).
 * When dateRange = 'Today', every stat card value is identical to Dashboard.tsx.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShoppingBag,
  Coffee, Calendar, Download,
  CheckCircle2, Clock, XCircle, AlertCircle, Utensils,
} from 'lucide-react';
import { useAnalytics, AnalyticsPeriod } from '../hooks/useAnalytics';
import { StatCard } from '../components/ui/StatCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { OrderStatus } from '../types/order';

// ─── Status display config (UI-only: icons & colours) ────────────────────────
const STATUS_CONFIG: Array<{
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  bar: string;
}> = [
  { status: 'New',       label: 'New',       icon: Coffee,       color: 'text-mocha-700', bar: 'bg-mocha-400' },
  { status: 'Preparing', label: 'Preparing', icon: Clock,        color: 'text-amber-600', bar: 'bg-amber-400' },
  { status: 'Ready',     label: 'Ready',     icon: AlertCircle,  color: 'text-blue-600',  bar: 'bg-blue-400'  },
  { status: 'Completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bar: 'bg-green-500' },
  { status: 'Cancelled', label: 'Cancelled', icon: XCircle,      color: 'text-red-500',   bar: 'bg-red-400'   },
];

function periodLabel(p: AnalyticsPeriod) {
  const map: Record<AnalyticsPeriod, string> = {
    'Today': 'today', 'This Week': 'this week', 'This Month': 'this month', 'This Year': 'this year',
  };
  return map[p];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Reports() {
  const [dateRange, setDateRange] = useState<AnalyticsPeriod>('This Week');

  // Single hook call — all computation happens inside useAnalytics.
  // When dateRange = 'Today', every stat equals Dashboard's values exactly.
  const analytics = useAnalytics(dateRange);

  if (analytics.loading) return <LoadingScreen />;
  if (analytics.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load reports</p>
          <p className="text-gray-500 text-sm">{analytics.error.message}</p>
        </div>
      </div>
    );
  }

  const { chartData, topItems, recentTransactions } = analytics;
  const pLabel       = periodLabel(dateRange);
  const maxSale      = Math.max(...chartData.map(d => d.value), 1);
  const maxItemCount = Math.max(...topItems.map(i => i.count), 1);

  // Merge analytics counts into STATUS_CONFIG for rendering
  const statusDisplay = STATUS_CONFIG
    .map(cfg => ({
      ...cfg,
      count: analytics.statusBreakdown.find(s => s.status === cfg.status)?.count ?? 0,
    }))
    .filter(x => x.count > 0);
  const maxStatusCount = Math.max(...statusDisplay.map(s => s.count), 1);

  // Stat cards — when dateRange = 'Today', these equal Dashboard's values exactly
  const statCards = [
    {
      label: 'Total Revenue (incl. tax)',
      value: `$${analytics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: analytics.realRevenue > 0 ? `+$${analytics.realRevenue.toFixed(2)} ${pLabel}` : 'Lifetime total',
      color: 'green',
    },
    {
      label: 'Total Orders',
      value: analytics.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      trend: `${analytics.realOrders} new ${pLabel}`,
      color: 'blue',
    },
    {
      label: 'Avg. Order Value',
      value: `$${analytics.avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      trend: `${analytics.completedPeriod.length} completed ${pLabel}`,
      color: 'orange',
    },
    {
      label: 'Menu Items',
      value: analytics.menuItemsCount.toString(),
      icon: Utensils,
      trend: `${analytics.availableMenuItemsCount} available now`,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-xs md:text-base text-gray-500">Track your cafe performance and growth.</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <div className="relative flex-1 md:flex-initial">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as AnalyticsPeriod)}
              className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-caramel"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-black transition-colors"
          >
            <Download size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards (same StatCard component as Dashboard) ──────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Revenue Trend + Top Items ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-sm md:text-lg font-bold text-gray-900">Revenue Trend</h2>
            {analytics.realRevenue > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                +${analytics.realRevenue.toFixed(2)} {pLabel}
              </span>
            )}
          </div>
          <div className="flex-1 flex items-end justify-between gap-1 md:gap-2 h-52 md:h-64 pb-2">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 md:gap-2 group">
                <div className="relative w-full h-44 md:h-52 flex items-end justify-center">
                  <motion.div
                    key={`${dateRange}-bar-${idx}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.value / maxSale) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.04 }}
                    className="w-full max-w-[32px] md:max-w-[40px] rounded-t-lg transition-opacity group-hover:opacity-75 relative"
                    style={{ background: data.realRevenue > 0 ? '#c8956c' : '#e8d5c4' }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-11 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                      ${data.value.toFixed(2)}{data.orders > 0 ? ` · ${data.orders} orders` : ''}
                    </div>
                  </motion.div>
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-500">{data.label}</span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 md:mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-caramel" />
              <span className="text-xs text-gray-500">Real orders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#e8d5c4' }} />
              <span className="text-xs text-gray-500">Historical baseline</span>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Top Selling Items</h2>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No orders {pLabel}</p>
          ) : (
            <div className="space-y-4 md:space-y-5">
              {topItems.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-gray-500 shrink-0 ml-2">{item.count}x</span>
                  </div>
                  <div className="w-full h-2 bg-mocha-100 rounded-full overflow-hidden">
                    <motion.div
                      key={`${dateRange}-top-${idx}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxItemCount) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.2 + idx * 0.08 }}
                      className="h-full bg-caramel rounded-full"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">${item.revenue.toFixed(2)} revenue</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Status Breakdown + Recent Transactions ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">

        {/* Order Status Breakdown — live kitchen board (all real orders, not period-filtered) */}
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4 md:mb-6">
            <h2 className="text-sm md:text-lg font-bold text-gray-900">Live Kitchen Board</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Current status of all {analytics.allOrdersTotal} real orders in the system
            </p>
          </div>
          {statusDisplay.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No orders in the system yet</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {statusDisplay.map((s, idx) => {
                const Icon = s.icon;
                const pct = analytics.allOrdersTotal > 0
                  ? Math.round((s.count / analytics.allOrdersTotal) * 100)
                  : 0;
                return (
                  <div key={s.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={s.color} />
                        <span className="font-medium text-gray-800">{s.label}</span>
                      </div>
                      <span className="text-gray-500 tabular-nums">{s.count} · {pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-mocha-100 rounded-full overflow-hidden">
                      <motion.div
                        key={`status-${s.status}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + idx * 0.06 }}
                        className={`h-full ${s.bar} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No completed orders {pLabel}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((order, idx) => {
                const elapsed = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const timeStr = elapsed < 1 ? 'just now' : elapsed < 60 ? `${elapsed}m ago` : `${Math.round(elapsed / 60)}h ago`;
                const summary = order.items.slice(0, 2).map(i => `${i.quantity}× ${i.name}`).join(', ');
                const more    = order.items.length > 2 ? ` +${order.items.length - 2}` : '';
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between py-2.5 md:py-3 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-green-50 text-green-600 rounded-lg shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                          {order.orderNumber} · Table {order.tableId}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{summary}{more}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs md:text-sm font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                      <p className="text-[11px] text-gray-400">{timeStr}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

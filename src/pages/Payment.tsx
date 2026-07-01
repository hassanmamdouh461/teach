import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types/order';
import { PaymentModal } from '../components/payment/PaymentModal';
import { CreditCard, DollarSign, Search, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrders } from '../hooks/useOrders';

export default function Payment() {
  // Use Appwrite - sync with Orders page
  const { orders: allOrders, error, completeWithPayment } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Show all orders pending payment — regardless of kitchen status.
  // An order leaves this screen ONLY when paymentStatus becomes 'Paid'.
  const orders = useMemo(() =>
    allOrders.filter(o => o.paymentStatus === 'Unpaid' && o.status !== 'Cancelled'),
  [allOrders]);

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = async (orderId: string, method: 'Cash' | 'Card') => {
    try {
      await completeWithPayment(orderId, method);
    } catch (err) {
      console.error('Failed to complete payment:', err);
      alert('Failed to complete payment');
    }
  };

  // Ready first → Preparing → New (cashier sees most urgent orders at the top).
  // Tie-break: oldest createdAt first (longest-waiting customer gets priority).
  const STATUS_PRIORITY: Record<string, number> = { Ready: 1, Preparing: 2, New: 3, Completed: 4, Cancelled: 5 };

  const filteredOrders = orders
    .filter(o =>
      o.tableId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const pd = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
      if (pd !== 0) return pd;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load orders</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const today = new Date().toDateString();
  const totalRevenue = allOrders
    .filter(o => o.paymentStatus === 'Paid' && new Date(o.createdAt).toDateString() === today)
    .reduce((sum, o) => sum + o.totalAmount * 1.1, 0);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Payment & Billing</h1>
          <p className="text-xs md:text-base text-gray-500">Process customer payments and view daily revenue.</p>
        </div>
        <div className="bg-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl border border-mocha-100 shadow-sm flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-50 text-green-600 rounded-lg">
                <DollarSign size={18} className="md:w-5 md:h-5" />
            </div>
            <div>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium">Today's Revenue (incl. tax)</p>
                <p className="text-base md:text-lg font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
        <input
          type="text"
          placeholder="Search by Table or Order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent shadow-sm text-sm md:text-base"
        />
      </div>

      {/* Payable Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredOrders.length > 0 ? (
           filteredOrders.map(order => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-300 transition-colors relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-xl font-bold text-gray-900">{order.tableId}</h3>
                   <p className="text-sm text-gray-500">order #{order.orderNumber}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                   order.status === 'Completed' ? 'bg-purple-100 text-purple-700' :
                   order.status === 'Ready'     ? 'bg-green-100 text-green-700'  :
                                                  'bg-blue-50 text-blue-700'
                }`}>
                   {order.status === 'Completed' ? '✓ Ready to Pay' : order.status}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {order.items.slice(0, 2).map((item, idx) => (
                   <div key={idx} className="flex justify-between text-sm text-gray-600">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                ))}
                {order.items.length > 2 && (
                   <p className="text-xs text-gray-400 italic">+{order.items.length - 2} more items...</p>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-lg text-gray-900">
                   <span>Total</span>
                   <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenPayment(order)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
              >
                <CreditCard size={18} /> Process Payment
              </button>
            </motion.div>
           ))
        ) : (
           <div className="col-span-full text-center py-20 text-gray-500">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Calculator className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No payable orders found</p>
           </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        order={selectedOrder}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}

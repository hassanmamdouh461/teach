import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTaxRate } from '../../utils/settingsConfig';
import { MenuItem, CATEGORIES } from '../../types/menu';
import { OrderItem, Order } from '../../types/order';
import { useLanguage } from '../../context/LanguageContext';
import { Coffee, Trash2, Plus, Minus, CreditCard, DollarSign, Check, XCircle, Printer } from 'lucide-react';
import { clsx } from 'clsx';
import { printCustomerReceipt } from '../../utils/printReceipts';

interface POSViewProps {
  menuItems: MenuItem[];
  onCreateOrder: (
    tableId: string,
    items: OrderItem[],
    paymentStatus: 'Paid' | 'Unpaid',
    paymentMethod?: 'Cash' | 'Card',
    paidAmount?: number
  ) => Promise<Order | null>;
  estimatedOrderNumber: string;
}

export function POSView({ menuItems, onCreateOrder, estimatedOrderNumber }: POSViewProps) {
  const { t, isRtl, language } = useLanguage();
  const [invoiceItems, setInvoiceItems] = useState<OrderItem[]>([]);
  const [receivedAmount, setReceivedAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [orderMode, setOrderMode] = useState<'Dine-in' | 'Takeaway'>('Takeaway');
  const [tableId, setTableId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSetOrderMode = (mode: 'Dine-in' | 'Takeaway') => {
    setOrderMode(mode);
    if (mode === 'Takeaway') {
      setPaymentStatus('Paid');
    } else {
      setPaymentStatus('Unpaid');
      setTableId('');
    }
  };

  // Available categories
  const categories = CATEGORIES;

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    const available = menuItems.filter(item => item.available);
    if (selectedCategory === 'All') return available;
    return available.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Total invoice amount
  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [invoiceItems]);

  const taxRate = getTaxRate();
  const taxAmount = useMemo(() => totalAmount * taxRate, [totalAmount, taxRate]);
  const grandTotal = useMemo(() => totalAmount + taxAmount, [totalAmount, taxAmount]);

  // Items count
  const itemsCount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [invoiceItems]);

  // Change amount
  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount);
    if (isNaN(received) || received <= grandTotal) return 0;
    return received - grandTotal;
  }, [receivedAmount, grandTotal]);

  // Add item to invoice
  const handleAddItem = (menuItem: MenuItem) => {
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          category: menuItem.category,
        },
      ];
    });
  };

  // Adjust item quantity
  const handleAdjustQuantity = (itemId: string, amount: number) => {
    setInvoiceItems(prev => {
      return prev
        .map(item => {
          if (item.id === itemId) {
            const nextQty = item.quantity + amount;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  // Remove item from invoice
  const handleRemoveItem = (itemId: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Keypad presses
  const handleKeypadPress = (val: string) => {
    setReceivedAmount(prev => {
      if (val === 'C') return '0';
      if (val === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '0') return val;
      return prev + val;
    });
  };

  // Quick cash buttons
  const handleQuickCash = (amount: number) => {
    setReceivedAmount(String(amount));
  };

  // Reset current invoice
  const handleReset = () => {
    setInvoiceItems([]);
    setReceivedAmount('0');
    setPaymentMethod('Cash');
    setPaymentStatus(orderMode === 'Takeaway' ? 'Paid' : 'Unpaid');
    setTableId('');
  };

  // Save and place order
  const handleSaveOrder = async () => {
    if (invoiceItems.length === 0) {
      alert(t('Please add items to invoice first'));
      return;
    }

    if (orderMode === 'Dine-in' && !tableId.trim()) {
      alert(t('Please select table number first'));
      return;
    }

    try {
      const finalTableId = orderMode === 'Takeaway' ? 'Takeaway' : `${t('Table')} ${tableId}`;
      const paidAmt = paymentStatus === 'Paid' ? grandTotal : undefined;
      await onCreateOrder(finalTableId, invoiceItems, paymentStatus, paymentMethod, paidAmt);
      
      // Clear state and show success message
      handleReset();
      setSuccessMessage(t('Successfully saved order'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save order');
    }
  };

  const handlePrintAndPay = async () => {
    if (invoiceItems.length === 0) {
      alert(t('Please add items to invoice first'));
      return;
    }

    if (orderMode === 'Dine-in' && !tableId.trim()) {
      alert(t('Please select table number first'));
      return;
    }

    try {
      const finalTableId = orderMode === 'Takeaway' ? 'Takeaway' : `${t('Table')} ${tableId}`;
      const finalPaymentStatus = 'Paid';
      const paidAmt = grandTotal;

      // Create order
      const newOrder = await onCreateOrder(finalTableId, invoiceItems, finalPaymentStatus, paymentMethod, paidAmt);

      if (newOrder) {
        printCustomerReceipt(newOrder, language);
      }

      // Clear state and show success message
      handleReset();
      setSuccessMessage(t('Successfully saved order'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to process print and save');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden text-gray-800">
      
      {/* 1. LEFT COLUMN: Payments & Calculator (Width 28%) - Only visible for Takeaway */}
      {orderMode === 'Takeaway' && (
        <div className="w-full lg:w-[28%] bg-white p-2.5 md:p-3 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="space-y-1.5 md:space-y-2">
            <h2 className="font-extrabold text-xs md:text-sm text-mocha-800 border-b border-gray-100 pb-1.5 shrink-0">
              <span className="font-sans">{t('Payment & Invoice')}</span>
            </h2>
            
            {/* Total Due & Received Amount Input */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-extrabold"><span className="font-sans">{t('Total Due')}</span></label>
                <div className="w-full bg-gray-950 text-amber-400 font-mono text-xl md:text-2xl font-black px-2.5 py-1 rounded-xl border border-gray-800 flex justify-between items-center select-all h-[46px]">
                  <span>{grandTotal.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 font-sans font-bold">{isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-extrabold"><span className="font-sans">{t('Received Amount')}</span></label>
                <div className="w-full bg-gray-950 text-emerald-400 font-mono text-xl md:text-2xl font-black px-2.5 py-1 rounded-xl border border-gray-800 flex justify-between items-center select-all h-[46px]">
                  <span>{receivedAmount}</span>
                  <span className="text-xs text-gray-500 font-sans font-bold">{isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
            </div>

            {/* Change for Customer */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-extrabold"><span className="font-sans">{t('Change for Customer')}</span></label>
              <div className="w-full bg-gray-950 text-amber-400 font-mono text-xl md:text-2xl font-black px-2.5 py-1 rounded-xl border border-gray-800 flex justify-between items-center h-[46px]">
                <span>{changeAmount.toFixed(2)}</span>
                <span className="text-xs text-gray-500 font-sans font-bold">{isRtl ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 20, 50, 100, 200, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleQuickCash(amt)}
                  className="bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-sm sm:text-base font-black text-gray-800 py-1.5 rounded-xl border border-gray-200"
                >
                  {amt}
                </button>
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-1.5 font-mono">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '00'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-base sm:text-lg font-black text-gray-900 py-2 rounded-xl border border-gray-200"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('C')}
                className="col-span-3 bg-red-500 hover:bg-red-600 text-white text-base font-black py-2 rounded-xl border border-red-600 shadow-sm active:scale-95 transition-all"
              >
                C
              </button>
            </div>

            {/* Payment Method & Status Selection */}
            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-gray-100 pt-2 shrink-0">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs text-gray-500 font-extrabold uppercase"><span className="font-sans">{t('Payment Method')}</span></label>
                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  <button
                    onClick={() => setPaymentMethod('Cash')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-md text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1",
                      paymentMethod === 'Cash' ? "bg-white text-mocha-700 shadow-sm" : "text-gray-500 hover:bg-white/30"
                    )}
                  >
                    <DollarSign size={14} />
                    <span className="font-sans">{t('Cash')}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('Card')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-md text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1",
                      paymentMethod === 'Card' ? "bg-white text-mocha-700 shadow-sm" : "text-gray-500 hover:bg-white/30"
                    )}
                  >
                    <CreditCard size={14} />
                    <span className="font-sans">{t('Card')}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] md:text-xs text-gray-500 font-extrabold uppercase"><span className="font-sans">{t('Payment Status')}</span></label>
                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  <button
                    onClick={() => setPaymentStatus('Unpaid')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-md text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1",
                      paymentStatus === 'Unpaid' ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:bg-white/30"
                    )}
                  >
                    <span className="font-sans">{t('Unpaid')}</span>
                  </button>
                  <button
                    onClick={() => setPaymentStatus('Paid')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-md text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1",
                      paymentStatus === 'Paid' ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:bg-white/30"
                    )}
                  >
                    <span className="font-sans">{t('Paid')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="space-y-1.5 mt-2 pt-1.5 border-t border-gray-100 shrink-0">
            <button
              onClick={handlePrintAndPay}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl border border-emerald-700 transition-all active:scale-95 text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Printer size={16} />
              <span className="font-sans">{t('Print & Pay')}</span>
            </button>
            
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleReset}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 rounded-xl border border-red-200 transition-all active:scale-95 text-xs sm:text-sm text-center"
              >
                <span className="font-sans">{t('Clear / Reset')}</span>
              </button>
              <button
                onClick={handleSaveOrder}
                className="bg-mocha-600 hover:bg-mocha-700 text-white font-black py-2 rounded-xl border border-mocha-700 transition-all active:scale-95 text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check size={16} />
                <span className="font-sans">{t('Save Invoice')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CENTER COLUMN: Product Grid & Category Filters (Width 2/4) */}
      <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Category Selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 border-b border-gray-100 shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-sm md:text-base font-black whitespace-nowrap transition-all border",
                selectedCategory === cat
                  ? "bg-mocha-600 text-white border-mocha-700 shadow-sm"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              )}
            >
              {t(cat)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 custom-scrollbar">
          {successMessage && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl p-3 mb-4 font-bold text-center text-xs animate-bounce">
              {successMessage}
            </div>
          )}
          {filteredMenuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <Coffee size={50} className="stroke-1 mb-2" />
              <p className="text-sm md:text-base font-bold">{t('No items')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-4 gap-3">
              {filteredMenuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all p-2.5 rounded-xl border border-gray-200/60 hover:border-gray-300 shadow-sm flex flex-col justify-between items-start text-start h-24 sm:h-26 relative overflow-hidden group"
                >
                  <span className="font-bold text-sm sm:text-base md:text-[16px] text-gray-900 group-hover:text-mocha-700 font-sans leading-snug pt-0.5">{t(item.name)}</span>
                  <div className="w-full flex justify-between items-center z-10 mt-1">
                    <span className="font-mono text-base sm:text-lg md:text-xl font-black text-mocha-800">{item.price.toFixed(2)} <span className="text-[10px] sm:text-xs text-gray-400 font-sans font-bold">{isRtl ? 'ج.م' : 'EGP'}</span></span>
                    <span className="bg-mocha-50 text-mocha-600 text-sm sm:text-base px-2.5 py-0.5 rounded-lg border border-mocha-200 group-hover:bg-mocha-600 group-hover:text-white transition-colors font-black">+</span>
                  </div>
                  {/* Subtle hover icon decoration */}
                  <Coffee size={32} className="absolute -right-2 -bottom-2 text-gray-200/20 group-hover:text-mocha-200/10 transition-all pointer-events-none" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT COLUMN: Current Bill & Summary (Width 23%) */}
      <div className="w-full lg:w-[23%] bg-white p-3 md:p-3.5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <h2 className="font-extrabold text-base md:text-lg text-mocha-800 border-b border-gray-100 pb-2 shrink-0">{t('Invoice Details')}</h2>
          
          {/* Table Mode Selector */}
          <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 mt-3 shrink-0">
            <button
              onClick={() => handleSetOrderMode('Dine-in')}
              className={clsx(
                "flex-1 py-2.5 rounded-lg text-sm md:text-base font-black transition-all",
                orderMode === 'Dine-in' ? "bg-white text-mocha-700 shadow-sm" : "text-gray-500 hover:bg-white/50"
              )}
            >
              {t('Dine-in')}
            </button>
            <button
              onClick={() => handleSetOrderMode('Takeaway')}
              className={clsx(
                "flex-1 py-2.5 rounded-lg text-sm md:text-base font-black transition-all",
                orderMode === 'Takeaway' ? "bg-white text-mocha-700 shadow-sm" : "text-gray-500 hover:bg-white/50"
              )}
            >
              {t('Takeaway')}
            </button>
          </div>

          {/* Table ID Selector (Only visible for Dine-in) */}
          {orderMode === 'Dine-in' && (
            <div className="mt-3 shrink-0 space-y-2 border-b border-gray-100 pb-3">
              <label className="text-sm text-gray-600 font-extrabold">{t('Table')}</label>
              <input
                type="text"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder={t('Enter Table Number')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-extrabold text-base md:text-lg focus:outline-none focus:border-mocha-600 focus:ring-2 focus:ring-mocha-100"
              />
              <div className="flex flex-wrap gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(num => (
                  <button
                    key={num}
                    onClick={() => setTableId(num)}
                    className={clsx(
                      "px-3.5 py-2 text-sm md:text-base font-extrabold rounded-xl border transition-all shadow-sm",
                      tableId === num
                        ? "bg-mocha-600 text-white border-mocha-700"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    T{num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Invoice List */}
          <div className="flex-1 overflow-y-auto mt-2 pr-1 hide-scrollbar border-b border-gray-100 pb-2">
            {invoiceItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                <Coffee size={32} className="stroke-1 mb-1" />
                <p className="text-xs font-bold">{t('No items')}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {invoiceItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs md:text-sm gap-1.5 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-[10px] md:text-xs text-gray-400 font-sans">{idx + 1}.</span>
                        <span className="font-extrabold text-gray-900 truncate text-xs md:text-sm font-sans">{t(item.name)}</span>
                      </div>
                      <span className="text-[11px] md:text-xs text-mocha-700 font-extrabold font-mono">{(item.price * item.quantity).toFixed(2)} <span className="font-sans text-[9px] md:text-[10px]">{isRtl ? 'ج.م' : 'EGP'}</span></span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center bg-white border border-gray-200 rounded-md p-0.5 shadow-sm">
                        <button
                          onClick={() => handleAdjustQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-1.5 font-black text-gray-900 text-xs md:text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleAdjustQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Summary Box */}
        <div className="mt-2 space-y-1.5 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
              <span className="text-gray-500 text-[10px] md:text-xs font-extrabold">{t('Invoice Number')}</span>
              <span className="font-black text-gray-950 mt-1 text-xs md:text-sm">{estimatedOrderNumber}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
              <span className="text-gray-500 text-[10px] md:text-xs font-extrabold">{t('Items Count')}</span>
              <span className="font-black text-gray-950 mt-1 text-xs md:text-sm">{itemsCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
              <span className="text-gray-500 text-[10px] md:text-xs font-extrabold">{t('Invoice Date')}</span>
              <span className="font-extrabold text-gray-900 mt-1 text-xs md:text-sm">{new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
            </div>
            
            {/* Invoice Total - Highlighted in Caramel/Yellow */}
            <div className="bg-amber-50/50 rounded-xl p-1.5 border border-amber-200/60 flex flex-col items-center justify-center min-h-[44px] relative">
              <span className="text-[8px] text-amber-600/80 font-extrabold mb-0.5 font-sans">{t('Total')}</span>
              <span className="font-mono text-xs font-black text-amber-900 mt-0.5">{grandTotal.toFixed(2)} <span className="text-[9px] font-sans font-bold">{isRtl ? 'ج.م' : 'EGP'}</span></span>
              <span className="absolute bottom-0.5 text-[6px] text-amber-600/60 font-sans">{isRtl ? 'شامل الضريبة' : 'incl. tax'}</span>
            </div>
          </div>
          
          {/* Action buttons (only visible here for Dine-in orders to save space) */}
          {orderMode === 'Dine-in' && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={handleReset}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 rounded-xl border border-red-200 transition-all active:scale-95 text-xs md:text-sm text-center"
              >
                {t('Clear / Reset')}
              </button>
              <button
                onClick={handleSaveOrder}
                className="bg-mocha-600 hover:bg-mocha-700 text-white font-black py-2 rounded-xl border border-mocha-700 transition-all active:scale-95 text-xs md:text-sm text-center flex items-center justify-center gap-1 shadow-sm"
              >
                <Check size={14} />
                {t('Save Invoice')}
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

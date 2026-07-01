import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../../types/order';
import { X, CheckCircle2, Receipt, Printer, CreditCard, Banknote } from 'lucide-react';
import { clsx } from 'clsx';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (orderId: string, method: 'Cash' | 'Card') => void;
}

export function PaymentModal({ order, isOpen, onClose, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  // Track whether onPaymentComplete has already been called for this session.
  // Prevents double-firing if the user clicks Done twice or if any stale timer fires.
  const paymentFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset all state when the modal opens on a fresh order
  useEffect(() => {
    if (isOpen && order) {
      if (order.paymentStatus === 'Paid') {
        setPaymentMethod(order.paymentMethod || 'Cash');
        setIsProcessing(false);
        setShowReceipt(true);
      } else {
        setPaymentMethod('Cash');
        setIsProcessing(false);
        setShowReceipt(false);
      }
      paymentFiredRef.current = false;
    }
    // Cleanup: cancel any pending timer if the modal is closed externally (e.g. backdrop)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, order?.id]); // re-run only when a different order opens

  if (!isOpen || !order) return null;

  const subtotal = order.totalAmount;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleProcessPayment = () => {
    setIsProcessing(true);
    timerRef.current = setTimeout(() => {
      // Fire the DB write immediately when payment "succeeds" — not on modal dismiss.
      // Capture orderId/method in closure so stale state can never target the wrong order.
      const orderId = order.id;
      const method  = paymentMethod;
      if (!paymentFiredRef.current) {
        paymentFiredRef.current = true;
        onPaymentComplete(orderId, method);
      }
      setIsProcessing(false);
      setShowReceipt(true);
    }, 1500);
  };

  const handleClose = () => {
    // Cancel any in-flight timer to prevent the stale-receipt bug
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsProcessing(false);
    setShowReceipt(false);
    onClose();
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .paid-stamp {
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            border: 3px solid #10b981;
            padding: 10px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .info { margin: 15px 0; font-size: 14px; }
          .info-row { 
            display: flex; 
            justify-content: space-between;
            margin: 5px 0;
          }
          .items { 
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 15px 0;
          }
          .item { 
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
          }
          .item-name { flex: 1; }
          .totals { margin-top: 15px; font-size: 14px; }
          .total-row { 
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total-row.grand { 
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          .payment-info {
            background: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
          }
          .footer { 
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            font-size: 12px;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BREWMASTER</h1>
          <p>Premium Coffee Experience</p>
          <p>Tel: (555) 123-4567</p>
        </div>

        <div class="paid-stamp">✓ PAID</div>
        
        <div class="info">
          <div class="info-row">
            <strong>Receipt:</strong>
            <span>${order.orderNumber}</span>
          </div>
          <div class="info-row">
            <strong>Table:</strong>
            <span>${order.tableId}</span>
          </div>
          <div class="info-row">
            <strong>Date:</strong>
            <span>${new Date().toLocaleString()}</span>
          </div>
        </div>

        <div class="items">
          <h3 style="margin-bottom: 10px;">Items:</h3>
          ${order.items.map(item => `
            <div class="item">
              <span class="item-name">${item.quantity}x ${item.name}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div class="total-row grand">
            <span>TOTAL PAID:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="payment-info">
          <strong>Payment Method:</strong> ${paymentMethod}
        </div>

        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>Enjoy your coffee ☕</p>
        </div>

        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-50 overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="text-mocha-700" />
              {showReceipt ? 'Payment Successful' : 'Process Payment'}
            </h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {!showReceipt ? (
              <div className="space-y-6">
                 {/* Order Summary */}
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Table</span>
                      <span className="font-bold text-gray-900">{order.tableId}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm text-gray-500">Order ID</span>
                       <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{order.orderNumber}</span>
                    </div>
                    <div className="border-t border-gray-200 my-3" />
                    <div className="flex justify-between items-center text-lg font-bold">
                       <span>Total to Pay</span>
                       <span className="text-mocha-700">${total.toFixed(2)}</span>
                    </div>
                 </div>

                 {/* Payment Method Selection */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button
                          onClick={() => setPaymentMethod('Cash')}
                          className={clsx(
                             "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                             paymentMethod === 'Cash' ? "border-mocha-700 bg-mocha-100 text-mocha-800" : "border-gray-100 hover:border-gray-200 text-gray-600"
                          )}
                       >
                          <Banknote size={24} />
                          <span className="font-medium">Cash</span>
                       </button>
                       <button
                          onClick={() => setPaymentMethod('Card')}
                          className={clsx(
                             "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                             paymentMethod === 'Card' ? "border-mocha-700 bg-mocha-100 text-mocha-800" : "border-gray-100 hover:border-gray-200 text-gray-600"
                          )}
                       >
                          <CreditCard size={24} />
                          <span className="font-medium">Card / UPI</span>
                       </button>
                    </div>
                 </div>

                 <button
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full bg-mocha-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-mocha-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                    {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                 </button>
              </div>
            ) : (
              <div className="text-center space-y-6">
                 <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                 </div>
                 
                 <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Payment Received!</h3>
                    <p className="text-gray-500">Transaction completed successfully.</p>
                 </div>

                 {/* Mock Receipt Preview */}
                 <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-left font-mono text-sm shadow-inner relative overflow-hidden">
                    {/* Jaggered edge effect */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent to-white bg-[length:10px_100%]" />
                    
                    <div className="text-center border-b border-gray-200 pb-4 mb-4">
                       <p className="font-bold text-lg">BREWMASTER</p>
                       <p className="text-xs text-gray-400">42 Roast Street, Coffee District</p>
                    </div>

                    <div className="space-y-2 mb-4">
                       {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between">
                             <span>{item.quantity}x {item.name}</span>
                             <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                       ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-1">
                       <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between">
                          <span>Tax</span>
                          <span>${tax.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between font-bold text-base pt-2">
                          <span>TOTAL</span>
                          <span>${total.toFixed(2)}</span>
                       </div>
                    </div>
                    
                    <div className="text-center mt-6 text-xs text-gray-400">
                       <p>Paid via {paymentMethod}</p>
                       <p>{new Date().toLocaleString()}</p>
                       <p>Thank you for choosing BrewMaster! ☕</p>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={handlePrintReceipt} 
                      className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                       <Printer size={18} /> Print Receipt
                    </button>
                    <button onClick={handleClose} className="flex-1 py-3 bg-mocha-700 text-white rounded-xl font-medium hover:bg-mocha-800 shadow-lg shadow-mocha-500/20">
                       Done
                    </button>
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

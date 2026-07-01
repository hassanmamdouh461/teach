export type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string; // Database ID (for API calls)
  orderNumber: string; // Display ID (e.g., ORD-1025)
  tableId: string;
  status: OrderStatus;
  /** Financial status. Only set to 'Paid' from Payment.tsx — never from the kitchen/orders screen. */
  paymentStatus: PaymentStatus;
  paymentMethod?: 'Cash' | 'Card';
  items: OrderItem[];
  totalAmount: number;
  createdAt: string; // ISO string
}

// ─── Demo layout: 3 New · 2 Preparing · 3 Ready · 0 Completed · 0 Cancelled ──
// ALL paymentStatus = 'Unpaid'  →  Dashboard revenue starts at $0.00
// This is the single source of truth used by both the Settings "Reset" button
// and the seed-appwrite.ts script, so both paths produce the exact same board.
export const MOCK_ORDERS: Order[] = [
  // ═══════════════ NEW (3) ═══════════════
  {
    id: 'mock-id-001',
    orderNumber: 'ORD-001',
    tableId: 'Table 3',
    status: 'New',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-1', name: 'Spanish Latte',    quantity: 2, price: 6.00 },
      { id: 'item-2', name: 'Croissant',         quantity: 1, price: 4.50 },
      { id: 'item-3', name: 'Orange Juice',      quantity: 1, price: 4.00 },
    ],
    totalAmount: 20.50,
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'mock-id-002',
    orderNumber: 'ORD-002',
    tableId: 'Table 7',
    status: 'New',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-4', name: 'Cappuccino',        quantity: 2, price: 5.00 },
      { id: 'item-5', name: 'Avocado Toast',     quantity: 1, price: 9.00 },
    ],
    totalAmount: 14.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'mock-id-003',
    orderNumber: 'ORD-003',
    tableId: 'Table 1',
    status: 'New',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-6', name: 'Espresso Shot',     quantity: 2, price: 3.50 },
      { id: 'item-7', name: 'Blueberry Muffin',  quantity: 1, price: 4.50 },
    ],
    totalAmount: 11.50,
    createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },

  // ═══════════════ PREPARING (2) ═══════════════
  {
    id: 'mock-id-004',
    orderNumber: 'ORD-004',
    tableId: 'Table 5',
    status: 'Preparing',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-8',  name: 'Iced Caramel Macchiato', quantity: 2, price: 6.50 },
      { id: 'item-9',  name: 'Club Sandwich',           quantity: 1, price: 9.00 },
    ],
    totalAmount: 22.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'mock-id-005',
    orderNumber: 'ORD-005',
    tableId: 'Table 2',
    status: 'Preparing',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-10', name: 'Mocha Frappe',     quantity: 1, price: 6.50 },
      { id: 'item-11', name: 'Eggs Benedict',    quantity: 1, price: 13.00 },
    ],
    totalAmount: 19.50,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },

  // ═══════════════ READY (3) ═══════════════
  {
    id: 'mock-id-006',
    orderNumber: 'ORD-006',
    tableId: 'Table 9',
    status: 'Ready',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-12', name: 'Flat White',       quantity: 3, price: 5.00 },
    ],
    totalAmount: 15.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'mock-id-007',
    orderNumber: 'ORD-007',
    tableId: 'Table 4',
    status: 'Ready',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-13', name: 'Spanish Latte',    quantity: 2, price: 6.00 },
      { id: 'item-14', name: 'Grilled Panini',   quantity: 1, price: 11.50 },
      { id: 'item-15', name: 'Espresso Shot',    quantity: 1, price: 3.50 },
    ],
    totalAmount: 27.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'mock-id-008',
    orderNumber: 'ORD-008',
    tableId: 'Table 6',
    status: 'Ready',
    paymentStatus: 'Unpaid',
    items: [
      { id: 'item-16', name: 'Americano',        quantity: 2, price: 4.00 },
      { id: 'item-17', name: 'Banana Bread',     quantity: 1, price: 4.00 },
    ],
    totalAmount: 12.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

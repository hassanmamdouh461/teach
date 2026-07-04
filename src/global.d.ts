export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  items: OrderItem[];
  status: 'New' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Paid';
  paymentMethod?: 'Cash' | 'Card';
  totalAmount: number;
  createdAt: string;
}

declare global {
  interface Window {
    electronAPI: {
      getMenu: () => Promise<MenuItem[]>;
      createMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
      updateMenuItem: (id: string, data: Partial<Omit<MenuItem, 'id'>>) => Promise<MenuItem>;
      deleteMenuItem: (id: string) => Promise<void>;
      resetMenu: (defaults: Omit<MenuItem, 'id'>[]) => Promise<MenuItem[]>;
      
      getOrders: () => Promise<Order[]>;
      createOrder: (order: Omit<Order, 'id'>) => Promise<Order>;
      updateOrderStatus: (id: string, status: Order['status']) => Promise<Order>;
      completeOrderPayment: (id: string, method: 'Cash' | 'Card') => Promise<Order>;
      updateOrder: (id: string, data: Partial<Omit<Order, 'id'>>) => Promise<Order>;
      deleteOrder: (id: string) => Promise<void>;
      resetOrders: (defaults: Omit<Order, 'id'>[]) => Promise<Order[]>;
    };
  }
}

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
  paidAt?: string;
  customerPhone?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
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

      getCustomers: () => Promise<Customer[]>;
      getCustomerByPhone: (phone: string) => Promise<Customer | null>;
      saveCustomer: (customer: Partial<Customer> & { phone: string }) => Promise<Customer>;
      deleteCustomer: (id: string) => Promise<void>;

      getSettings: () => Promise<Record<string, string>>;
      saveSetting: (key: string, value: string) => Promise<void>;
      deleteSetting: (key: string) => Promise<void>;
    };
  }
}

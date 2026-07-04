import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MenuItem, INITIAL_MENU_ITEMS } from '../types/menu';
import { Order, OrderStatus } from '../types/order';
import { menuService } from '../services/menuService';
import { ordersService } from '../services/ordersService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: Error | null;
  addItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateItem: (id: string, data: Partial<Omit<MenuItem, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  addOrder: (order: Omit<Order, 'id'>) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  completeWithPayment: (id: string, method?: 'Cash' | 'Card') => Promise<void>;
  updateOrder: (id: string, data: Partial<Omit<Order, 'id'>>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

interface DataContextValue {
  menu: MenuState;
  orders: OrdersState;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<Error | null>(null);

  // Orders state
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<Error | null>(null);

  // Track if already fetched (prevent double-fetch in StrictMode)
  const menuFetched = useRef(false);
  const ordersFetched = useRef(false);

  // ── Menu fetching ────────────────────────────────────────────────────────────

  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      setMenuError(null);
      const data = await menuService.getAll();
      setMenuItems(data);
    } catch (err) {
      console.warn('[DataContext] Failed to fetch menu from local SQLite, using default initial items:', err);
      setMenuItems(INITIAL_MENU_ITEMS);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // ── Orders fetching ───────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await ordersService.getAll();
      setOrdersList(data);
    } catch (err) {
      console.warn('[DataContext] Failed to fetch orders from local SQLite:', err);
      setOrdersList([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    if (!menuFetched.current) {
      menuFetched.current = true;
      fetchMenu();
    }
    if (!ordersFetched.current) {
      ordersFetched.current = true;
      fetchOrders();
    }
  }, [fetchMenu, fetchOrders]);

  // ── Menu mutations ────────────────────────────────────────────────────────────

  const addItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    try {
      const newItem = await menuService.create(item);
      setMenuItems(prev => [newItem, ...prev]);
    } catch (err) {
      console.error('[DataContext] Failed to create item in SQLite:', err);
    }
  }, []);

  const updateItem = useCallback(async (id: string, data: Partial<Omit<MenuItem, 'id'>>) => {
    try {
      const updatedItem = await menuService.update(id, data);
      setMenuItems(prev => prev.map(i => i.id === id ? updatedItem : i));
    } catch (err) {
      console.error('[DataContext] Failed to update item in SQLite:', err);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await menuService.delete(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('[DataContext] Failed to delete item in SQLite:', err);
    }
  }, []);

  const toggleAvailability = useCallback(async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    try {
      const updatedItem = await menuService.update(id, { available: !item.available });
      setMenuItems(prev => prev.map(i => i.id === id ? updatedItem : i));
    } catch (err) {
      console.error('[DataContext] Failed to toggle availability in SQLite:', err);
    }
  }, [menuItems]);

  // ── Orders mutations ──────────────────────────────────────────────────────────

  const addOrder = useCallback(async (order: Omit<Order, 'id'>): Promise<Order | null> => {
    try {
      const newOrder = await ordersService.create(order);
      setOrdersList(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error('[DataContext] Failed to create order in SQLite:', err);
      return null;
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    try {
      const updatedOrder = await ordersService.updateStatus(id, status);
      setOrdersList(prev => prev.map(o => o.id === id ? updatedOrder : o));
    } catch (err) {
      console.error('[DataContext] Failed to update order status in SQLite:', err);
    }
  }, []);

  const completeWithPayment = useCallback(async (id: string, method: 'Cash' | 'Card' = 'Cash') => {
    try {
      const updatedOrder = await ordersService.completeWithPayment(id, method);
      setOrdersList(prev => prev.map(o => o.id === id ? updatedOrder : o));
    } catch (err) {
      console.error('[DataContext] Failed to complete payment in SQLite:', err);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, data: Partial<Omit<Order, 'id'>>) => {
    try {
      const updatedOrder = await ordersService.update(id, data);
      setOrdersList(prev => prev.map(o => o.id === id ? updatedOrder : o));
    } catch (err) {
      console.error('[DataContext] Failed to update order in SQLite:', err);
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      await ordersService.delete(id);
      setOrdersList(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('[DataContext] Failed to delete order in SQLite:', err);
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────

  const value: DataContextValue = {
    menu: {
      items: menuItems,
      loading: menuLoading,
      error: menuError,
      addItem,
      updateItem,
      deleteItem,
      toggleAvailability,
      refetch: fetchMenu,
    },
    orders: {
      orders: ordersList,
      loading: ordersLoading,
      error: ordersError,
      addOrder,
      updateOrderStatus,
      completeWithPayment,
      updateOrder,
      deleteOrder,
      refetch: fetchOrders,
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMenuContext(): MenuState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useMenuContext must be used within DataProvider');
  return ctx.menu;
}

export function useOrdersContext(): OrdersState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useOrdersContext must be used within DataProvider');
  return ctx.orders;
}


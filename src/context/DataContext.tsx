import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MenuItem } from '../types/menu';
import { Order, OrderStatus, PaymentStatus } from '../types/order';
import { menuService } from '../services/menuService';
import { ordersService } from '../services/ordersService';
import { client, APPWRITE_CONFIG, directUpdate } from '../lib/appwrite';

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
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
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
      setMenuError(err as Error);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // ── Orders fetching ──────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await ordersService.getAll();
      setOrdersList(data);
    } catch (err) {
      setOrdersError(err as Error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Fetch once on mount + setup realtime
  useEffect(() => {
    if (!menuFetched.current) {
      menuFetched.current = true;
      fetchMenu();
    }
    if (!ordersFetched.current) {
      ordersFetched.current = true;
      fetchOrders();
    }

    // Realtime subscription - update local state immediately using the event payload
    const ordersChannel = `databases.${APPWRITE_CONFIG.DB_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.ORDERS}.documents`;
    const menuChannel = `databases.${APPWRITE_CONFIG.DB_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.MENU}.documents`;

    const unsubscribe = client.subscribe([ordersChannel, menuChannel], (response) => {
      const channels = response.channels as string[];
      const isOrderEvent = channels.some(c => c.includes(APPWRITE_CONFIG.COLLECTIONS.ORDERS));
      const isMenuEvent = channels.some(c => c.includes(APPWRITE_CONFIG.COLLECTIONS.MENU));

      if (isOrderEvent) {
        const doc = response.payload as any;
        if (doc) {
          const isDelete = response.events.some(e => e.endsWith('.delete'));
          if (isDelete) {
            setOrdersList(prev => prev.filter(o => o.id !== doc.$id));
          } else {
            let items = doc.items;
            if (typeof items === 'string') {
              try { items = JSON.parse(items); } catch { items = []; }
            }
            if (!Array.isArray(items)) items = [];

            const parsedOrder: Order = {
              id: doc.$id,
              orderNumber: doc.orderNumber,
              tableId: doc.tableId,
              items,
              status: doc.status as OrderStatus,
              paymentStatus: (doc.paymentStatus as PaymentStatus) ?? 'Unpaid',
              totalAmount: doc.totalAmount,
              createdAt: doc.createdAt,
            };

            setOrdersList(prev => {
              const exists = prev.some(o => o.id === parsedOrder.id);
              if (exists) {
                return prev.map(o => o.id === parsedOrder.id ? parsedOrder : o);
              } else {
                return [parsedOrder, ...prev];
              }
            });
          }
        } else {
          fetchOrders();
        }
      }

      if (isMenuEvent) {
        const doc = response.payload as any;
        if (doc) {
          const isDelete = response.events.some(e => e.endsWith('.delete'));
          if (isDelete) {
            setMenuItems(prev => prev.filter(i => i.id !== doc.$id));
          } else {
            const parsedItem: MenuItem = {
              id: doc.$id,
              name: doc.name,
              description: doc.description,
              price: doc.price,
              category: doc.category,
              image: doc.image,
              available: doc.available,
            };

            setMenuItems(prev => {
              const exists = prev.some(i => i.id === parsedItem.id);
              if (exists) {
                return prev.map(i => i.id === parsedItem.id ? parsedItem : i);
              } else {
                return [parsedItem, ...prev];
              }
            });
          }
        } else {
          fetchMenu();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchMenu, fetchOrders]);

  // ── Refs for rollback — always point to latest state ─────────────────────────
  const menuItemsRef = useRef(menuItems);
  menuItemsRef.current = menuItems;
  const ordersListRef = useRef(ordersList);
  ordersListRef.current = ordersList;

  // ── Menu mutations ────────────────────────────────────────────────────────────

  const addItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    const newItem = await menuService.create(item);
    setMenuItems(prev => [newItem, ...prev]);
  }, []);

  const updateItem = useCallback(async (id: string, data: Partial<Omit<MenuItem, 'id'>>) => {
    const snapshot = menuItemsRef.current;
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    try {
      await menuService.update(id, data);
    } catch (err) {
      setMenuItems(snapshot);
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const snapshot = menuItemsRef.current;
    setMenuItems(prev => prev.filter(i => i.id !== id));
    try {
      await menuService.delete(id);
    } catch (err) {
      setMenuItems(snapshot);
      throw err;
    }
  }, []);

  const toggleAvailability = useCallback(async (id: string) => {
    const item = menuItemsRef.current.find(i => i.id === id);
    if (!item) return;
    const snapshot = menuItemsRef.current;
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
    try {
      await menuService.update(id, { available: !item.available });
    } catch (err) {
      setMenuItems(snapshot);
      throw err;
    }
  }, []);

  // ── Orders mutations ──────────────────────────────────────────────────────────

  const addOrder = useCallback(async (order: Omit<Order, 'id'>) => {
    const newOrder = await ordersService.create(order);
    setOrdersList(prev => [newOrder, ...prev]);
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const snapshot = ordersListRef.current;
    const existingOrder = snapshot.find(o => o.id === id);
    const isPaid = existingOrder && existingOrder.paymentStatus === 'Paid';
    // If order is already paid and marked as ready, automatically complete it
    const finalStatus = (status === 'Ready' && isPaid) ? 'Completed' : status;

    setOrdersList(prev => prev.map(o => o.id === id ? { ...o, status: finalStatus } : o));
    try {
      await ordersService.updateStatus(id, finalStatus);
    } catch (err) {
      setOrdersList(snapshot);
      throw err;
    }
  }, []);

  const completeWithPayment = useCallback(async (id: string, method: 'Cash' | 'Card' = 'Cash') => {
    const snapshot = ordersListRef.current;
    const existingOrder = snapshot.find(o => o.id === id);
    const shouldComplete = existingOrder && existingOrder.status === 'Ready';

    // Optimistic update: If the kitchen status is already Ready, mark the order as Completed.
    // Otherwise, keep the original status (New/Preparing) so the kitchen can still process it.
    setOrdersList(prev => prev.map(o =>
      o.id === id ? { 
        ...o, 
        paymentStatus: 'Paid',
        status: shouldComplete ? 'Completed' : o.status
      } : o
    ));
    try {
      if (shouldComplete) {
        // Update both paymentStatus, status, and paymentMethod to Completed in the DB
        await directUpdate(APPWRITE_CONFIG.COLLECTIONS.ORDERS, id, {
          paymentStatus: 'Paid',
          status: 'Completed',
          paymentMethod: method,
        });
      } else {
        await ordersService.completeWithPayment(id, method);
      }
    } catch (err) {
      setOrdersList(snapshot);
      throw err;
    }
  }, []);

  const updateOrder = useCallback(async (id: string, data: Partial<Omit<Order, 'id'>>) => {
    const snapshot = ordersListRef.current;
    setOrdersList(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
    try {
      await ordersService.update(id, data);
    } catch (err) {
      setOrdersList(snapshot);
      throw err;
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const snapshot = ordersListRef.current;
    setOrdersList(prev => prev.filter(o => o.id !== id));
    try {
      await ordersService.delete(id);
    } catch (err) {
      setOrdersList(snapshot);
      throw err;
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

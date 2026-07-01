import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MenuItem, INITIAL_MENU_ITEMS } from '../types/menu';
import { Order, OrderStatus } from '../types/order';
import { menuService } from '../services/menuService';
import { ordersService } from '../services/ordersService';
import { client, APPWRITE_CONFIG } from '../lib/appwrite';

/**
 * Pending-writes guard.
 * While a mutation is in-flight we track the optimistic patch so that any
 * realtime-triggered refetch that races back with stale server data won't
 * overwrite the optimistic state the user already sees.
 */
interface PendingWrite {
  id: string;
  patch: Partial<Order>;
}

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

  // ── Pending-writes guard ──────────────────────────────────────────────────────
  // Tracks in-flight mutation patches so realtime refetches don't overwrite
  // optimistic state with stale server data.
  const pendingWritesRef = useRef<PendingWrite[]>([]);

  const addPendingWrite = (id: string, patch: Partial<Order>) => {
    pendingWritesRef.current = [...pendingWritesRef.current, { id, patch }];
  };
  const removePendingWrite = (id: string) => {
    pendingWritesRef.current = pendingWritesRef.current.filter(pw => pw.id !== id);
  };

  /**
   * Apply any pending optimistic patches on top of server data so that
   * a stale refetch can never regress what the user already sees.
   */
  const mergeWithPending = (serverOrders: Order[]): Order[] => {
    const pending = pendingWritesRef.current;
    if (pending.length === 0) return serverOrders;
    return serverOrders.map(order => {
      const pw = pending.find(p => p.id === order.id);
      return pw ? { ...order, ...pw.patch } : order;
    });
  };

  // ── Debounce timer for realtime refetches ──────────────────────────────────
  const ordersDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Menu fetching ────────────────────────────────────────────────────────────

  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      setMenuError(null);
      const data = await menuService.getAll();
      setMenuItems(data);
      localStorage.setItem('local_menu_items', JSON.stringify(data));
    } catch (err) {
      console.warn('[DataContext] Failed to fetch menu from Appwrite, using local cache:', err);
      const cached = localStorage.getItem('local_menu_items');
      if (cached) {
        try {
          setMenuItems(JSON.parse(cached));
        } catch {
          setMenuItems(INITIAL_MENU_ITEMS);
        }
      } else {
        setMenuItems(INITIAL_MENU_ITEMS);
      }
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // ── Orders fetching (with pending-writes merge) ───────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await ordersService.getAll();
      const merged = mergeWithPending(data);
      setOrdersList(merged);
      localStorage.setItem('local_orders', JSON.stringify(data));
    } catch (err) {
      console.warn('[DataContext] Failed to fetch orders from Appwrite, using local cache:', err);
      const cached = localStorage.getItem('local_orders');
      if (cached) {
        try {
          setOrdersList(JSON.parse(cached));
        } catch {
          setOrdersList([]);
        }
      } else {
        setOrdersList([]);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  /**
   * Debounced version of fetchOrders for realtime events.
   * Appwrite can fire multiple realtime events in rapid succession (e.g. when
   * a document update triggers both a create and update event, or when multiple
   * documents change). Debouncing collapses them into a single refetch.
   */
  const debouncedFetchOrders = useCallback(() => {
    if (ordersDebounceRef.current) clearTimeout(ordersDebounceRef.current);
    ordersDebounceRef.current = setTimeout(() => {
      fetchOrders();
    }, 300);
  }, [fetchOrders]);

  const debouncedFetchMenu = useCallback(() => {
    if (menuDebounceRef.current) clearTimeout(menuDebounceRef.current);
    menuDebounceRef.current = setTimeout(() => {
      fetchMenu();
    }, 300);
  }, [fetchMenu]);

  // Fetch once on mount + setup realtime
  useEffect(() => {
    // Optimistic initial load from local storage to prevent blank screen
    const cachedMenu = localStorage.getItem('local_menu_items');
    if (cachedMenu) {
      try {
        setMenuItems(JSON.parse(cachedMenu));
        setMenuLoading(false);
      } catch {}
    }
    const cachedOrders = localStorage.getItem('local_orders');
    if (cachedOrders) {
      try {
        setOrdersList(JSON.parse(cachedOrders));
        setOrdersLoading(false);
      } catch {}
    }

    if (!menuFetched.current) {
      menuFetched.current = true;
      fetchMenu();
    }
    if (!ordersFetched.current) {
      ordersFetched.current = true;
      fetchOrders();
    }

    // Realtime subscription - debounced refetch when orders or menu change externally
    const ordersChannel = `databases.${APPWRITE_CONFIG.DB_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.ORDERS}.documents`;
    const menuChannel = `databases.${APPWRITE_CONFIG.DB_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.MENU}.documents`;

    const unsubscribe = client.subscribe([ordersChannel, menuChannel], (response) => {
      const channels = response.channels as string[];
      if (channels.some(c => c.includes(APPWRITE_CONFIG.COLLECTIONS.ORDERS))) {
        debouncedFetchOrders();
      }
      if (channels.some(c => c.includes(APPWRITE_CONFIG.COLLECTIONS.MENU))) {
        debouncedFetchMenu();
      }
    });

    return () => {
      unsubscribe();
      if (ordersDebounceRef.current) clearTimeout(ordersDebounceRef.current);
      if (menuDebounceRef.current) clearTimeout(menuDebounceRef.current);
    };
  }, [fetchMenu, fetchOrders, debouncedFetchOrders, debouncedFetchMenu]);

  // ── Refs for rollback — always point to latest state ─────────────────────────
  const menuItemsRef = useRef(menuItems);
  menuItemsRef.current = menuItems;
  const ordersListRef = useRef(ordersList);
  ordersListRef.current = ordersList;

  // ── Menu mutations ────────────────────────────────────────────────────────────

  const addItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    let newItem: MenuItem;
    try {
      newItem = await menuService.create(item);
    } catch (err) {
      console.warn('[DataContext] Failed to create item on Appwrite, saving locally:', err);
      newItem = { ...item, id: `local-${Date.now()}` };
    }
    setMenuItems(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('local_menu_items', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateItem = useCallback(async (id: string, data: Partial<Omit<MenuItem, 'id'>>) => {
    const snapshot = menuItemsRef.current;
    const updatedItems = snapshot.map(i => i.id === id ? { ...i, ...data } : i);
    setMenuItems(updatedItems);
    localStorage.setItem('local_menu_items', JSON.stringify(updatedItems));
    try {
      await menuService.update(id, data);
    } catch (err) {
      console.warn('[DataContext] Failed to update item on Appwrite, kept local changes:', err);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const snapshot = menuItemsRef.current;
    const updatedItems = snapshot.filter(i => i.id !== id);
    setMenuItems(updatedItems);
    localStorage.setItem('local_menu_items', JSON.stringify(updatedItems));
    try {
      await menuService.delete(id);
    } catch (err) {
      console.warn('[DataContext] Failed to delete item on Appwrite, kept local changes:', err);
    }
  }, []);

  const toggleAvailability = useCallback(async (id: string) => {
    const item = menuItemsRef.current.find(i => i.id === id);
    if (!item) return;
    const snapshot = menuItemsRef.current;
    const updatedItems = snapshot.map(i => i.id === id ? { ...i, available: !i.available } : i);
    setMenuItems(updatedItems);
    localStorage.setItem('local_menu_items', JSON.stringify(updatedItems));
    try {
      await menuService.update(id, { available: !item.available });
    } catch (err) {
      console.warn('[DataContext] Failed to toggle availability on Appwrite:', err);
    }
  }, []);

  // ── Orders mutations ──────────────────────────────────────────────────────────

  const addOrder = useCallback(async (order: Omit<Order, 'id'>) => {
    let newOrder: Order;
    try {
      newOrder = await ordersService.create(order);
    } catch (err) {
      console.warn('[DataContext] Failed to create order on Appwrite, saving locally:', err);
      newOrder = { ...order, id: `local-ord-${Date.now()}` };
    }
    setOrdersList(prev => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('local_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const snapshot = ordersListRef.current;
    const patch = { status };
    addPendingWrite(id, patch);
    const updatedOrders = snapshot.map(o => o.id === id ? { ...o, ...patch } : o);
    setOrdersList(updatedOrders);
    localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
    try {
      await ordersService.updateStatus(id, status);
    } catch (err) {
      console.warn('[DataContext] Failed to update order status on Appwrite:', err);
    } finally {
      removePendingWrite(id);
    }
  }, []);

  const completeWithPayment = useCallback(async (id: string, method: 'Cash' | 'Card' = 'Cash') => {
    const snapshot = ordersListRef.current;
    const patch: Partial<Order> = { paymentStatus: 'Paid', paymentMethod: method };
    addPendingWrite(id, patch);
    const updatedOrders = snapshot.map(o => o.id === id ? { ...o, ...patch } : o);
    setOrdersList(updatedOrders);
    localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
    try {
      await ordersService.completeWithPayment(id, method);
    } catch (err) {
      console.warn('[DataContext] Failed to complete payment on Appwrite:', err);
    } finally {
      removePendingWrite(id);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, data: Partial<Omit<Order, 'id'>>) => {
    const snapshot = ordersListRef.current;
    addPendingWrite(id, data as Partial<Order>);
    const updatedOrders = snapshot.map(o => o.id === id ? { ...o, ...data } : o);
    setOrdersList(updatedOrders);
    localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
    try {
      await ordersService.update(id, data);
    } catch (err) {
      console.warn('[DataContext] Failed to update order on Appwrite:', err);
    } finally {
      removePendingWrite(id);
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const snapshot = ordersListRef.current;
    const updatedOrders = snapshot.filter(o => o.id !== id);
    setOrdersList(updatedOrders);
    localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
    try {
      await ordersService.delete(id);
    } catch (err) {
      console.warn('[DataContext] Failed to delete order on Appwrite:', err);
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

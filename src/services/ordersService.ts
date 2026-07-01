import { directCreate, directUpdate, directDelete, directList, APPWRITE_CONFIG } from '../lib/appwrite';
import { Order, OrderStatus, PaymentStatus } from '../types/order';
import { ID } from 'appwrite';

/**
 * Orders Service - Handle all CRUD operations for Orders using Appwrite
 */
export const ordersService = {
  /**
   * Fetch all orders from Appwrite
   */
  async getAll(): Promise<Order[]> {
    try {
      const response = await directList(
        APPWRITE_CONFIG.COLLECTIONS.ORDERS,
        ['{"method":"limit","values":[5000]}']
      );

      return response.documents.map((doc: any) => {
        // Parse items if it's a string (Appwrite might store it as JSON)
        let items = doc.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.error('[ordersService] Failed to parse items:', e);
            items = [];
          }
        }
        // Ensure items is always an array
        if (!Array.isArray(items)) {
          items = [];
        }

        return {
          id: doc.$id,
          orderNumber: doc.orderNumber,
          tableId: doc.tableId,
          items,
          status: doc.status as OrderStatus,
          paymentStatus: (doc.paymentStatus as PaymentStatus) ?? 'Unpaid',
          totalAmount: doc.totalAmount,
          createdAt: doc.createdAt,
        };
      });
    } catch (error) {
      console.error('[ordersService] Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  },

  /**
   * Create a new order in Appwrite
   */
  async create(order: Omit<Order, 'id'>): Promise<Order> {
    try {
      const response = await directCreate(APPWRITE_CONFIG.COLLECTIONS.ORDERS, ID.unique(), {
        orderNumber: String(order.orderNumber),
        tableId: String(order.tableId),
        items: JSON.stringify(order.items),
        status: String(order.status),
        paymentStatus: order.paymentStatus ?? 'Unpaid',
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt
          ? new Date(order.createdAt).toISOString()
          : new Date().toISOString(),
      });

      let items = response.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      if (!Array.isArray(items)) items = [];

      return {
        id: response.$id,
        orderNumber: response.orderNumber,
        tableId: response.tableId,
        items,
        status: response.status,
        paymentStatus: (response.paymentStatus as PaymentStatus) ?? 'Unpaid',
        totalAmount: response.totalAmount,
        createdAt: response.createdAt,
      };
    } catch (error) {
      console.error('[ordersService] Error creating order:', error);
      throw new Error('Failed to create order');
    }
  },

  /**
   * Update order status in Appwrite
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const response = await directUpdate(APPWRITE_CONFIG.COLLECTIONS.ORDERS, id, { status: String(status) });

      // Parse items from JSON string
      let items = response.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      return {
        id: response.$id,
        orderNumber: response.orderNumber,
        tableId: response.tableId,
        items,
        status: response.status,
        paymentStatus: (response.paymentStatus as PaymentStatus) ?? 'Unpaid',
        totalAmount: response.totalAmount,
        createdAt: response.createdAt,
      };
    } catch (error) {
      console.error('[ordersService] Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  },

  /**
   * Update entire order in Appwrite
   */
  async update(id: string, data: Partial<Omit<Order, 'id'>>): Promise<Order> {
    try {
      const cleanData: Record<string, unknown> = {};
      if (data.orderNumber !== undefined) cleanData.orderNumber = data.orderNumber;
      if (data.tableId !== undefined) cleanData.tableId = data.tableId;
      if (data.items !== undefined) cleanData.items = JSON.stringify(data.items);
      if (data.status !== undefined) cleanData.status = String(data.status);
      if (data.paymentStatus !== undefined) cleanData.paymentStatus = String(data.paymentStatus);
      if (data.totalAmount !== undefined) cleanData.totalAmount = Number(data.totalAmount);
      if (data.createdAt !== undefined) cleanData.createdAt = data.createdAt;

      const response = await directUpdate(APPWRITE_CONFIG.COLLECTIONS.ORDERS, id, cleanData);

      // Parse items from JSON string
      let items = response.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      return {
        id: response.$id,
        orderNumber: response.orderNumber,
        tableId: response.tableId,
        items,
        status: response.status,
        paymentStatus: (response.paymentStatus as PaymentStatus) ?? 'Unpaid',
        totalAmount: response.totalAmount,
        createdAt: response.createdAt,
      };
    } catch (error) {
      console.error('[ordersService] Error updating order:', error);
      throw new Error('Failed to update order');
    }
  },

  /**
   * Mark an order as Paid — called exclusively from Payment.tsx.
   * Only writes paymentStatus + paymentMethod. Kitchen status is NEVER touched
   * here — separation of concerns: the cashier's action must not override the
   * kitchen workflow (an order can be paid while still 'New' or 'Preparing').
   * Revenue is recognised the moment paymentStatus becomes 'Paid'.
   */
  async completeWithPayment(id: string, method: 'Cash' | 'Card' = 'Cash'): Promise<Order> {
    try {
      const response = await directUpdate(APPWRITE_CONFIG.COLLECTIONS.ORDERS, id, {
        paymentStatus: 'Paid',
        paymentMethod: method,
      });

      let items = response.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      if (!Array.isArray(items)) items = [];

      return {
        id: response.$id,
        orderNumber: response.orderNumber,
        tableId: response.tableId,
        items,
        status: response.status,
        paymentStatus: 'Paid',
        totalAmount: response.totalAmount,
        createdAt: response.createdAt,
      };
    } catch (error) {
      console.error('[ordersService] Error completing order with payment:', error);
      throw new Error('Failed to complete payment');
    }
  },

  /**
   * Delete an order from Appwrite
   */
  async delete(id: string): Promise<void> {
    try {
      await directDelete(APPWRITE_CONFIG.COLLECTIONS.ORDERS, id);
    } catch (error) {
      console.error('[ordersService] Error deleting order:', error);
      throw new Error('Failed to delete order');
    }
  },

  /**
   * Reset orders to defaults (delete all + recreate)
   */
  async resetToDefaults(defaultOrders: Omit<Order, 'id'>[]): Promise<Order[]> {
    let existing: Order[] = [];
    try {
      existing = await this.getAll();
    } catch (e) {
      console.warn('[ordersService] Could not fetch existing orders during reset:', e);
    }

    // Try to delete existing orders from Appwrite
    if (existing.length > 0) {
      await Promise.all(
        existing.map(async (order) => {
          try {
            await this.delete(order.id);
          } catch (e) {
            console.warn(`[ordersService] Failed to delete order ${order.id} on Appwrite:`, e);
          }
        })
      );
    }

    // Try to create new default orders on Appwrite
    const created: Order[] = [];
    await Promise.all(
      defaultOrders.map(async (order) => {
        try {
          const newOrder = await this.create(order);
          created.push(newOrder);
        } catch (e) {
          console.warn('[ordersService] Failed to create default order on Appwrite:', e);
          // Generate a local order as fallback
          const localOrder: Order = {
            ...order,
            id: `local-ord-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: order.createdAt || new Date().toISOString()
          };
          created.push(localOrder);
        }
      })
    );

    // Save the final list to localStorage
    localStorage.setItem('local_orders', JSON.stringify(created));
    return created;
  },
};

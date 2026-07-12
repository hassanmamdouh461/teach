const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'brewmaster.db');
  console.log('[database] Initializing SQLite database at:', dbPath);
  
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrency/performance
  db.pragma('journal_mode = WAL');

  // Create menu table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS menu (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      available INTEGER NOT NULL DEFAULT 1
    )
  `).run();

  // Auto-seed to 40 items if current database has fewer items
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM menu').get().count;
    if (count < 40) {
      console.log('[database] SQLite menu has fewer than 40 items. Seeding/Updating to 40 items...');
      const seedData = require('./seed_data.cjs');
      const insert = db.prepare(`
        INSERT OR REPLACE INTO menu (id, name, description, price, category, image, available)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      db.transaction(() => {
        db.prepare('DELETE FROM menu').run();
        for (const item of seedData) {
          insert.run(
            item.id,
            item.name,
            item.description,
            item.price,
            item.category,
            item.image,
            item.available ? 1 : 0
          );
        }
      })();
      console.log('[database] Auto-seeding complete! Total menu items:', db.prepare('SELECT COUNT(*) as count FROM menu').get().count);
    }
  } catch (err) {
    console.error('[database] Auto-seeding SQLite database failed:', err);
  }

  // Create orders table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL,
      tableId TEXT NOT NULL,
      items TEXT NOT NULL, -- JSON string
      status TEXT NOT NULL,
      paymentStatus TEXT NOT NULL DEFAULT 'Unpaid',
      paymentMethod TEXT,
      totalAmount REAL NOT NULL,
      createdAt TEXT NOT NULL,
      paidAt TEXT
    )
  `).run();
  
  // Create customers table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      points REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `).run();

  // Create settings table for persistence of localStorage settings
  db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `).run();

  // Migration: Add paidAt column if table already existed without it
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN paidAt TEXT').run();
  } catch (e) {
    // Column already exists or table didn't exist yet
  }

  // Migration: Add customer columns to orders
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN customerPhone TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN pointsEarned REAL DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN pointsRedeemed REAL DEFAULT 0').run();
  } catch (e) {}

  // Migration: Update existing mock/legacy orders to Dine-in/Takeaway and reset them as new orders today
  try {
    const legacyCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE tableId LIKE 'Table %'").get().count;
    if (legacyCount > 0) {
      console.log('[database] Migrating legacy orders to Dine-in/Takeaway and resetting status...');
      const rows = db.prepare("SELECT * FROM orders ORDER BY createdAt ASC").all();
      
      const updateStmt = db.prepare(`
        UPDATE orders 
        SET orderNumber = ?, tableId = ?, status = 'New', paymentStatus = 'Unpaid', paymentMethod = NULL, paidAt = NULL, createdAt = ? 
        WHERE id = ?
      `);
      
      const runTx = db.transaction(() => {
        let i = 1;
        const now = new Date();
        for (const row of rows) {
          const tableId = (i % 2 === 1) ? 'Dine-in' : 'Takeaway';
          const orderTime = new Date(now.getTime() - 1000 * 60 * (rows.length - i) * 3).toISOString();
          updateStmt.run(String(i), tableId, orderTime, row.id);
          i++;
        }
      });
      runTx();
    }
  } catch (e) {
    console.error('[database] Failed to run legacy orders migration:', e);
  }

  // Migration: Update categories of existing menu items to Kitchen or Bar
  try {
    db.prepare(`
      UPDATE menu 
      SET category = 'Bar' 
      WHERE category IN ('Hot Coffee', 'Iced Coffee', 'Frappe', 'Milkshakes', 'قهوة ساخنة', 'قهوة باردة', 'فرابيه', 'ميلك شيك')
    `).run();
    db.prepare(`
      UPDATE menu 
      SET category = 'Kitchen' 
      WHERE category IN ('Food', 'Chicken Meals', 'وجبات دجاج', 'مأكولات', 'ساندوتشات')
    `).run();
    console.log('[database] Successfully migrated menu categories to Kitchen / Bar');
  } catch (e) {
    console.error('[database] Failed to run menu categories migration:', e);
  }
}

// Ensure database is initialized
function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}

// --- Menu CRUD Operations ---

function getMenu() {
  const sqlite = getDb();
  const rows = sqlite.prepare('SELECT * FROM menu').all();
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: row.image,
    available: Boolean(row.available)
  }));
}

function createMenuItem(item) {
  const sqlite = getDb();
  const id = item.id || `menu-${Math.random().toString(36).substr(2, 9)}`;
  sqlite.prepare(`
    INSERT INTO menu (id, name, description, price, category, image, available)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    item.name,
    item.description || '',
    item.price,
    item.category,
    item.image || '',
    item.available ? 1 : 0
  );
  return { ...item, id };
}

function updateMenuItem(id, data) {
  const sqlite = getDb();
  const fields = [];
  const values = [];
  
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
  if (data.available !== undefined) { fields.push('available = ?'); values.push(data.available ? 1 : 0); }
  
  if (fields.length === 0) return getMenuItem(id);
  
  values.push(id);
  sqlite.prepare(`
    UPDATE menu SET ${fields.join(', ')} WHERE id = ?
  `).run(...values);
  
  return getMenuItem(id);
}

function getMenuItem(id) {
  const sqlite = getDb();
  const row = sqlite.prepare('SELECT * FROM menu WHERE id = ?').get(id);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: row.image,
    available: Boolean(row.available)
  };
}

function deleteMenuItem(id) {
  const sqlite = getDb();
  sqlite.prepare('DELETE FROM menu WHERE id = ?').run(id);
}

function resetMenu(defaults) {
  const sqlite = getDb();
  
  // Wrap in transaction for safety and speed
  const runTransaction = sqlite.transaction((items) => {
    sqlite.prepare('DELETE FROM menu').run();
    const insert = sqlite.prepare(`
      INSERT INTO menu (id, name, description, price, category, image, available)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const created = [];
    for (const item of items) {
      const id = item.id || `menu-${Math.random().toString(36).substr(2, 9)}`;
      insert.run(
        id,
        item.name,
        item.description || '',
        item.price,
        item.category,
        item.image || '',
        item.available ? 1 : 0
      );
      created.push({ ...item, id });
    }
    return created;
  });

  return runTransaction(defaults);
}

// --- Orders CRUD Operations ---

function getOrders() {
  const sqlite = getDb();
  const rows = sqlite.prepare('SELECT * FROM orders ORDER BY CAST(orderNumber AS INTEGER) ASC').all();
  return rows.map(row => {
    let items = [];
    try {
      items = JSON.parse(row.items);
    } catch (e) {
      console.error('[database] Failed to parse order items json:', e);
    }
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      tableId: row.tableId,
      items,
      status: row.status,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.paymentMethod || undefined,
      totalAmount: row.totalAmount,
      createdAt: row.createdAt,
      paidAt: row.paidAt || undefined,
      customerPhone: row.customerPhone || undefined,
      pointsEarned: row.pointsEarned || 0,
      pointsRedeemed: row.pointsRedeemed || 0
    };
  });
}

function createOrder(order) {
  const sqlite = getDb();
  const id = order.id || `ord-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = order.createdAt || new Date().toISOString();
  
  // Calculate sequential order number for today using efficient SQL COUNT
  const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const countToday = sqlite.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE date(createdAt) = ?"
  ).get(todayLocal).count;
  const orderNumber = String(countToday + 1);

  sqlite.prepare(`
    INSERT INTO orders (id, orderNumber, tableId, items, status, paymentStatus, paymentMethod, totalAmount, createdAt, paidAt, customerPhone, pointsEarned, pointsRedeemed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    orderNumber,
    order.tableId,
    JSON.stringify(order.items),
    order.status,
    order.paymentStatus || 'Unpaid',
    order.paymentMethod || null,
    order.totalAmount,
    createdAt,
    order.paidAt || null,
    order.customerPhone || null,
    order.pointsEarned || 0,
    order.pointsRedeemed || 0
  );

  return {
    ...order,
    id,
    orderNumber,
    createdAt,
    customerPhone: order.customerPhone || undefined,
    pointsEarned: order.pointsEarned || 0,
    pointsRedeemed: order.pointsRedeemed || 0
  };
}

function updateOrderStatus(id, status) {
  const sqlite = getDb();
  sqlite.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return getOrder(id);
}

function completeOrderPayment(id, method) {
  const sqlite = getDb();
  const paidAt = new Date().toISOString();
  sqlite.prepare("UPDATE orders SET paymentStatus = 'Paid', paymentMethod = ?, paidAt = ? WHERE id = ?").run(method, paidAt, id);
  return getOrder(id);
}

function updateOrder(id, data) {
  const sqlite = getDb();
  const fields = [];
  const values = [];
  
  if (data.orderNumber !== undefined) { fields.push('orderNumber = ?'); values.push(data.orderNumber); }
  if (data.tableId !== undefined) { fields.push('tableId = ?'); values.push(data.tableId); }
  if (data.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(data.items)); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.paymentStatus !== undefined) { fields.push('paymentStatus = ?'); values.push(data.paymentStatus); }
  if (data.paymentMethod !== undefined) { fields.push('paymentMethod = ?'); values.push(data.paymentMethod); }
  if (data.totalAmount !== undefined) { fields.push('totalAmount = ?'); values.push(data.totalAmount); }
  if (data.createdAt !== undefined) { fields.push('createdAt = ?'); values.push(data.createdAt); }
  if (data.paidAt !== undefined) { fields.push('paidAt = ?'); values.push(data.paidAt); }
  if (data.customerPhone !== undefined) { fields.push('customerPhone = ?'); values.push(data.customerPhone); }
  if (data.pointsEarned !== undefined) { fields.push('pointsEarned = ?'); values.push(data.pointsEarned); }
  if (data.pointsRedeemed !== undefined) { fields.push('pointsRedeemed = ?'); values.push(data.pointsRedeemed); }
  
  if (fields.length === 0) return getOrder(id);
  
  values.push(id);
  sqlite.prepare(`
    UPDATE orders SET ${fields.join(', ')} WHERE id = ?
  `).run(...values);
  
  return getOrder(id);
}

function getOrder(id) {
  const sqlite = getDb();
  const row = sqlite.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return null;
  let items = [];
  try {
    items = JSON.parse(row.items);
  } catch {}
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    tableId: row.tableId,
    items,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod || undefined,
    totalAmount: row.totalAmount,
    createdAt: row.createdAt,
    paidAt: row.paidAt || undefined,
    customerPhone: row.customerPhone || undefined,
    pointsEarned: row.pointsEarned || 0,
    pointsRedeemed: row.pointsRedeemed || 0
  };
}

function deleteOrder(id) {
  const sqlite = getDb();
  sqlite.prepare('DELETE FROM orders WHERE id = ?').run(id);
}

function resetOrders(defaults) {
  const sqlite = getDb();
  
  const runTransaction = sqlite.transaction((orders) => {
    sqlite.prepare('DELETE FROM orders').run();
    const insert = sqlite.prepare(`
      INSERT INTO orders (id, orderNumber, tableId, items, status, paymentStatus, paymentMethod, totalAmount, createdAt, paidAt, customerPhone, pointsEarned, pointsRedeemed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const created = [];
    for (const order of orders) {
      const id = order.id || `ord-${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = order.createdAt || new Date().toISOString();
      insert.run(
        id,
        order.orderNumber,
        order.tableId,
        JSON.stringify(order.items),
        order.status,
        order.paymentStatus || 'Unpaid',
        order.paymentMethod || null,
        order.totalAmount,
        createdAt,
        order.paidAt || null,
        order.customerPhone || null,
        order.pointsEarned || 0,
        order.pointsRedeemed || 0
      );
      created.push({ ...order, id, createdAt });
    }
    return created;
  });

  return runTransaction(defaults);
}

// --- Customers CRUD Operations ---

function getCustomers() {
  const sqlite = getDb();
  return sqlite.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
}

function getCustomerByPhone(phone) {
  const sqlite = getDb();
  return sqlite.prepare('SELECT * FROM customers WHERE phone = ?').get(phone) || null;
}

function saveCustomer(customer) {
  const sqlite = getDb();
  const existing = sqlite.prepare('SELECT * FROM customers WHERE phone = ?').get(customer.phone);
  
  if (existing) {
    sqlite.prepare('UPDATE customers SET name = ?, points = ? WHERE phone = ?').run(
      customer.name || existing.name,
      customer.points !== undefined ? customer.points : existing.points,
      customer.phone
    );
    return getCustomerByPhone(customer.phone);
  } else {
    const id = customer.id || `cust-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = customer.createdAt || new Date().toISOString();
    sqlite.prepare('INSERT INTO customers (id, name, phone, points, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(id, customer.name || 'Customer', customer.phone, customer.points || 0, createdAt);
    return getCustomerByPhone(customer.phone);
  }
}

function deleteCustomer(id) {
  const sqlite = getDb();
  sqlite.prepare('DELETE FROM customers WHERE id = ?').run(id);
}

// --- Settings Persistence ---

function getSettings() {
  const sqlite = getDb();
  try {
    const rows = sqlite.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } catch (e) {
    console.error('[database] Failed to get settings:', e);
    return {};
  }
}

function saveSetting(key, value) {
  const sqlite = getDb();
  try {
    sqlite.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  } catch (e) {
    console.error('[database] Failed to save setting:', e);
  }
}

function deleteSetting(key) {
  const sqlite = getDb();
  try {
    sqlite.prepare('DELETE FROM settings WHERE key = ?').run(key);
  } catch (e) {
    console.error('[database] Failed to delete setting:', e);
  }
}

module.exports = {
  initDatabase,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  resetMenu,
  getOrders,
  createOrder,
  updateOrderStatus,
  completeOrderPayment,
  updateOrder,
  deleteOrder,
  resetOrders,
  getCustomers,
  getCustomerByPhone,
  saveCustomer,
  deleteCustomer,
  getSettings,
  saveSetting,
  deleteSetting
};

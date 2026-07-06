const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Prevents white flash on launch
    backgroundColor: '#111827', // Match the application dark background
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window only when content is ready to paint
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize the local SQLite database on startup
  db.initDatabase();

  // Register IPC handlers for renderer database requests
  ipcMain.handle('db:get-menu', () => db.getMenu());
  ipcMain.handle('db:create-menu-item', (event, item) => db.createMenuItem(item));
  ipcMain.handle('db:update-menu-item', (event, id, data) => db.updateMenuItem(id, data));
  ipcMain.handle('db:delete-menu-item', (event, id) => db.deleteMenuItem(id));
  ipcMain.handle('db:reset-menu', (event, defaults) => db.resetMenu(defaults));

  ipcMain.handle('db:get-orders', () => db.getOrders());
  ipcMain.handle('db:create-order', (event, order) => db.createOrder(order));
  ipcMain.handle('db:update-order-status', (event, id, status) => db.updateOrderStatus(id, status));
  ipcMain.handle('db:complete-order-payment', (event, id, method) => db.completeOrderPayment(id, method));
  ipcMain.handle('db:update-order', (event, id, data) => db.updateOrder(id, data));
  ipcMain.handle('db:delete-order', (event, id) => db.deleteOrder(id));
  ipcMain.handle('db:reset-orders', (event, defaults) => db.resetOrders(defaults));

  ipcMain.handle('db:get-customers', () => db.getCustomers());
  ipcMain.handle('db:get-customer-by-phone', (event, phone) => db.getCustomerByPhone(phone));
  ipcMain.handle('db:save-customer', (event, customer) => db.saveCustomer(customer));
  ipcMain.handle('db:delete-customer', (event, id) => db.deleteCustomer(id));

  ipcMain.handle('db:get-settings', () => db.getSettings());
  ipcMain.handle('db:save-setting', (event, key, value) => db.saveSetting(key, value));
  ipcMain.handle('db:delete-setting', (event, key) => db.deleteSetting(key));

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

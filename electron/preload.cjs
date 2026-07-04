const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMenu: () => ipcRenderer.invoke('db:get-menu'),
  createMenuItem: (item) => ipcRenderer.invoke('db:create-menu-item', item),
  updateMenuItem: (id, data) => ipcRenderer.invoke('db:update-menu-item', id, data),
  deleteMenuItem: (id) => ipcRenderer.invoke('db:delete-menu-item', id),
  resetMenu: (defaults) => ipcRenderer.invoke('db:reset-menu', defaults),
  
  getOrders: () => ipcRenderer.invoke('db:get-orders'),
  createOrder: (order) => ipcRenderer.invoke('db:create-order', order),
  updateOrderStatus: (id, status) => ipcRenderer.invoke('db:update-order-status', id, status),
  completeOrderPayment: (id, method) => ipcRenderer.invoke('db:complete-order-payment', id, method),
  updateOrder: (id, data) => ipcRenderer.invoke('db:update-order', id, data),
  deleteOrder: (id) => ipcRenderer.invoke('db:delete-order', id),
  resetOrders: (defaults) => ipcRenderer.invoke('db:reset-orders', defaults),
});

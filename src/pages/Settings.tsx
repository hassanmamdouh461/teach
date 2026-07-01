import React, { useState } from 'react';
import { User, Store, Bell, Lock, HelpCircle, LogOut, Database, RotateCcw, Coffee, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { DatabaseStatus } from '../components/ui/DatabaseStatus';
import { MOCK_ORDERS } from '../types/order';
import { INITIAL_MENU_ITEMS } from '../types/menu';
import { menuService } from '../services/menuService';
import { ordersService } from '../services/ordersService';
import { useAuth } from '../context/AuthContext';
import { QrMenuModal } from '../components/settings/QrMenuModal';


export default function Settings() {
  const [resetting, setResetting] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const { logout } = useAuth();

  const handleResetOrders = async () => {
    if (window.confirm('⚠️ This will reset all orders in Appwrite to default. Continue?')) {
      try {
        setResetting(true);
        await ordersService.resetToDefaults(MOCK_ORDERS);
        alert('✅ Orders reset successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset orders:', error);
        alert('❌ Failed to reset orders');
      } finally {
        setResetting(false);
      }
    }
  };

  const handleResetMenu = async () => {
    if (window.confirm('⚠️ This will reset menu in Appwrite to default 8 items. Continue?')) {
      try {
        setResetting(true);
        await menuService.resetToDefaults(INITIAL_MENU_ITEMS);
        alert('✅ Menu reset successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset menu:', error);
        alert('❌ Failed to reset menu');
      } finally {
        setResetting(false);
      }
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ This will delete ALL data from Appwrite (Menu + Orders). Continue?')) {
      try {
        setResetting(true);
        // Try to delete all menu items from Appwrite
        try {
          const menuItems = await menuService.getAll();
          await Promise.all(menuItems.map(item => menuService.delete(item.id).catch(() => {})));
        } catch (e) {
          console.warn('Failed to clean menu items from Appwrite:', e);
        }
        
        // Try to delete all orders from Appwrite
        try {
          const orders = await ordersService.getAll();
          await Promise.all(orders.map(order => ordersService.delete(order.id).catch(() => {})));
        } catch (e) {
          console.warn('Failed to clean orders from Appwrite:', e);
        }

        // Clear local storage cache
        localStorage.removeItem('local_menu_items');
        localStorage.removeItem('local_orders');
        
        alert('✅ All data cleared successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('❌ Failed to clear data');
      } finally {
        setResetting(false);
      }
    }
  };

  const sections = [
    {
      title: 'Profile Settings',
      items: [
        { icon: User, label: 'My Account', desc: 'Manage your personal details' },
        { icon: Store, label: 'Cafe Info', desc: 'Update cafe details and branding' },
      ]
    },
    {
      title: 'Customer Experience',
      items: [
        { 
          icon: QrCode, 
          label: 'Customer QR Menu', 
          desc: 'Generate & print QR code for customer view', 
          onClick: () => setIsQrModalOpen(true) 
        },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { icon: Bell, label: 'Notifications', desc: 'Configure alert preferences' },
        { icon: Lock, label: 'Privacy & Security', desc: 'Update password and controls' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', desc: 'Get help with using the app' },
      ]
    }
  ];

  return (
    <div className="space-y-3 md:space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs md:text-base text-gray-500">Manage your account and preferences.</p>
      </div>

      <div className="space-y-3 md:space-y-6">
        {sections.map((section, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-100">
               <h2 className="font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="p-2">
               {section.items.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={item.onClick}
                    className="mobile-touch-target w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group tap-highlight-none"
                  >
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-mocha-50 group-hover:text-mocha-700 transition-colors">
                        <item.icon size={20} />
                     </div>
                     <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm md:text-base">{item.label}</h3>
                        <p className="text-xs md:text-sm text-gray-500">{item.desc}</p>
                     </div>
                  </button>
               ))}
            </div>
          </motion.div>
        ))}

        {/* Database Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DatabaseStatus />
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Data Management</h2>
          </div>
          <div className="p-2 space-y-2">
            <button 
              onClick={handleResetOrders}
              disabled={resetting}
              className="mobile-touch-target w-full flex items-center gap-4 p-4 hover:bg-amber-50 rounded-xl transition-colors text-left group tap-highlight-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition-colors">
                <RotateCcw size={20} className={resetting ? 'animate-spin' : ''} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm md:text-base">Reset Orders</h3>
                <p className="text-xs md:text-sm text-gray-500">Reset Appwrite orders to defaults</p>
              </div>
            </button>

            <button 
              onClick={handleResetMenu}
              disabled={resetting}
              className="mobile-touch-target w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-xl transition-colors text-left group tap-highlight-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                <Coffee size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm md:text-base">Reset Menu</h3>
                <p className="text-xs md:text-sm text-gray-500">Reset Appwrite menu to 8 items</p>
              </div>
            </button>

            <button 
              onClick={handleClearAllData}
              disabled={resetting}
              className="mobile-touch-target w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors text-left group tap-highlight-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                <Database size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm md:text-base">Clear All Data</h3>
                <p className="text-xs md:text-sm text-gray-500">Delete everything from Appwrite</p>
              </div>
            </button>
          </div>
        </motion.div>

        <motion.button 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           onClick={logout}
           className="mobile-touch-target w-full bg-red-50 text-red-600 py-3 md:py-4 rounded-xl font-semibold hover:bg-red-100 flex items-center justify-center gap-2 transition-colors tap-highlight-none"
        >
           <LogOut size={20} /> Sign Out
         </motion.button>
      </div>
      
      <QrMenuModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} />
    </div>
  );
}

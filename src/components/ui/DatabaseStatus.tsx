import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { directList, APPWRITE_CONFIG } from '../../lib/appwrite';
import { motion } from 'framer-motion';

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export function DatabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      await directList(
        APPWRITE_CONFIG.COLLECTIONS.MENU,
        ['{"method":"limit","values":[1]}']
      );
      setStatus('connected');
      setLastChecked(new Date());
    } catch (error) {
      console.error('Database connection error:', error);
      setStatus('error');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    // Auto-check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Checking...',
          description: 'Verifying database connection',
        };
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Connected',
          description: 'Database is connected and operational',
        };
      case 'error':
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Connection Error',
          description: 'Unable to connect to Appwrite database',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border ${config.borderColor} ${config.bgColor} rounded-xl p-4 md:p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center ${config.color} flex-shrink-0`}>
            <Icon 
              size={20} 
              className={status === 'checking' ? 'animate-spin' : ''} 
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} className="text-gray-400 flex-shrink-0" />
              <h3 className={`font-semibold ${config.color} text-sm md:text-base`}>
                Database Status: {config.label}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-2">
              {config.description}
            </p>
            
            {/* Connection Status Info - No Sensitive Data */}
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Region:</span>
                <span>Frankfurt (fra)</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Database:</span>
                <span className="font-mono">restaurant_db</span>
              </div>
              {lastChecked && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Last checked:</span>
                  <span>{lastChecked.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={checkConnection}
          disabled={status === 'checking'}
          className={`mobile-touch-target p-2 rounded-lg ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity disabled:opacity-50 flex-shrink-0 tap-highlight-none`}
          title="Refresh connection status"
        >
          <RefreshCw 
            size={18} 
            className={status === 'checking' ? 'animate-spin' : ''} 
          />
        </button>
      </div>
    </motion.div>
  );
}

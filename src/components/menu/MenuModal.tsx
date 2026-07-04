import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, CATEGORIES } from '../../types/menu';
import { useLanguage } from '../../context/LanguageContext';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id'> | MenuItem) => void;
  initialData?: MenuItem | null;
}

export function MenuModal({ isOpen, onClose, onSave, initialData }: MenuModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[1], // Default to Hot Coffee
    image: '',
    available: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price.toString(),
        category: initialData.category,
        image: initialData.image,
        available: initialData.available,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: CATEGORIES[1],
        image: '',
        available: true,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const defaultImage = ['Hot Coffee', 'Iced Coffee', 'Frappe', 'Milkshakes'].includes(formData.category)
        ? 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
      const finalImage = formData.image.trim() || defaultImage;

      await onSave({
        ...formData,
        image: finalImage,
        price: parseFloat(formData.price),
        ...(initialData ? { id: initialData.id } : {}),
      } as MenuItem);
      onClose();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      alert(t('Failed to save item. Please try again.'));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-lg shadow-xl relative z-10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? t('Edit Item') : t('Add New Item')}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Item Name')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent transition-all"
                placeholder={t('e.g. Spanish Latte')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Description')}</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent transition-all resize-none"
                placeholder={t('Brief description of the item...')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Price')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent transition-all bg-white"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(category => (
                    <option key={category} value={category}>{t(category)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Image URL')}</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent transition-all"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('Paste a URL from Unsplash or other image hosts (Optional).')}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-xl bg-mocha-700 text-white font-medium hover:bg-mocha-800 shadow-lg shadow-mocha-500/20 transition-colors"
              >
                {initialData ? t('Save Changes') : t('Create Item')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

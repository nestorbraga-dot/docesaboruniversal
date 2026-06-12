import { useState, useEffect } from 'react';
import { Product, Category, Order, BannerConfig, AppState } from './types.ts';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_ORDERS, 
  DEFAULT_BANNER 
} from './data.ts';
import Navbar from './components/Navbar.tsx';
import ClientMenu from './components/ClientMenu.tsx';
import KitchenPanel from './components/KitchenPanel.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Mode selection state: 'client' | 'kitchen' | 'admin'
  const [mode, setMode] = useState<'client' | 'kitchen' | 'admin'>('client');

  // Load state from local storage or defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('docesabor_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('docesabor_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('docesabor_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [banner, setBanner] = useState<BannerConfig>(() => {
    const saved = localStorage.getItem('docesabor_banner');
    return saved ? JSON.parse(saved) : DEFAULT_BANNER;
  });

  const [isShopOpen, setIsShopOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('docesabor_isshopopen');
    return saved === null ? true : JSON.parse(saved);
  });

  const [autoClearDelivered, setAutoClearDelivered] = useState<boolean>(() => {
    const saved = localStorage.getItem('docesabor_autoclear_delivered');
    return saved === null ? false : JSON.parse(saved);
  });

  // Save states to local storage on modification
  useEffect(() => {
    localStorage.setItem('docesabor_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('docesabor_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('docesabor_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('docesabor_banner', JSON.stringify(banner));
  }, [banner]);

  useEffect(() => {
    localStorage.setItem('docesabor_isshopopen', JSON.stringify(isShopOpen));
  }, [isShopOpen]);

  useEffect(() => {
    localStorage.setItem('docesabor_autoclear_delivered', JSON.stringify(autoClearDelivered));
  }, [autoClearDelivered]);

  // Clean automatically if toggle enabled and count >= 20
  useEffect(() => {
    const deliveredCount = orders.filter(o => o.status === 'entregue').length;
    if (autoClearDelivered && deliveredCount >= 20) {
      setOrders(prev => prev.filter(o => o.status !== 'entregue'));
    }
  }, [orders, autoClearDelivered]);

  // General updater hook for administrative inputs
  const handleUpdateGlobalState = (key: string, value: any) => {
    if (key === 'products') setProducts(value);
    if (key === 'categories') setCategories(value);
    if (key === 'orders') setOrders(value);
    if (key === 'banner') setBanner(value);
    if (key === 'isShopOpen') setIsShopOpen(value);
    if (key === 'autoClearDelivered') setAutoClearDelivered(value);
  };

  // Submit new order from shopping cart
  const handleAddOrder = (orderData: Omit<Order, 'id' | 'shortId' | 'createdAt'>) => {
    const randomHash = Math.floor(1000 + Math.random() * 9000); // 4-digit ID
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      shortId: `#${randomHash}`,
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);
  };

  // Transition kitchen order states
  const handleUpdateOrderStatus = (orderId: string, newStatus: 'preparando' | 'pronto' | 'entregue') => {
    setOrders((prev) => 
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Clear delivered orders to liberate memory storage space
  const handleClearDeliveredOrders = () => {
    setOrders((prev) => prev.filter(o => o.status !== 'entregue'));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Simulation top mode switcher bar - Hidden for Client to prevent exposure */}
      {mode !== 'client' && (
        <Navbar 
          currentMode={mode} 
          onChangeMode={setMode} 
          orders={orders} 
        />
      )}

      {/* Main active workspace viewpoint wrapper */}
      <div className="flex-1 p-3 sm:p-5 flex items-center justify-center">
        
        <AnimatePresence mode="wait">
          {mode === 'client' && (
            <motion.div
              key="client-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ClientMenu 
                products={products}
                categories={categories}
                orders={orders}
                banner={banner}
                isShopOpen={isShopOpen}
                onAddOrder={handleAddOrder}
                onSwitchMode={setMode}
              />
            </motion.div>
          )}

          {mode === 'kitchen' && (
            <motion.div
              key="kitchen-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <KitchenPanel 
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                onSwitchMode={setMode}
                onClearDeliveredOrders={handleClearDeliveredOrders}
                autoClearDelivered={autoClearDelivered}
                onToggleAutoClear={() => setAutoClearDelivered(prev => !prev)}
              />
            </motion.div>
          )}

          {mode === 'admin' && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <AdminPanel 
                products={products}
                categories={categories}
                orders={orders}
                banner={banner}
                isShopOpen={isShopOpen}
                onUpdateState={handleUpdateGlobalState}
                onSwitchMode={setMode}
                autoClearDelivered={autoClearDelivered}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

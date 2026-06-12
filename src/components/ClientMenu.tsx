import { useState, useMemo, FormEvent, MouseEvent } from 'react';
import { Product, Category, OrderItem, Order, BannerConfig } from '../types.ts';
import { 
  Search, 
  ShoppingCart, 
  ClipboardList, 
  IceCream, 
  Plus, 
  Minus, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Store, 
  DollarSign,
  User,
  Phone,
  MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientMenuProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  banner: BannerConfig;
  isShopOpen: boolean;
  onAddOrder: (order: Omit<Order, 'id' | 'shortId' | 'createdAt'>) => void;
  onSwitchMode: (mode: 'client' | 'kitchen' | 'admin') => void;
}

type TabType = 'menu' | 'cart' | 'orders';

export default function ClientMenu({
  products,
  categories,
  orders,
  banner,
  isShopOpen,
  onAddOrder,
  onSwitchMode
}: ClientMenuProps) {
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Customization modal states
  const [flavorModalProduct, setFlavorModalProduct] = useState<Product | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<{ name: string; price: number }[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  
  // Checkout states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [observations, setObservations] = useState('');
  const [tableNumber, setTableNumber] = useState('Mesa 01');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);

  // Secret admin mode activation states
  const [secretClicks, setSecretClicks] = useState<number[]>([]);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [secretError, setSecretError] = useState('');
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);

  const visibleProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
      return p.visible && matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalItemPrice, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Session-based tracking of client's orders
  const clientPlacedOrders = useMemo(() => {
    // Show orders matching this session table or name if specified,
    // or just display any pending or ready orders in the database for simulator convenience
    return orders;
  }, [orders]);

  const handleOpenProductModal = (product: Product) => {
    if (!product.available) return;
    setFlavorModalProduct(product);
    setSelectedFlavors([]);
    setSelectedToppings([]);
    setModalQuantity(1);
  };

  const handleAddToCartDirectly = (product: Product, e: MouseEvent) => {
    e.stopPropagation();
    if (!product.available) return;

    const hasFlavors = product.flavors && product.flavors.length > 0;
    const hasToppings = product.toppings && product.toppings.length > 0;

    if (hasFlavors || hasToppings) {
      handleOpenProductModal(product);
    } else {
      const newCartItem: OrderItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        basePrice: product.price,
        selectedFlavors: [],
        selectedToppings: [],
        totalItemPrice: product.price
      };
      setCart(prev => [...prev, newCartItem]);
    }
  };

  const handleToggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      // Limit to max 3 flavors for premium taste balance
      if (selectedFlavors.length < 3) {
        setSelectedFlavors([...selectedFlavors, flavor]);
      }
    }
  };

  const handleToggleTopping = (topping: { name: string; price: number }) => {
    if (selectedToppings.some(t => t.name === topping.name)) {
      setSelectedToppings(selectedToppings.filter(t => t.name !== topping.name));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleAddToCartFromModal = () => {
    if (!flavorModalProduct) return;

    const toppingsPrice = selectedToppings.reduce((acc, t) => acc + t.price, 0);
    const totalItemPrice = (flavorModalProduct.price + toppingsPrice) * modalQuantity;

    const newCartItem: OrderItem = {
      id: `${flavorModalProduct.id}-${Date.now()}`,
      productId: flavorModalProduct.id,
      name: flavorModalProduct.name,
      quantity: modalQuantity,
      basePrice: flavorModalProduct.price,
      selectedFlavors: [...selectedFlavors],
      selectedToppings: [...selectedToppings],
      totalItemPrice
    };

    setCart([...cart, newCartItem]);
    setFlavorModalProduct(null);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        const toppingsPrice = item.selectedToppings.reduce((acc, t) => acc + t.price, 0);
        return {
          ...item,
          quantity: newQty,
          totalItemPrice: (item.basePrice + toppingsPrice) * newQty
        };
      }
      return item;
    }));
  };

  const handleCheckout = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    onAddOrder({
      customerName: customerName.trim(),
      tableNumber,
      phone: phone.trim() || undefined,
      observations: observations.trim() || undefined,
      items: cart,
      totalPrice: cartTotal,
      status: 'preparando',
      paymentMethod
    });

    setCart([]);
    setCustomerName('');
    setPhone('');
    setObservations('');
    setShowCheckoutSuccess(true);
    setTimeout(() => {
      setShowCheckoutSuccess(false);
      setActiveTab('orders'); // switch to order status screen
    }, 2500);
  };

  const handleIceCreamGroupClick = () => {
    const now = Date.now();
    setSecretClicks((prev) => {
      const recent = [...prev, now].filter((t) => now - t < 3000);
      if (recent.length >= 6) {
        setShowSecretModal(true);
        setSecretPassword('');
        setSecretError('');
        setIsSecretUnlocked(false);
        return [];
      }
      return recent;
    });
  };

  const handleSecretPasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (secretPassword.trim() === 'desafio/app') {
      setIsSecretUnlocked(true);
      setSecretError('');
    } else {
      setSecretError('Senha incorreta! Tente novamente.');
    }
  };

  return (
    <div id="client-screen-wrapper" className="w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto bg-white min-h-[90vh] md:min-h-[82vh] shadow-xl md:shadow-2xl rounded-3xl overflow-hidden flex flex-col relative border border-slate-100 transition-all duration-300">
      
      {/* HEADER SECTION */}
      <header id="client-nav-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <motion.div 
            onClick={handleIceCreamGroupClick}
            whileTap={{ scale: 0.92 }}
            animate={secretClicks.length > 0 ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="p-2 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100 select-none relative"
            title="Acesso Administrativo"
          >
            <IceCream className="w-6 h-6 text-amber-500 fill-amber-100" />
            {secretClicks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {secretClicks.length}
              </span>
            )}
          </motion.div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Doce Sabor</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Sorveteria Gourmet</p>
          </div>
        </div>
        
        {/* Shop status badge */}
        <div>
          {isShopOpen ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Aberto
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-full border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Fechado
            </span>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-white">
        
        {/* Left Column (Menu List) - always layout visible on desktop, dynamic on small devices */}
        <div className={`flex-1 md:flex-[7] lg:flex-[8] overflow-y-auto pb-32 md:pb-6 ${
          activeTab === 'menu' ? 'block animate-fadeIn' : 'hidden md:block'
        }`}>
          <AnimatePresence mode="wait">
            
            {/* TAB 1: CARDÁPIO (MENU) */}
            {(activeTab === 'menu' || true) && (
              <motion.div
                key="menu-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 space-y-6"
              >
              {/* Banner */}
              <div 
                id="client-banner" 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white p-6 shadow-md"
              >
                {/* Visual abstract overlay circles */}
                <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-500/30 rounded-full blur-2xl"></div>
                <div className="absolute right-12 -top-12 w-32 h-32 bg-amber-400/20 rounded-full blur-xl"></div>
                
                <div className="relative z-10 max-w-[80%] space-y-2">
                  <h2 className="text-2xl font-black leading-tight text-white font-sans">{banner.title}</h2>
                  <p className="text-xs text-amber-100 font-medium leading-relaxed">{banner.subtitle}</p>
                </div>
                
                <div className="absolute right-4 bottom-4 text-white/10 select-none">
                  <IceCream className="w-24 h-24 rotate-12" />
                </div>
              </div>

              {/* Closed Warning Banner */}
              {!isShopOpen && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Loja fechada no momento</h4>
                    <p className="text-xs mt-1 text-slate-600">O cardápio está visível para visualização, mas os pedidos online estão suspensos temporariamente.</p>
                  </div>
                </div>
              )}

              {/* Search input inside pill bar container */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar sorvetes, lanches, sobremesas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 focus:ring-2 focus:ring-amber-500 rounded-xl text-sm placeholder:text-slate-400 text-slate-700 transition"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Horizontal scrollbar categories */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categorias</h3>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-250 shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-base">Nossos Delícias</h3>
                  <span className="text-xs text-slate-400 font-medium">{visibleProducts.length} itens</span>
                </div>

                {visibleProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {visibleProducts.map((p) => (
                      <div
                        key={p.id}
                        id={`product-${p.id}`}
                        onClick={() => handleOpenProductModal(p)}
                        className={`flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-amber-200 transition cursor-pointer group ${
                          !p.available ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Food photo */}
                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative bg-slate-50">
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          {!p.available && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                              <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-lg uppercase">
                                Esgotado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Summary specifications */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition truncate">
                              {p.name}
                            </h4>
                            <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-relaxed">
                              {p.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-black text-amber-600 text-sm">
                              R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            
                            {p.available && isShopOpen && (
                              <button 
                                onClick={(e) => handleAddToCartDirectly(p, e)}
                                className="p-1 px-3 bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-bold rounded-lg transition flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl text-slate-500">
                    <p className="text-sm font-medium">Nenhum item encontrado nesta categoria.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Right Column (Cart / Orders info sidebar) - dynamic on mobile, sticky-open on desktop */}
        <div id="right-info-sidebar" className={`flex-1 md:flex-[5] lg:flex-[4] md:border-l md:border-slate-100 flex flex-col bg-slate-50/15 md:bg-white overflow-hidden ${
          activeTab !== 'menu' ? 'block' : 'hidden md:block'
        }`}>
          
          {/* Sub-tab selection indicator row only on desktop viewports */}
          <div className="hidden md:flex bg-slate-50 border-b border-slate-100 p-2.5 justify-around gap-2 sticky top-0 z-15 shrink-0 select-none">
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'cart' || activeTab === 'menu'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Carrinho ({cartItemsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Pedidos ({clientPlacedOrders.length})</span>
              {clientPlacedOrders.some(o => o.status === 'pronto') && (
                <span className="absolute top-1.5 right-1.5 bg-emerald-500 w-1.5 h-1.5 rounded-full select-none"></span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-32 md:pb-6 min-h-0">
            <AnimatePresence mode="wait">
              
              {/* TAB 2: CARRINHO (CART / CHECKOUT) */}
              {(activeTab === 'cart' || activeTab === 'menu') && (
                <motion.div
                  key="cart-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 space-y-6"
                >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h3 className="font-extrabold text-slate-800 text-base tracking-tight">Meu Carrinho</h3>
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-bold">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}</span>
              </div>

              {cart.length > 0 ? (
                <>
                  {/* Cart items list - Sleek border-b separation to reduce visual clutter */}
                  <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{item.name}</h4>
                          
                          {/* Configured Details */}
                          {item.selectedFlavors.length > 0 && (
                            <p className="text-slate-500 text-[10px] mt-0.5 leading-tight">
                              <span className="font-semibold text-slate-600">Sabores:</span> {item.selectedFlavors.join(', ')}
                            </p>
                          )}
                          
                          {item.selectedToppings.length > 0 && (
                            <p className="text-slate-500 text-[10px] leading-tight">
                              <span className="font-semibold text-slate-600">Adicionais:</span> {item.selectedToppings.map(t => t.name).join(', ')}
                            </p>
                          )}

                          <span className="text-amber-600 font-extrabold text-[11px] block mt-1">
                            R$ {(item.totalItemPrice / item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada
                          </span>
                        </div>

                        {/* Quantity and Actions */}
                        <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                          <button 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-500 transition text-[10px] font-semibold"
                          >
                            Excluir
                          </button>

                          <div className="flex items-center gap-1.5 bg-slate-50/80 rounded-lg p-0.5 border border-slate-100">
                            <button
                              onClick={() => handleUpdateCartQuantity(item.id, -1)}
                              className="p-1 hover:bg-white text-slate-550 rounded transition shadow-2xs"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-black text-slate-800 px-1">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQuantity(item.id, 1)}
                              className="p-1 hover:bg-white text-slate-550 rounded transition shadow-2xs"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Total - Refined to use clean lines and smaller footers */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Subtotal de itens</span>
                      <span>R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Taxa de serviço (Mesa)</span>
                      <span className="text-emerald-600 font-bold">Grátis</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-slate-800 pt-1 border-t border-slate-50">
                      <span>VALOR TOTAL</span>
                      <span className="text-amber-600 text-sm">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Form fields checkout - Beautifully unified and simplified container */}
                  <form onSubmit={handleCheckout} className="space-y-4 pt-1">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest pl-0.5">Informações de Envio</h4>
                    
                    <div className="space-y-3">
                      {/* Name input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Seu Nome / Identificação *"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                        />
                      </div>

                      {/* Phone/Whatsapp input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input
                          type="tel"
                          placeholder="Celular / WhatsApp (opcional)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                        />
                      </div>

                      {/* Table and payment grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 mb-0.5 uppercase pl-0.5">Mesa / Local</label>
                          <select
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                          >
                            <option value="Mesa 01">Mesa 01</option>
                            <option value="Mesa 02">Mesa 02</option>
                            <option value="Mesa 03">Mesa 03</option>
                            <option value="Mesa 04">Mesa 04</option>
                            <option value="Mesa 05">Mesa 05</option>
                            <option value="Balcão">Balcão</option>
                            <option value="Para Viagem">Para Viagem</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 mb-0.5 uppercase pl-0.5">Pagamento</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                          >
                            <option value="pix">Pix (Online)</option>
                            <option value="cartao">Cartão</option>
                            <option value="dinheiro">Dinheiro</option>
                          </select>
                        </div>
                      </div>

                      {/* Observations text */}
                      <div className="relative">
                        <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none text-slate-450">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <textarea
                          placeholder="Observações ou detalhes especiais..."
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          rows={2}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isShopOpen}
                      className="w-full py-2.5 mt-1 bg-amber-500 text-white font-extrabold hover:bg-amber-600 rounded-xl tracking-wide disabled:bg-slate-300 disabled:cursor-not-allowed text-xs sm:text-sm transition duration-200 shadow-xs hover:shadow-md"
                    >
                      {isShopOpen ? 'Confirmar e Enviar para Cozinha' : 'Loja Fechada'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="inline-flex p-3 bg-slate-50 text-slate-400 rounded-full">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Seu carrinho está vazio</h4>
                    <p className="text-slate-400 text-xs mt-1">Navegue no cardápio e adicione os melhores sorvetes da região!</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="px-5 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl text-xs font-bold transition"
                  >
                    Olhar Cardápio
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: PEDIDOS (STATUS TRACKING) */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-lg">Pedidos do Local</h3>
                <span className="text-xs text-slate-500 font-semibold">{clientPlacedOrders.length} pedidos</span>
              </div>

              {clientPlacedOrders.length > 0 ? (
                <div className="space-y-4">
                  {clientPlacedOrders.map((order) => {
                    const isNew = order.status === 'preparando';
                    const isReady = order.status === 'pronto';
                    
                    return (
                      <div key={order.id} className="p-4 bg-white border border-slate-150 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded">
                              {order.shortId}
                            </span>
                            <span className="text-xs text-slate-400 ml-2 font-medium">
                              {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-1">{order.customerName}</h4>
                            <p className="text-slate-405 text-xs font-semibold">{order.tableNumber}</p>
                            {order.phone && (
                              <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1 font-medium">
                                <span className="font-bold text-slate-400">Tel:</span> {order.phone}
                              </p>
                            )}
                          </div>
                          
                          {/* Rich Status Badging */}
                          <div>
                            {order.status === 'preparando' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-105 text-[10px] font-bold rounded-lg uppercase">
                                <Clock className="w-3 h-3 animate-spin" /> Em Preparo
                              </span>
                            )}
                            {order.status === 'pronto' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 border border-green-105 text-[10px] font-bold rounded-lg uppercase animate-bounce">
                                <Check className="w-3 h-3" /> Retire Aqui!
                              </span>
                            )}
                            {order.status === 'entregue' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase">
                                Entregue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order items list */}
                        <div className="border-t border-b border-dashed border-slate-150 py-2 space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-slate-600 text-xs flex justify-between">
                              <span className="truncate max-w-[70%] font-medium">
                                <span className="font-extrabold text-slate-800">{item.quantity}x</span> {item.name}
                              </span>
                              <span className="font-semibold shrink-0 text-slate-700">
                                R$ {item.totalItemPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.observations && (
                          <div className="p-2 bg-slate-50 border border-slate-150/60 rounded-xl text-[11px] text-slate-600 leading-normal">
                            <span className="font-extrabold text-slate-400 uppercase text-[9.5px] tracking-wider block mb-0.5">Observações:</span>
                            {order.observations}
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold uppercase">Forma: {order.paymentMethod.toUpperCase()}</span>
                          <span className="font-black text-slate-800 text-sm">
                            Total: <span className="text-amber-600">R$ {order.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 space-y-3 bg-slate-50 rounded-2xl text-slate-500">
                  <ClipboardList className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-sm font-medium">Nenhum pedido efetuado nesta sessão.</p>
                  <p className="text-xs text-slate-400">Quando você fizer um pedido no carrinho, ele aparecerá listado aqui para acompanhamento.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
          </div>
        </div>
      </main>

      {/* FLOAT CUSTOMIZATION MODAL FOR CHOSEN ICECREAM OR MEAL */}
      <AnimatePresence>
        {flavorModalProduct && (
          <div 
            onClick={() => setFlavorModalProduct(null)}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:justify-center md:items-center p-4 cursor-pointer animate-fadeIn"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-h-[85vh] md:max-h-[90vh] md:max-w-md w-full overflow-y-auto space-y-5 shadow-2xl relative border border-slate-100 cursor-default"
            >
              {/* Close Button top corner */}
              <button
                onClick={() => setFlavorModalProduct(null)}
                className="absolute right-6 top-6 p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header profile of item */}
              <div className="flex gap-4 items-start pr-8">
                <img
                  src={flavorModalProduct.image}
                  alt={flavorModalProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover rounded-2xl shadow-sm bg-slate-50 shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{flavorModalProduct.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{flavorModalProduct.description}</p>
                  <p className="text-amber-600 font-extrabold text-base mt-1">
                    R$ {flavorModalProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Flavor Selections: if flavors exist */}
              {flavorModalProduct.flavors && flavorModalProduct.flavors.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm text-slate-800">Escolha os Sabores <span className="text-slate-400 text-xs font-normal">(Até 3)</span></h4>
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-extrabold">
                      {selectedFlavors.length}/3
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {flavorModalProduct.flavors.map((flv) => {
                      const isSelected = selectedFlavors.includes(flv);
                      return (
                        <button
                          key={flv}
                          type="button"
                          onClick={() => handleToggleFlavor(flv)}
                          className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold border transition ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-slate-150 bg-slate-50 text-slate-650 hover:bg-slate-100'
                          }`}
                        >
                          <span>{flv}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extra Toppings / Adicionais */}
              {flavorModalProduct.toppings && flavorModalProduct.toppings.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="font-bold text-sm text-slate-800">Deseja adicionar complementos?</h4>
                  
                  <div className="space-y-1.5">
                    {flavorModalProduct.toppings.map((top) => {
                      const isSelected = selectedToppings.some(t => t.name === top.name);
                      return (
                        <div
                          key={top.name}
                          onClick={() => handleToggleTopping(top)}
                          className={`flex items-center justify-between p-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 text-amber-800'
                              : 'border-slate-150 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                            </span>
                            <span>{top.name}</span>
                          </div>
                          <span className="font-bold text-amber-600">
                            + R$ {top.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector and Total Button */}
              <div className="border-t border-slate-100 pt-4 flex gap-4 items-center">
                <div className="flex items-center bg-slate-100 rounded-xl px-1 py-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-extrabold text-slate-800 px-3">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCartFromModal}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs sm:text-sm tracking-wide transition flex justify-between items-center px-4"
                >
                  <span>Adicionar ao carrinho</span>
                  <span className="bg-amber-700/30 px-2.5 py-0.5 rounded text-[11px] font-black">
                    R$ {((flavorModalProduct.price + selectedToppings.reduce((acc, t) => acc + t.price, 0)) * modalQuantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS CHECKOUT ANIMATION SCREEN OVERLAY */}
      <AnimatePresence>
        {showCheckoutSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 text-center space-y-4 max-w-xs shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Pedido Recebido!</h3>
                <p className="text-slate-400 text-xs mt-1">Seu pedido foi transmitido com sucesso direta para a nossa cozinha.</p>
                <p className="text-xs font-bold text-amber-650 mt-2">Status: Preparando</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTTOM FLOATING TAB BAR (MATCHES TAB BAR IN SCREENSHOT 3) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-sm z-40 md:hidden">
        <div id="floating-tabs" className="bg-zinc-900/95 backdrop-blur-md text-white shadow-xl rounded-full flex justify-between items-center px-3 py-1.5 border border-zinc-800/50">
          
          {/* Cardápio Tab Button */}
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-all rounded-full ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-white font-extrabold py-2'
                : 'text-zinc-400 hover:text-white font-medium'
            }`}
          >
            <IceCream className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-wider select-none">Cardápio</span>
          </button>

          {/* Carrinho Tab Button with Badge count bubble */}
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-all rounded-full relative ${
              activeTab === 'cart'
                ? 'bg-amber-500 text-white font-extrabold py-2'
                : 'text-zinc-400 hover:text-white font-medium'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 border border-zinc-900 text-[8px] text-white w-4 h-4 rounded-full flex items-center justify-center font-extrabold animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-wider select-none">Carrinho</span>
          </button>

          {/* Pedidos Stat Tab Button */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-all rounded-full relative ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-white font-extrabold py-2'
                : 'text-zinc-400 hover:text-white font-medium'
            }`}
          >
            <div className="relative">
              <ClipboardList className="w-4 h-4" />
              {clientPlacedOrders.some(o => o.status === 'pronto') && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-500 border border-zinc-900 w-2.5 h-2.5 rounded-full flex items-center justify-center animate-ping"></span>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-wider select-none">Pedidos</span>
          </button>

        </div>
      </div>

      {/* SECRET MODAL */}
      <AnimatePresence>
        {showSecretModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setShowSecretModal(false);
                  setIsSecretUnlocked(false);
                  setSecretPassword('');
                  setSecretError('');
                }}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!isSecretUnlocked ? (
                <form onSubmit={handleSecretPasswordSubmit} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="inline-flex p-3 bg-amber-50 rounded-2xl text-amber-500 mb-2">
                      <IceCream className="w-6 h-6 fill-amber-100" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800">Acesso Restrito</h3>
                    <p className="text-xs text-slate-400 leading-normal">Insira a senha do desafio para liberar as guias administrativas</p>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="password"
                      value={secretPassword}
                      onChange={(e) => setSecretPassword(e.target.value)}
                      placeholder="Senha do desafio..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition text-slate-850"
                      autoFocus
                    />
                    {secretError && (
                      <p className="text-xs text-rose-500 font-semibold px-1">{secretError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wide rounded-xl transition cursor-pointer shadow-md"
                  >
                    Confirmar Senha
                  </button>
                </form>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="space-y-1.5">
                    <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-500 mb-2 animate-bounce">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800">Liberado com Sucesso!</h3>
                    <p className="text-xs text-slate-400">Selecione o painel que deseja visualizar no momento</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <button
                      onClick={() => {
                        setShowSecretModal(false);
                        setIsSecretUnlocked(false);
                        onSwitchMode('kitchen');
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Store className="w-4 h-4 text-amber-500" />
                      <span>Ir para Cozinha (Painel)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSecretModal(false);
                        setIsSecretUnlocked(false);
                        onSwitchMode('admin');
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <User className="w-4 h-4 animate-pulse" />
                      <span>Ir para Administrador</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowSecretModal(false);
                      setIsSecretUnlocked(false);
                    }}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-slate-200/50"
                  >
                    Voltar para Loja
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

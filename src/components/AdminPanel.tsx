import { useState, useMemo, FormEvent } from 'react';
import { Product, Category, Order, BannerConfig } from '../types.ts';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  TrendingUp, 
  Search, 
  Image as ImageIcon, 
  Settings, 
  DollarSign, 
  LayoutGrid, 
  Store, 
  ClipboardList, 
  PlusCircle, 
  Sparkles, 
  Award,
  LogOut,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  banner: BannerConfig;
  isShopOpen: boolean;
  onUpdateState: (key: string, value: any) => void;
  onSwitchMode: (mode: 'client' | 'kitchen' | 'admin') => void;
  autoClearDelivered?: boolean;
}

type AdminTab = 'items' | 'categories' | 'stats' | 'banner';

export default function AdminPanel({
  products,
  categories,
  orders,
  banner,
  isShopOpen,
  onUpdateState,
  onSwitchMode,
  autoClearDelivered = false
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('items');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create / Edit product modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'sorvetes',
    image: '',
    flavors: '',
    toppingsRaw: '' // comma separated name:price lists
  });

  // Create category input state
  const [newCategoryName, setNewCategoryName] = useState('');

  // Handle open mock product creator
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories[1]?.slug || 'sorvetes',
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400',
      flavors: 'Creme, Morango, Chocolate Belga, Baunilha, Maracujá',
      toppingsRaw: 'Chantilly Extra:3.50, Calda de Nutella:4.50, M&Ms:2.50'
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    
    // Convert arrays & lists to editable plaintext
    const flavorsStr = product.flavors ? product.flavors.join(', ') : '';
    const toppingsStr = product.toppings 
      ? product.toppings.map(t => `${t.name}:${t.price}`).join(', ') 
      : '';

    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      flavors: flavorsStr,
      toppingsRaw: toppingsStr
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    // Parse comma-separated inputs
    const parsedFlavors = formData.flavors
      ? formData.flavors.split(',').map(f => f.trim()).filter(Boolean)
      : [];
    
    const parsedToppings = formData.toppingsRaw
      ? formData.toppingsRaw.split(',').map(item => {
          const parts = item.split(':');
          const name = parts[0]?.trim();
          const price = parseFloat(parts[1]?.trim() || '0');
          return { name, price };
        }).filter(t => t.name && !isNaN(t.price))
      : [];

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image.trim() || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400',
      available: editingProduct ? editingProduct.available : true,
      visible: editingProduct ? editingProduct.visible : true,
      flavors: parsedFlavors.length > 0 ? parsedFlavors : undefined,
      toppings: parsedToppings.length > 0 ? parsedToppings : undefined
    };

    let updatedProducts: Product[];
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? productPayload : p);
    } else {
      updatedProducts = [productPayload, ...products];
    }

    onUpdateState('products', updatedProducts);
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item do cardápio?')) {
      const updated = products.filter(p => p.id !== productId);
      onUpdateState('products', updated);
    }
  };

  const handleToggleAvailable = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return { ...p, available: !p.available };
      }
      return p;
    });
    onUpdateState('products', updated);
  };

  const handleToggleVisible = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return { ...p, visible: !p.visible };
      }
      return p;
    });
    onUpdateState('products', updated);
  };

  const handleCreateCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    
    // Check duplication
    if (categories.some(c => c.slug === slug)) {
      alert('Esta categoria já existe!');
      return;
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      slug
    };

    onUpdateState('categories', [...categories, newCat]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catId: string, slug: string) => {
    if (slug === 'todos') {
      alert('A categoria "Todos" é padrão do sistema e não pode ser excluída.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Os produtos vinculados a ela não serão excluídos, mas ficarão sem categoria.')) {
      const updated = categories.filter(c => c.id !== catId);
      onUpdateState('categories', updated);
    }
  };

  // Filter products by admin search
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Statistics & revenue calculations
  const stats = useMemo(() => {
    // Total gross money
    const grossRevenue = orders.reduce((acc, curr) => acc + curr.totalPrice, 0);
    
    // Total items sold
    let totalItemsCount = 0;
    const itemSalesFrequency: Record<string, { count: number; revenue: number; image: string }> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        totalItemsCount += item.quantity;
        if (!itemSalesFrequency[item.name]) {
          // Look up product image from current state or use default
          const pRef = products.find(p => p.id === item.productId);
          itemSalesFrequency[item.name] = { 
            count: 0, 
            revenue: 0, 
            image: pRef?.image || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=100'
          };
        }
        itemSalesFrequency[item.name].count += item.quantity;
        itemSalesFrequency[item.name].revenue += item.totalItemPrice;
      });
    });

    // Sort popular items
    const popularItems = Object.entries(itemSalesFrequency)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Distribution by payment method
    const paymentsDist = { pix: 0, cartao: 0, dinheiro: 0 };
    orders.forEach(o => {
      if (paymentsDist[o.paymentMethod] !== undefined) {
        paymentsDist[o.paymentMethod] += o.totalPrice;
      }
    });

    return {
      grossRevenue,
      totalOrders: orders.length,
      totalItemsSold: totalItemsCount,
      popularItems,
      paymentsDist
    };
  }, [orders, products]);

  const totalDeliveredCount = useMemo(() => {
    return orders.filter(o => o.status === 'entregue').length;
  }, [orders]);

  return (
    <div id="admin-screen-wrapper" className="w-full max-w-6xl mx-auto bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col shadow-xl min-h-[85vh] text-slate-800">
      
      {/* HEADER SECTION (CLEAN MINIMAL BACKEND ROW) */}
      <header id="admin-nav-header" className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight font-sans">
              Admin & Controles
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Gestão e Retaguarda</p>
          </div>
        </div>

        {/* Real-time controls */}
        <div className="flex items-center gap-6 flex-wrap">
          
          {/* Active status switcher button */}
          <button
            onClick={() => onUpdateState('isShopOpen', !isShopOpen)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              isShopOpen 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{isShopOpen ? 'Loja Aberta' : 'Loja Fechada'}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => onSwitchMode('kitchen')} 
              className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-500" />
              <span>Painel Cozinha</span>
            </button>
            <button 
              onClick={() => onSwitchMode('client')} 
              className="px-3.5 py-2 bg-slate-905 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-450" />
              <span>Sair do Painel</span>
            </button>
          </div>
        </div>
      </header>

      {/* ADMIN LEVEL SUB-TABS NAVIGATION BAR matches tabs in screenshot 2 */}
      <div className="bg-slate-50 border-b border-rose-100 px-6 py-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          
          {/* Cardápio / Itens Tab Button */}
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'items'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Cardápio / Itens</span>
          </button>

          {/* Categorias Tab Button */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Categorias</span>
          </button>

          {/* Faturamento Analytics */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Faturamento</span>
          </button>

          {/* Imagem / Banner Settings */}
          <button
            onClick={() => setActiveTab('banner')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'banner'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagem / Banner</span>
          </button>

        </div>

        {/* Global Item Creator button triggered when looking at products tab */}
        {activeTab === 'items' && (
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        )}
      </div>

      {/* WORKSPACE VIEW CONTENT AREA */}
      <main className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB: ITEMS MANAGEMENT LIST */}
          {activeTab === 'items' && (
            <motion.div
              key="items-admin-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-extrabold text-slate-800 text-lg">Itens do Cardápio</h3>
                
                {/* Search query box */}
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-205 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 text-slate-700"
                  />
                </div>
              </div>

              {/* TABLE CONTAINER matches Screenshot 2 list exactly */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <th className="p-4 w-16">Foto</th>
                        <th className="p-4">Nome / Detalhe</th>
                        <th className="p-4 w-32">Categoria</th>
                        <th className="p-4 w-32">Preço Base</th>
                        <th className="p-4 w-52 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          {/* Col 1: Photo */}
                          <td className="p-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-150">
                              <img
                                src={p.image}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>

                          {/* Col 2: Name & detail */}
                          <td className="p-4 max-w-xs md:max-w-md">
                            <div className="font-black text-slate-800 text-sm md:text-base">{p.name}</div>
                            <p className="text-slate-400 text-[11px] md:text-xs truncate mt-0.5" title={p.description}>
                              {p.description}
                            </p>
                          </td>

                          {/* Col 3: Category Pill */}
                          <td className="p-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 font-extrabold text-[10px] rounded-lg capitalize">
                              {p.category}
                            </span>
                          </td>

                          {/* Col 4: Price */}
                          <td className="p-4 whitespace-nowrap font-extrabold text-slate-800 text-sm md:text-base">
                            R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Col 5: Responsive switches & actions in screenshot */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex gap-2 items-center justify-end">
                              
                              {/* Availability switch button ('Disponível' / 'Indisponível') */}
                              <button
                                onClick={() => handleToggleAvailable(p.id)}
                                className={`px-2 py-1 rounded-md text-[10px] font-extrabold select-none transition ${
                                  p.available 
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {p.available ? 'Disponível' : 'Esgotado'}
                              </button>

                              {/* Visibility toggles ('Visível' / 'Oculto') */}
                              <button
                                onClick={() => handleToggleVisible(p.id)}
                                className={`px-2 py-1 rounded-md text-[10px] font-extrabold select-none transition ${
                                  p.visible 
                                    ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200' 
                                    : 'bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100'
                                }`}
                              >
                                {p.visible ? 'Visível' : 'Oculto'}
                              </button>

                              {/* Edit Action Button */}
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md hover:text-slate-800 transition"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Action Button */}
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 bg-slate-100 text-slate-500 hover:bg-rose-50 rounded-md hover:text-rose-600 transition"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    Nenhum produto cadastrado com a pesquisa fornecida.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <motion.div
              key="categories-admin-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Box 1: Create category form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-850 text-sm">Adicionar Categoria</h3>
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome da Categoria</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Taças, Caldas, Combos"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-amber-500 rounded-xl text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 text-white font-extrabold rounded-lg text-xs hover:bg-amber-600 transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Categoria
                  </button>
                </form>
              </div>

              {/* Box 2: Categories lists */}
              <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-105">Categorias Cadastradas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    const linkedCount = products.filter(p => p.category === cat.slug).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm capitalize">{cat.name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{linkedCount} produtos vinculados</span>
                        </div>
                        {cat.slug !== 'todos' && (
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.slug)}
                            className="p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB: STATS & ANALYTICS billing section */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats-admin-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="font-extrabold text-slate-800 text-lg">Métricas e Faturamento</h3>

              <div className="p-4 bg-slate-50 border border-slate-150/60 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs">
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ Configuração de Limpeza de Dados
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Gerencie o histórico de entregas {totalDeliveredCount > 0 ? `(Atualmente com ${totalDeliveredCount} pedidos entregues)` : ''} para liberar espaço e otimizar o carregamento.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-150 shadow-2xs">
                    <span className="text-xs font-bold text-slate-600">Limpeza Automática:</span>
                    <button
                      onClick={() => onUpdateState('autoClearDelivered', !autoClearDelivered)}
                      className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-wider rounded-lg border transition cursor-pointer ${
                        autoClearDelivered
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {autoClearDelivered ? 'Ativada' : 'Desativada'}
                    </button>
                  </div>
                  {totalDeliveredCount >= 20 && !autoClearDelivered && (
                    <button
                      onClick={() => {
                        onUpdateState('orders', orders.filter(o => o.status !== 'entregue'));
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-sm"
                    >
                      Limpar Manual ({totalDeliveredCount} Pedidos)
                    </button>
                  )}
                </div>
              </div>
              
              {/* High level metrics panels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* Gross Revenue panel */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-emerald-500 bg-emerald-50 p-2 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Faturamento Bruto</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    R$ {stats.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Em tempo real
                  </div>
                </div>

                {/* Orders count panel */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-amber-500 bg-amber-50 p-2 rounded-xl">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Pedidos</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {stats.totalOrders}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Acompanhamento diário
                  </p>
                </div>

                {/* Items volume count panel */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-purple-500 bg-purple-50 p-2 rounded-xl">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Itens Servidos</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {stats.totalItemsSold}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold text-purple-600">
                    Média de {stats.totalOrders > 0 ? (stats.totalItemsSold / stats.totalOrders).toFixed(1) : 0} p/ pedido
                  </p>
                </div>

              </div>

              {/* Secondary grids for popular items lists & payment statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Popular items ledger */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
                  <h4 className="font-extrabold text-slate-800 text-sm pb-1 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500 fill-amber-100" />
                    <span>Os Mais Vendidos do Dia</span>
                  </h4>
                  
                  {stats.popularItems.length > 0 ? (
                    <div className="space-y-3">
                      {stats.popularItems.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-xs text-slate-400 w-4">
                              {index + 1}°
                            </span>
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50">
                              <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h5 className="font-black text-xs text-slate-850 truncate max-w-[180px]">{item.name}</h5>
                              <span className="text-[10px] text-slate-400 font-semibold">{item.count} unidades servidas</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-755 font-mono block">
                              R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-10 font-medium">Aguardando primeiros pedidos para gerar ranking.</p>
                  )}
                </div>

                {/* Payments breakdown graphs */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs">
                  <h4 className="font-extrabold text-slate-800 text-sm">Arrecadação por Meio de Pagamento</h4>
                  
                  <div className="space-y-4 pt-1">
                    {/* Pix */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>PIX</span>
                        <span className="font-mono">R$ {stats.paymentsDist.pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${stats.grossRevenue > 0 ? (stats.paymentsDist.pix / stats.grossRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Cartão (Crédito / Débito)</span>
                        <span className="font-mono">R$ {stats.paymentsDist.cartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${stats.grossRevenue > 0 ? (stats.paymentsDist.cartao / stats.grossRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Cash */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Dinheiro Físico</span>
                        <span className="font-mono">R$ {stats.paymentsDist.dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${stats.grossRevenue > 0 ? (stats.paymentsDist.dinheiro / stats.grossRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB: GREETING & BANNER CONFIG */}
          {activeTab === 'banner' && (
            <motion.div
              key="banner-admin-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6"
            >
              <h3 className="font-extrabold text-slate-800 text-base">Configuração do Banner</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Título do Banner</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => onUpdateState('banner', { ...banner, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:ring-2 focus:ring-amber-500 rounded-xl text-xs sm:text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Subtítulo / Descrição</label>
                  <textarea
                    rows={3}
                    value={banner.subtitle}
                    onChange={(e) => onUpdateState('banner', { ...banner, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:ring-2 focus:ring-amber-500 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                {/* Banner demonstration mockup matches customer view */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prévia visual do Cliente</label>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white p-5 shadow">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/30 rounded-full blur-xl"></div>
                    <div className="relative z-10 max-w-[80%] space-y-1">
                      <h4 className="text-base font-black leading-tight">{banner.title}</h4>
                      <p className="text-[10px] text-amber-100 leading-normal">{banner.subtitle}</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FLOAT ADD / EDIT PRODUCT MODAL FRAME */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-800 text-base">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form schema */}
              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-550 mb-1">Nome do Produto <span className="text-rose-505">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sundae de Morango Crocante, Hambúrguer Duplo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  {/* Category select */}
                  <div>
                    <label className="block font-bold text-slate-550 mb-1">Categoria <span className="text-slate-400">(Filtro do cardápio)</span></label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs font-semibold capitalize"
                    >
                      {categories.filter(c => c.slug !== 'todos').map(c => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price input */}
                  <div>
                    <label className="block font-bold text-slate-550 mb-1">Preço de Venda (R$) <span className="text-rose-505">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 19.90"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Image URL with demo icon */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-550 mb-1">URL da Imagem / Foto</label>
                    <input
                      type="text"
                      placeholder="Cole um link HTTPS de uma foto válida de sorvete"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs"
                    />
                  </div>

                  {/* Description textarea */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-550 mb-1">Descrição do Produto</label>
                    <textarea
                      rows={2}
                      placeholder="Descreva os ingredientes de forma atraente para o cliente"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs"
                    />
                  </div>

                  {/* Customizable Flavors List */}
                  <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-3">
                    <label className="block font-bold text-slate-550 mb-0.5">Sabores Disponíveis <span className="text-slate-400 font-normal">(Separados por vírgula)</span></label>
                    <p className="text-[10px] text-slate-400 mb-1.5 leading-tight">Deixe em branco se este item não possuir escolha de sabor (ex: lanches, bebidas prontas).</p>
                    <input
                      type="text"
                      placeholder="Creme, Morango, Chocolate, Doce de Leite, Flocos"
                      value={formData.flavors}
                      onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs"
                    />
                  </div>

                  {/* Customizable Toppings Extra */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-550 mb-0.5">Adicionais Extras <span className="text-slate-400 font-normal">(Formato Nome:Preço separados por vírgula)</span></label>
                    <p className="text-[10px] text-slate-400 mb-1.5 leading-tight">Deixe em branco se não houver adicionais para cobrar.</p>
                    <input
                      type="text"
                      placeholder="Nutella:5.00, Chantilly:3.50, Granulado:2.00"
                      value={formData.toppingsRaw}
                      onChange={(e) => setFormData({ ...formData, toppingsRaw: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl text-xs font-mono"
                    />
                  </div>

                </div>

                {/* Confirm footer */}
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 text-white font-black hover:bg-amber-600 rounded-xl transition shadow-xs"
                  >
                    Salvar Item
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

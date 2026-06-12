import { Product, Category, BannerConfig, Order } from './types.ts';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-todos', name: 'Todos', slug: 'todos' },
  { id: 'cat-sorvetes', name: 'Sorvetes', slug: 'sorvetes' },
  { id: 'cat-lanches', name: 'Lanches', slug: 'lanches' },
  { id: 'cat-bebidas', name: 'Bebidas', slug: 'bebidas' },
  { id: 'cat-sobremesas', name: 'Sobremesas', slug: 'sobremesas' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-taca-morango',
    name: 'Taça de Morango Especial',
    description: 'Sorvete artesanal com pedaços de morango de verdade, calda artesanal de frutas vermelhas e chantilly fresquinho.',
    price: 22.90,
    category: 'sorvetes',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    flavors: ['Morango', 'Creme', 'Chocolate Belga', 'Baunilha', 'Ninho'],
    toppings: [
      { name: 'Calda Extra de Morango', price: 2.50 },
      { name: 'Chantilly Extra', price: 3.50 },
      { name: 'Pedaços de Morango', price: 4.00 },
      { name: 'Leite Condensado', price: 2.00 },
    ],
  },
  {
    id: 'prod-burger-duplo',
    name: 'Hambúrguer Caseiro Duplo',
    description: 'Pão brioche, 2 carnes artesanais de 150g grelhadas na brasa, queijo cheddar derretido, alface crespa, tomate e nosso molho da casa.',
    price: 32.00,
    category: 'lanches',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    flavors: [],
    toppings: [
      { name: 'Bacon fatiado', price: 4.50 },
      { name: 'Ovo frito', price: 2.50 },
      { name: 'Queijo Cheddar Extra', price: 3.00 },
    ],
  },
  {
    id: 'prod-milkshake-oreo',
    name: 'Milkshake de Oreo Supremo',
    description: 'Bebida ultra gelada e cremosa batida com sorvete de baunilha, pedaços generosos de biscoito Oreo fatiado, calda de chocolate e chantilly.',
    price: 18.90,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    flavors: ['Baunilha', 'Chocolate', 'Flocos'],
    toppings: [
      { name: 'Nutella na borda', price: 5.00 },
      { name: 'Chantilly Extra', price: 3.00 },
      { name: 'Pá de Oreo picado', price: 2.50 },
    ],
  },
  {
    id: 'prod-petit-gateau',
    name: 'Petit Gâteau Clássico',
    description: 'Bolinho quente de chocolate belga com recheio cremoso escorrendo, servido com sorvete artesanal de creme e calda quente.',
    price: 19.90,
    category: 'sobremesas',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    flavors: ['Creme', 'Chocolate Belga', 'Coco', 'Flocos'],
    toppings: [
      { name: 'Calda de Chocolate', price: 2.00 },
      { name: 'Farofa de Castanha', price: 1.50 },
      { name: 'Granulado Belga', price: 3.00 },
    ],
  },
  {
    id: 'prod-casquinha-trufada',
    name: 'Casquinha Crocante Trufada',
    description: 'Casquinha de biscoito ultra crocante, recheada internamente com trufa artesanal de chocolate belga e preenchida com a bola do seu sabor predileto.',
    price: 8.50,
    category: 'sorvetes',
    image: 'https://images.unsplash.com/photo-1501443762531-d7d69957b867?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    flavors: ['Creme', 'Morango', 'Chocolate Belga', 'Maracujá', 'Doce de Leite', 'Flocos', 'Ninho'],
    toppings: [
      { name: 'Nutella Líquida', price: 4.50 },
      { name: 'Flocos de Ovomaltine', price: 2.00 },
      { name: 'Farofa Doce', price: 1.00 },
    ],
  },
  {
    id: 'prod-suco-refrescante',
    name: 'Suco Natural de Laranja',
    description: 'Espremido na hora com laranjas frescas e selecionadas. Fonte direta de vitamina C e energia.',
    price: 9.00,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
  },
  {
    id: 'prod-taca-chocolate',
    name: 'Mega Taça Rocher',
    description: 'Três bolas de sorvete de chocolate belga, bombons Ferrero Rocher, calda de avelã italiana, chantilly e castanha de caju triturada.',
    price: 25.90,
    category: 'sorvetes',
    image: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    flavors: ['Chocolate Belga', 'Ninho', 'Creme', 'Doce de Leite'],
    toppings: [
      { name: 'Bombom Rocher Extra', price: 6.00 },
      { name: 'Chantilly Extra', price: 3.00 },
      { name: 'Calda de Nutella', price: 4.50 },
    ],
  },
  {
    id: 'prod-batata-frita',
    name: 'Batata Rústica da Casa',
    description: 'Porção crocante de batatas rústicas fritas na hora, salpicadas com alecrim fresco e páprica defumada, acompanhadas de maionese verde.',
    price: 21.00,
    category: 'lanches',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400',
    available: true,
    visible: true,
    toppings: [
      { name: 'Cheddar cremoso e bacon picado', price: 6.00 },
      { name: 'Maionese extra', price: 2.00 },
    ],
  }
];

export const DEFAULT_BANNER: BannerConfig = {
  title: 'O Melhor Sorvete da Cidade',
  subtitle: 'Sabor artesanal, ingredientes frescos e muito amor na receita.',
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    shortId: '#1284',
    customerName: 'Renata Silva',
    tableNumber: 'Mesa 04',
    items: [
      {
        id: 'oi-1',
        productId: 'prod-taca-morango',
        name: 'Taça de Morango Especial',
        quantity: 1,
        basePrice: 22.90,
        selectedFlavors: ['Morango', 'Chocolate Belga'],
        selectedToppings: [
          { name: 'Pedaços de Morango', price: 4.00 },
          { name: 'Chantilly Extra', price: 3.50 }
        ],
        totalItemPrice: 30.40,
      }
    ],
    totalPrice: 30.40,
    status: 'preparando',
    paymentMethod: 'pix',
    createdAt: new Date().toISOString(),
    phone: '(11) 98765-4321',
    observations: 'Colocar colher descartável e calda caprichada.',
  },
  {
    id: 'ord-2',
    shortId: '#1285',
    customerName: 'Lucas Lima',
    tableNumber: 'Mesa 02',
    items: [
      {
        id: 'oi-2',
        productId: 'prod-burger-duplo',
        name: 'Hambúrguer Caseiro Duplo',
        quantity: 1,
        basePrice: 32.00,
        selectedFlavors: [],
        selectedToppings: [
          { name: 'Bacon fatiado', price: 4.50 }
        ],
        totalItemPrice: 36.50,
      }
    ],
    totalPrice: 36.50,
    status: 'pronto',
    paymentMethod: 'cartao',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    phone: '(21) 99888-7766',
    observations: 'Sem cebola e bacon bem tostado.',
  }
];

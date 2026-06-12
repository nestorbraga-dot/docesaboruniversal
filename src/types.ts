export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  visible: boolean;
  flavors?: string[]; // Opções de sabores
  toppings?: { name: string; price: number }[]; // Opções de adicionais
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface OrderItem {
  id: string; // ID único para a linha do carrinho (combinação de produto + acompanhamentos)
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedFlavors: string[];
  selectedToppings: { name: string; price: number }[];
  totalItemPrice: number; // (basePrice + toppings) * quantity
}

export interface Order {
  id: string;
  shortId: string; // Ex: #1234
  customerName: string;
  tableNumber: string;
  phone?: string;
  observations?: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'preparando' | 'pronto' | 'entregue';
  paymentMethod: 'pix' | 'cartao' | 'dinheiro';
  createdAt: string;
}

export interface BannerConfig {
  title: string;
  subtitle: string;
  bannerImage?: string;
}

export interface AppState {
  products: Product[];
  categories: Category[];
  orders: Order[];
  banner: BannerConfig;
  isShopOpen: boolean;
}

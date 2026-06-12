import { Product, Order } from '../types.ts';
import { IceCream, Utensils, Settings, AppWindow } from 'lucide-react';

interface NavbarProps {
  currentMode: 'client' | 'kitchen' | 'admin';
  onChangeMode: (mode: 'client' | 'kitchen' | 'admin') => void;
  orders: Order[];
}

export default function Navbar({
  currentMode,
  onChangeMode,
  orders
}: NavbarProps) {
  const activePreparingCount = orders.filter(o => o.status === 'preparando').length;
  const activeReadyCount = orders.filter(o => o.status === 'pronto').length;

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-150 text-slate-800 py-3.5 px-6 flex flex-wrap items-center justify-between gap-4 font-sans select-none sticky top-0 z-50 shadow-xs">
      
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-amber-500 rounded-lg text-white">
          <IceCream className="w-4 h-4 fill-white" />
        </div>
        <div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-800">Doce Sabor</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase ml-2 select-none">
            Demo Control
          </span>
        </div>
      </div>

      {/* Simulator message for instruction guidelines */}
      <p className="hidden lg:block text-xs text-slate-500 font-medium">
        🔔 Faça pedidos na <strong className="text-amber-600">Loja</strong>, veja na <strong className="text-amber-600">Cozinha</strong> e configure no <strong className="text-amber-600">Admin</strong>!
      </p>

      {/* Mode Switches */}
      <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 gap-1 overflow-x-auto self-stretch sm:self-auto scrollbar-none">
        
        {/* Client View tab */}
        <button
          onClick={() => onChangeMode('client')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            currentMode === 'client'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
          }`}
        >
          <AppWindow className="w-4 h-4" />
          <span>Loja (Cliente)</span>
        </button>

        {/* Kitchen screen tab */}
        <button
          onClick={() => onChangeMode('kitchen')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap relative ${
            currentMode === 'kitchen'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Cozinha (Painel)</span>
          {activePreparingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
              {activePreparingCount}
            </span>
          )}
        </button>

        {/* Admin controls tab */}
        <button
          onClick={() => onChangeMode('admin')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            currentMode === 'admin'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Administrador</span>
        </button>

      </div>

    </nav>
  );
}

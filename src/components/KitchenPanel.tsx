import { useState, useEffect } from 'react';
import { Order } from '../types.ts';
import { Clock, CheckSquare, CheckCircle, Package, Volume2, VolumeX, Store, ArrowRight, Utensils, Trash2, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KitchenPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: 'preparando' | 'pronto' | 'entregue') => void;
  onSwitchMode: (mode: 'client' | 'kitchen' | 'admin') => void;
  onClearDeliveredOrders?: () => void;
  autoClearDelivered?: boolean;
  onToggleAutoClear?: () => void;
}

export default function KitchenPanel({
  orders,
  onUpdateStatus,
  onSwitchMode,
  onClearDeliveredOrders,
  autoClearDelivered = false,
  onToggleAutoClear
}: KitchenPanelProps) {
  const [muteSound, setMuteSound] = useState(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Periodically refresh order timers ("Há X min")
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter orders by status
  const preparingOrders = orders.filter((o) => o.status === 'preparando');
  const readyOrders = orders.filter((o) => o.status === 'pronto');
  const deliveredOrders = orders
    .filter((o) => o.status === 'entregue')
    // Show only the 10 most recent delivered items to avoid list bloating
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const totalDeliveredCount = orders.filter((o) => o.status === 'entregue').length;

  // Play simulated kitchen bell sound using Web Audio API (safe, no external files required!)
  const playChimeSoundNow = () => {
    if (muteSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Ring the chime (two crisp high frequency sin waves like a real table ding-bell!)
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = audioCtx.currentTime;
      playTone(1800, now, 0.15);
      playTone(2200, now + 0.08, 0.25);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser gesture permissions", e);
    }
  };

  // Listen to new orders arriving in 'preparing' to play sound (except on mount)
  const [lastOrderId, setLastOrderId] = useState<string>('');
  useEffect(() => {
    if (preparingOrders.length > 0) {
      const mostRecent = preparingOrders[preparingOrders.length - 1];
      if (mostRecent.id !== lastOrderId && lastOrderId !== '') {
        playChimeSoundNow();
      }
      if (mostRecent) {
        setLastOrderId(mostRecent.id);
      }
    }
  }, [preparingOrders]);

  // Handle transition and sound trigger
  const handleSetPronto = (orderId: string) => {
    onUpdateStatus(orderId, 'pronto');
    playChimeSoundNow();
  };

  // Convert time to label: e.g. "Há 2 min"
  const getElapsedLabel = (createdAtString: string) => {
    const elapsedMs = nowTime - new Date(createdAtString).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    if (mins <= 0) return 'Agora mesmo';
    if (mins === 1) return 'Há 1 min';
    return `Há ${mins} min`;
  };

  return (
    <div id="kitchen-screen-wrapper" className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl min-h-[85vh] text-slate-100">
      
      {/* HEADER SECTION (MATCHES SCREENSHOT 1 BLACK ROW) */}
      <header id="kitchen-nav-header" className="bg-neutral-900 px-6 py-4 flex flex-wrap items-center justify-between border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-lg text-slate-950">
            <Utensils className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider font-mono text-white">
            Painel da Cozinha
          </h1>
        </div>

        {/* Shortcut links and settings buttons */}
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => onSwitchMode('admin')} 
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-250 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Gerenciar</span>
            </button>
            <button 
              onClick={() => onSwitchMode('client')} 
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-450 animate-pulse" />
              <span>Sair do Painel</span>
            </button>
          </div>

          {/* Sound toggle matching 'Chime Mudo' in Screenshot 1 */}
          <button
            onClick={() => {
              setMuteSound(!muteSound);
              if (muteSound) {
                // Test chime as feedback
                setTimeout(() => playChimeSoundNow(), 100);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition ${
              muteSound 
                ? 'border-slate-800 bg-slate-800 text-slate-400' 
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {muteSound ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Chime Mudo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Chime Ativo</span>
              </>
            )}
          </button>

          {/* Fila Ativa status dot */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase text-slate-300">Fila Ativa</span>
          </div>
        </div>
      </header>

      {/* KITCHEN COLUMNS (THREE COLUMN GRID MATCHING SCREENSHOT 1) */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40">
        
        {/* COLUMN 1: PREPARANDO */}
        <section className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-205 py-0.5">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Preparando</span>
            </h2>
            <span className="bg-slate-800 text-slate-300 font-mono font-bold rounded-full text-xs px-3 py-1">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            <AnimatePresence>
              {preparingOrders.length > 0 ? (
                preparingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 relative group overflow-hidden"
                  >
                    {/* Orange indicator bar to represent item state */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

                    {/* Meta header */}
                    <div className="flex justify-between items-start pl-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase font-mono">
                            {order.shortId}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">{order.tableNumber}</span>
                        </div>
                        <h4 className="font-black text-white text-base mt-1.5">{order.customerName}</h4>
                        {order.phone && (
                          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                            WhatsApp: <strong className="text-slate-300 font-mono">{order.phone}</strong>
                          </span>
                        )}
                      </div>
                      
                      {/* Timer */}
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
                        <Clock className="w-3 h-3 text-amber-500 animate-spin-slow" />
                        {getElapsedLabel(order.createdAt)}
                      </span>
                    </div>

                    {/* Product item breakdown list */}
                    <div className="bg-slate-950/65 rounded-lg p-2.5 space-y-2 border border-slate-900/10 pl-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs space-y-1 border-b border-slate-800/40 last:border-0 pb-1.5 last:pb-0">
                          <p className="font-bold text-slate-200">
                            <span className="text-amber-400 font-black text-sm">{item.quantity}x</span> {item.name}
                          </p>

                          {/* Customer specified details: Flavors */}
                          {item.selectedFlavors.length > 0 && (
                            <div className="text-[10px] text-amber-100/90 pl-4 py-0.5 bg-amber-550/5 border-l border-amber-500/20">
                              <span className="font-bold">Sabores:</span> {item.selectedFlavors.join(' • ')}
                            </div>
                          )}

                          {/* Customer requested modifiers: Toppings */}
                          {item.selectedToppings.length > 0 && (
                            <div className="text-[10px] text-slate-400 pl-4">
                              <span className="font-bold text-slate-350">Adicionais:</span>{' '}
                              {item.selectedToppings.map((t) => t.name).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.observations && (
                      <div className="bg-rose-500/10 border-l border-rose-500 text-rose-200 p-2 rounded-r-lg text-[11px] leading-relaxed">
                        <span className="font-extrabold uppercase text-[9px] tracking-wide text-rose-400 block mb-0.5">Observação:</span>
                        "{order.observations}"
                      </div>
                    )}

                    {/* Bottom action transition */}
                    <button
                      onClick={() => handleSetPronto(order.id)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black tracking-wide text-xs uppercase rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 text-slate-950" />
                      Pronto (Liberar)
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs px-4 space-y-2">
                  <Utensils className="w-8 h-8 text-slate-600 mx-auto opacity-30" />
                  <p className="font-bold">Nenhum pedido na fila de produção.</p>
                  <p className="text-slate-600">Novos pedidos feitos pelo cliente aparecerão automaticamente neste painel.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* COLUMN 2: PRONTO (AGUARDANDO RETIRADA) */}
        <section className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
            <h2 className="font-bold flex items-center gap-2 text-emerald-450 py-0.5">
              <Package className="w-5 h-5 text-emerald-500" />
              <span>Pronto (Aguardando)</span>
            </h2>
            <span className="bg-emerald-900/40 text-emerald-400 font-mono font-bold rounded-full border border-emerald-500/20 text-xs px-3 py-1">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            <AnimatePresence>
              {readyOrders.length > 0 ? (
                readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 relative group overflow-hidden"
                  >
                    {/* Green indicator bar for ready orders */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>

                    {/* Meta */}
                    <div className="flex justify-between items-start pl-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-slate-350 px-2 py-0.5 rounded font-bold text-[10px] uppercase font-mono">
                            {order.shortId}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">{order.tableNumber}</span>
                        </div>
                        <h4 className="font-black text-white text-base mt-1.5">{order.customerName}</h4>
                        {order.phone && (
                          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                            WhatsApp: <strong className="text-slate-300 font-mono">{order.phone}</strong>
                          </span>
                        )}
                      </div>
                      
                      {/* Bell alarm chime button */}
                      <button 
                        onClick={playChimeSoundNow}
                        className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[10px] font-extrabold uppercase border border-emerald-500/20 flex items-center gap-0.5 transition"
                        title="Chamar Cliente"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Chamar
                      </button>
                    </div>

                    {/* Order List */}
                    <div className="bg-slate-950/40 rounded-lg p-2 border border-slate-850 pl-3">
                      {order.items.map((item) => (
                        <p key={item.id} className="text-xs text-slate-300 font-medium my-1">
                          <span className="text-emerald-400 font-black">{item.quantity}x</span> {item.name}
                        </p>
                      ))}
                    </div>

                    {order.observations && (
                      <div className="bg-rose-500/10 border-l border-rose-500 text-rose-200 p-2 rounded-r-lg text-[11px] leading-relaxed">
                        <span className="font-extrabold uppercase text-[9px] tracking-wide text-rose-400 block mb-0.5">Observação:</span>
                        "{order.observations}"
                      </div>
                    )}

                    {/* Deliver Action */}
                    <button
                      onClick={() => onUpdateStatus(order.id, 'entregue')}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black tracking-wide text-xs uppercase rounded-lg transition"
                    >
                      Entregar para Mesa
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs px-4 space-y-2">
                  <Package className="w-8 h-8 text-slate-650 mx-auto opacity-30" />
                  <p className="font-bold">Aguardando novos preparos ficarem prontos.</p>
                  <p className="text-slate-600">Marque um pedido em andamento como "Pronto" para movê-lo de coluna automaticamente.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* COLUMN 3: ENTREGUES HISTORIC */}
        <section className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4 font-bold">
            <h2 className="flex items-center gap-2 text-slate-400 py-0.5">
              <CheckSquare className="w-5 h-5 text-slate-400" />
              <span>Entregues</span>
            </h2>
            <span className="bg-slate-805 text-slate-400 font-mono font-bold rounded-full text-xs px-3 py-1 border border-slate-800">
              {totalDeliveredCount}
            </span>
          </div>

          <div className="mb-3 p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs gap-2">
            <span className="text-slate-400 font-semibold leading-snug">Limpeza Automática (&ge; 20 pedidos):</span>
            <button
              onClick={onToggleAutoClear}
              className={`px-3 py-1 font-extrabold uppercase text-[10px] rounded-lg tracking-wider transition cursor-pointer ${
                autoClearDelivered
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {autoClearDelivered ? 'Ativa' : 'Inativa'}
            </button>
          </div>

          {totalDeliveredCount >= 20 && !autoClearDelivered && (
            <button
              onClick={() => {
                if (onClearDeliveredOrders) {
                  onClearDeliveredOrders();
                }
              }}
              className="mb-3 w-full py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 hover:border-rose-500/35 rounded-xl font-bold text-[11px] uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Apagar {totalDeliveredCount} entregues (Liberar Espaço)</span>
            </button>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            <AnimatePresence>
              {deliveredOrders.length > 0 ? (
                deliveredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-slate-900/70 border border-slate-800/60 rounded-xl relative pl-4 opacity-75 hover:opacity-100 transition"
                  >
                    {/* Grey accent line */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-600"></div>

                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-mono text-[9px] text-slate-500 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                          {order.shortId}
                        </span>
                        <h4 className="font-bold text-slate-200 mt-1.5">{order.customerName}</h4>
                        <p className="text-slate-500 text-[10px] font-semibold">{order.tableNumber}</p>
                        {order.phone && (
                          <p className="text-slate-400 text-[10px] font-medium font-mono">Tel: {order.phone}</p>
                        )}
                      </div>
                      
                      {/* Price and mark */}
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 font-medium font-semibold uppercase">Concluído</span>
                        <span className="font-black text-amber-500 text-xs mt-0.5 font-mono">
                          R$ {order.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 max-h-12 overflow-hidden truncate">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </div>

                    {order.observations && (
                      <p className="text-[10px] text-slate-500 italic mt-1.5 border-t border-slate-800/40 pt-1">
                        Obs: "{order.observations}"
                      </p>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs px-4 space-y-2">
                  <CheckSquare className="w-8 h-8 text-slate-650 mx-auto opacity-20" />
                  <p className="font-bold">Histórico vazio.</p>
                  <p className="text-slate-600">Pedidos concluídos e entregues ao longo do dia serão listados aqui.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

    </div>
  );
}

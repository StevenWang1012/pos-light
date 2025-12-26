import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from './store';
import { OrderStatus, Order, Dish, OrderItem } from './types';
import { 
  ShoppingCart, CheckCircle2, ChevronRight, 
  Minus, Plus, ArrowRight, UserPlus, Info, 
  MapPin, Clock, Coffee, Sparkles, X, AlertCircle,
  Image as ImageIcon, Edit3, Users, ChefHat, Receipt, ArrowLeft, Check, Search
} from 'lucide-react';

const CustomerApp: React.FC = () => {
  const { config, dishes, orders, setOrders, addOrder, updateOrderStatus } = useStore();
  const [step, setStep] = useState<'landing' | 'menu' | 'summary' | 'done'>('landing');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  // Selection State
  const [selectionTarget, setSelectionTarget] = useState<Dish | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Join Code State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const currentTable = { id: 'tab1', name: '1號桌' };

  // 尋找當前桌位的訂單 (用於顯示進度)
  const tableOrder = useMemo(() => {
    return orders.find(o => o.tableId === currentTable.id && o.status !== OrderStatus.CANCELLED);
  }, [orders, currentTable.id]);

  // Reset selection state when modal opens
  useEffect(() => {
    if (selectionTarget) {
      setSelectedOption('');
      setCustomNote('');
    }
  }, [selectionTarget]);

  // Auto redirect based on status if already in order
  useEffect(() => {
    if (tableOrder && step === 'landing') {
        if (tableOrder.status === OrderStatus.ORDERING) {
            setStep('menu');
        } else {
            setStep('done');
        }
    }
  }, [tableOrder, step]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(dishes.map(d => d.category))).sort();
    if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0]);
    return cats;
  }, [dishes]);

  // GPS Check
  useEffect(() => {
    if (step === 'summary' && config.isGpsEnabled) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = getDistance(pos.coords.latitude, pos.coords.longitude, config.centerCoords.lat, config.centerCoords.lng);
          if (dist > config.gpsRadius) {
             setGpsError(`距離餐廳 ${Math.round(dist)}m，請至店內點餐`);
             setGpsLocked(true);
          } else {
             setGpsLocked(false);
             setGpsError(null);
          }
        },
        () => {
          setGpsError("請開啟定位權限以驗證到店");
          setGpsLocked(true);
        }
      );
    } else {
      setGpsLocked(false);
      setGpsError(null);
    }
  }, [step, config]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleStartNewOrder = () => {
    if (tableOrder) {
        setStep('menu');
        return;
    }
    const newOrder: Order = {
      id: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      tableId: currentTable.id,
      tableName: currentTable.name,
      randomCode: Math.floor(1000 + Math.random() * 9000).toString(),
      items: [],
      status: OrderStatus.ORDERING,
      createdAt: Date.now(),
      totalAmount: 0,
      serviceFee: 0,
    };
    addOrder(newOrder);
    setStep('menu');
  };

  const handleJoinOrder = () => {
      setJoinError(null);
      const foundOrder = orders.find(o => o.randomCode === joinCodeInput && o.status !== OrderStatus.CANCELLED);
      
      if (foundOrder) {
          setStep('menu');
      } else {
          setJoinError("代碼錯誤");
      }
  };

  const updateOrderItems = (dish: Dish, delta: number, option?: string, note?: string) => {
    if (!tableOrder) return;
    let newItems = [...tableOrder.items];
    const existingIndex = newItems.findIndex(i => i.dishId === dish.id && i.selectedOption === option && i.customNote === note);

    if (existingIndex > -1) {
      const newQty = newItems[existingIndex].quantity + delta;
      if (newQty <= 0) newItems.splice(existingIndex, 1);
      else newItems[existingIndex].quantity = newQty;
    } else if (delta > 0) {
      newItems.push({ 
        dishId: dish.id, 
        name: dish.name, 
        price: dish.price, 
        quantity: 1, 
        selectedOption: option,
        customNote: note 
      });
    }

    const subtotal = newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const fee = config.isServiceFeeEnabled ? Math.round(subtotal * config.serviceFeeRate) : 0;
    setOrders(orders.map(o => o.id === tableOrder.id ? { ...tableOrder, items: newItems, totalAmount: subtotal + fee, serviceFee: fee } : o));
    setSelectionTarget(null);
    setCustomNote('');
  };

  const StatusCard = ({ icon: Icon, title, desc, colorClass }: any) => (
      <div className={`p-6 rounded-2xl flex items-center space-x-4 shadow-sm border ${colorClass}`}>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
            <Icon size={24} className="text-white"/>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
            <p className="text-white/90 text-sm mt-0.5">{desc}</p>
          </div>
      </div>
  );

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-[#F9FAFB] overflow-hidden text-[#1F2937] font-sans">
      
      {/* Modern Header */}
      <header className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">{config.restaurantName}</h2>
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{currentTable.name}</span>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {step === 'landing' && (
          <div className="p-6 flex flex-col items-center justify-center min-h-full space-y-8 animate-in fade-in zoom-in-95">
             <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-2">
                <Sparkles className="text-white" size={28}/>
             </div>
             
             <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">歡迎光臨</h1>
                <p className="text-gray-500 text-sm">開始您的點餐體驗</p>
             </div>
             
             <div className="w-full space-y-6">
                <button onClick={handleStartNewOrder} className="w-full bg-[#1F2937] text-white p-4 rounded-xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all hover:bg-black">
                    <span className="text-base font-semibold pl-1">開始點餐</span>
                    <div className="bg-white/10 p-1.5 rounded-full">
                        <ArrowRight size={18}/>
                    </div>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-[#F9FAFB] px-2 text-gray-400">或加入同桌</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <input 
                            type="tel" 
                            maxLength={4}
                            value={joinCodeInput}
                            onChange={(e) => { 
                                setJoinCodeInput(e.target.value.replace(/\D/g, ''));
                                setJoinError(null);
                            }}
                            placeholder="輸入 4 碼同桌代碼"
                            className={`w-full text-center text-lg font-bold p-4 rounded-xl border-2 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal ${joinError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 bg-white'}`}
                        />
                    </div>
                    
                    {joinError && (
                        <p className="text-center text-xs text-red-500 animate-in slide-in-from-top-1 font-medium">{joinError}</p>
                    )}

                    <button 
                        onClick={handleJoinOrder}
                        disabled={joinCodeInput.length !== 4}
                        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${joinCodeInput.length === 4 ? 'bg-blue-600 text-white shadow-md active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        加入
                    </button>
                </div>
             </div>
          </div>
        )}

        {step === 'menu' && (
          <div className="animate-in fade-in pb-28">
             {/* Info Bar - Compact */}
             <div className="mx-4 mt-4 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Users size={16} className="text-blue-600"/>
                    <span className="text-sm font-semibold text-gray-600">同桌代碼</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-600 tabular-nums">{tableOrder?.randomCode || '----'}</span>
                    <button className="text-xs text-gray-400 border px-2 py-0.5 rounded hover:bg-gray-50 transition-colors">分享</button>
                </div>
             </div>

             {/* Modern Tabs */}
             <div className="sticky top-0 bg-[#F9FAFB]/95 backdrop-blur-sm z-40 pt-4 pb-2 px-4 flex space-x-2 overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#1F2937] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    {cat}
                  </button>
                ))}
             </div>

             {/* Menu List */}
             <div className="p-4 space-y-3">
                {dishes.filter(d => d.category === activeCategory && d.isAvailable).map(dish => {
                  const count = tableOrder?.items.filter(i => i.dishId === dish.id).reduce((a,b)=>a+b.quantity, 0) || 0;
                  return (
                    <div key={dish.id} onClick={() => {
                        if((dish.options && dish.options.length > 0) || dish.allowCustomNotes) setSelectionTarget(dish);
                        else updateOrderItems(dish, 1);
                      }} 
                      className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm active:border-blue-500 transition-all cursor-pointer group">
                       <div className="flex items-center flex-1 min-w-0">
                           <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                              {dish.imageUrl ? (
                                <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />
                              ) : (
                                <ImageIcon size={20} className="text-gray-300" />
                              )}
                           </div>
                           <div className="ml-3 flex-1 min-w-0 pr-2">
                              <h4 className="text-base font-semibold text-gray-900 leading-snug truncate">{dish.name}</h4>
                              <p className="text-sm font-medium text-blue-600 mt-0.5 tabular-nums">$ {dish.price}</p>
                           </div>
                       </div>
                       
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${count > 0 ? 'bg-blue-600 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                         {count > 0 ? <span className="text-xs font-bold">{count}</span> : <Plus size={16}/>}
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {step === 'summary' && tableOrder && (
          <div className="p-5 space-y-6 animate-in slide-in-from-right duration-300 pb-32 bg-white min-h-full">
             <div className="flex justify-between items-center pb-4 border-b border-gray-100">
               <h1 className="text-xl font-bold text-gray-900">訂單確認</h1>
               <button onClick={() => setStep('menu')} className="text-blue-600 text-sm font-medium px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">繼續加點</button>
             </div>
             
             <div className="space-y-4">
                {tableOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start py-1">
                     <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{item.name} {item.selectedOption && <span className="text-blue-600 text-xs">/ {item.selectedOption}</span>}</span>
                        {item.customNote && <span className="text-[10px] text-gray-500 mt-0.5">備註: {item.customNote}</span>}
                        <span className="text-xs text-gray-400 mt-0.5 tabular-nums">$ {item.price} × {item.quantity}</span>
                     </div>
                     <span className="text-sm font-semibold text-gray-900 tabular-nums">$ {item.price * item.quantity}</span>
                  </div>
                ))}
             </div>
             
             <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100 mt-4">
                <span className="text-sm font-medium text-gray-600">總計金額</span>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">$ {tableOrder.totalAmount}</span>
             </div>

             {gpsError && (
               <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start space-x-2 text-red-600">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-snug">{gpsError}</p>
               </div>
             )}

             <div className="pt-4">
                 <button 
                    disabled={gpsLocked}
                    onClick={() => { updateOrderStatus(tableOrder.id, OrderStatus.SUBMITTED); setStep('done'); }}
                    className={`w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center space-x-2 transition-all ${gpsLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#1F2937] text-white active:scale-[0.98] hover:bg-black'}`}>
                    <span>確認送出</span>
                    <ArrowRight size={18}/>
                 </button>
                 <p className="text-center text-[10px] text-gray-400 mt-3">送出後無法取消，將直接開始製作</p>
             </div>
          </div>
        )}

        {step === 'done' && tableOrder && (
           <div className="p-6 flex flex-col items-center min-h-full space-y-6 animate-in zoom-in-95 pt-12">
              {tableOrder.status === OrderStatus.SUBMITTED && (
                  <StatusCard 
                    icon={ChefHat} 
                    title="訂單已送出" 
                    desc="廚房正在準備您的餐點" 
                    colorClass="bg-blue-600 w-full border-blue-600"
                  />
              )}

              {tableOrder.status === OrderStatus.PAID && (
                  <StatusCard 
                    icon={Receipt} 
                    title="結帳完成" 
                    desc="感謝光臨，祝您用餐愉快" 
                    colorClass="bg-green-500 w-full border-green-500"
                  />
              )}

              <div className="w-full bg-white border border-gray-200 p-5 rounded-2xl space-y-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b pb-2">明細</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {tableOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700">{item.name} x{item.quantity}</span>
                            <span className="font-semibold text-gray-900">$ {item.price * item.quantity}</span>
                        </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-medium text-gray-500 text-sm">總計</span>
                      <span className="font-bold text-lg text-blue-600 tabular-nums">$ {tableOrder.totalAmount}</span>
                  </div>
              </div>

              <div className="w-full space-y-3 pt-2">
                  {tableOrder.status === OrderStatus.PAID ? (
                      <button onClick={() => { setJoinCodeInput(''); setStep('landing'); }} className="w-full bg-[#1F2937] text-white py-3.5 rounded-xl font-bold text-sm active:scale-[0.98]">
                          返回首頁
                      </button>
                  ) : (
                      <button onClick={() => setStep('menu')} className="w-full bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 active:bg-gray-100">
                          加點餐點
                      </button>
                  )}
              </div>
           </div>
        )}
      </main>

      {/* Modal - Selection (Modern Style) */}
      {selectionTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-end sm:items-center sm:justify-center p-0 sm:p-4">
           <div className="bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-200">
              
              <div className="flex items-start justify-between mb-6">
                 <div className="flex-1 pr-4">
                   <h3 className="text-xl font-bold text-gray-900 leading-tight">{selectionTarget.name}</h3>
                   <p className="text-blue-600 font-bold text-lg mt-1">$ {selectionTarget.price}</p>
                 </div>
                 <button onClick={() => setSelectionTarget(null)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-500"/></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-2">
                  {selectionTarget.options && selectionTarget.options.length > 0 && (
                    <div className="space-y-3">
                       <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">選擇規格</p>
                       <div className="flex flex-wrap gap-2">
                          {selectionTarget.options.map(opt => (
                             <button 
                                key={opt} 
                                onClick={() => setSelectedOption(opt)} 
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedOption === opt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                             >
                                {opt}
                             </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {selectionTarget.allowCustomNotes && (
                    <div className="space-y-3">
                       <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">備註</p>
                       <input 
                            placeholder="例如：少冰、不要蔥..." 
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                       />
                    </div>
                  )}
              </div>

              <button 
                onClick={() => updateOrderItems(selectionTarget, 1, selectedOption || undefined, customNote)} 
                disabled={selectionTarget.options && selectionTarget.options.length > 0 && !selectedOption}
                className={`w-full py-3.5 mt-4 rounded-xl text-base font-bold transition-all flex items-center justify-center space-x-2 ${
                    selectionTarget.options && selectionTarget.options.length > 0 && !selectedOption 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#1F2937] text-white active:scale-[0.98] hover:bg-black shadow-lg'
                }`}
              >
                  {selectionTarget.options && selectionTarget.options.length > 0 && !selectedOption ? 
                    <span className="text-sm">請選擇規格</span> : 
                    <>
                        <Plus size={18} />
                        <span>加入購物車</span>
                    </>
                  }
              </button>
           </div>
        </div>
      )}

      {/* Floating Cart Button (Compact) */}
      {step === 'menu' && tableOrder && tableOrder.items.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300">
           <button onClick={() => setStep('summary')} className="w-full bg-[#1F2937]/95 backdrop-blur text-white py-3.5 rounded-xl flex items-center justify-between px-5 shadow-xl active:scale-[0.98] transition-all hover:bg-black">
              <div className="flex items-center space-x-3">
                 <div className="bg-blue-600 min-w-[1.5rem] h-6 px-1.5 rounded-full flex items-center justify-center font-bold text-xs">
                    {tableOrder.items.reduce((a,b)=>a+b.quantity, 0)}
                 </div>
                 <span className="font-semibold text-sm">查看購物車</span>
              </div>
              <div className="flex items-center">
                <span className="text-base font-bold mr-1 tabular-nums">$ {tableOrder.totalAmount}</span>
                <ChevronRight size={18} className="text-gray-400"/>
              </div>
           </button>
        </div>
      )}
    </div>
  );
};

export default CustomerApp;
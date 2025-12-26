import React, { useState, useMemo, useRef } from 'react';
import { useStore } from './store';
import { TableStatus, OrderStatus, Order, Table, Dish } from './types';
import { 
  LayoutDashboard, Utensils, Settings, BarChart3, 
  Plus, X, MapPin, ChevronRight, ChevronLeft, 
  Printer, ListOrdered, CheckCircle2, Circle,
  LogOut, Timer, Trash2, Trophy, Camera, 
  Upload, Info, TrendingUp, Calendar, Globe,
  Image as ImageIcon, Coffee, QrCode // 加入 QrCode icon
} from 'lucide-react';

const MerchantApp: React.FC = () => {
  const { 
    tables, orders, dishes, config, 
    updateOrderStatus, updateTableStatus, toggleItemServed,
    setConfig, setTables, setDishes, addOrder, setOrders 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'reports' | 'settings'>('tables');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [showMenuEditor, setShowMenuEditor] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  
  // 新增：QR Code 預覽狀態
  const [viewQrTable, setViewQrTable] = useState<Table | null>(null);
  
  const [editorCategory, setEditorCategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);

  // 核心修復：優化訂單獲取邏輯，解決客人下單後桌位顯示不連動的問題
  const getTableActiveOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return null; // 只檢查桌子是否存在

    // 獲取該桌最新一筆未取消的訂單
    const activeOrder = orders
      .filter(o => o.tableId === tableId && o.status !== OrderStatus.CANCELLED)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    
    if (!activeOrder) return null;

    // 智能判斷：
    // 如果桌子狀態標記為 IDLE (空閒)，但卻有 "PAID" (已結帳) 的訂單，代表這是上一組客人留下的記錄，視為空桌 (不顯示)。
    // 但如果訂單狀態是 ORDERING (點餐中) 或 SUBMITTED (已送單)，代表是新客人，即使桌況是 IDLE 也要強制顯示。
    if (table.status === TableStatus.IDLE) {
       if (activeOrder.status === OrderStatus.PAID) return null;
    }

    return activeOrder;
  };

  const categories = useMemo(() => {
    const dishCats = Array.from(new Set(dishes.map(d => d.category)));
    if (editorCategory && !dishCats.includes(editorCategory)) {
      dishCats.push(editorCategory);
    }
    if (dishCats.length > 0 && !editorCategory) {
      setEditorCategory(dishCats[0]);
    }
    return dishCats.sort();
  }, [dishes, editorCategory]);

  const allOrdersSorted = useMemo(() => {
    return [...orders].sort((a, b) => b.createdAt - a.createdAt);
  }, [orders]);

  const reportData = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === OrderStatus.PAID);
    
    const yearlyTotal = paidOrders
      .filter(o => new Date(o.createdAt).getFullYear() === reportYear)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const amount = paidOrders
        .filter(o => {
          const d = new Date(o.createdAt);
          return d.getFullYear() === reportYear && (d.getMonth() + 1) === monthNum;
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
      return { month: monthNum, amount };
    });

    const dishStats: Record<string, { name: string, count: number }> = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!dishStats[item.dishId]) dishStats[item.dishId] = { name: item.name, count: 0 };
        dishStats[item.dishId].count += item.quantity;
      });
    });
    const topDishes = Object.values(dishStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { 
      yearlyTotal, 
      months: months.filter(m => m.amount > 0 || m.month === (new Date().getMonth() + 1)).reverse(),
      topDishes
    };
  }, [orders, reportYear]);

  const handlePayOrder = () => {
    if (!selectedTable) return;
    const activeOrder = getTableActiveOrder(selectedTable.id);
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, OrderStatus.PAID);
    updateTableStatus(selectedTable.id, TableStatus.PAID);
  };

  const handleResetTable = () => {
    if (!selectedTable) return;
    updateTableStatus(selectedTable.id, TableStatus.IDLE);
    setShowOrderPanel(false);
  };

  const deleteTable = (id: string, name: string) => {
    if (confirm(`確定要移除「${name}」嗎？`)) {
      setTables(tables.filter(t => t.id !== id));
    }
  };

  const saveDish = (dish: Dish) => {
    if (dishes.find(d => d.id === dish.id)) {
      setDishes(dishes.map(d => d.id === dish.id ? dish : d));
    } else {
      setDishes([...dishes, dish]);
    }
    setEditingDish(null);
  };

  const deleteDish = (id: string) => {
    if (confirm('確定要刪除此品項嗎？')) {
      setDishes(dishes.filter(d => d.id !== id));
      setEditingDish(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingDish) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingDish({ ...editingDish, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const LargeTitle = ({ title, action }: { title: string, action?: React.ReactNode }) => (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-[#F2F2F7]/95 ios-blur z-30 flex justify-between items-end border-b border-gray-200/50">
      <h1 className="text-4xl font-[900] text-black tracking-tight">{title}</h1>
      {action}
    </div>
  );

  return (
    <div className={`flex flex-col h-screen max-w-lg mx-auto bg-[#F2F2F7] relative overflow-hidden text-black font-sans transition-colors duration-500 ${isEditMode ? 'border-4 border-red-500 rounded-lg box-border' : ''}`}>
      
      {/* 編輯模式提示條 - 防呆機制 */}
      {isEditMode && (
          <div className="bg-red-500 text-white text-center py-1 text-xs font-bold absolute top-0 left-0 right-0 z-50">
              ⚠️ 目前為編輯模式 - 請小心刪除，或點擊 QR Code 圖示列印桌碼
          </div>
      )}

      <main className="flex-1 overflow-y-auto pb-44">
        {activeTab === 'tables' && (
          <div className="animate-in fade-in duration-300">
            <LargeTitle 
              title={isEditMode ? "編輯桌位" : "現場桌況"} 
              action={
                <button onClick={() => setIsEditMode(!isEditMode)} className={`px-6 py-3 rounded-full font-black text-base border-2 transition-all active:scale-95 ${isEditMode ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-offset-2 ring-red-200' : 'bg-white text-black border-gray-200 shadow-sm'}`}>
                  {isEditMode ? "完成設定" : "管理桌位"}
                </button>
              }
            />
            <div className="p-6 grid grid-cols-2 gap-5">
              {tables.map(table => {
                const activeOrder = getTableActiveOrder(table.id);
                // 優化：顏色邏輯更明確，增加背景色濃度
                let bgColor = 'bg-white border-gray-200 text-gray-500';
                let statusText = '空閒中';
                let statusBadgeColor = 'bg-gray-100 text-gray-400';
                let icon = null;

                if (activeOrder) {
                  const unserved = activeOrder.items.filter(i => !i.isServed).length;
                  if (activeOrder.status === OrderStatus.PAID) {
                    // 已結帳：綠色系，代表安全、可整理
                    bgColor = 'bg-[#34C759]/10 border-[#34C759] text-[#34C759]';
                    statusText = unserved > 0 ? '已結帳(未齊)' : '✅ 已結帳';
                    statusBadgeColor = 'bg-[#34C759] text-white';
                    icon = <CheckCircle2 size={32} />;
                  } else if (activeOrder.status === OrderStatus.ORDERING) {
                    // 點餐中：橘色系 (新增狀態顯示)
                    bgColor = 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200';
                    statusText = '📱 點餐中';
                    statusBadgeColor = 'bg-white/20 text-white backdrop-blur-md';
                    icon = <ListOrdered size={32} />;
                  } else {
                    // 製作中：藍色系，代表忙碌
                    bgColor = 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg shadow-blue-200';
                    statusText = unserved > 0 ? '🔥 製作中' : '餐點已齊';
                    statusBadgeColor = 'bg-white/20 text-white backdrop-blur-md';
                    icon = <Timer size={32} />;
                  }
                }

                return (
                  <div key={table.id} className="relative group">
                    <button onClick={() => { if(!isEditMode){ setSelectedTable(table); setShowOrderPanel(true); } }}
                        className={`w-full min-h-[14rem] rounded-[2.5rem] border-[4px] flex flex-col items-center justify-center space-y-4 transition-all active:scale-95 shadow-sm overflow-hidden ${bgColor}`}>
                        
                        {/* ICON 區域加大 */}
                        <div className="scale-110">{icon}</div>
                        
                        {/* 桌名加大，使用 bolder */}
                        <span className={`text-3xl font-[900] px-2 text-center line-clamp-1 ${!activeOrder ? 'text-gray-800' : ''}`}>
                            {table.name}
                        </span>
                        
                        {/* 狀態改為膠囊標籤，字體加大至 text-sm */}
                        <span className={`px-4 py-1.5 rounded-full text-sm font-black tracking-wider ${statusBadgeColor}`}>
                            {statusText}
                        </span>
                    </button>
                    
                    {/* 編輯模式下的按鈕群組 */}
                    {isEditMode && (
                      <>
                        {/* 刪除按鈕 (右上) */}
                        <button onClick={(e) => { e.stopPropagation(); deleteTable(table.id, table.name); }} 
                            className="absolute -top-3 -right-3 bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in active:scale-90 border-4 border-[#F2F2F7] z-10">
                            <Trash2 size={24} strokeWidth={3} />
                        </button>
                        
                        {/* QR Code 生成按鈕 (左上) */}
                        <button onClick={(e) => { e.stopPropagation(); setViewQrTable(table); }} 
                            className="absolute -top-3 -left-3 bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in active:scale-90 border-4 border-gray-200 z-10">
                            <QrCode size={24} strokeWidth={3} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              
              {isEditMode && (
                <button onClick={() => { const n = prompt('請輸入新桌號 (例如: 8)'); if(n) setTables([...tables, { id: 't-'+Date.now(), name: n+'號桌', capacity: 4, qrCode: 'DG-'+n, status: TableStatus.IDLE }]); }}
                  className="min-h-[14rem] rounded-[2.5rem] border-[4px] border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 active:scale-95 bg-gray-50 hover:bg-white transition-colors">
                  <Plus size={48} className="mb-2 opacity-50"/>
                  <span className="font-black text-xl">新增桌位</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-in fade-in duration-300">
            <LargeTitle title="即時訂單" />
            <div className="p-6 space-y-4">
               {allOrdersSorted.map(o => (
                  <button key={o.id} onClick={() => setDetailedOrder(o)} className="w-full bg-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-sm active:bg-gray-50 border border-gray-100">
                     <div className="text-left">
                        <p className="text-2xl font-black text-gray-800">{o.tableName}</p>
                        <p className="text-sm font-bold text-gray-400 mt-1">{new Date(o.createdAt).toLocaleTimeString()} · #{o.randomCode}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-black text-[#007AFF] tabular-nums">${o.totalAmount}</p>
                        <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${o.status === OrderStatus.PAID ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                           {o.status}
                        </div>
                     </div>
                  </button>
               ))}
               {allOrdersSorted.length === 0 && (
                 <div className="py-20 text-center text-gray-300 font-bold flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><ListOrdered size={32} className="opacity-30"/></div>
                    目前尚無訂單
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in fade-in duration-300">
            <LargeTitle title="營業統計" action={
              <div className="flex items-center bg-white rounded-full border shadow-sm p-1">
                <button onClick={() => setReportYear(y => y-1)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
                  <ChevronLeft size={24}/>
                </button>
                <span className="text-xl font-black px-4 tabular-nums w-24 text-center">{reportYear}</span>
                <button 
                  onClick={() => setReportYear(y => y+1)} 
                  disabled={reportYear >= new Date().getFullYear()}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-transform ${reportYear >= new Date().getFullYear() ? 'text-gray-300' : 'hover:bg-gray-100 active:scale-90 text-black'}`}
                >
                  <ChevronRight size={24}/>
                </button>
              </div>
            }/>
            <div className="p-6 space-y-6">
               <div className="bg-[#1C1C1E] p-10 rounded-[3rem] text-white shadow-xl text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120}/></div>
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-2 z-10 relative">{reportYear} 年度收益總覽</p>
                  <p className="text-6xl font-[900] text-[#FFD60A] tabular-nums z-10 relative">${reportData.yearlyTotal.toLocaleString()}</p>
               </div>

               {/* 熱銷排行 */}
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-4 border border-gray-100">
                  <div className="flex items-center space-x-2 text-gray-400 px-1">
                    <Trophy size={20} className="text-[#FFD60A]"/>
                    <p className="text-sm font-black uppercase tracking-widest">熱銷品項排行榜</p>
                  </div>
                  <div className="space-y-4">
                     {reportData.topDishes.map((dish, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                           <div className="flex items-center space-x-4">
                             <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">{i+1}</span>
                             <span className="font-bold text-lg">{dish.name}</span>
                           </div>
                           <span className="font-black text-[#007AFF] tabular-nums text-lg">{dish.count} 份</span>
                        </div>
                     ))}
                     {reportData.topDishes.length === 0 && <p className="text-center text-gray-300 font-bold py-4">尚無排行資料</p>}
                  </div>
               </div>

               {/* 月度細節 */}
               <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden divide-y">
                  {reportData.months.map(m => (
                    <div key={m.month} className="p-6 flex justify-between items-center active:bg-gray-50">
                       <span className="text-xl font-black">{m.month} 月</span>
                       <span className="text-2xl font-[900] tabular-nums">${m.amount.toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300">
            <LargeTitle title="系統設定" />
            <div className="px-6 space-y-6 pb-20">
               {/* 找回：餐廳名稱設定 */}
               <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden p-8 space-y-3 border border-gray-100">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">餐廳顯示名稱 (POS 與 客戶端)</label>
                  <div className="flex items-center space-x-3 bg-gray-50 p-6 rounded-3xl border border-gray-100 focus-within:border-[#007AFF]/30 transition-all">
                     <Utensils size={24} className="text-[#FF9500]" />
                     <input 
                       value={config.restaurantName} 
                       onChange={(e) => setConfig({...config, restaurantName: e.target.value})}
                       placeholder="輸入餐廳名稱"
                       className="flex-1 bg-transparent font-black text-2xl outline-none text-[#007AFF]"
                     />
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden divide-y border border-gray-100">
                  <button onClick={() => setShowMenuEditor(true)} className="w-full p-8 flex justify-between items-center active:bg-gray-50 hover:bg-gray-50 transition-colors">
                     <div className="flex items-center space-x-4"><Utensils size={28} className="text-[#FF9500]" /><span className="text-2xl font-black">菜單圖片與分類管理</span></div>
                     <ChevronRight size={24} className="text-gray-300" />
                  </button>
                  
                  {/* GPS 核心開關 */}
                  <div className="p-8 flex justify-between items-center">
                     <div className="flex items-center space-x-4"><Globe size={28} className="text-[#34C759]" /><span className="text-2xl font-black">啟用 GPS 到店驗證</span></div>
                     <label className="relative inline-flex items-center cursor-pointer scale-125 mr-2">
                        <input type="checkbox" checked={config.isGpsEnabled} onChange={(e) => setConfig({...config, isGpsEnabled: e.target.checked})} className="sr-only peer" />
                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#34C759]"></div>
                     </label>
                  </div>

                  <div className="p-8 flex justify-between items-center">
                     <div className="flex items-center space-x-4"><MapPin size={28} className="text-[#007AFF]" /><span className="text-2xl font-black">GPS 範圍 (公尺)</span></div>
                     <input type="number" value={config.gpsRadius} onChange={(e) => setConfig({...config, gpsRadius: parseInt(e.target.value)})} className="w-24 text-right text-3xl font-black outline-none bg-transparent text-[#007AFF]" />
                  </div>
               </div>

               {config.isGpsEnabled && (
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-4 animate-in slide-in-from-top duration-300 border border-gray-100">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <MapPin size={16}/>
                      <p className="text-xs font-black uppercase tracking-widest">店面中心座標設定</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">緯度 Latitude</label>
                          <input type="number" step="0.000001" value={config.centerCoords.lat} onChange={(e) => setConfig({...config, centerCoords: {...config.centerCoords, lat: parseFloat(e.target.value)}})} className="w-full bg-gray-50 p-4 rounded-xl font-bold tabular-nums text-lg" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">經度 Longitude</label>
                          <input type="number" step="0.000001" value={config.centerCoords.lng} onChange={(e) => setConfig({...config, centerCoords: {...config.centerCoords, lng: parseFloat(e.target.value)}})} className="w-full bg-gray-50 p-4 rounded-xl font-bold tabular-nums text-lg" />
                      </div>
                    </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 ios-blur border-t border-gray-200 pb-safe z-50 h-32 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'tables', icon: LayoutDashboard, label: '桌位狀況' },
          { id: 'orders', icon: ListOrdered, label: '訂單列表' },
          { id: 'reports', icon: BarChart3, label: '營收報表' },
          { id: 'settings', icon: Settings, label: '系統設定' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center flex-1 transition-all p-2 ${activeTab === item.id ? 'text-[#007AFF] scale-105' : 'text-gray-300'}`}>
            <item.icon size={36} strokeWidth={2.5}/>
            <span className="text-xs font-black mt-1 tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 菜單管理 Overlay */}
      {showMenuEditor && (
        <div className="fixed inset-0 bg-[#F2F2F7] z-[120] flex flex-col animate-in slide-in-from-right duration-300">
           <div className="px-6 pt-12 pb-4 flex items-center bg-white sticky top-0 z-10 border-b">
              <button onClick={() => setShowMenuEditor(false)} className="text-[#007AFF] font-black flex items-center text-xl active:opacity-50 transition-opacity p-2"><ChevronLeft size={32}/> 返回</button>
              <h2 className="flex-1 text-center text-2xl font-black pr-16">菜單管理</h2>
           </div>
           
           {/* 分類 Tab 列 */}
           <div className="bg-white border-b px-6 flex space-x-4 overflow-x-auto no-scrollbar pb-4 pt-2">
              {categories.map(cat => (
                 <button 
                  key={cat} 
                  onClick={() => setEditorCategory(cat)}
                  className={`px-6 py-3 rounded-full font-black text-base whitespace-nowrap transition-all ${editorCategory === cat ? 'bg-[#007AFF] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                 >
                   {cat}
                 </button>
              ))}
              <button 
                onClick={() => { const n = prompt('新分類名稱?'); if(n) setEditorCategory(n); }}
                className="px-6 py-3 rounded-full font-black text-base whitespace-nowrap bg-gray-50 text-[#007AFF] border border-[#007AFF]/20"
              >
                + 新分類
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 divide-y overflow-hidden">
                 {dishes.filter(d => d.category === editorCategory).map(dish => (
                   <button key={dish.id} onClick={() => setEditingDish(dish)} className="w-full p-5 flex items-center active:bg-gray-50 text-left transition-colors">
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                         {dish.imageUrl ? (
                           <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />
                         ) : (
                           <ImageIcon size={32} className="text-gray-300" />
                         )}
                      </div>
                      <div className="flex-1 ml-5">
                         <p className="text-xl font-black text-gray-900">{dish.name}</p>
                         <div className="flex items-center space-x-2 mt-1">
                           <p className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${dish.isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                             {dish.isAvailable ? '供應中' : '已售罄'}
                           </p>
                           {dish.options && dish.options.length > 0 && (
                             <span className="text-xs bg-blue-50 text-blue-500 font-bold px-2 py-0.5 rounded-md">可選規格</span>
                           )}
                         </div>
                      </div>
                      <div className="flex items-center space-x-3">
                         <p className="text-2xl font-[900] text-[#007AFF] tabular-nums">${dish.price}</p>
                         <ChevronRight className="text-gray-300" size={24}/>
                      </div>
                   </button>
                 ))}
                 {dishes.filter(d => d.category === editorCategory).length === 0 && (
                   <div className="p-20 text-center space-y-4">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200"><Utensils size={48}/></div>
                      <p className="text-gray-300 font-bold text-lg">分類「{editorCategory}」目前尚無品項</p>
                   </div>
                 )}
              </div>
              
              <div className="pt-4 pb-20">
                 <button 
                  onClick={() => setEditingDish({ id: 'd-'+Date.now(), name: '', price: 0, category: editorCategory || '新分類', isAvailable: true, options: [], allowCustomNotes: true })}
                  className="w-full bg-black text-white py-6 rounded-[2.5rem] text-xl font-black shadow-xl active:scale-95 flex items-center justify-center space-x-3 transition-transform"
                 >
                    <Plus size={32}/> <span>新增品項到 {editorCategory}</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 品項編輯彈窗 */}
      {editingDish && (
        <div className="fixed inset-0 bg-black/40 ios-blur z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b text-center shrink-0 bg-gray-50/50">
                 <h3 className="text-2xl font-black">品項詳情編輯</h3>
                 <p className="text-sm text-gray-400 font-bold mt-1">設定菜單顯示資訊</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                 <div className="space-y-3">
                    <label className="text-sm font-black text-gray-500 uppercase tracking-widest px-1">1. 品項名稱</label>
                    <input autoFocus placeholder="品項名稱" value={editingDish.name} onChange={e => setEditingDish({...editingDish, name: e.target.value})} className="w-full p-5 bg-[#F2F2F7] rounded-2xl font-black text-2xl outline-none focus:ring-4 focus:ring-[#007AFF]/10 transition-all text-center" />
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-gray-500 uppercase tracking-widest px-1">2. 品項展示圖片</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-all group hover:bg-gray-100">
                       {editingDish.imageUrl ? (
                         <div className="relative w-full h-full">
                            <img src={editingDish.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Upload className="text-white" size={40} />
                            </div>
                         </div>
                       ) : (
                         <div className="text-center text-gray-300">
                            <Camera size={48} className="mx-auto mb-2" />
                            <p className="text-sm font-black">點擊上傳圖片</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-gray-500 uppercase tracking-widest px-1">3. 定價與分類</label>
                    <div className="space-y-3">
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xl">$</span>
                          <input type="number" placeholder="定價" value={editingDish.price || ''} onChange={e => setEditingDish({...editingDish, price: parseInt(e.target.value) || 0})} className="w-full p-5 pl-12 bg-[#F2F2F7] rounded-2xl font-black text-2xl outline-none tabular-nums" />
                       </div>
                       <input placeholder="品項分類" value={editingDish.category} onChange={e => setEditingDish({...editingDish, category: e.target.value})} className="w-full p-5 bg-[#F2F2F7] rounded-2xl font-black text-xl outline-none" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-sm font-black text-gray-500 uppercase tracking-widest">4. 規格/口味選項</label>
                      <Info size={16} className="text-gray-300"/>
                    </div>
                    <div className="bg-[#F2F2F7] p-5 rounded-3xl space-y-3 border border-gray-200/50">
                       <textarea rows={2} placeholder="以逗號分隔, 如: 原味,焦糖,玫瑰" value={editingDish.options?.join(',') || ''} onChange={e => setEditingDish({...editingDish, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full bg-transparent font-bold text-lg outline-none resize-none placeholder:text-gray-300" />
                       <div className="flex flex-wrap gap-2">
                          {editingDish.options?.map((opt, i) => (
                            <span key={i} className="bg-white px-3 py-1.5 rounded-full text-xs font-black text-[#007AFF] shadow-sm border border-[#007AFF]/10">{opt}</span>
                          ))}
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <span className="text-sm font-bold text-gray-600">開放客戶備註 (如: 少冰)</span>
                       <input type="checkbox" checked={editingDish.allowCustomNotes} onChange={e => setEditingDish({...editingDish, allowCustomNotes: e.target.checked})} className="w-6 h-6 accent-[#007AFF]" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-gray-500 uppercase tracking-widest px-1">5. 供應狀態</label>
                    <button onClick={() => setEditingDish({...editingDish, isAvailable: !editingDish.isAvailable})} className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${editingDish.isAvailable ? 'bg-[#34C759]/10 text-[#34C759] border-2 border-[#34C759]/20' : 'bg-red-50 text-red-500 border-2 border-red-100'}`}>
                       <span className="text-xl font-black">{editingDish.isAvailable ? '目前正常供應' : '目前已售罄'}</span>
                       {editingDish.isAvailable ? <CheckCircle2 size={28}/> : <X size={28}/>}
                    </button>
                 </div>

                 <button onClick={() => deleteDish(editingDish.id)} className="w-full py-4 text-red-400 font-bold text-sm bg-red-50 rounded-xl hover:bg-red-100 transition-colors">刪除此品項</button>
              </div>

              <div className="flex border-t shrink-0 h-24 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] bg-white z-10">
                 <button onClick={() => setEditingDish(null)} className="flex-1 font-bold text-xl text-gray-400 active:bg-gray-50">取消</button>
                 <button onClick={() => saveDish(editingDish)} className="flex-1 font-[900] text-xl text-[#007AFF] active:bg-gray-50 border-l border-gray-100">儲存設定</button>
              </div>
           </div>
        </div>
      )}

      {/* QR Code 預覽與列印 Modal */}
      {viewQrTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                 <div>
                    <h3 className="text-3xl font-[900] text-gray-900">{viewQrTable.name} 專屬點餐碼</h3>
                    <p className="text-gray-500 font-bold text-sm mt-2">請將此 QR Code 列印並張貼於桌上</p>
                 </div>
                 
                 <div className="bg-white p-4 rounded-3xl border-4 border-black shadow-lg">
                    {/* 使用公開 API 生成 QR Code 圖片，連結到目前網址並帶入參數 */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?mode=customer&tableId=' + viewQrTable.id)}`} 
                      alt="QR Code" 
                      className="w-56 h-56 object-contain"
                    />
                 </div>

                 <div className="bg-gray-50 p-4 rounded-xl w-full text-left space-y-1 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">連結預覽</p>
                    <p className="text-xs font-mono text-gray-600 break-all">{window.location.origin}?mode=customer&tableId={viewQrTable.id}</p>
                 </div>
              </div>

              <div className="flex border-t h-20 bg-gray-50">
                 <button onClick={() => setViewQrTable(null)} className="flex-1 font-bold text-xl text-gray-500 active:bg-gray-200 transition-colors">關閉</button>
                 <button onClick={() => window.print()} className="flex-1 font-[900] text-xl text-black border-l border-gray-200 active:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                    <Printer size={24}/>
                    <span>列印</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 桌位面板 */}
      {showOrderPanel && selectedTable && (
        <div className="fixed inset-0 bg-black/40 ios-blur z-[60] flex items-end">
          <div className="ios-sheet bg-white w-full rounded-t-[3rem] flex flex-col max-h-[85vh] shadow-2xl pb-safe">
            <div className="h-10 flex justify-center items-center shrink-0" onClick={() => setShowOrderPanel(false)}><div className="w-16 h-1.5 bg-gray-300 rounded-full" /></div>
            <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-[3rem]">
              <div>
                  <h3 className="text-4xl font-black text-gray-900">{selectedTable.name}</h3>
                  <p className="text-gray-400 font-bold text-sm mt-1">桌位詳情與結帳</p>
              </div>
              <button onClick={() => setShowOrderPanel(false)} className="bg-gray-100 p-4 rounded-full active:scale-90 transition-transform"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {getTableActiveOrder(selectedTable.id) ? (
                <>
                  <div className="bg-[#F2F2F7] p-6 rounded-[2.5rem] space-y-4">
                    {getTableActiveOrder(selectedTable.id)?.items.map((item, i) => (
                      <div key={i} onClick={() => toggleItemServed(getTableActiveOrder(selectedTable.id)!.id, item.dishId)} 
                        className="flex justify-between items-center cursor-pointer active:opacity-60 transition-opacity p-2 -mx-2 hover:bg-white/50 rounded-xl">
                        <div className="flex items-center space-x-4 text-2xl font-bold">
                          {item.isServed ? <CheckCircle2 className="text-[#34C759] shrink-0" size={32}/> : <Circle className="text-gray-300 shrink-0" size={32}/>}
                          <div className="flex flex-col">
                            <span className={`text-xl ${item.isServed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name} {item.selectedOption && <span className="text-[#007AFF] text-lg">({item.selectedOption})</span>} x {item.quantity}</span>
                            {item.customNote && <span className="text-sm text-gray-400 font-bold mt-0.5">備註: {item.customNote}</span>}
                          </div>
                        </div>
                        <span className="text-2xl font-black tabular-nums text-gray-700">${item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-6 mt-4 flex justify-between items-end">
                      <span className="text-gray-400 font-bold text-xl">消費總計</span>
                      <span className="text-5xl font-black text-[#007AFF] tabular-nums">${getTableActiveOrder(selectedTable.id)?.totalAmount}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                      {getTableActiveOrder(selectedTable.id)?.status !== OrderStatus.PAID ? (
                        <button onClick={handlePayOrder} className="w-full py-6 bg-[#34C759] text-white rounded-[2rem] text-3xl font-black shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center justify-center space-x-3">
                            <span className="tracking-widest">確認收款</span>
                        </button>
                      ) : (
                        <div className="p-6 border-4 border-[#34C759] text-[#34C759] rounded-[2rem] text-center text-3xl font-black bg-[#34C759]/5 flex items-center justify-center space-x-2">
                            <CheckCircle2 size={36}/>
                            <span>已結帳完成</span>
                        </div>
                      )}
                      
                      {/* 清空桌位按鈕 - 加上視覺區隔防止誤觸 */}
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        <button onClick={handleResetTable} className="w-full py-5 bg-black text-white rounded-[2rem] text-xl font-black active:scale-95 flex items-center justify-center space-x-3 opacity-90 hover:opacity-100">
                            <LogOut size={24}/>
                            <span>清空桌位 (客人已離開)</span>
                        </button>
                      </div>
                  </div>
                </>
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300 space-y-4">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center"><Coffee size={48}/></div>
                      <p className="font-bold text-2xl">目前無活動點單</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 訂單詳情 Overlay */}
      {detailedOrder && (
        <div className="fixed inset-0 bg-white z-[110] flex flex-col animate-in slide-in-from-right duration-300">
           <div className="px-6 pt-12 pb-6 border-b flex items-center bg-[#F2F2F7]/50 sticky top-0">
              <button onClick={() => setDetailedOrder(null)} className="text-[#007AFF] font-black flex items-center text-xl p-2"><ChevronLeft size={36}/> 返回</button>
              <h2 className="flex-1 text-center text-2xl font-black pr-16">{detailedOrder.tableName} 詳情</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="bg-[#F2F2F7] p-8 rounded-[3rem] space-y-6">
                 {detailedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-200/50 last:border-0 pb-4 last:pb-0">
                       <div className="flex items-center space-x-3 text-2xl font-bold">
                          <div className="flex flex-col">
                            <span className="text-gray-800">{item.name} {item.selectedOption && <span className="text-[#007AFF]">({item.selectedOption})</span>} x {item.quantity}</span>
                            {item.customNote && <span className="text-sm text-gray-400 font-bold mt-1">備註: {item.customNote}</span>}
                          </div>
                       </div>
                       <span className="text-2xl font-black tabular-nums text-gray-600">${item.price * item.quantity}</span>
                    </div>
                 ))}
                 <div className="border-t-2 border-dashed border-gray-300 pt-6 flex justify-between items-center text-3xl font-black">
                    <span className="text-gray-500">消費總計</span>
                    <span className="text-[#007AFF] tabular-nums">${detailedOrder.totalAmount}</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.print()} className="w-full py-6 bg-white border-4 border-gray-100 rounded-[2rem] text-xl font-black flex items-center justify-center space-x-2 active:bg-gray-50 text-gray-600">
                      <Printer size={28}/><span>列印單據</span>
                  </button>
                  {detailedOrder.status === OrderStatus.SUBMITTED && (
                    <button onClick={() => { updateOrderStatus(detailedOrder.id, OrderStatus.ORDERING); updateTableStatus(detailedOrder.tableId, TableStatus.ORDERING); setDetailedOrder(null); }} className="w-full py-6 bg-[#34C759] text-white rounded-[2rem] text-xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2">
                        <CheckCircle2 size={28}/><span>接受點單</span>
                    </button>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MerchantApp;
import { Dish, Table, TableStatus, SystemConfig } from './types';

// 預設選項模組 - 減少重複代碼，保持一致性
const OPT_TEMP = ['熱', '冰', '去冰'];
const OPT_SUGAR = ['正常糖', '半糖', '微糖', '無糖'];
const OPT_COFFEE_STD = ['熱', '冰'];

export const INITIAL_DISHES: Dish[] = [
  // 莊園烘焙咖啡 Grange Roasted Coffee (通常單品強調冷熱)
  { id: 'c1', name: 'COE評鑑咖啡', category: '莊園烘焙咖啡', price: 220, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c2', name: '雲端咖啡', category: '莊園烘焙咖啡', price: 190, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c3', name: '皇室溫泉咖啡', category: '莊園烘焙咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c4', name: '老虎山咖啡', category: '莊園烘焙咖啡', price: 150, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c5', name: '安提哥火山咖啡', category: '莊園烘焙咖啡', price: 140, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c6', name: '老山姆咖啡', category: '莊園烘焙咖啡', price: 140, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c7', name: '馬雅古典咖啡', category: '莊園烘焙咖啡', price: 130, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'c8', name: '莊園冰咖啡', category: '莊園烘焙咖啡', price: 130, isAvailable: true, options: ['正常冰', '少冰', '去冰'], allowCustomNotes: true },

  // 拿鐵與咖啡系列 (加入完整的口味與溫度選項)
  { id: 'l1', name: '卡布奇諾', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { 
    id: 'l2', 
    name: '風味拿鐵咖啡', 
    category: '拿鐵與咖啡', 
    price: 160, 
    isAvailable: true,
    options: ['原味', '焦糖', '榛果', '香草', '玫瑰', ...OPT_COFFEE_STD],
    allowCustomNotes: true
  },
  { id: 'l3', name: '摩卡奇諾', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'l4', name: '焦糖瑪奇朵', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'l5', name: '維也納咖啡', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'l6', name: '拿鐵可可', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'l7', name: '玫瑰浪漫冰咖啡', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: ['正常冰', '少冰', '去冰'], allowCustomNotes: true },
  { id: 'l8', name: '香草柔情冰咖啡', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: ['正常冰', '少冰', '去冰'], allowCustomNotes: true },
  { id: 'l9', name: '抹茶咖啡', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: OPT_COFFEE_STD, allowCustomNotes: true },
  { id: 'l10', name: '特調冰咖啡', category: '拿鐵與咖啡', price: 160, isAvailable: true, options: ['正常冰', '少冰', '去冰'], allowCustomNotes: true },
  { id: 'l11', name: '濃縮咖啡', category: '拿鐵與咖啡', price: 140, isAvailable: true, options: ['熱'], allowCustomNotes: true },

  // 茶品與果汁 Tea & Juice (補齊甜度冰塊)
  { 
    id: 't1', 
    name: '特調奶茶', 
    category: '茶品與果汁', 
    price: 140, 
    isAvailable: true,
    options: ['去冰', '少冰', '正常冰', '溫', '熱', ...OPT_SUGAR],
    allowCustomNotes: true
  },
  { 
    id: 't2', 
    name: '金桔茶', 
    category: '茶品與果汁', 
    price: 140, 
    isAvailable: true,
    options: ['冰', '熱', ...OPT_SUGAR],
    allowCustomNotes: true
  },
  { 
    id: 't3', 
    name: '玫瑰花茶', 
    category: '茶品與果汁', 
    price: 140, 
    isAvailable: true,
    options: ['冰', '熱', ...OPT_SUGAR],
    allowCustomNotes: true
  },
  { 
    id: 't4', 
    name: '枸杞菊花茶', 
    category: '茶品與果汁', 
    price: 140, 
    isAvailable: true,
    options: ['冰', '熱', ...OPT_SUGAR],
    allowCustomNotes: true
  },
  { id: 't5', name: '薑片桂圓茶 (熱)', category: '茶品與果汁', price: 180, isAvailable: true, options: ['熱', ...OPT_SUGAR], allowCustomNotes: true },
  { id: 't6', name: '蔬果汁 (冰)', category: '茶品與果汁', price: 130, isAvailable: true, options: ['去冰', '少冰', '正常冰'], allowCustomNotes: true },
  { id: 't7', name: '蜂蜜檸檬汁 (冰)', category: '茶品與果汁', price: 130, isAvailable: true, options: ['去冰', '少冰', '正常冰', ...OPT_SUGAR], allowCustomNotes: true },
  { id: 't8', name: '蘋果汁 (冰)', category: '茶品與果汁', price: 130, isAvailable: true, options: ['去冰', '少冰', '正常冰'], allowCustomNotes: true },
  { id: 't9', name: '芒果汁 (冰)', category: '茶品與果汁', price: 150, isAvailable: true, options: ['去冰', '少冰', '正常冰'], allowCustomNotes: true },
  { id: 't10', name: '小青柑健康茶品 (熱)', category: '茶品與果汁', price: 150, isAvailable: true, options: ['熱'], allowCustomNotes: true },
];

export const INITIAL_TABLES: Table[] = [
  { id: 'tab1', name: '1號桌', capacity: 2, qrCode: 'DG-01', status: TableStatus.IDLE },
  { id: 'tab2', name: '2號桌', capacity: 2, qrCode: 'DG-02', status: TableStatus.IDLE },
  { id: 'tab3', name: '3號桌', capacity: 4, qrCode: 'DG-03', status: TableStatus.IDLE },
  { id: 'tab4', name: '4號桌', capacity: 4, qrCode: 'DG-04', status: TableStatus.IDLE },
  { id: 'tab5', name: '沙發區', capacity: 6, qrCode: 'DG-05', status: TableStatus.IDLE },
];

export const DEFAULT_CONFIG: SystemConfig = {
  restaurantName: 'Don Gus Coffee',
  gpsRadius: 100,
  centerCoords: { lat: 25.0330, lng: 121.5654 },
  serviceFeeRate: 0.1,
  isServiceFeeEnabled: false,
  isGpsEnabled: false // 預設關閉 GPS 驗證
};
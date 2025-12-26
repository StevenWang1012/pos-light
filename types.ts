
export enum TableStatus {
  IDLE = '空閒',
  ORDERING = '點餐中',
  CHECKED_IN = '已報到',
  PAID = '已結帳'
}

export enum OrderStatus {
  ORDERING = '點餐中',
  SUBMITTED = '已下單',
  CHECKED_IN = '已報到',
  PAID = '已付費',
  CANCELLED = '已取消'
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string; 
  options?: string[]; // 口味與規格 (如：榛果、玫瑰、大杯)
  allowCustomNotes?: boolean; // 是否允許客戶端輸入額外備註 (如：去冰、微糖)
}

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOption?: string; 
  customNote?: string; // 客戶端的額外備註
  isServed?: boolean; 
}

export interface Order {
  id: string;
  tableId: string;
  tableName: string;
  randomCode: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: number;
  totalAmount: number;
  serviceFee: number;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  qrCode: string;
  status: TableStatus;
}

export interface SystemConfig {
  restaurantName: string;
  gpsRadius: number; 
  centerCoords: { lat: number; lng: number };
  serviceFeeRate: number; 
  isServiceFeeEnabled: boolean;
  isGpsEnabled: boolean; // 新增：是否啟用 GPS 驗證
}

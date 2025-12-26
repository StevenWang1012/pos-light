
import { useState, useEffect } from 'react';
import { Table, Order, Dish, SystemConfig, OrderStatus } from './types';
import { INITIAL_TABLES, INITIAL_DISHES, DEFAULT_CONFIG } from './constants';

const STORAGE_KEYS = {
  TABLES: 'pos_tables',
  ORDERS: 'pos_orders',
  DISHES: 'pos_dishes',
  CONFIG: 'pos_config'
};

export const useStore = () => {
  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [dishes, setDishes] = useState<Dish[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISHES);
    return saved ? JSON.parse(saved) : INITIAL_DISHES;
  });

  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
  }, [dishes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const updateTableStatus = (tableId: string, status: any) => {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  };

  const toggleItemServed = (orderId: string, dishId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        items: order.items.map(item => 
          item.dishId === dishId ? { ...item, isServed: !item.isServed } : item
        )
      };
    }));
  };

  return {
    tables, setTables,
    orders, setOrders,
    dishes, setDishes,
    config, setConfig,
    addOrder,
    updateOrderStatus,
    updateTableStatus,
    toggleItemServed
  };
};

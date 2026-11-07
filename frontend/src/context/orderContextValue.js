import { createContext, useContext } from 'react';

export const OrderContext = createContext(null);

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

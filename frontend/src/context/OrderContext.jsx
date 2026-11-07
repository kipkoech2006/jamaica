import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrderContext } from './orderContextValue';
import { createOrder as sendOrder, fetchOrders, updateOrderStatus } from '../lib/orderApi';

/** @typedef {import('../types').CartItem} CartItem */
/** @typedef {import('../types').CreateOrderInput} CreateOrderInput */
/** @typedef {import('../types').Order} Order */
/** @typedef {import('../types').OrderStatus} OrderStatus */

export function OrderProvider({ children }) {
  const [cart, setCart] = useState(/** @type {CartItem[]} */ ([]));
  const [orders, setOrders] = useState(/** @type {Order[]} */ ([]));
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const refreshOrders = useCallback(async (signal) => {
    try {
      const currentOrders = await fetchOrders(signal);
      setOrders(currentOrders);
      setOrdersError('');
      setOrdersLoading(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setOrdersError('Could not connect to live orders. Retrying shortly.');
        setOrdersLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialRequestId = window.setTimeout(() => refreshOrders(controller.signal), 0);
    const intervalId = window.setInterval(() => refreshOrders(), 3000);

    return () => {
      controller.abort();
      window.clearTimeout(initialRequestId);
      window.clearInterval(intervalId);
    };
  }, [refreshOrders]);

  /** @param {import('../types').MenuItem} item */
  const addToCart = useCallback((item) => {
    setCart((currentCart) => {
      const existing = currentCart.find((cartItem) => cartItem.id === item.id);
      return existing
        ? currentCart.map((cartItem) => (
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ))
        : [...currentCart, { ...item, quantity: 1 }];
    });
  }, []);

  /** @param {number} itemId @param {number} difference */
  const changeQuantity = useCallback((itemId, difference) => {
    setCart((currentCart) => currentCart
      .map((item) => (
        item.id === itemId ? { ...item, quantity: item.quantity + difference } : item
      ))
      .filter((item) => item.quantity > 0));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /** @param {CreateOrderInput} order */
  const submitOrder = useCallback(async (order) => {
    const createdOrder = await sendOrder(order);
    setCart([]);
    await refreshOrders();
    return createdOrder;
  }, [refreshOrders]);

  /** @param {number} id @param {OrderStatus} status */
  const changeOrderStatus = useCallback(async (id, status) => {
    const updatedOrder = await updateOrderStatus(id, status);
    setOrders((currentOrders) => currentOrders.map((order) => (
      order.id === updatedOrder.id ? updatedOrder : order
    )));
    setOrdersError('');
  }, []);

  const value = useMemo(() => ({
    cart,
    orders,
    ordersLoading,
    ordersError,
    addToCart,
    changeQuantity,
    clearCart,
    submitOrder,
    changeOrderStatus,
  }), [
    cart,
    orders,
    ordersLoading,
    ordersError,
    addToCart,
    changeQuantity,
    clearCart,
    submitOrder,
    changeOrderStatus,
  ]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

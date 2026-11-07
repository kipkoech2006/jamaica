async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function fetchOrders(signal) {
  return request('/api/orders', { signal });
}

/** @param {import('../types').CreateOrderInput} order */
export function createOrder(order) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

/** @param {number} id @param {import('../types').OrderStatus} status */
export function updateOrderStatus(id, status) {
  return request(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

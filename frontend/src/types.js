/**
 * @typedef {Object} MenuItem
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {string} category
 * @property {string} [description]
 */

/**
 * @typedef {MenuItem & { quantity: number }} CartItem
 */

/**
 * @typedef {Object} CustomerInfo
 * @property {string} customerName
 * @property {string} phoneNumber
 * @property {'TABLE' | 'DELIVERY'} orderType
 * @property {string} tableNumber
 * @property {string} deliveryAddress
 * @property {string} notes
 * @property {number | null} [latitude]
 * @property {number | null} [longitude]
 * @property {string} waiterPhone
 */

/**
 * @typedef {Omit<CustomerInfo, 'waiterPhone'> & { items: Array<{ menuItemId: number, quantity: number }> }} CreateOrderInput
 */

/**
 * @typedef {'PENDING' | 'IN_PREPARATION' | 'DELIVERED' | 'CANCELLED'} OrderStatus
 */

/**
 * @typedef {Object} OrderItem
 * @property {number} menuItemId
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {string} customerName
 * @property {string} phoneNumber
 * @property {'TABLE' | 'DELIVERY'} orderType
 * @property {string | null} tableNumber
 * @property {string | null} deliveryAddress
 * @property {string | null} notes
 * @property {number | null} latitude
 * @property {number | null} longitude
 * @property {OrderStatus} status
 * @property {string} createdAt
 * @property {OrderItem[]} items
 */

export {};

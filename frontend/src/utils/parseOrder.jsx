/**
 * Utility parse order items - thống nhất 1 nơi
 * Thay thế code trùng lặp ở Admin.jsx, Menu.jsx
 */

/**
 * Parse items từ JSON string (trong orders table)
 * @param {string} itemsStr - Chuỗi JSON items
 * @returns {Array} Mảng items đã parse
 */
export function parseItems(itemsStr) {
  try {
    return JSON.parse(itemsStr);
  } catch {
    return [];
  }
}

/**
 * Tính tổng tiền đơn hàng
 * @param {string|Array} items - items string hoặc array
 * @returns {number} Tổng tiền
 */
export function calculateOrderTotal(items) {
  let parsedItems = items;
  if (typeof items === 'string') {
    parsedItems = parseItems(items);
  }
  if (!Array.isArray(parsedItems)) return 0;
  return parsedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
}

/**
 * Statuses và labels - thống nhất 1 nơi
 */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const ORDER_STATUS_LABELS = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền'
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

/**
 * Get status badge JSX
 * @param {string} status - Trạng thái đơn hàng
 * @returns {JSX.Element} Badge component
 */
export function getStatusBadge(status) {
  const colorClass = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending;
  const label = ORDER_STATUS_LABELS[status] || status;
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

export default parseItems;

/**
 * Utility định dạng tiền tệ - thống nhất 1 nơi
 * Phù hợp cho việc hiển thị giá dịch vụ Barber
 */

/**
 * Format giá tiền theo định dạng Việt Nam
 * @param {number} price - Giá tiền
 * @param {string} unit - Đơn vị tiền tệ (mặc định: đ)
 * @returns {string} Chuỗi đã format
 */
export function formatPrice(price, unit = 'đ') {
  if (price === undefined || price === null) {
    return `0${unit}`;
  }
  return Number(price).toLocaleString('vi-VN') + unit;
}

/**
 * Format giá tiền theo kiểu currency (VND)
 * @param {number} price - Giá tiền  
 * @returns {string} Chuỗi đã format với định dạng currency
 */
export function formatCurrency(price) {
  if (price === undefined || price === null) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(0);
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default formatPrice;

/**
 * Chú ý: File này chứa logic cũ của Food App.
 * Đối với hệ thống Barber, thông tin lịch hẹn được quản lý trực tiếp qua object Booking.
 */

export function parseItems(itemsStr) {
  try {
    return JSON.parse(itemsStr);
  } catch {
    return [];
  }
}

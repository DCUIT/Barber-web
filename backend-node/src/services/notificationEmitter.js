// Small helper for realtime notification emission.
// Keeps bookings routes simpler.
export function emitNotification(io, notification) {
  if (!io || !notification) return;
  io.emit('notification:new', notification);
}


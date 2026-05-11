# ADMIN DASHBOARD

## Mục tiêu
Quản lý toàn bộ hệ thống.

---

# Admin Auth
- [x] admin route protection (`requireRole(['admin'])`)

---

# Dashboard

## 1. Statistics
- [x] total bookings (`/bookings?` / `/bookings/stats`)
- [x] total users (`/auth/users`)
- [x] total revenue (`/bookings/stats` + frontend charts)
- [x] total barbers (`/barbers`)

---

# Services Management
- [x] services table (`Admin.jsx`)
- [x] create service (`POST /services`)
- [x] edit service (`PUT /services/:id`)
- [x] delete service (`DELETE /services/:id`)

---

# Barbers Management
- [x] barber table (`Admin.jsx`)
- [x] CRUD barber (`POST/PUT/DELETE /barbers`)

---

# Bookings Management
- [x] bookings table (`GET /bookings`)
- [x] filter status (Admin filterStatus)
- [x] update booking status (`PUT /bookings/:id/status`)

---

# Users Management
- [x] users table (`GET /auth/users`)
- [x] delete user (`DELETE /auth/users/:id`)
- [x] block user (`PUT /auth/users/:id/block`)
- [x] role update (`PUT /auth/users/:id/role`)

---

# Notifications (realtime)
- [x] Backend socket emit khi booking mới/cập nhật (`newBooking`, `bookingUpdated`)
- [x] Admin notification center (frontend `Admin.jsx`)

---

# Upload
- [x] Upload endpoint: `POST /upload` (Cloudinary)
- [x] Upload service image + barber avatar

---

# Done condition
- Admin quản lý được toàn bộ
- Realtime admin notification hoạt động


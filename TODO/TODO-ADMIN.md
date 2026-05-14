# ADMIN DASHBOARD

## Mục tiêu
Quản lý toàn bộ hệ thống.

---

## Admin dashboard tasks (merge từ root TODO.md)
- [ ] Fix build failure in `frontend/src/pages/Admin.jsx` (currently JSX tag mismatch from dashboard insertion)
- [ ] Restore original Admin.jsx structure (remove broken dashboard block)
- [ ] Re-implement dashboard UI (dark/gold) safely
- [ ] Add Quick Actions wiring:
  - [ ] Add Appointment -> switch to BOOKINGS and open modal form
  - [ ] Check-In Client -> PUT /bookings/:id/status Accepted
  - [ ] Complete Service -> PUT /bookings/:id/status Completed
  - [ ] Cancel Booking -> PUT /bookings/:id/status Cancelled
- [ ] Ensure dashboard Upcoming table/booking status updates reflect real data
- [ ] Run `cd frontend && npm run lint` and `cd frontend && npm run build`

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


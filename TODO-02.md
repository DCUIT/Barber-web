# TODO-02 - Execution breakdown

## 1) Migrate end-to-end (Node.js Express + schema mới)
- [ ] Tạo backend Node.js project trong `backend-node/`
- [ ] Implement JWT auth (roles: user/barber/admin)
- [ ] Implement CRUD: users (admin), services, barbers
- [ ] Implement bookings: create booking + list bookings + status update (admin/barber)
- [ ] Implement booking calendar/time slots endpoint

## 2) Database
- [ ] Chọn MongoDB hay MySQL (tạm dùng SQLite nếu bạn muốn nhanh demo, nhưng mục tiêu là Mongo/MySQL)
- [ ] Seed admin + sample services/barbers

## 3) Frontend migration
- [ ] Branding: replace Food/Cart/Order texts
- [ ] Replace pages: Home -> services/barbers/feedback, Booking page
- [x] Remove Cart/Payment flow; create booking calendar + confirm
- [ ] Update Admin page to manage services/barbers/bookings/users
- [ ] Create Barber page (calendar + confirm/status)

## 4) Booking Calendar
- [ ] Time slot generation based on barber workingHours + duration
- [ ] Block booked slots
- [ ] Handle overlap validation server-side

## 5) Java microservice (optional after core)
- [ ] Create Spring Boot module for notification/analytics/recommendation
- [ ] Node.js call Java service

## 6) Feature bắt buộc + mạnh
- [ ] Responsive UI
- [ ] Upload images (services/barbers)
- [ ] Realtime booking (polling/websocket)
- [ ] Deploy (instructions)



# TODO - Barber Booking Web migration

## Step 1: Repo khảo sát & mapping
- [x] Đọc cấu trúc project hiện tại (Auth, Services, Barbers, Bookings)
- [x] Chuyển đổi toàn bộ UI sang phong cách The Cutting Edge (Gold & Black)

## Step 2: Thống nhất kiến trúc mục tiêu
- [x] Thống nhất concept: Barber Booking Web
- [ ] Quy ước endpoints Node.js + DB schema tương lai
- [x] Chọn hướng Java: Spring Boot microservice (notification/analytics/recommendation)

## Step 3: Tách backend hiện tại
- [ ] Xây Node.js Express API mới (giữ frontend chạy được)
- [ ] Di chuyển auth (JWT), CRUD services/barbers, booking calendar
- [ ] Thiết kế DB (MongoDB hoặc MySQL) và migrate schema

## Step 4: Update frontend
- [ ] React pages: Home -> hiển barber nổi bật + services hot + feedback
- [ ] Tạo Booking page (Select Service -> Barber -> Date -> Time -> Confirm)
- [ ] Xóa Cart flow, thay Appointment/Booking calendar + time slot
- [ ] Admin dashboard: services/barbers/bookings/users
- [ ] Barber dashboard: xem lịch + xác nhận/đổi trạng thái

## Step 5: Branding
- [ ] Đổi logo/banner/navbar/footer/màu (đen/đỏ/trắng/gold)

## Step 6: Feature bắt buộc cho intern
- [ ] Login/Register + role user/barber/admin
- [ ] CRUD + responsive
- [ ] Upload ảnh (services/barbers)
- [ ] Realtime booking (websocket/polling)
- [ ] Deploy

## Step 7: Feature mạnh
- [ ] Email confirmation
- [ ] Payment sandbox
- [ ] Chat realtime
- [ ] QR check-in
- [ ] AI recommendation

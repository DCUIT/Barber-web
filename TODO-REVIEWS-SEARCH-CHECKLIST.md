# Reviews + Search (C) - checklist implementation

## Backend (Mongo)
- [x] Tạo `backend-node/src/models/Review.js`

- [x] Tạo `backend-node/src/routes/reviews.routes.js`

- [x] Mount router vào `backend-node/src/server.js`

- [x] Implement `POST /reviews`
  - [x] requireAuth
  - [x] validate booking exists and `booking.status === 'Completed'`
- [x] unique: 1 review / 1 booking (the bookingId)
- [x] validate rating range 1..5
- [x] update `Barber.rating` = avg(rating) after insert
- [x] Implement `GET /reviews/barbers/:barberId`
  - [x] populate username + booking reference

## Frontend
- [ ] Tạo UI search ngay trong `frontend/src/pages/Home.jsx`
  - [ ] ô input keyword
  - [ ] lọc service và barber theo keyword
  - [ ] hiển thị kết quả + nút xem reviews
- [ ] Tạo component/section Reviews trên trang Home
  - [ ] hiển thị danh sách reviews theo barber
  - [ ] hiển thị avg rating
  - [ ] form tạo review (star + comment)
- [ ] Thêm route API gọi với token

## Testing
- [ ] Login -> đặt lịch -> cập nhật booking sang Completed (admin/barber)
- [ ] Review sau Completed thành công
- [ ] Không cho review trước Completed
- [ ] Review 2 lần cho cùng booking bị chặn


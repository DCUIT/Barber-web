# TODO - Reviews/Rating đơn giản (để code dễ đọc & chạy ổn)

## Mục tiêu
- Hiển thị **rating sao** của barber (dựa trên `barber.rating`)
- Tránh làm hệ thống review phức tạp (user viết review, lưu list, v.v.) nếu không có backend endpoint.

## Steps
1. Update UI trên trang hiển thị danh sách barber (ưu tiên trang `Home.jsx`) để render:
   - `b.rating` dạng sao (VD: 4.6 -> ★★★★☆)
   - giá trị rating số
2. (Nếu có trang khác hiển thị barber, cập nhật tương tự)
3. Build frontend để đảm bảo không lỗi.

## Ghi chú
- Backend hiện có `rating` trong `backend-node/src/models/Barber.js`.
- Endpoint CRUD barber trong `backend-node/src/routes/barbers.routes.js` đã nhận `rating`.
- Chưa thấy hệ thống endpoint review riêng; vì vậy làm rating đơn giản.


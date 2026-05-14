# TODO - Tạo account Alex và Sam

## Thông tin đã hiểu
- Backend có endpoint đăng ký: `POST /auth/register` (trong `backend-node/src/routes/auth.routes.js`).
- Backend có seed dữ liệu barbers `Alex` và `Sam` (trong `backend-node/src/routes/seed.js`).
- Cần tạo **user account** (tài khoản đăng nhập) cho `Alex` và `Sam` để đăng nhập được trên frontend.

## Tình trạng triển khai (đã làm)
- Đã cập nhật `backend-node/src/routes/seed.js` để seed thêm user account cho:
  - `alex` / role `user`
  - `sam` / role `user`
- Password mặc định cho Alex/Sam (và cả admin nếu không set env) hiện là: **`123456`**.



## Cách đăng nhập
- Username: `alex`
- Password: `123456`
- Username: `sam`
- Password: `123456`



## Kế hoạch triển khai (dự kiến)
1. Xác định cơ chế DB đang dùng (Mongo hay SQLite).
2. Thêm seed cho user `Alex` và `Sam`:
   - Tạo `User` với `username`, `passwordHash` từ `bcrypt`.
   - Gán role mặc định `user` (hoặc `barber` tùy yêu cầu).
   - Seed không trùng (kiểm tra đã tồn tại theo `username`).
3. Nếu dùng SQLite MVP: cần seed vào bảng `users` thông qua logic `backend-node/src/services/sqlite.js`/đường seed SQLite.
4. Chạy server seed để kiểm tra đăng nhập:
   - `Alex`/password
   - `Sam`/password
5. (Tuỳ chọn) Cập nhật README/TODO-AUTH để ghi rõ username/password mặc định.


# Plan: Admin Manage Bookings

## Status: 🔄 MIGRATING

### Tasks:
1. **Backend** - API Cập nhật trạng thái lịch hẹn:
   - `PUT /bookings/<id>` - Cập nhật status (Pending, Accepted, Completed, Cancelled)
2. **Frontend** - Quản lý lịch hẹn:
   - Hiển thị danh sách khách hàng đặt lịch.
   - Nút xác nhận hoặc hủy lịch ngay trên dashboard.

---

## 📋 Cách Test A - Z

### Bước 1: Khởi động server
```bash
# Chạy Backend Node.js và Frontend như hướng dẫn trước đó
```

### Bước 2: Đăng nhập Admin
1. Mở trình duyệt: http://localhost:5173
2. Click **Đăng nhập**
3. Nhập:
   - Username: `admin`
   - Password: `123`

### Bước 3: Đặt hàng (tạo đơn mới)
1. Thêm món vào giỏ hàng
2. Click **Thanh toán**
3. Hoàn thành đặt hàng
4. Đơn hàng sẽ có status = "pending"

### Bước 4: Test đổi trạng thái
1. Click **Admin** trong menu
2. Chuyển sang tab **Đơn hàng**
3. Tại đơn hàng bạn vừa tạo, dùng **dropdown** để đổi:
   - → **"Đã thanh toán"** (paid) - Simulate payment success
   - → **"Hoàn tiền"** (refunded) - Simulate refund

---

## 🎯 Các trạng thái đơn hàng:
| Status | Label UI | Màu badge |
|--------|---------|----------|
| pending | Chờ xử lý | 🟡 Vàng |
| paid | Đã thanh toán | 🟢 Xanh |
| cancelled | Hủy | 🔴 Đỏ |
| refunded | Hoàn tiền | ⚪ Xám |

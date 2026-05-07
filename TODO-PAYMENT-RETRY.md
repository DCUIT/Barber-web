# Plan: Admin Test Payment Retry

## Status: ✅ DONE

### Completed:

1. **Backend (app.py)** - Added API:
   - `PUT /orders/<id>` - Update order status (admin only)
   - Accepts: { status: "pending" | "paid" | "cancelled" | "refunded" }
   - Token valid for 24 hours

2. **Frontend (Admin.jsx)** - Added UI:
   - Dropdown to change order status
   - Visual status badges (color-coded)
   - Show status for each order

---

## 📋 Cách Test A - Z

### Bước 1: Khởi động server
```bash
# Terminal 1 - Backend
cd backend && python app.py

# Terminal 2 - Frontend  
cd frontend && npm run dev
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

# BarberHistory UI update

## Plan
1. Hiểu cấu trúc `frontend/src/pages/BarberHistory.jsx` và dữ liệu booking hiện có.
2. Thay UI BarberHistory từ list thuần sang layout dashboard:
   - trái: calendar theo **tháng** (grid)
   - phải: list appointment cards
3. Parse/format `bookingDate` (và `bookingTime`) để nhóm booking theo ngày.
4. Thêm tương tác chọn ngày trên calendar (click ô có booking => filter list bên phải).
5. Styling vintage/wood & gold accents nhưng không copy nguyên CSS từ mẫu HTML.
6. Đảm bảo realtime (`bookingUpdated`) refresh đúng và cập nhật cả calendar + list theo ngày đang chọn.
7. Kiểm tra edge cases: không có booking, bookingDate format lạ.

## Status
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
- [ ] Step 4
- [ ] Step 5
- [ ] Step 6
- [ ] Step 7


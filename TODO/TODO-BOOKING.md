# BOOKINGS

## Mục tiêu
Làm booking system hoàn chỉnh (service + barber + date + time slot + status + history + realtime).

---

## Booking page UI redesign (steps layout)
- [ ] Làm trang `frontend/src/pages/Booking.jsx` có bố cục “booking steps 4 cột” như mẫu:
  1) Select services
  2) Select barber
  3) Select date & time
  4) Your details + booking summary + confirm button
- [ ] Cập nhật CSS (màu gỗ/vintage: gold, wood background) bằng cách thêm/mở rộng `frontend/src/bookingStyle.css`
- [ ] Giữ nguyên logic hiện có trong Booking.jsx:
  - selectedServiceId, selectedBarberId, bookingDate, selectedTime, note, handleConfirm
  - availableSlots, loadingSlots, submitting
  - showSuccessModal logic
- [ ] Responsive: desktop 4 cột, mobile 1 cột (hoặc 2 cột)

---


# Backend

## 1. Booking model
- [x] userId
- [x] barberId
- [x] serviceId
- [x] bookingDate
- [x] bookingTime
- [x] status
- [x] note

## 2. Booking APIs
- [x] POST /bookings (tạo booking)
- [x] GET /bookings (user/barber/admin role-based)
- [x] PUT /bookings/:id/status (Pending/Accepted/Completed/Cancelled)

## 3. Booking logic
- [x] generate 30 phút slots (`GET /bookings/calendar` dựa trên workingHours)
- [x] block booked slots (conflict check)
- [x] overlap validation server-side (409 conflict)

## 4. Booking status
- [x] Pending
- [x] Accepted
- [x] Completed
- [x] Cancelled

---

# Frontend

## 1. Booking UI
- [x] select service
- [x] select barber
- [x] select date
- [x] select time slot

## 2. Note field
- [x] textarea note

## 3. Booking modal/popup
- [x] success popup (`frontend/src/pages/Booking.jsx`)

---

# Booking History

## 1. User bookings
- [x] list bookings
- [x] show status

---

# Realtime

## 1. Socket.io
- [x] socket emit: newBooking
- [x] socket emit: bookingUpdated

## 2. Frontend refresh
- [x] Admin/Barber/User refresh khi có socket events

---

# Done condition
- Không đặt trùng lịch
- Booking hoạt động đúng
- Realtime booking refresh hoạt động


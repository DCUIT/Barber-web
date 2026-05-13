# TODO - Booking page UI redesign (dạng như mẫu)

## Mục tiêu
- Làm trang `frontend/src/pages/Booking.jsx` có bố cục kiểu “booking steps 4 cột” tương tự mẫu HTML bạn gửi.
- Không copy nguyên khung HTML; giữ logic booking thật.

## Việc cần làm
1. Tách layout trong `Booking.jsx`:
   - Section tiêu đề (Secure your next cut)
   - Grid booking steps (4 bước):
     1) Select services (đang có form chọn dịch vụ)
     2) Select barber (đang có form chọn thợ)
     3) Select date & time (đang có calendar và slots)
     4) Your details + booking summary + confirm button

2. Cập nhật CSS (thêm file mới hoặc mở rộng `frontend/src/bookingStyle.css`) để tạo theme màu gỗ/vintage (gold, wood background).

3. Tái dùng state/handler hiện có trong Booking.jsx:
   - selectedServiceId, selectedBarberId, bookingDate, selectedTime, note, handleConfirm
   - availableSlots, loadingSlots, submitting
   - showSuccessModal logic giữ nguyên

4. Đảm bảo responsive: desktop 4 cột, mobile 1 cột (hoặc 2 cột).

## Check
- `npm run build` không lỗi
- Booking confirm vẫn hoạt động đúng


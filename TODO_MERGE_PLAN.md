# Plan: Gộp các TODO giống nhau, còn lại cho vào folder TODO/

## Information Gathered
- `TODO.md` hiện chỉ chứa các nhiệm vụ cho **Admin dashboard/Quick actions/build fix**.
- Các file ở root: 
  - `TODO_HOME_UI.md` mô tả **Home UI redesign**.
  - `TODO_BOOKING_UI.md` mô tả **Booking page UI redesign**.
- Folder `TODO/` chứa các file đã được phân theo chủ đề:
  - `TODO-AUTH.md`, `TODO-BOOKING.md`, `TODO-FRONTEND.md`, `TODO-OPTIONAL.md`, `TODO-ADMIN.md`, `TODO-DEPLOY.md`.
- Tiêu chí “giống nhau” được chốt: **giống theo CHỦ ĐỀ/FEATURE**.

## Plan
1. Xác định mapping theo chủ đề:
   - `TODO_HOME_UI.md` -> gộp vào `TODO/TODO-FRONTEND.md` (UI/UX).
   - `TODO_BOOKING_UI.md` -> gộp vào `TODO/TODO-BOOKING.md` hoặc `TODO/TODO-FRONTEND.md` (ưu tiên `TODO-BOOKING.md` vì là Booking).
   - `TODO.md` (admin dashboard quick actions/build fix) -> gộp vào `TODO/TODO-ADMIN.md` hoặc `TODO/TODO-DEPLOY.md` (ưu tiên `TODO-ADMIN.md`).
2. Gộp nội dung bằng cách:
   - Thêm các mục checkbox tương ứng dưới section phù hợp trong file đích.
   - Giữ nguyên checklist và command kiểm tra build nếu có.
3. Với mọi nội dung “không giống chủ đề” (không match Admin/Auth/Booking/Frontend/Deploy/Optional) -> di chuyển vào folder `TODO/` file riêng.
4. Sau khi gộp xong:
   - Xoá hoặc bỏ trống các file TODO root không còn dùng (khuyến nghị: chuyển vào `TODO/` nếu còn cần tham chiếu lịch sử).
5. Chạy kiểm tra:
   - `cd frontend && npm run lint`
   - `cd frontend && npm run build`

## Dependent Files to be edited
- `TODO/TODO-FRONTEND.md`
- `TODO/TODO-BOOKING.md`
- `TODO/TODO-ADMIN.md`
- (tuỳ chọn) `TODO.md`, `TODO_HOME_UI.md`, `TODO_BOOKING_UI.md`

## Followup steps
- Run lint/build để đảm bảo không ảnh hưởng code.

<ask_followup_question>
Xác nhận mình triển khai theo mapping ưu tiên:
- Home UI -> TODO-FRONTEND
- Booking UI -> TODO-BOOKING
- TODO.md (admin/build fix/quick actions) -> TODO-ADMIN
Sau đó sẽ xoá/đưa nội dung root TODO vào TODO/ để tránh trùng lặp.
</ask_followup_question>


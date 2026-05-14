# FRONTEND (UI/State/UX/Responsive)

## Mục tiêu
Frontend hoạt động responsive + có UI cho booking/admin/barber/user.

---

## Home UI redesign (The Cutting Edge Barbershop)
- [ ] Replace `frontend/src/pages/Home.jsx` layout to match requested style:
  - [ ] Custom header section (do not rely on existing Navbar component)
  - [ ] Hero section with background image + overlay
  - [ ] Booking card (name/phone/date/service) using existing quickBooking state
  - [ ] Service highlights cards
  - [ ] Why-us section cards
  - [ ] Gallery image grid
  - [ ] Footer section (custom, but keep brand text)
- [ ] Add/extend CSS in `frontend/src/style.css` (new class names for Home page only)
- [ ] Ensure no duplicated footer string appears multiple times
- [ ] Run `npm run build` in `frontend` to confirm build passes

---



# Routing & access
- [x] React Router routes (`frontend/src/App.jsx`)
- [x] ProtectedRoute with role guard (`frontend/src/components/ProtectedRoute.jsx`)

---

# UI components
- [x] Navbar (notification bell có socket)
- [x] Sidebar (admin)
- [x] Cards
- [x] Modal/ConfirmDialog
- [x] Table
- [x] Calendar
- [x] Toast notification

---

# State management
- [x] AuthContext (`frontend/src/context/AuthContext.jsx`)
- [x] SocketContext (`frontend/src/context/SocketContext.jsx`)

---

# UX
- [x] Loading spinner
- [x] Skeleton/placeholder (nếu có component)

---

# Responsive
- [x] Mobile
- [x] Tablet
- [x] Desktop

---

# Form validation
- [x] MVP validation server-side
- [ ] Optional: add react-hook-form/formik (nếu bạn muốn chuẩn hoá)

---

# Done condition
- Không vỡ layout
- Routing & protected pages hoạt động


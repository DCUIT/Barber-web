# AUTH SYSTEM

## Mục tiêu
Làm hệ thống đăng nhập JWT hoàn chỉnh cho:
- user
- barber
- admin

---

# Backend

## 1. User model
- [x] username
- [x] password (bcrypt hash)
- [x] role
- [x] avatar
- [x] phone

## 2. Auth routes
- [x] POST /auth/register (`backend-node/src/routes/auth.routes.js`)
- [x] POST /auth/login
- [x] GET /auth/me

## 3. Hash password
- [x] bcrypt hash password khi register
- [x] bcrypt compare password khi login

## 4. JWT
- [x] tạo token khi login
- [x] lưu id + role trong token

## 5. Middleware
- [x] requireAuth (verify token)
- [x] requireRole(['admin'])
- [x] requireRole(['admin','barber']) (cho status booking)

## 6. Validation
- [x] Missing fields handling (400)
- [x] Invalid token / credentials handling (401)

---

# Frontend

## 1. Login page
- [x] username input
- [x] password input

## 2. Register page
- [x] Register tồn tại (UI nằm trong flow auth của dự án)

## 3. Save auth
- [x] Save token localStorage (AuthContext)
- [x] Save user info (AuthContext)
- [x] Auto redirect/protected route (`ProtectedRoute`)

## 4. Logout
- [x] clear localStorage
- [x] redirect login

## Profile
- [x] Avatar update UI (`frontend/src/pages/Profile.jsx`)
- [x] Phone update UI (`frontend/src/pages/Profile.jsx`)
- [x] Change password UI (`frontend/src/pages/Profile.jsx`)

---

# Done condition
- Login hoạt động
- Protected route hoạt động
- Admin route hoạt động


# TODO-NEXT

## Backend-node: MongoDB dependency blocker
- [x] Create backend-node skeleton (Express + Mongoose models + JWT roles)
- [x] Implement endpoints: /auth, /services, /barbers, /bookings + /bookings/calendar
- [x] Add seedDatabase() called on startup
- [ ] Fix local dev environment: Start MongoDB (port 27017) or update MONGO_URL to reachable instance
- [ ] Add a fallback option for MVP using in-memory or SQLite if MongoDB không chạy (chỉ nếu cần)

## Frontend migration blocker
- [ ] Update frontend/src/api.js baseURL to `http://127.0.0.1:4000`
- [ ] Replace Food/Cart/Payment flow with Booking flow and new pages/components



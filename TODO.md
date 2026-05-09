# TODO (Barber fullstack) — checklist completion

## Authentication & JWT
- [x] Register exists (`POST /auth/register`, frontend `Login.jsx`)
- [x] Login exists (`POST /auth/login`)
- [x] Logout exists (`Navbar.jsx` clears localStorage)
- [x] JWT auth middleware exists (`middleware/auth.js`)
- [ ] Verify `/auth/me`, `/auth/change-password` fully work in both Mongo and SQLite drivers

## Profile
- [x] Avatar + Phone update UI (`Profile.jsx`)
- [x] Change password UI (`Profile.jsx`)
- [ ] Name editing: currently only shows username (confirm requirement)

## Services
- [x] Services list used in booking flow (`Booking.jsx` calls `/services`)
- [x] Price + duration + image available via service model and admin management
- [ ] Dedicated Services UI/page (if required by checklist)

## Barber
- [x] Barber list used in booking flow (`Booking.jsx` calls `/barbers`)
- [x] Experience + specialty + rating shown (Booking/Admin/Home)
- [x] Working hours used for availability (`/bookings/calendar`)
- [ ] Display working hours explicitly in UI (if required)

## Booking
- [x] Choose service
- [x] Choose barber
- [x] Choose date
- [x] Choose time slot (30-min slots)
- [x] Note field
- [x] Booking success popup/modal (`Booking.jsx`)
- [ ] Confirm role-based status transitions allowed as required (Pending/Accepted/Completed/Cancelled)

## Booking History
- [x] List of bookings with status (`BarberHistory.jsx`)
- [x] Socket realtime refresh for bookings (`bookingUpdated`)
- [ ] Ensure user sees only their own bookings (backend appears to do this)

## Notifications
- [x] Toast notification
- [x] Realtime notifications via socket.io
- [x] Notification bell UI (`Navbar.jsx`)
- [ ] Targeted notifications (server emits to all; client filters)

## Search
- [x] Search service/barber by keyword on Home (`Home.jsx`)
- [ ] Add/ensure search on dedicated screens if required

## Reviews
- [x] Reviews list + average rating in modal (`BarberReviewsModal.jsx`)
- [x] Backend supports create review only if booking.status === Completed (`reviews.routes.js`)
- [ ] Frontend review creation UX: currently requires manual `bookingId` input; ideally auto-select from completed bookings

## Responsive
- [x] Mobile nav exists (`Navbar.jsx` uses md:hidden)
- [x] Layout uses Tailwind responsive classes
- [ ] Manually verify tablet/desktop layouts for booking + modal + history

## Testing
- [ ] Run backend + frontend and smoke test all flows end-to-end


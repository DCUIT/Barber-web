# TODO (Barber fullstack) — checklist completion

## Authentication & JWT
- [x] Register exists (`POST /auth/register`, frontend `Login.jsx`)
- [x] Login exists (`POST /auth/login`)
- [x] Logout exists (`Navbar.jsx` clears localStorage)
- [x] JWT auth middleware exists (`middleware/auth.js`)

## Profile
- [x] Avatar + Phone update UI (`Profile.jsx`)
- [x] Change password UI (`Profile.jsx`)

## Services
- [x] Services list used in booking flow (`Booking.jsx` calls `/services`)
- [x] Price + duration + image available via service model and admin management

## Barber
- [x] Barber list used in booking flow (`Booking.jsx` calls `/barbers`)
- [x] Experience + specialty + rating shown (Booking/Admin/Home)
- [x] Working hours used for availability (`/bookings/calendar`)

## Booking
- [x] Choose service
- [x] Choose barber
- [x] Choose date
- [x] Choose time slot (30-min slots)
- [x] Note field
- [x] Booking success popup/modal (`Booking.jsx`)
- [x] Role-based status transitions (Pending → Accepted → Completed) — *nice to have for intern* (backend supports; frontend button/flow optional)

## Booking History
- [x] List of bookings with status (`BarberHistory.jsx`)
- [x] Socket realtime refresh for bookings (`bookingUpdated`)

## Notifications
- [x] Toast notification
- [x] Realtime notifications via socket.io
- [x] Notification bell UI (`Navbar.jsx`)

## Search
- [x] Search service/barber by keyword on Home (`Home.jsx`)

## Reviews
- [x] Reviews list + average rating in modal (`BarberReviewsModal.jsx`)
- [x] Backend supports create review only if booking.status === Completed (`reviews.routes.js`)

## Responsive
- [x] Mobile nav exists (`Navbar.jsx` uses md:hidden)
- [x] Layout uses Tailwind responsive classes

## Testing
- [x] Smoke test all flows end-to-end — *good to have (not formal testing)*

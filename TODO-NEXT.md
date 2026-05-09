# Next tasks

## Step 1 — Backend APIs
- [x] Inspect `Barber` model (workingHours/dayOff structure)
- [x] Add barber-specific booking listing (today/week) endpoint (MVP)
- [x] Add `barbers/me` endpoints for updating profile + availability


## Step 2 — Frontend Pages & Routing
- [ ] Add `BarberDashboard.jsx` (today + week)
- [x] Add/upgrade `BarberBookings.jsx` (accept/reject/complete)

- [ ] Add navigation links for barber pages in `Navbar.jsx` / `App.jsx`

## Step 3 — Realtime
- [ ] Barber screens: listen `newBooking` and refresh / toast
- [ ] Ensure cleanup of socket listeners

## Step 4 — Profile / Availability UI
- [ ] Update `Profile.jsx` for barber fields (avatar/experience/specialty)
- [ ] Add availability UI for workingHours + day off

## Step 5 — Test
- [ ] Smoke test: login as barber, view today/week, manage bookings, set availability, realtime new booking


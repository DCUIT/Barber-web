# TODO

- [ ] Fix build failure in `frontend/src/pages/Admin.jsx` (currently JSX tag mismatch from dashboard insertion)
- [ ] Restore original Admin.jsx structure (remove broken dashboard block)
- [ ] Re-implement dashboard UI (dark/gold) safely
- [ ] Add Quick Actions wiring:
  - [ ] Add Appointment -> switch to BOOKINGS and open modal form
  - [ ] Check-In Client -> PUT /bookings/:id/status Accepted
  - [ ] Complete Service -> PUT /bookings/:id/status Completed
  - [ ] Cancel Booking -> PUT /bookings/:id/status Cancelled
- [ ] Ensure dashboard Upcoming table/booking status updates reflect real data
- [ ] Run `cd frontend && npm run lint` and `cd frontend && npm run build`

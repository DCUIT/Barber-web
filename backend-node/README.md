# Barber Booking Web - Node.js API (backend-node)

## Run (local)
1. Start MongoDB (default: `mongodb://127.0.0.1:27017`)
2. Configure env (optional):
   - `MONGO_URL`
   - `JWT_SECRET`
3. Install + start
   - `npm install`
   - `npm run dev`

API base:
- `http://127.0.0.1:4000`

## Endpoints
### Auth
- `POST /auth/register` body: `{ username, password, role? }`
- `POST /auth/login` body: `{ username, password }`

### Services (admin)
- `GET /services`
- `POST /services`
- `PUT /services/:id`
- `DELETE /services/:id`

### Barbers (admin)
- `GET /barbers`
- `POST /barbers`
- `PUT /barbers/:id`
- `DELETE /barbers/:id`

### Bookings
- `GET /bookings/calendar?barberId=...&date=YYYY-MM-DD`
- `GET /bookings` (admin: all, user: self)
- `POST /bookings` body: `{ barberId, serviceId, bookingDate, bookingTime, note? }`
- `PUT /bookings/:id/status` body: `{ status }`


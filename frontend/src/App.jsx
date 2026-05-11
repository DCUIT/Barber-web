import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Success from "./pages/Success";

import BarberHistory from "./pages/BarberHistory";
import Profile from "./pages/Profile";
import BarberDashboard from "./pages/BarberDashboard";
import BarberBookings from "./pages/BarberBookings";

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="min-h-screen flex flex-col bg-[#f4f4f4] text-[#333]">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/my-bookings" element={<ProtectedRoute><BarberHistory /></ProtectedRoute>} />
            <Route path="/barber-dashboard" element={<ProtectedRoute allowedRoles={["barber"]}><BarberDashboard /></ProtectedRoute>} />
            <Route path="/barber/bookings" element={<ProtectedRoute allowedRoles={["barber"]}><BarberBookings /></ProtectedRoute>} />
            <Route path="/success" element={<Success />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Admin /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
}

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Success from "./pages/Success";

import BookingPro from "./pages/BookingPro";
import BarberHistory from "./pages/BarberHistory";

export default function App() {
  return (

    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-orders" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<BookingPro />} />

          <Route path="/my-bookings" element={<BarberHistory />} />
          <Route path="/success" element={<Success />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}


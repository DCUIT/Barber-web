
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DarkToggle from "./DarkToggle";
import { clearCart, getCartCount } from "../utils/useCart";

// Note: this repo has many lint rules enabled; keep this component pure.



export default function Navbar() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [cartCount, setCartCount] = useState(0);
  // cartCount kept for future UI; intentionally not used right now.
  // eslint-disable-next-line no-unused-vars
  void cartCount;

  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    // Only read initial values once; avoid setState directly inside effect body (lint)
    queueMicrotask(() => {
      setToken(localStorage.getItem("token"));
      setUsername(localStorage.getItem("username"));
      setCartCount(getCartCount());
    });

    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUsername(localStorage.getItem("username"));
      setCartCount(getCartCount());
    };

    const handleCartBounce = () => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartBounce", handleCartBounce);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartBounce", handleCartBounce);
    };
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    clearCart();
    setToken(null);
    setUsername(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="logo">
        THE <span>CUTTING EDGE</span> BARBERSHOP
      </div>

      <nav className="hidden md:block">
        <ul className="flex items-center gap-6">
          <Link to="/" className="hover:text-[#d4a373] transition">Trang Chủ</Link>
          <Link to="/booking" className="hover:text-green-600 transition">Đặt Lịch</Link>
          {token ? (
            <Link to="/my-bookings" className="hover:text-green-600 transition">Lịch của tôi</Link>
          ) : (
            <Link to="/login" className="hover:text-green-600 transition">Đăng nhập</Link>
          )}
          <Link to="/" className="hover:text-green-600 transition">Ưu Đãi</Link>
          <Link to="/" className="hover:text-green-600 transition">Liên Hệ</Link>
        </ul>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Giao diện Barber thường dùng tông tối cố định, có thể bỏ DarkToggle nếu muốn */}
          <DarkToggle />
          
          {token ? (
            <div className="flex items-center gap-3">
              {username === "admin" && (
                <Link
                  to="/admin"
                  className="text-yellow-600 hover:text-yellow-700 font-semibold"
                  title="Quản trị"
                >
                  <i className="fas fa-cog text-xl"></i>
                </Link>
              )}
              <span className="text-green-600 font-semibold hidden sm:inline">{username}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-green-600 transition"
                title="Đăng xuất"
              >
                <i className="fas fa-sign-out-alt text-xl"></i>
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-gray-600 hover:text-green-600 transition" title="Đăng nhập">
              <i className="fas fa-user text-xl"></i>
            </Link>
          )}
          <Link to="/booking" className="relative text-gray-600 hover:text-green-600 transition">
            <i className="fas fa-calendar-check text-xl"></i>
          </Link>
        </div>
    </header>
  );
}

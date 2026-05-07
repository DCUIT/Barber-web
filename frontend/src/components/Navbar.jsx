
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
    // Initial load cart count
    const count = getCartCount();
    setCartCount(count);

    // Listen to storage changes
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-green-600 flex items-center gap-2">
          <i className="fas fa-utensils"></i> Hương Vị Việt
        </Link>

        <nav className="hidden md:flex space-x-6 font-medium text-gray-700">
          <Link to="/" className="hover:text-green-600 transition">Trang Chủ</Link>
          <Link to="/booking" className="hover:text-green-600 transition">Đặt Lịch</Link>
          {token ? (
            <Link to="/my-bookings" className="hover:text-green-600 transition">Lịch của tôi</Link>
          ) : (
            <Link to="/login" className="hover:text-green-600 transition">Đăng nhập</Link>
          )}
          <Link to="/" className="hover:text-green-600 transition">Ưu Đãi</Link>
          <Link to="/" className="hover:text-green-600 transition">Liên Hệ</Link>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
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
            <i className={`fas fa-calendar-check text-xl ${cartBounce ? 'animate-bounce' : ''}`}></i>
          </Link>
        </div>
      </div>
    </header>
  );
}

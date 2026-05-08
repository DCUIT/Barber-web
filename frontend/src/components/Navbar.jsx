import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DarkToggle from "./DarkToggle";

// Note: this repo has many lint rules enabled; keep this component pure.
export default function Navbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));

  const updateAuth = useCallback(() => {
    setToken(localStorage.getItem("token"));
    setUsername(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    window.addEventListener("storage", updateAuth);
    window.addEventListener("auth-change", updateAuth); // Lắng nghe sự kiện tùy chỉnh

    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("auth-change", updateAuth);
    };
  }, [updateAuth]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    updateAuth();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="logo">
        THE <span>CUTTING EDGE</span> BARBERSHOP
      </div>

      <nav className="hidden md:block">
        <ul className="flex items-center gap-6">
          <Link to="/" className="hover:text-[#d4a373] transition">Trang Chủ</Link>
          <Link to="/booking" className="hover:text-[#d4a373] transition">Đặt Lịch</Link>
          {token ? (
            <Link to="/my-bookings" className="hover:text-[#d4a373] transition">Lịch của tôi</Link>
          ) : (
            <Link to="/login" className="hover:text-[#d4a373] transition">Đăng nhập</Link>
          )}
          <Link to="/" className="hover:text-[#d4a373] transition">Ưu Đãi</Link>
          <Link to="/" className="hover:text-[#d4a373] transition">Liên Hệ</Link>
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
              <span className="text-white font-semibold hidden sm:inline">{username}</span>
              <button
                onClick={handleLogout}
                className="text-white hover:text-[#d4a373] transition"
                title="Đăng xuất"
              >
                <i className="fas fa-sign-out-alt text-xl"></i>
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-white hover:text-[#d4a373] transition" title="Đăng nhập">
              <i className="fas fa-user text-xl"></i>
            </Link>
          )}
          <Link to="/booking" className="relative text-white hover:text-[#d4a373] transition">
            <i className="fas fa-calendar-check text-xl"></i>
          </Link>
        </div>
    </header>
  );
}

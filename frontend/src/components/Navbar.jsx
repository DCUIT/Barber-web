import { useEffect, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import DarkToggle from "./DarkToggle";
import { useAuth } from "../context/AuthContext";

function MobileNav({
  token,
  role,
  username,
  notifications,
  showNotif,
  setShowNotif,
  setNotifications,
  handleLogout,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-white px-2 py-1 border border-white/30 rounded"
          aria-label="Open menu"
        >
          ☰
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative text-white hover:text-[#d4a373] transition"
            aria-label="Notifications"
          >
            <i className="fas fa-bell text-xl"></i>
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800">
              <div className="p-3 border-b font-bold text-sm bg-gray-50 flex justify-between">
                Thông báo
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-blue-600 font-normal"
                >
                  Xóa hết
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Không có thông báo mới</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border-b hover:bg-gray-50 transition cursor-pointer"
                    >
                      <p className="font-bold text-xs">{n.title}</p>
                      <p className="text-xs text-gray-600">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute left-4 right-4 top-16 bg-black text-white rounded-xl shadow-lg p-4 z-[60]">
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)} className="hover:text-[#d4a373] transition">
              Trang Chủ
            </Link>
            <Link
              to="/booking"
              onClick={() => setOpen(false)}
              className="hover:text-[#d4a373] transition"
            >
              Đặt Lịch
            </Link>

            {token ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setOpen(false)}
                  className="hover:text-[#d4a373] transition"
                >
                  Lịch của tôi
                </Link>

                {role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="hover:text-yellow-400 transition"
                  >
                    Quản Trị
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-left hover:text-[#d4a373] transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="hover:text-[#d4a373] transition"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}

      {/* role is unused here, but kept to match signature if needed later */}
      <span className="hidden">{role}</span>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const role = user?.role;
  const username = user?.username;

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // Realtime Notifications
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000");

    socket.on("newBooking", (data) => {
      if (role === "admin" || role === "barber") {
        const msg = `Có lịch hẹn mới từ ${data.userId?.username || "khách hàng"}!`;
        toast.success(msg, { icon: "🔔" });
        setNotifications((prev) => [
          { id: Date.now(), title: "Lịch hẹn mới", message: msg, time: "Vừa xong" },
          ...prev,
        ]);
      }
    });

    socket.on("bookingUpdated", (data) => {
      if (role === "user") {
        const msg = `Lịch hẹn của bạn đã được cập nhật thành: ${data.status}`;
        toast.success(msg);
        setNotifications((prev) => [
          { id: Date.now(), title: "Cập nhật lịch hẹn", message: msg, time: "Vừa xong" },
          ...prev,
        ]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="logo">THE <span>CUTTING EDGE</span> BARBERSHOP</div>

      {/* Desktop nav */}
      <nav className="hidden md:block">
        <ul className="flex items-center gap-6">
          <Link to="/" className="hover:text-[#d4a373] transition">
            Trang Chủ
          </Link>
          <Link to="/booking" className="hover:text-[#d4a373] transition">
            Đặt Lịch
          </Link>
          {token ? (
            <Link to="/my-bookings" className="hover:text-[#d4a373] transition">
              Lịch của tôi
            </Link>
          ) : (
            <Link to="/login" className="hover:text-[#d4a373] transition">
              Đăng nhập
            </Link>
          )}
          <Link to="/" className="hover:text-[#d4a373] transition">
            Ưu Đãi
          </Link>
          <Link to="/" className="hover:text-[#d4a373] transition">
            Liên Hệ
          </Link>
        </ul>
      </nav>

      <div className="flex items-center space-x-4">
        <DarkToggle />

        {token ? (
          <div className="flex items-center gap-3">
            {role === "admin" && (
              <Link
                to="/admin"
                className="text-yellow-600 hover:text-yellow-700 font-semibold"
                title="Quản trị"
              >
                <i className="fas fa-cog text-xl"></i>
              </Link>
            )}
            {role === "barber" && (
              <>
                <Link
                  to="/barber-dashboard"
                  className="text-blue-400 hover:text-blue-500 font-semibold"
                  title="Dashboard"
                >
                  <i className="fas fa-calendar-check text-xl"></i>
                </Link>
              </>
            )}
            
            <Link
              to="/profile"
              className="text-gray-300 hover:text-white transition"
              title="Hồ sơ cá nhân"
            >
              <i className="fas fa-user-circle text-xl"></i>
            </Link>

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

        {/* Desktop notification bell */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative text-white hover:text-[#d4a373] transition"
          >
            <i className="fas fa-bell text-xl"></i>
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800">
              <div className="p-3 border-b font-bold text-sm bg-gray-50 flex justify-between">
                Thông báo
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-blue-600 font-normal"
                >
                  Xóa hết
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Không có thông báo mới</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 border-b hover:bg-gray-50 transition cursor-pointer">
                      <p className="font-bold text-xs">{n.title}</p>
                      <p className="text-xs text-gray-600">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile */}
        <MobileNav
          token={token}
          role={role}
          username={username}
          notifications={notifications}
          showNotif={showNotif}
          setShowNotif={setShowNotif}
          setNotifications={setNotifications}
          handleLogout={handleLogout}
        />
      </div>
    </header>
  );
}

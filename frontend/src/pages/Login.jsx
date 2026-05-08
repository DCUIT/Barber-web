import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

// Trang đăng nhập / đăng ký, có thể chuyển tab, dễ xem lại
export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false); // false = login, true = register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Xử lý đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { username, password });
      
      // Kiểm tra dữ liệu trả về từ server trong Console (F12)
      console.log("Dữ liệu đăng nhập:", res.data);

      const token = res.data.access_token || res.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("username", res.data.username || username);
      localStorage.setItem("role", res.data.role || "user");
      
      window.dispatchEvent(new Event("auth-change")); // Thông báo cho Navbar cập nhật
      alert("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      console.error("Chi tiết lỗi đăng nhập:", err);
      if (!err.response) {
        setError("Lỗi kết nối: Hãy đảm bảo Backend đang chạy ở cổng 4000 và MongoDB đã bật.");
      } else {
        setError(err.response?.data?.msg || "Sai tài khoản hoặc mật khẩu!");
      }
    }
    setLoading(false);
  };

  // Xử lý đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/auth/register", { username, password });
      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setIsRegister(false); // Chuyển về form đăng nhập
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.msg || "Đăng ký thất bại!");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-black">
        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 pb-2 text-center font-semibold ${!isRegister ? "border-b-2 border-yellow-400 text-yellow-400" : "text-gray-500"}`}
            onClick={() => { setIsRegister(false); setError(""); setSuccess(""); }}
          >
            Đăng nhập
          </button>
          <button
            className={`flex-1 pb-2 text-center font-semibold ${isRegister ? "border-b-2 border-yellow-400 text-yellow-400" : "text-gray-500"}`}
            onClick={() => { setIsRegister(true); setError(""); setSuccess(""); }}
          >
            Đăng ký
          </button>
        </div>

        {/* Form đăng nhập */}
        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-1">Tài khoản</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:border-blue-500 outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:border-blue-500 outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        ) : (
          /* Form đăng ký */
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block mb-1">Tài khoản</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:border-blue-500 outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:border-blue-500 outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
            {success && <div className="text-green-500 mb-2 text-sm">{success}</div>}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
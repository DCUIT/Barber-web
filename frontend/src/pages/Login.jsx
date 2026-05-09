import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Trang đăng nhập / đăng ký, có thể chuyển tab, dễ xem lại
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false); // false = login, true = register

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Xử lý đăng nhập
  const onLogin = async (data) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", data);
      
      const token = res.data.access_token || res.data.token;
      if (!token) {
        setError("Không nhận được mã xác thực hợp lệ từ máy chủ.");
        return;
      }

      login({
        token,
        username: res.data.username || data.username,
        role: res.data.role || "user"
      });

      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Lỗi kết nối: Hãy đảm bảo Backend đang chạy ở cổng 4000 và MongoDB đã bật.");
      } else {
        setError(err.response?.data?.msg || "Sai tài khoản hoặc mật khẩu!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng ký
  const onRegister = async (data) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/auth/register", data);
      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setIsRegister(false); // Chuyển về form đăng nhập
      reset();
    } catch (err) {
      setError(err.response?.data?.msg || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-black">
        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 pb-2 text-center font-semibold ${!isRegister ? "border-b-2 border-yellow-400 text-gray-800" : "text-gray-500"}`}
            onClick={() => { setIsRegister(false); setError(""); setSuccess(""); reset(); }}
          >
            Đăng nhập
          </button>
          <button
            className={`flex-1 pb-2 text-center font-semibold ${isRegister ? "border-b-2 border-yellow-400 text-gray-800" : "text-gray-500"}`}
            onClick={() => { setIsRegister(true); setError(""); setSuccess(""); reset(); }}
          >
            Đăng ký
          </button>
        </div>

        {/* Form đăng nhập */}
        {!isRegister ? (
          <form onSubmit={handleSubmit(onLogin)}>
            <div className="mb-4">
              <label className="block mb-1">Tài khoản</label>
              <input
                className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-black focus:border-blue-500 outline-none`}
                {...register("username", { required: "Tên đăng nhập là bắt buộc" })}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block mb-1">Mật khẩu</label>
              <input
                type="password"
                className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-black focus:border-blue-500 outline-none`}
                {...register("password", { 
                  required: "Mật khẩu là bắt buộc",
                  minLength: {
                    value: 6,
                    message: "Mật khẩu phải ít nhất 6 ký tự"
                  }
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
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
          <form onSubmit={handleSubmit(onRegister)}>
            <div className="mb-4">
              <label className="block mb-1">Tài khoản</label>
              <input
                className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-black focus:border-blue-500 outline-none`}
                {...register("username", { required: "Tên đăng nhập là bắt buộc" })}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block mb-1">Mật khẩu</label>
              <input
                type="password"
                className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded bg-white text-black focus:border-blue-500 outline-none`}
                {...register("password", { 
                  required: "Mật khẩu là bắt buộc",
                  minLength: { value: 6, message: "Mật khẩu phải ít nhất 6 ký tự" }
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
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
import { useEffect, useState, useCallback, useMemo } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const statusMap = {
  Pending: { bg: "bg-yellow-100", fg: "text-yellow-800", label: "Chờ xác nhận" },
  Accepted: { bg: "bg-green-100", fg: "text-green-800", label: "Đã xác nhận" },
  Completed: { bg: "bg-blue-100", fg: "text-blue-800", label: "Hoàn thành" },
  Cancelled: { bg: "bg-red-100", fg: "text-red-800", label: "Đã hủy" }
};
const statusLabel = (s) => {
  const v = statusMap[s] || { bg: "bg-gray-100", fg: "text-gray-800", label: s };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${v.bg} ${v.fg}`}>{v.label}</span>;
};

export default function BarberHistory() {
  const navigate = useNavigate();
  const { token } = useAuth(); // Sử dụng AuthContext

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]); // token từ AuthContext

  const fetchBookings = useCallback(async () => {
    if (!token) return; // Don't fetch if no token
    setLoading(true);
    try {
      const res = await API.get("/bookings", authHeader);
      // Ensure we extract the array if it's nested, and fallback to an empty array
      const data = res.data?.bookings || res.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.msg || "Không thể tải lịch");
    } finally {
      setLoading(false);
    }
  }, [authHeader, token]); // Dependencies for useCallback

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]); // Depend on fetchBookings

  // Socket.io integration
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    
    socket.on('bookingUpdated', fetchBookings);
    
    return () => {
      socket.off('bookingUpdated', fetchBookings);
    };
  }, [fetchBookings, socket]);

  if (loading) return <div className="py-12 text-center">Đang tải...</div>;
  return (
    <div className="min-h-screen text-gray-800">
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">Lịch sử booking</h1>
      </section>

      <main className="container mx-auto px-4 pb-20 text-gray-800">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        ) : null}

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-3">📅</p>
            <p className="text-gray-500">Bạn chưa có booking nào</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {bookings.map((b) => (
              <div key={b._id || b.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg text-gray-800">Booking</div>
                    <div className="text-gray-500 text-sm mt-1">{b.bookingDate} • {b.bookingTime}</div>
                  </div>
                  {statusLabel(b.status)}
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  {/* Giả sử Backend trả về object đã populate, hãy dùng b.serviceId.name */}
                  <div><span className="text-gray-500">Dịch vụ:</span> <span className="font-semibold">{b.serviceId?.name || b.serviceId}</span></div>
                  <div><span className="text-gray-500">Stylist:</span> <span className="font-semibold">{b.barberId?.name || b.barberId}</span></div>
                  {b.note ? <div><span className="text-gray-500">Note:</span> <span className="font-semibold">{b.note}</span></div> : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto mt-8">
          <button
            onClick={() => navigate("/booking")}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg"
          >
            Tạo booking mới
          </button>
        </div>
      </main>
    </div>
  );
}

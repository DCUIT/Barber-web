import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Accepted", label: "Accepted" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" }
];

function statusBadge(status) {
  const base = "px-3 py-1 rounded text-xs font-bold";
  if (status === "Pending") return `${base} bg-yellow-100 text-yellow-800`;
  if (status === "Accepted") return `${base} bg-green-100 text-green-800`;
  if (status === "Completed") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-red-100 text-red-800`;
}

export default function BarberBookings() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth(); // Sử dụng AuthContext

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [bookings, setBookings] = useState([]);

  const fetchBookingsForDate = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/barber/bookings/today?date=${encodeURIComponent(selectedDate)}`, authHeader);
      setBookings(res.data?.bookings || []);
    } catch (e) {
      setError(e?.response?.data?.msg || "Không thể tải booking");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, selectedDate, token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

  }, [navigate, token]); // token từ AuthContext

  useEffect(() => {
    fetchBookingsForDate();
  }, [fetchBookingsForDate]);

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    socket.on("bookingUpdated", fetchBookingsForDate);
    socket.on("newBooking", fetchBookingsForDate);
    return () => {
      socket.off("bookingUpdated", fetchBookingsForDate);
      socket.off("newBooking", fetchBookingsForDate);
    };
  }, [fetchBookingsForDate, socket]);

  const updateStatus = async (bookingId, status) => {
    try {
      await API.put(`/bookings/${bookingId}/status`, { status }, authHeader);
      await fetchBookingsForDate();
    } catch (e) {
      setError(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">Quản lý booking</h1>
        <p className="mt-2 text-gray-500">Accept / Reject / Complete cho ngày đã chọn</p>
      </section>

      <main className="container mx-auto px-4 pb-20">
        {error ? <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div> : null}

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div>
              <div className="text-sm text-gray-500">Ngày</div>
              <input
                type="date"
                className="border rounded-xl p-2 bg-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button
              className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-xl font-bold"
              onClick={fetchBookingsForDate}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center text-gray-500 py-12">
            Chưa có booking
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {bookings.map((b) => (
              <div key={b._id || b.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <div className="font-bold text-lg">{b.bookingTime}</div>
                    <div className="text-sm text-gray-600">Khách: {b.userId?.username || "Guest"}</div>
                    <div className="text-sm text-gray-600">Dịch vụ: {b.serviceId?.name || b.serviceId}</div>
                    {b.note ? <div className="text-xs text-gray-500 mt-1">Note: {b.note}</div> : null}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <span className={statusBadge(b.status)}>{b.status}</span>

                    <div className="flex gap-2 flex-wrap justify-end">
                      <select
                        className="border rounded-xl p-2 text-sm"
                        value={b.status}
                        onChange={(e) => updateStatus(b._id, e.target.value)}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto mt-8">
          <button
            onClick={() => navigate("/barber-dashboard")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 p-3 rounded-xl font-bold"
          >
            Quay lại dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

function tabNeedsGuard(role) {
  return role && role !== "barber";
}

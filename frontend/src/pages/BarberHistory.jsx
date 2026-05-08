import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

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
  const token = localStorage.getItem("token");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    API.get("/bookings", authHeader)
      .then((res) => setBookings(res.data || []))
      .catch((e) => setError(e?.response?.data?.msg || "Không thể tải lịch"))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  if (loading) return <div className="py-12 text-center">Đang tải...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">Lịch sử booking</h1>
      </section>

      <main className="container mx-auto px-4 pb-20">
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
                    <div className="font-bold text-lg">Booking</div>
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

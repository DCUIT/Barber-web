import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatYYYYMMDD(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function BarberDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth(); // Sử dụng AuthContext

  const [tab, setTab] = useState("today"); // today | week
  const [todayStr] = useState(() => formatYYYYMMDD(new Date()));
  const [weekStart, setWeekStart] = useState(() => formatYYYYMMDD(new Date()));

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const handleAuthError = useCallback((e) => {
    if (e?.response?.status === 401 || e?.response?.data?.msg === "Invalid token" || e?.response?.data?.msg === "Unauthorized") {
      navigate("/login");
      logout(); // Đảm bảo xóa token và user khỏi context
      toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [navigate, logout]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [todayBookings, setTodayBookings] = useState([]);
  const [weekDays, setWeekDays] = useState([]); // [{date, weekday, slots}] + maybe bookings handled separately
  const [weekBookingsByDate, setWeekBookingsByDate] = useState({}); // date -> bookings

  const fetchToday = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const date = todayStr;
      const res = await API.get(`/barber/bookings/today?date=${encodeURIComponent(date)}`, authHeader);
      setTodayBookings(res.data?.bookings || []);
    } catch (e) {
      handleAuthError(e);
      setError(e?.response?.data?.msg || "Không thể tải lịch hôm nay");
      setTodayBookings([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, token, todayStr, handleAuthError]);

  const fetchWeek = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const start = weekStart;
      const availabilityRes = await API.get(`/barber/availability?start=${encodeURIComponent(start)}`, authHeader);
      setWeekDays(availabilityRes.data?.days || []);

      const bookingsRes = await API.get(`/barber/bookings/week?start=${encodeURIComponent(start)}`, authHeader);
      const days = bookingsRes.data?.days || [];
      const map = {};
      for (const d of days) map[d.date] = d.bookings || [];
      setWeekBookingsByDate(map);
    } catch (e) {
      handleAuthError(e);
      setError(e?.response?.data?.msg || "Không thể tải lịch tuần");
      setWeekDays([]);
      setWeekBookingsByDate({});
    } finally {
      setLoading(false);
    }
  }, [authHeader, token, weekStart, handleAuthError]);

  const updateStatus = useCallback(async (bookingId, newStatus) => {
    try {
      await API.put(`/bookings/${bookingId}/status`, { status: newStatus }, authHeader);
      toast.success(`Đã cập nhật: ${newStatus}`);
      // Refresh data
      if (tab === "today") fetchToday();
      if (tab === "week") fetchWeek();
    } catch (e) {
      handleAuthError(e);
      toast.error(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }, [authHeader, tab, fetchToday, fetchWeek, handleAuthError]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (user?.role && user.role !== "barber") {
      // MVP: chỉ hiển thị cho barber
      // vẫn cho phép xem nếu bạn muốn, nhưng mặc định điều hướng
      // navigate("/");
    }
  }, [navigate, token, user]); // Thêm user vào dependency

  useEffect(() => {
    if (token) { // Chỉ fetch khi có token
      if (tab === "today") fetchToday();
      if (tab === "week") fetchWeek();
    }
  }, [tab, fetchToday, fetchWeek, token]);

  // realtime: bookingUpdated/newBooking affects dashboard
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    
    const handleRefresh = () => {
      if (tab === "today") fetchToday();
      if (tab === "week") fetchWeek();
    };

    socket.on("newBooking", handleRefresh);
    socket.on("bookingUpdated", handleRefresh);

    return () => {
      socket.off("newBooking", handleRefresh);
      socket.off("bookingUpdated", handleRefresh);
    };
  }, [fetchToday, fetchWeek, tab, socket]);


  const weekDates = useMemo(() => {
    const base = new Date(weekStart + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => formatYYYYMMDD(addDays(base, i)));
  }, [weekStart]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800">
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter">Bảng điều khiển</h1>
        <p className="text-gray-500 mt-2 font-medium">Theo dõi và quản lý lịch hẹn của bạn</p>
        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={() => setTab("today")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${tab === "today" ? "bg-black text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setTab("week")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${tab === "week" ? "bg-black text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            Tuần này
          </button>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-20">
        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="text-amber-600 text-xs uppercase font-black tracking-widest mb-1">Chờ duyệt</div>
              <div className="text-3xl font-black text-gray-900">{todayBookings.filter(b => b.status === "Pending").length}</div>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl">
              <i className="fas fa-hourglass-half"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="text-emerald-600 text-xs uppercase font-black tracking-widest mb-1">Tổng lịch hẹn</div>
              <div className="text-3xl font-black text-gray-900">{todayBookings.length}</div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 text-xl">
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="text-blue-600 text-xs uppercase font-black tracking-widest mb-1">Đã xong</div>
              <div className="text-3xl font-black text-gray-900">{todayBookings.filter(b => b.status === "Completed").length}</div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 text-xl">
              <i className="fas fa-check-double"></i>
            </div>
          </div>
        </div>

        {error ? <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div> : null}
        {loading ? <div className="py-6 text-center text-gray-500">Đang tải...</div> : null}

        {tab === "today" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden max-w-5xl mx-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-gray-50/50">
               <h2 className="font-black text-gray-900 flex items-center gap-2">
                 <i className="fas fa-calendar-day text-blue-500"></i>
                 Lịch hẹn hôm nay <span className="text-gray-400 font-medium ml-2">{todayStr}</span>
               </h2>
               <button onClick={fetchToday} className="text-blue-600 text-xs font-black uppercase tracking-widest hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                  <i className="fas fa-sync-alt mr-2"></i> Làm mới
               </button>
            </div>

            {todayBookings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Không có booking</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayBookings.map((b) => (
                  <div key={b._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex flex-col items-center justify-center shadow-xl">
                        <span className="text-xs font-bold opacity-70">Giờ</span>
                        <span className="text-lg font-black">{b.bookingTime}</span>
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-lg">{b.userId?.name || b.userId?.username || "Khách vãng lai"}</div>
                        <div className="text-blue-600 font-bold text-sm uppercase">{b.serviceId?.name || "Dịch vụ"}</div>
                        {b.note && <div className="text-gray-400 text-xs mt-1 italic">"{b.note}"</div>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex gap-2">
                        {b.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(b._id, "Accepted")}
                              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                            >
                              Xác nhận
                            </button>
                            <button
                              onClick={() => updateStatus(b._id, "Cancelled")}
                              className="bg-white text-rose-600 border border-rose-100 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {b.status === "Accepted" && (
                          <button
                            onClick={() => updateStatus(b._id, "Completed")}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-6 bg-gray-50/50 border-t border-gray-50">
              <button
                onClick={() => navigate("/barber/bookings")}
                className="w-full bg-black hover:bg-gray-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Quản lý booking (accept/reject/complete)
              </button>
            </div>
          </div>
        )}

        {tab === "week" && (
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-gray-400 font-black uppercase tracking-widest">Tuần bắt đầu</div>
                <div className="font-black text-2xl text-gray-900">{weekStart}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => {
                    const d = new Date(weekStart + "T00:00:00");
                    d.setDate(d.getDate() - 7);
                    setWeekStart(formatYYYYMMDD(d));
                  }}
                >
                  Trước
                </button>
                <button
                  className="bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-black transition-all shadow-md"
                  onClick={() => {
                    setWeekStart(todayStr);
                  }}
                >
                  Hôm nay
                </button>
                <button
                  className="bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  onClick={() => {
                    const d = new Date(weekStart + "T00:00:00");
                    d.setDate(d.getDate() + 7);
                    setWeekStart(formatYYYYMMDD(d));
                  }}
                >
                  Sau
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekDates.map((d) => {
                const dayAvailability = weekDays.find((x) => x.date === d);
                const slotsFree = dayAvailability?.slots?.length ?? 0;
                const bookings = weekBookingsByDate[d] || [];
                return (
                  <div key={d} className={`border rounded-2xl p-5 transition-all hover:border-blue-200 ${d === todayStr ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-gray-100'}`}>
                    <div className="flex items-baseline justify-between">
                      <div className={`font-black ${d === todayStr ? 'text-blue-600' : 'text-gray-900'}`}>{d}</div>
                      <div className="text-[10px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Trống: {slotsFree}</div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {bookings.length === 0 ? (
                        <div className="text-sm text-gray-300 italic py-2">Không có lịch</div>
                      ) : (
                        bookings.map((b) => (
                          <div key={b._id} className="text-sm flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                              <div className="font-black text-gray-800 leading-none">{b.bookingTime}</div>
                              <div className="text-[10px] text-gray-500 mt-1 truncate max-w-[80px]">{b.userId?.name || "Khách"}</div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                b.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : b.status === "Accepted"
                                    ? "bg-green-100 text-green-800"
                                    : b.status === "Completed"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate("/barber/bookings")}
                className="w-full bg-black hover:bg-gray-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Quản lý booking (accept/reject/complete)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

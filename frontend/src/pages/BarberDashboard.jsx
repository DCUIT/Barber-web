import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

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
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const role = localStorage.getItem("role");

  const [tab, setTab] = useState("today"); // today | week
  const [todayStr, setTodayStr] = useState(() => formatYYYYMMDD(new Date()));
  const [weekStart, setWeekStart] = useState(() => formatYYYYMMDD(new Date()));

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

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
      setError(e?.response?.data?.msg || "Không thể tải lịch hôm nay");
      setTodayBookings([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, token, todayStr]);

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
      setError(e?.response?.data?.msg || "Không thể tải lịch tuần");
      setWeekDays([]);
      setWeekBookingsByDate({});
    } finally {
      setLoading(false);
    }
  }, [authHeader, token, weekStart]);

  const updateStatus = useCallback(async (bookingId, newStatus) => {
    try {
      await API.put(`/bookings/${bookingId}/status`, { status: newStatus }, authHeader);
      toast.success(`Đã cập nhật: ${newStatus}`);
      // Refresh data
      if (tab === "today") fetchToday();
      if (tab === "week") fetchWeek();
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }, [authHeader, token, weekStart]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (role && role !== "barber") {
      // MVP: chỉ hiển thị cho barber
      // vẫn cho phép xem nếu bạn muốn, nhưng mặc định điều hướng
      // navigate("/");
    }

    const onAuthChange = () => {
      const t = localStorage.getItem("token");
      setToken(t);
      if (!t) navigate("/login");
    };
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, [navigate, role, token]);

  useEffect(() => {
    if (tab === "today") fetchToday();
    if (tab === "week") fetchWeek();
  }, [tab, fetchToday, fetchWeek]);

  // realtime: bookingUpdated/newBooking affects dashboard
  useEffect(() => {
    const socket = io("http://localhost:4000");
    socket.on("connect", () => console.log("Connected (BarberDashboard)"));

    socket.on("newBooking", () => {
      if (tab === "today") fetchToday();
      if (tab === "week") fetchWeek();
    });

    socket.on("bookingUpdated", () => {
      if (tab === "today") fetchToday();
      if (tab === "week") fetchWeek();
    });

    return () => socket.disconnect();
  }, [fetchToday, fetchWeek, tab]);


  const weekDates = useMemo(() => {
    const base = new Date(weekStart + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => formatYYYYMMDD(addDays(base, i)));
  }, [weekStart]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">Barber dashboard</h1>
        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={() => setTab("today")}
            className={`px-4 py-2 rounded-xl font-bold border ${tab === "today" ? "bg-black text-white" : "bg-white"}`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setTab("week")}
            className={`px-4 py-2 rounded-xl font-bold border ${tab === "week" ? "bg-black text-white" : "bg-white"}`}
          >
            Tuần này
          </button>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-20">
        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-yellow-500">
            <div className="text-gray-500 text-xs uppercase font-bold">Lịch chờ duyệt</div>
            <div className="text-2xl font-black">{todayBookings.filter(b => b.status === "Pending").length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
            <div className="text-gray-500 text-xs uppercase font-bold">Lịch hôm nay</div>
            <div className="text-2xl font-black">{todayBookings.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <div className="text-gray-500 text-xs uppercase font-bold">Hoàn thành</div>
            <div className="text-2xl font-black">{todayBookings.filter(b => b.status === "Completed").length}</div>
          </div>
        </div>

        {error ? <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div> : null}
        {loading ? <div className="py-6 text-center text-gray-500">Đang tải...</div> : null}

        {tab === "today" && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="font-bold text-lg uppercase tracking-wider">Danh sách lịch hẹn</h2>
               <button onClick={fetchToday} className="text-blue-600 text-sm hover:underline">
                  <i className="fas fa-sync-alt mr-1"></i> Làm mới
               </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Ngày</div>
                <div className="font-bold text-xl">{todayStr}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Booking</div>
                <div className="font-bold text-xl">{todayBookings.length}</div>
              </div>
            </div>

            {todayBookings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Không có booking</div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((b) => (
                  <div key={b._id} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold">{b.bookingTime}</div>
                      <div className="text-sm text-gray-600">{b.userId?.username || "Khách"}</div>
                      <div className="text-sm text-gray-600">{b.serviceId?.name || "Service"}</div>
                      {b.note ? <div className="text-xs text-gray-500 mt-2">Note: {b.note}</div> : null}
                    </div>
                    <div>
                      <div className="flex flex-col gap-2 mb-2">
                        {b.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(b._id, "Accepted")}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700"
                            >
                              Chấp nhận
                            </button>
                            <button
                              onClick={() => updateStatus(b._id, "Cancelled")}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {b.status === "Accepted" && (
                          <button
                            onClick={() => updateStatus(b._id, "Completed")}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold ${
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
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => navigate("/barber/bookings")}
                className="w-full bg-black hover:bg-gray-900 text-white p-3 rounded-xl font-bold"
              >
                Quản lý booking (accept/reject/complete)
              </button>
            </div>
          </div>
        )}

        {tab === "week" && (
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Tuần bắt đầu</div>
                <div className="font-bold text-xl">{weekStart}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="border px-3 py-2 rounded-xl font-bold"
                  onClick={() => {
                    const d = new Date(weekStart + "T00:00:00");
                    d.setDate(d.getDate() - 7);
                    setWeekStart(formatYYYYMMDD(d));
                  }}
                >
                  Trước
                </button>
                <button
                  className="border px-3 py-2 rounded-xl font-bold"
                  onClick={() => {
                    setWeekStart(todayStr);
                  }}
                >
                  Hôm nay
                </button>
                <button
                  className="border px-3 py-2 rounded-xl font-bold"
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
                  <div key={d} className="border rounded-xl p-4">
                    <div className="flex items-baseline justify-between">
                      <div className="font-bold">{d}</div>
                      <div className="text-xs text-gray-500">Trống: {slotsFree}</div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {bookings.length === 0 ? (
                        <div className="text-sm text-gray-500">Không có booking</div>
                      ) : (
                        bookings.map((b) => (
                          <div key={b._id} className="text-sm flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold">{b.bookingTime}</div>
                              <div className="text-xs text-gray-600">{b.userId?.username || "Khách"}</div>
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

            <div className="mt-6">
              <button
                onClick={() => navigate("/barber/bookings")}
                className="w-full bg-black hover:bg-gray-900 text-white p-3 rounded-xl font-bold"
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

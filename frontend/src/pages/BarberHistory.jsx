import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const statusMap = {
  Pending: { bg: "bg-[#c5a059]/20", fg: "text-[#c5a059]", label: "Chờ xác nhận" },
  Accepted: { bg: "bg-emerald-900/40", fg: "text-emerald-400", label: "Đã xác nhận" },
  Completed: { bg: "bg-blue-900/40", fg: "text-blue-400", label: "Hoàn thành" },
  Cancelled: { bg: "bg-[#8b0000]/40", fg: "text-red-400", label: "Đã hủy" }
};

const statusLabel = (s) => {
  const v = statusMap[s] || { bg: "bg-gray-100", fg: "text-gray-800", label: s };
  return (
    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/5 shadow-sm ${v.bg} ${v.fg}`}>
      {v.label}
    </span>
  );
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function safeParseBookingDate(input) {
  // backend có thể trả về dạng "YYYY-MM-DD" hoặc chuỗi Date khác
  if (!input) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return null;
  return toISODate(dt);
}

function formatMonthTitle(year, monthIndex0) {
  const d = new Date(year, monthIndex0, 1);
  return d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

export default function BarberHistory() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tháng hiển thị calendar
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), monthIndex0: d.getMonth() };
  });

  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchBookings = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const res = await API.get("/bookings", authHeader);
      const data = res.data?.bookings || res.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.msg || "Không thể tải lịch");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, token]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Socket.io realtime
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handler = () => fetchBookings();
    socket.on("bookingUpdated", handler);

    return () => {
      socket.off("bookingUpdated", handler);
    };
  }, [fetchBookings, socket]);

  const normalized = useMemo(() => {
    return bookings
      .map((b) => {
        const normalizedDate = safeParseBookingDate(b.bookingDate || b.date);
        return { ...b, _dateKey: normalizedDate };
      })
      .filter((b) => b._dateKey);
  }, [bookings]);

  const monthBookingsByDate = useMemo(() => {
    const map = {};
    const { year, monthIndex0 } = monthCursor;
    const prefix = `${year}-${pad2(monthIndex0 + 1)}`;

    for (const b of normalized) {
      if (!b._dateKey.startsWith(prefix)) continue;
      map[b._dateKey] = map[b._dateKey] || [];
      map[b._dateKey].push(b);
    }

    Object.keys(map).forEach((k) => {
      map[k].sort((x, y) => String(x.bookingTime || "").localeCompare(String(y.bookingTime || "")));
    });

    return map;
  }, [normalized, monthCursor]);

  const selectedBookings = useMemo(() => {
    return monthBookingsByDate[selectedDate] || [];
  }, [monthBookingsByDate, selectedDate]);

  const monthGrid = useMemo(() => {
    const { year, monthIndex0 } = monthCursor;

    const first = new Date(year, monthIndex0, 1);
    const last = new Date(year, monthIndex0 + 1, 0);

    const startDow = first.getDay();
    const daysInMonth = last.getDate();

    const cells = [];

    // Fill before
    for (let i = 0; i < startDow; i++) {
      cells.push({ key: `empty-${i}`, day: null, dateKey: null, hasBooking: false, outside: true });
    }

    // Fill month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dt = new Date(year, monthIndex0, day);
      const dateKey = toISODate(dt);
      cells.push({
        key: dateKey,
        day,
        dateKey,
        hasBooking: Boolean(monthBookingsByDate[dateKey]?.length),
        outside: false
      });
    }

    // Fill after to stable 6 rows
    while (cells.length < 42) {
      const i = cells.length - (startDow + daysInMonth);
      const dt = new Date(year, monthIndex0 + 1, i + 1);
      const dateKey = toISODate(dt);
      cells.push({
        key: `next-${dateKey}`,
        day: dt.getDate(),
        dateKey,
        hasBooking: Boolean(monthBookingsByDate[dateKey]?.length),
        outside: true
      });
    }

    return cells;
  }, [monthCursor, monthBookingsByDate]);

  const monthTitle = useMemo(() => formatMonthTitle(monthCursor.year, monthCursor.monthIndex0), [monthCursor]);

  const shiftMonth = (delta) => {
    setMonthCursor((prev) => {
      const d = new Date(prev.year, prev.monthIndex0, 1);
      d.setMonth(d.getMonth() + delta);
      return { year: d.getFullYear(), monthIndex0: d.getMonth() };
    });
  };

  // Reset selectedDate về ngày 01 tháng nếu user đang chọn ngày không thuộc tháng
  useEffect(() => {
    const { year, monthIndex0 } = monthCursor;
    const inMonthPrefix = `${year}-${pad2(monthIndex0 + 1)}`;
    if (!selectedDate?.startsWith(inMonthPrefix)) {
      setSelectedDate(`${year}-${pad2(monthIndex0 + 1)}-01`);
    }
  }, [monthCursor, selectedDate]);

  useEffect(() => {
    // Khi đổi tháng, đảm bảo selectedDate nằm trong tháng (đã xử lý ở effect trên)
  }, [monthCursor]);

  if (loading) return <div className="py-12 text-center">Đang tải...</div>;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "#2b1a13 url('https://www.transparenttextures.com/patterns/dark-wood.png')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <header className="py-10 border-b border-[#c5a059]/20 bg-black/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')] opacity-20 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="mt-3">
              <h1 className="text-3xl md:text-5xl font-black tracking-[0.25em] uppercase text-[#c5a059] drop-shadow-2xl">
                THE CUTTING EDGE
              </h1>
              <p className="text-white/50 text-[10px] md:text-xs tracking-[0.5em] font-light mt-3 uppercase">Lịch sử đặt lịch cá nhân</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-20 pt-10 text-gray-100">
        {error ? (
          <div className="bg-red-100/90 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Calendar - 4 columns */}
          <section className="lg:col-span-4 bg-black/40 backdrop-blur-md border border-[#c5a059]/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059]/70 font-black">Lịch tháng</div>
                <div className="text-xl font-black text-[#c5a059] uppercase tracking-tighter">{monthTitle}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => shiftMonth(-1)}
                  className="px-3 py-2 rounded-lg border border-[#c5a059]/30 hover:bg-[#c5a059]/10 text-[#c5a059] text-sm font-bold transition-colors"
                  aria-label="Tháng trước"
                  type="button"
                >
                  ←
                </button>
                <button
                  onClick={() => shiftMonth(1)}
                  className="px-3 py-2 rounded-lg border border-[#c5a059]/30 hover:bg-[#c5a059]/10 text-[#c5a059] text-sm font-bold transition-colors"
                  aria-label="Tháng sau"
                  type="button"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <div key={d} className="text-[10px] text-[#c5a059]/50 font-black pb-1">
                  {d}
                </div>
              ))}

              {monthGrid.map((cell) => {
                const isSelected = Boolean(cell.dateKey) && cell.dateKey === selectedDate;
                const isOutsideMonth = cell.outside;

                const base =
                  "h-10 flex items-center justify-center rounded border transition-all duration-300";

                if (!cell.dateKey) {
                  return <div key={cell.key} className={base + " border-transparent bg-transparent"} />;
                }

                const hasBooking = cell.hasBooking;

                const cellClass = hasBooking
                  ? "border-[#c5a059]/50 bg-[#c5a059] text-black font-black cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                  : "border-white/5 bg-white/5 text-gray-500 cursor-pointer hover:border-[#c5a059]/30 hover:text-white";

                const outsideClass = isOutsideMonth ? "opacity-50" : "";

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => {
                      if (!isOutsideMonth) setSelectedDate(cell.dateKey);
                    }}
                    disabled={isOutsideMonth}
                    className={`${base} ${cellClass} ${outsideClass} ${isSelected ? "ring-2 ring-[#c5a059] ring-offset-2 ring-offset-black" : ""}`}
                    aria-label={cell.dateKey}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-xs">{cell.day}</span>
                      {hasBooking ? <span className="w-2 h-2 mt-1 rounded-full bg-black/60" /> : <span className="h-2" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[10px] text-[#c5a059]/50 italic uppercase tracking-wider">
              <i className="fas fa-info-circle"></i> Click ngày có đánh dấu để xem chi tiết
            </div>
          </section>

          {/* Appointment list - 8 columns */}
          <section className="lg:col-span-8 bg-black/40 backdrop-blur-md border border-[#c5a059]/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="border-l-4 border-[#c5a059] pl-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059]/70 font-black">Lịch trình ngày</div>
                <div className="text-3xl font-black text-[#c5a059]">{selectedDate}</div>
              </div>
              <button
                onClick={() => navigate("/booking")}
                className="bg-[#8b0000] hover:bg-[#a00000] text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest text-xs transition-all border border-white/10 shadow-lg"
                type="button"
              >
                + Đặt lịch mới
              </button>
            </div>

            {selectedBookings.length === 0 ? (
              <div className="text-center py-28 border-2 border-dashed border-white/5 rounded-2xl bg-black/20">
                <div className="text-6xl opacity-10 mb-6 grayscale text-[#c5a059]">💈</div>
                <div className="text-xs font-black text-[#c5a059]/30 uppercase tracking-[0.3em]">Tiệm trống lịch</div>
                <div className="text-[10px] text-gray-600 mt-2 italic">Vui lòng chọn ngày vàng trên lịch để xem chi tiết.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {selectedBookings.map((b) => (
                  <div
                    key={b._id || b.id}
                    className="group rounded-2xl border border-[#c5a059]/10 bg-gradient-to-br from-[#1e120d] to-[#0f0a08] p-6 relative overflow-hidden transition-all duration-500 hover:border-[#c5a059]/40 hover:shadow-2xl hover:shadow-[#c5a059]/5 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')] opacity-10 pointer-events-none" />
                    
                    <div className="relative flex justify-between items-start mb-4">
                      <div className="w-16 h-16 bg-[#c5a059] text-black rounded-xl flex flex-col items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                         <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">Giờ hẹn</span>
                         <span className="text-xl font-black">{b.bookingTime}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {statusLabel(b.status)}
                        <div className="text-[10px] text-gray-500 font-mono mt-1">Ref: {String(b._id).slice(-6).toUpperCase()}</div>
                      </div>
                    </div>

                    <div className="relative space-y-2">
                        <div className="text-lg font-black text-white group-hover:text-[#c5a059] transition-colors uppercase tracking-tight">
                          {b.serviceId?.name || b.serviceId || "Standard Cut"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <i className="fas fa-user-tie text-xs text-[#c5a059]"></i>
                          <span className="text-xs uppercase tracking-wider">Stylist: <span className="text-gray-200 font-black">{b.barberId?.name || "Master Barber"}</span></span>
                        </div>
                        {b.note && (
                          <div className="mt-3 p-3 bg-black/40 rounded-lg border-l-2 border-[#c5a059]/50 text-[11px] text-gray-400 italic leading-relaxed">
                            "{b.note}"
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

    </div>
  );
}

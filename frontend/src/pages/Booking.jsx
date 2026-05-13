import { useEffect, useMemo, useState } from "react";
import API from "../api";
import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style.css";
import "./Booking.css";


// NOTE: Đây là layout mô phỏng đúng mẫu HTML bạn cung cấp (The Cutting Edge - Đặt Lịch Hẹn).
// Logic booking thật vẫn giữ: load services/barbers, lấy slots, submit /bookings.

function formatDateInput(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Booking() {
  const navigate = useNavigate();
  const { token } = useAuth(); // Sử dụng AuthContext

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");

  const [bookingDate, setBookingDate] = useState(() => formatDateInput(new Date()));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  const [note, setNote] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBooking, setLastBooking] = useState(null);

  useEffect(() => {
    if (!token) { // Kiểm tra token từ AuthContext
      navigate("/login");
      return;
    }
    
    const fetchInitialData = async () => {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          API.get("/services"),
          API.get("/barbers")
        ]);
        setServices(servicesRes.data || []);
        setBarbers(barbersRes.data || []);
      } catch (error) {
        console.error("Error fetching initial booking data:", error);
        setServices([]);
        setBarbers([]);
      }
    };
    fetchInitialData();
  }, [navigate, token]);

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    setSelectedTime("");

    if (!selectedBarberId || !bookingDate) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    let cancelled = false;

    API.get(
      `/bookings/calendar?barberId=${encodeURIComponent(selectedBarberId)}&date=${encodeURIComponent(bookingDate)}`,
      authHeader
    )
      .then((res) => {
        if (!cancelled) {
          setAvailableSlots(res.data?.slots || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBarberId, bookingDate, authHeader]);

  const selectedService = useMemo(
    () => services.find((s) => String(s._id) === String(selectedServiceId)),
    [services, selectedServiceId]
  );

  async function handleConfirm() {
    if (!selectedServiceId || !selectedBarberId || !bookingDate || !selectedTime) {
      toast.error("Please select service, staff, date and time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post(
        "/bookings",
        {
          barberId: selectedBarberId,
          serviceId: selectedServiceId,
          bookingDate,
          bookingTime: selectedTime,
          note: note || ""
        },
        authHeader
      );

      toast.success("Booking confirmed!");
      setLastBooking(res.data);
      setShowSuccessModal(true);
      setNote("");
      setSelectedTime("");

      // reload slots
      API.get(
        `/bookings/calendar?barberId=${encodeURIComponent(selectedBarberId)}&date=${encodeURIComponent(bookingDate)}`,
        authHeader
      ).then((res) => setAvailableSlots(res.data?.slots || [])).catch(() => setAvailableSlots([]));
    } catch (e) {
      const msg = e?.response?.data?.msg || "Đặt lịch thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="booking-shell">
      <header className="booking-header">
        <h2>SECURE YOUR NEXT CUT</h2>
        <p>Chọn dịch vụ và barber yêu thích của bạn</p>


      </header>

      <div className="booking-grid">
        {/* 1) SELECT SERVICES */}
        <section className="booking-step">
          <h3>
            <span>1</span> SELECT SERVICES
          </h3>

          {services.length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 14 }}>Đang tải dịch vụ...</div>
          ) : (
            services.map((s) => {
              const active = String(s._id) === String(selectedServiceId);
              return (
                <div
                  key={s._id}
                  className={`booking-card ${active ? "active" : ""}`}
                  onClick={() => setSelectedServiceId(s._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedServiceId(s._id);
                  }}
                >
                  <h4>{s.name}</h4>
                  <p>{new Intl.NumberFormat("vi-VN").format(s.price)}đ</p>
                </div>
              );
            })
          )}
        </section>

        {/* 2) SELECT BARBER */}
        <section className="booking-step">
          <h3>
            <span>2</span> SELECT BARBER
          </h3>

          <div style={{ marginTop: 12 }}>
            {barbers.slice(0, 4).map((b) => {

              const active = String(b._id) === String(selectedBarberId);
              return (
                <div
                  key={b._id}
                  className={`booking-card ${active ? "active" : ""}`}
                  onClick={() => setSelectedBarberId(b._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedBarberId(b._id);
                  }}
                >
                  <h4>{b.name}</h4>
                  <p>{b.specialty || "Master Barber"}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3) CHOOSE DATE & TIME */}
        <section className="booking-step">
          <h3>
            <span>3</span> CHOOSE DATE &amp; TIME
          </h3>

          <div>
            <input
              className="booking-input"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />

          </div>


          <div className="time-slots">
            {availableSlots.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  opacity: 0.75,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {loadingSlots ? "Đang tải khung giờ..." : "Không có khung giờ trống"}
              </div>
            ) : (
              availableSlots.map((t) => {
                const active = selectedTime === t;
                return (
                  <button
                    key={t}
                    type="button"
                    className={`booking-slot ${active ? "active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                );
              })
            )}

          </div>
        </section>

        {/* 4) YOUR DETAILS */}
        <section className="booking-step">
          <h3>
            <span>4</span> YOUR DETAILS
          </h3>

          <div>
            <textarea
              className="booking-input"
              rows={3}
              placeholder="Ghi chú (tùy chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="booking-summary">
            <h4>BOOKING SUMMARY</h4>
            <p>
              <span>Service</span>
              <span>{selectedService?.name || "-"}</span>
            </p>
            <p>
              <span>Barber</span>
              <span>
                {barbers.find((b) => b._id === selectedBarberId)?.name || "-"}
              </span>
            </p>

            <p>
              <span>Time</span>
              <span>
                {(() => {
                  if (!bookingDate || !selectedTime) return "-";
                  const [yyyy, mm, dd] = String(bookingDate).split("-");
                  const formatted = yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : bookingDate;
                  return `${selectedTime} (${formatted})`;
                })()}

              </span>
            </p>

            <p>
              <span>Total</span>
              <span>
                {selectedService
                  ? `${new Intl.NumberFormat("vi-VN").format(selectedService.price)}đ`
                  : "-"}
              </span>
            </p>


            <button
              type="button"
              className="booking-confirm"
              disabled={submitting}
              onClick={handleConfirm}
            >
              {submitting ? "ĐANG XỬ LÝ..." : "CONFIRM BOOKING"}
            </button>
          </div>
        </section>
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastBooking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt lịch thành công!</h2>
            <p className="text-gray-500 mb-6 text-sm">Cảm ơn bạn đã tin tưởng The Cutting Edge.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Dịch vụ:</span>
                <span className="font-bold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Thợ:</span>
                <span className="font-bold">{barbers.find((b) => b._id === selectedBarberId)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Thời gian:</span>
                <span className="font-bold text-[#d4a373]">
                  {lastBooking.bookingTime} - {lastBooking.bookingDate}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full btn-submit m-0 py-3"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );

}

import { useEffect, useMemo, useState } from "react";
import API from "../api";
import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style.css";

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
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Booking Form Area */}
      <section id="booking" className="services" style={{ maxWidth: 900, width: "100%" }}>
        <div className="booking-form" style={{ width: "100%" }}>
            <h3>ĐẶT LỊCH HẸN</h3>
          
          <div className="form-group">
            <label>1. CHỌN DỊCH VỤ</label>
            <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
              <option value="">Select a service...</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} - {new Intl.NumberFormat("vi-VN").format(s.price)}đ
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>2. CHỌN THỢ</label>
            <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)}>
              <option value="">Select staff...</option>
              {barbers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.specialty || "Barber"})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>3. SELECT DATE & TIME</label>
            <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />

            <div className="time-slots" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px", marginTop: "15px" }}>
              {availableSlots.length === 0 ? (
              <div className="text-gray-500 text-center py-2" style={{ gridColumn: "span 2" }}>
                  {loadingSlots ? "Đang tải khung giờ..." : "Không có khung giờ trống"}
                </div>
              ) : (
                availableSlots.map((t) => (

                  <button
                    key={t}
                    type="button"
                    className={`btn-submit ${selectedTime === t ? "" : "opacity-50"}`}
                    style={{
                      margin: 0, 
                      padding: "8px", 
                      fontSize: "14px", 
                      background: selectedTime === t ? "#d4a373" : "#333", 
                      color: selectedTime === t ? "black" : "white",
                      fontWeight: "bold"
                    }}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "20px" }}>
            <label>GHI CHÚ (TÙY CHỌN)</label>
            <textarea 
              rows={3} 
              placeholder="Bạn có yêu cầu gì đặc biệt không?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              /* Removed inline style for border, let CSS handle it */
            />
          </div>

          <button 
            className="btn-submit" 
            type="button" 
            disabled={submitting} 
            onClick={handleConfirm}
            style={{ marginTop: "20px" }}
          >
            {submitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT LỊCH"}
          </button>
        </div>
      </section>

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
                <span className="font-bold">{barbers.find(b => b._id === selectedBarberId)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Thời gian:</span>
                <span className="font-bold text-[#d4a373]">{lastBooking.bookingTime} - {lastBooking.bookingDate}</span>
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

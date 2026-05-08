import { useEffect, useMemo, useState } from "react";
import API from "../api";
import Toast from "../components/Toast";

import { useNavigate } from "react-router-dom";
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
  const token = localStorage.getItem("token");
  const [token] = useState(() => localStorage.getItem("token"));

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

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    API.get("/services")
      .then((res) => setServices(res.data || []))
      .catch(() => setServices([]));

    API.get("/barbers")
      .then((res) => setBarbers(res.data || []))
      .catch(() => setBarbers([]));
  }, [navigate, token]);

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    // reset time when barber/service/date changes
    // defer to microtask to satisfy set-state-in-effect lint
    let cancelled = false;
    setSelectedTime("");

    queueMicrotask(() => {
      setSelectedTime("");
      if (!selectedBarberId || !bookingDate) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }
      setLoadingSlots(true);
    });

    if (!selectedBarberId || !bookingDate) {
      return () => {
        cancelled = true;
      };
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
        if (cancelled) return;
        setAvailableSlots(res.data?.slots || []);
        if (!cancelled) {
          setAvailableSlots(res.data?.slots || []);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableSlots([]);
        if (!cancelled) {
          setAvailableSlots([]);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingSlots(false);
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
      setToast({ open: true, type: "error", message: "Vui lòng chọn đầy đủ dịch vụ, thợ, ngày và giờ." });
      return;
    }

    setSubmitting(true);
    try {
      await API.post(
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

      setToast({ open: true, type: "success", message: "Đặt lịch thành công!" });
      setNote("");
      setSelectedTime("");
      // reload slots
      API.get(
        `/bookings/calendar?barberId=${encodeURIComponent(selectedBarberId)}&date=${encodeURIComponent(bookingDate)}`,
        authHeader
      ).then((res) => setAvailableSlots(res.data?.slots || [])).catch(() => setAvailableSlots([]));
    } catch (e) {
      const msg = e?.response?.data?.msg || "Đặt lịch thất bại";
      setToast({ open: true, type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Booking Form Area */}
      <section id="booking" className="booking-container">
        <div className="booking-card">
          <div className="step">
            <h3>1. CHỌN DỊCH VỤ</h3>
      <section id="booking" className="services" style={{ background: "transparent", padding: "40px 20px" }}>
        <div className="booking-form" style={{ margin: "0 auto" }}>
          <h3 style={{ textAlign: "center", marginBottom: "30px" }}>ĐẶT LỊCH HẸN</h3>
          
          <div className="form-group">
            <label>1. CHỌN DỊCH VỤ</label>
            <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
              <option value="">Chọn dịch vụ...</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.name} - {new Intl.NumberFormat("vi-VN").format(s.price)}đ
                </option>
              ))}
            </select>
          </div>

          <div className="step">
            <h3>2. CHỌN STYLIST</h3>
          <div className="form-group">
            <label>2. CHỌN STYLIST</label>
            <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)}>
              <option value="">Chọn stylist...</option>
              {barbers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                  {b.name} ({b.specialty || "Barber"})
                </option>
              ))}
            </select>
          </div>

          <div className="step">
            <h3>3. CHỌN NGÀY & GIỜ</h3>
          <div className="form-group">
            <label>3. CHỌN NGÀY & GIỜ</label>
            <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />

            <div className="time-slots">
            <div className="time-slots" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
              {availableSlots.length === 0 ? (
                <button className="slot" type="button" disabled>
                  {loadingSlots ? "Đang tải..." : "Chưa có giờ"}
                </button>
                <div className="text-gray-500 text-center py-2" style={{ gridColumn: "span 2" }}>
                  {loadingSlots ? "Đang tải khung giờ..." : "Không có khung giờ trống"}
                </div>
              ) : (
                availableSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`slot ${selectedTime === t ? "active" : ""}`}
                    className={`btn-submit ${selectedTime === t ? "" : "opacity-50"}`}
                    style={{ margin: 0, padding: "8px", fontSize: "14px", background: selectedTime === t ? "#d4a373" : "#333", color: "white" }}
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
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "none" }}
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

      {/* Confirm button (kept outside template card, but uses same style rule) */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "-10px" }}>
        <button className="btn-confirm" type="button" disabled={submitting} onClick={handleConfirm}>
          {submitting ? "Đang đặt..." : "XÁC NHẬN ĐẶT LỊCH"}
        </button>
      </div>

      {toast.open && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, open: false })} />
      )}
    </div>
  );
}

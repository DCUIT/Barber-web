import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Toast from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

function formatDateInput(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookingPro() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

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
    let cancelled = false;

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
    }


    API.get(
      `/bookings/calendar?barberId=${encodeURIComponent(selectedBarberId)}&date=${encodeURIComponent(bookingDate)}`,
      authHeader
    )
      .then((res) => {
        if (cancelled) return;
        setAvailableSlots(res.data?.slots || []);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableSlots([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBarberId, bookingDate, authHeader]);

  const selectedService = useMemo(
    () => services.find((s) => String(s._id) === String(selectedServiceId)),
    [services, selectedServiceId]
  );

  const selectedBarber = useMemo(
    () => barbers.find((b) => String(b._id) === String(selectedBarberId)),
    [barbers, selectedBarberId]
  );

  async function handleConfirm() {
    if (!selectedServiceId || !selectedBarberId || !bookingDate || !selectedTime) {
      setToast({ open: true, type: "error", message: "Vui lòng chọn đầy đủ dịch vụ, thợ, ngày và giờ." });
      return;
    }

    setConfirmModal({
      open: true,
      title: "Xác nhận đặt lịch",
      message: "Bạn có chắc muốn đặt lịch hẹn này?",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSubmitting(true);
        try {
          await API.post(
            "/bookings",
            {
              barberId: selectedBarberId,
              serviceId: selectedServiceId,
              bookingDate,
              bookingTime: selectedTime,
              note: note || "",
            },
            authHeader
          );

          setToast({ open: true, type: "success", message: "Đặt lịch thành công!" });
          setNote("");
          setSelectedTime("");

          API.get(
            `/bookings/calendar?barberId=${encodeURIComponent(selectedBarberId)}&date=${encodeURIComponent(bookingDate)}`,
            authHeader
          )
            .then((res) => setAvailableSlots(res.data?.slots || []))
            .catch(() => setAvailableSlots([]));
        } catch (e) {
          const msg = e?.response?.data?.msg || "Đặt lịch thất bại";
          setToast({ open: true, type: "error", message: msg });
        } finally {
          setSubmitting(false);
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bb-hero">
        <div className="bb-hero-content">
          <h1 className="bb-hero-title">
            ĐẶT LỊCH HẸN CẮT TÓC<br />TRỰC TUYẾN DỄ DÀNG
          </h1>
          <p className="bb-hero-subtitle">Trải nghiệm dịch vụ chuyên nghiệp ngay hôm nay!</p>
          <button
            className="bb-btn-main"
            onClick={() => document.getElementById("booking-pro")?.scrollIntoView({ behavior: "smooth" })}
          >
            ĐẶT LỊCH NGAY
          </button>
        </div>
      </header>

      <section id="booking-pro" className="bb-booking-container">
        <div className="bb-booking-card">
          <div className="bb-step">
            <h3>1. CHỌN DỊCH VỤ</h3>
            <select
              className="bb-control"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              <option value="">-- Chọn dịch vụ --</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bb-step">
            <h3>2. CHỌN STYLIST</h3>
            <select
              className="bb-control"
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
            >
              <option value="">-- Chọn barber --</option>
              {barbers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bb-step">
            <h3>3. CHỌN NGÀY & GIỜ</h3>
            <input
              type="date"
              className="bb-control"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />

            <div className="bb-time-slots">
              {loadingSlots ? (
                <div className="col-span-2 text-center text-gray-500">Đang tạo lịch...</div>
              ) : availableSlots.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500">Chưa có khung giờ trống</div>
              ) : (
                availableSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`bb-slot ${selectedTime === t ? "bb-slot-active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bb-step">
            <h3>GHI CHÚ (TÙY CHỌN)</h3>
            <textarea
              className="bb-control"
              rows={3}
              placeholder="Gợi ý kiểu tóc, lưu ý..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="bb-actions">
            <button
              className="bb-confirm"
              disabled={submitting}
              onClick={handleConfirm}
            >
              {submitting ? "Đang đặt..." : "XÁC NHẬN ĐẶT LỊCH"}
            </button>
            <div className="bb-summary">
              {selectedService ? (
                <span className="bb-pill">{selectedService.name}</span>
              ) : null}
              {selectedBarber ? (
                <span className="bb-pill">{selectedBarber.name}</span>
              ) : null}
              {selectedTime ? <span className="bb-pill">{selectedTime}</span> : null}
            </div>
          </div>
        </div>
      </section>

      {toast.open && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}
    </div>

    {/* CONFIRMATION DIALOG */}
    <ConfirmDialog
      open={confirmModal.open}
      title={confirmModal.title}
      message={confirmModal.message}
      onConfirm={confirmModal.onConfirm}
      onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
      type="info"
    />
  );
}


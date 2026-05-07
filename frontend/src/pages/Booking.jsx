import { useEffect, useMemo, useState } from "react";
import API from "../api";
import Toast from "../components/Toast";

import { useNavigate } from "react-router-dom";

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
    const id = window.queueMicrotask(() => setSelectedTime(""));

    if (!selectedBarberId || !bookingDate) {
      window.clearTimeout(id);
      // avoid setState synchronously in the effect body
      queueMicrotask(() => setAvailableSlots([]));
      return;
    }




    let cancelled = false;
    setLoadingSlots(true);

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Đặt lịch cắt tóc</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-xl mb-4">1) Chọn dịch vụ</h2>
            <div className="space-y-3">
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {typeof s.price === "number" ? `(${s.price}đ)` : ""}
                  </option>
                ))}
              </select>

              <h2 className="font-bold text-xl mb-1 mt-6">2) Chọn barber</h2>
              <select
                className="w-full border rounded-lg px-3 py-2"
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

              <div className="mt-6">
                <h2 className="font-bold text-xl mb-2">3) Chọn ngày</h2>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className="mt-6">
                <h2 className="font-bold text-xl mb-2">Ghi chú</h2>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Gợi ý kiểu tóc, lưu ý..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-xl mb-4">4) Chọn giờ</h2>

            <div className="mb-4">
              <div className="text-sm text-gray-500">Trạng thái: {loadingSlots ? "Đang tải" : "Sẵn sàng"}</div>
              {selectedService && selectedBarberId ? (
                <div className="text-gray-700 mt-2">
                  <span className="font-semibold">{selectedService.name}</span> cho <span className="font-semibold">{barbers.find(b => String(b._id)===String(selectedBarberId))?.name || ""}</span>
                </div>
              ) : null}
            </div>

            {availableSlots.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                {loadingSlots ? "Đang tạo lịch..." : "Chưa có khung giờ trống"}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`px-3 py-3 rounded-xl border font-semibold transition ${
                      selectedTime === t
                        ? "bg-red-600 text-white border-red-700"
                        : "bg-white hover:bg-red-50 border-gray-200 text-gray-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang đặt..." : "Xác nhận đặt lịch"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast.open && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}
    </div>
  );
}


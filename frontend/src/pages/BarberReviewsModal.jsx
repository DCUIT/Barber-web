import { useEffect, useMemo, useState } from "react";
import API from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function Stars({ rating = 0 }) {
  const v = Number(rating || 0);
  const full = Math.floor(v);
  const half = v - full >= 0.25 && v - full < 0.75; // Adjust half star logic
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} style={{ color: "#d4a373" }}>
          ★
        </span>
      ))}
      {half && (
        <span style={{ color: "#d4a373" }}>
          ☆
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} style={{ color: "#cfcfcf" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function BarberReviewsModal({ barber, onClose, onSubmitted }) {
  const { token } = useAuth(); // Sử dụng AuthContext
  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  const [bookingId, setBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!barber?._id) return;

    let cancelled = false;
    setLoading(true);
    API.get(`/reviews/barbers/${encodeURIComponent(barber._id)}`)
      .then((res) => {
        if (cancelled) return;
        setReviews(res.data || []);
      })
      .catch(() => {
        if (cancelled) return;
        setReviews([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [barber?._id]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingId) {
      toast.error("Vui lòng nhập bookingId để tạo review (bookingId chỉ hợp lệ khi status=Completed)");
      return;
    }

    setLoading(true);
    try {
      await API.post(
        "/reviews",
        {
          bookingId,
          rating: Number(rating),
          comment: comment || "",
        },
        authHeader
      );

      setBookingId("");
      setComment("");
      setRating(5);

      if (onSubmitted) onSubmitted();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Tạo review thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!barber) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reviews: {barber.name}</h2>
            <div className="mt-2 text-gray-600">
              Avg: <Stars rating={avgRating} /> <span className="ml-2">({avgRating.toFixed(1)})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <h3 className="font-bold">Danh sách reviews</h3>
          {loading && <div className="text-gray-500 mt-2">Đang tải...</div>}
          {!loading && reviews.length === 0 && <div className="text-gray-500 mt-2">Chưa có review</div>}

          {!loading && reviews.length > 0 && (
            <div className="space-y-3 mt-4">
              {reviews.map((r) => (
                <div key={r._id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{r.userId?.username || "User"}</div>
                    <div>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  {r.comment ? <p className="text-gray-700 mt-2">{r.comment}</p> : null}
                  <div className="text-xs text-gray-400 mt-2">
                    Booking: {r.bookingId?._id || r.bookingId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 border-t pt-5">
          <h3 className="font-bold">Tạo review</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700">BookingId</label>
              <input
                className="w-full border p-2 rounded bg-white text-gray-900"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="bookingId (status=Completed)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Rating (1-5)</label>
              <select
                className="w-full border p-2 rounded bg-white text-gray-900"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700">Comment</label>
            <textarea
              className="w-full border p-2 rounded bg-white text-gray-900"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bạn muốn nói gì về barber?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi review"}
          </button>
        </form>

        <div className="text-xs text-gray-400 mt-4">
          Lưu ý: Server chỉ cho phép review khi booking status = Completed.
        </div>
      </div>
    </div>
  );
}

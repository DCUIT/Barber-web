import { useState, useEffect } from 'react';
import axios from 'axios';
import Spinner from './Spinner';

/**
 * Calendar Component
 * Hiển thị các khung giờ trống của Barber dựa trên ngày được chọn.
 * Tích hợp với API: GET /api/bookings/calendar?barberId=...&date=...
 */
export default function Calendar({ barberId, onSelectSlot }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!barberId) return;

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/bookings/calendar`, {
          params: { barberId, date: selectedDate }
        });
        setSlots(response.data.slots || []);
      } catch (err) {
        setError("Không thể tải danh sách khung giờ trống.");
        console.error("Calendar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [barberId, selectedDate]);

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
          <i className="fas fa-clock text-blue-500"></i>
          Chọn Giờ Hẹn
        </h3>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {loading ? (
        <div className="py-10"><Spinner /></div>
      ) : error ? (
        <div className="text-red-500 text-sm py-4">{error}</div>
      ) : slots.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-center py-8 italic bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          Không có khung giờ nào khả dụng trong ngày này.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectSlot(selectedDate, slot)}
              className="py-2 px-1 text-sm font-medium rounded-md border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

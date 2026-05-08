import { useEffect, useState, useCallback } from "react";
import API from "../api";
import { parseItems, calculateOrderTotal } from "../utils/parseOrder.jsx";
import { formatCurrency as formatPrice } from "../utils/formatPrice";
import ConfirmDialog from "../components/ConfirmDialog";

const STATUS_LABELS = {
  pending: { bg: "bg-yellow-100", fg: "text-yellow-800", label: "Chờ xử lý" },
  paid: { bg: "bg-green-100", fg: "text-green-800", label: "Đã thanh toán" },
  cancelled: { bg: "bg-red-100", fg: "text-red-800", label: "Đã hủy" },
  refunded: { bg: "bg-gray-100", fg: "text-gray-800", label: "Đã hoàn tiền" },
};

function getStatusBadge(status) {
  const key = String(status || "").toLowerCase();
  const v = STATUS_LABELS[key] || STATUS_LABELS.pending;
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${v.bg} ${v.fg}`}>{v.label}</span>
  );
}

// Trang Menu cũ (Food/Order) không còn dùng trong Barber Booking.
// Route /my-orders đã bị xóa khỏi App.jsx. File này giữ lại để tránh import gãy ở branch cũ.

export default function Menu() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">🧑‍💼</div>
        <h1 className="text-2xl font-bold">Không còn trang Food/Order</h1>
        <p className="text-gray-600 mt-2">Vui lòng vào Booking để đặt lịch.</p>
        <a
          href="/booking"
          className="inline-block mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold"
        >
          Go to Booking
        </a>
      </div>
    </div>
  );
}



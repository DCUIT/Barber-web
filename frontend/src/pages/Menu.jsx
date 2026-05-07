import { useEffect, useState } from "react";
import API from "../api";
import { parseItems, calculateOrderTotal, getStatusBadge, ORDER_STATUSES } from "../utils/parseOrder.jsx";
import { formatCurrency as formatPrice } from "../utils/formatPrice";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Menu() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  async function fetchOrders() {
    if (token) {
      try {
        const res = await API.get("/orders", authHeader);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    }
    setLoading(false);
  }

  async function handleCancelOrder(orderId) {
    try {
      await API.put(`/orders/${orderId}/cancel`, {}, authHeader);
      fetchOrders();
      setSelectedOrder(null);
      alert(`Đã hủy đơn #${orderId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Hủy đơn thất bại!");
    }
  }

  // Confirm handlers
  const handleActionClick = (orderId, action) => {
    setPendingAction({ orderId, action });
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (pendingAction?.action === "cancel") {
      handleCancelOrder(pendingAction.orderId);
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  const getStatusBadge = (status) => {
    const colors = { pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", refunded: "bg-gray-100 text-gray-800" };
    const labels = { pending: "Chờ xử lý", paid: "Đã thanh toán", cancelled: "Đã hủy", refunded: "Đã hoàn tiền" };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status] || colors.pending}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Title */}
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">
          Lịch Sử Đặt Món
        </h1>
      </section>

      {/* Orders List */}
      <main className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-10">Đang tải...</div>
        ) : !token ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem lịch sử đặt món</p>
            <a href="/login" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
              Đăng nhập
            </a>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-6xl mb-4">🍽️</p>
            <p className="text-gray-500">Bạn chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {orders.map(order => {
              const items = parseItems(order.items);
              const total = calculateOrderTotal(items);
              return (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <div>
                      <span className="font-bold text-lg">Đơn hàng #{order.id}</span>
                      <span className="ml-2 text-gray-500 text-sm">{order.created_at?.slice(0, 10) || ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-orange-500 font-bold text-xl">{formatPrice(total)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-3">Click xem chi tiết →</div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Order Detail Modal - with action buttons */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">Chi tiết đơn hàng #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-500">Khách hàng:</div>
                <div className="font-semibold">{selectedOrder.user}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Trạng thái:</div>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div>
                <div className="text-sm text-gray-500">Ngày đặt:</div>
                <div>{selectedOrder.created_at || "Không có thông tin"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Danh sách món:</div>
                <div className="space-y-2">
                  {parseItems(selectedOrder.items).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">x{item.quantity}</div>
                      </div>
                      <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-yellow-600">{formatPrice(calculateOrderTotal(parseItems(selectedOrder.items)))}</span>
                </div>
              </div>
              
              {/* Action buttons for user account */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">Hành động:</div>
                <div className="flex flex-wrap gap-2">
                  {/* Pending: User can cancel */}
                  {selectedOrder.status === ORDER_STATUSES.PENDING && (
                    <button 
                      onClick={() => handleActionClick(selectedOrder.id, "cancel")} 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-semibold"
                    >
                      ✕ Hủy đơn
                    </button>
                  )}
                  {/* Cancelled/Refunded: Show message */}
                  {(selectedOrder.status === ORDER_STATUSES.CANCELLED || selectedOrder.status === ORDER_STATUSES.REFUNDED) && (
                    <div className="text-gray-500 text-center py-2 w-full">
                      Đơn hàng đã {selectedOrder.status === ORDER_STATUSES.CANCELLED ? "bị hủy" : "được hoàn tiền"}
                    </div>
                  )}
                  {/* Paid: Show info - cannot refund (only admin) */}
                  {selectedOrder.status === ORDER_STATUSES.PAID && (
                    <div className="text-gray-500 text-center py-2 w-full">
                      Liên hệ admin để hoàn tiền
                    </div>
                  )}
                </div>
              </div>
              
              <button onClick={() => setSelectedOrder(null)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded mt-2">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Xác nhận hủy đơn"
        message="Hủy đơn hàng này? Hành động này không thể hoàn tác."
        confirmText="✕ Hủy đơn"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}

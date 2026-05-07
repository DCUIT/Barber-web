// OrderModal component - Tách ra từ Admin.jsx để tránh inline modal quá lớn
import { useState } from "react";
import { getStatusBadge, parseItems, calculateOrderTotal, ORDER_STATUSES } from "../utils/parseOrder.jsx";
import { formatCurrency as formatPrice } from "../utils/formatPrice";
import ConfirmDialog from "./ConfirmDialog";

export default function OrderModal({ order, onClose, onUpdateStatus }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  if (!order) return null;
  
  const items = parseItems(order.items);
  const total = calculateOrderTotal(items);

  // Prepare action handlers
  const actions = {
    [ORDER_STATUSES.PAID]: {
      title: "Xác nhận thanh toán",
      message: "Đánh dấu đơn hàng này là ĐÃ THANH TOÁN?",
      confirmText: "✓ Xác nhận",
      type: "success"
    },
    [ORDER_STATUSES.CANCELLED]: {
      title: "Xác nhận hủy đơn",
      message: "Hủy đơn hàng này? Hành động này không thể hoàn tác.",
      confirmText: "✕ Hủy đơn",
      type: "danger"
    },
    [ORDER_STATUSES.REFUNDED]: {
      title: "Xác nhận hoàn tiền",
      message: "HOÀN TIỀN cho đơn hàng này?",
      confirmText: "↩ Hoàn tiền",
      type: "warning"
    }
  };

  const handleActionClick = (newStatus) => {
    setPendingAction({ status: newStatus, ...actions[newStatus] });
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (pendingAction) {
      onUpdateStatus(order.id, pendingAction.status);
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-lg">Chi tiết đơn hàng #{order.id}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="text-sm text-gray-500">Khách hàng:</div>
              <div className="font-semibold">{order.user}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Trạng thái:</div>
              {getStatusBadge(order.status)}
            </div>
            <div>
              <div className="text-sm text-gray-500">Ngày đặt:</div>
              <div>{order.created_at || "Không có thông tin"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">Danh sách món:</div>
              <div className="space-y-2">
                {items.map((item, idx) => (
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
                <span className="text-yellow-600">{formatPrice(total)}</span>
              </div>
            </div>
            
            {/* BUTTONS FOR ALL STATUSES */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500 mb-2">Hành động:</div>
              <div className="flex flex-wrap gap-2">
                {/* Pending: Show 2 buttons */}
                {order.status === ORDER_STATUSES.PENDING && (
                  <>
                    <button 
                      onClick={() => handleActionClick(ORDER_STATUSES.PAID)} 
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-semibold"
                    >
                      ✓ Đánh dấu đã thanh toán
                    </button>
                    <button 
                      onClick={() => handleActionClick(ORDER_STATUSES.CANCELLED)} 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-semibold"
                    >
                      ✕ Hủy đơn
                    </button>
                  </>
                )}
                {/* Paid: Show refund button */}
                {order.status === ORDER_STATUSES.PAID && (
                  <button 
                    onClick={() => handleActionClick(ORDER_STATUSES.REFUNDED)} 
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-semibold"
                  >
                    ↩ Hoàn tiền
                  </button>
                )}
                {/* Cancelled/Refunded: Show message */}
                {(order.status === ORDER_STATUSES.CANCELLED || order.status === ORDER_STATUSES.REFUNDED) && (
                  <div className="text-gray-500 text-center py-2">
                    Đơn hàng đã {order.status === ORDER_STATUSES.CANCELLED ? "bị hủy" : "được hoàn tiền"}
                  </div>
                )}
                {/* Close button */}
                <button 
                  onClick={onClose} 
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded mt-2"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title={pendingAction?.title || "Xác nhận"}
        message={pendingAction?.message || ""}
        confirmText={pendingAction?.confirmText || "Xác nhận"}
        cancelText="Hủy"
        type={pendingAction?.type || "warning"}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}

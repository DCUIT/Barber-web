// Confirm Dialog component - Modal xác nhận hành động
export default function ConfirmDialog({ open, title, message, confirmText = "Xác nhận", cancelText = "Hủy", onConfirm, onCancel, type = "warning" }) {
  if (!open) return null;

  const colors = {
    warning: "bg-yellow-500 hover:bg-yellow-600",
    danger: "bg-red-500 hover:bg-red-600",
    success: "bg-green-500 hover:bg-green-600",
    info: "bg-blue-500 hover:bg-blue-600"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6 shadow-xl">
        <div className="text-center">
          {/* Icon */}
          <div className="text-5xl mb-4">
            {type === "warning" && "⚠️"}
            {type === "danger" && "🛑"}
            {type === "success" && "✅"}
            {type === "info" && "ℹ️"}
          </div>
          
          {/* Title */}
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          
          {/* Message */}
          <p className="text-gray-500 mb-6">{message}</p>
          
          {/* Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded font-semibold"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 text-white py-2 px-4 rounded font-semibold ${colors[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

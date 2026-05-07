import { useState } from "react";
import Toast from "./Toast";
import { formatPrice } from "../utils/formatPrice";

export default function FoodCard({ food, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const [buttonText, setButtonText] = useState(`Thêm ${quantity} vào giỏ`);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleAddToCart = () => {
    // Guest có thể thêm vào giỏ - không bắt buộc login
    // Chỉ check login khi thanh toán
    onAdd({ id: food.id, quantity });

    // Show toast
    setToastMessage(`Đã thêm ${quantity} ${food.name} vào giỏ!`);
    setShowToast(true);

    // Change button text temporarily
    setButtonText("✔ Đã thêm");
    setTimeout(() => {
      setButtonText(`Thêm ${quantity} vào giỏ`);
    }, 2000);

    // Trigger cart icon bounce - sử dụng đúng event type
    window.dispatchEvent(new Event("cartBounce"));

    setQuantity(1); // Reset after add
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500"}
          alt={food.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition duration-500"
        />
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800">{food.name}</h3>
        <p className="text-orange-500 font-bold text-xl my-2">{formatPrice(food.price)}</p>

        <div className="flex items-center justify-center space-x-3 mb-4 p-2 bg-gray-50 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition text-gray-600 font-bold text-lg"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="font-bold text-xl min-w-[3rem] text-center bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition text-gray-600 font-bold text-lg"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-bold hover:bg-orange-600 transition shadow-md shadow-orange-200"
        >
          {buttonText}
        </button>
      </div>
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

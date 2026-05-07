import { useState, useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`}>
      <div className="flex items-center gap-2">
        <i className={`fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}
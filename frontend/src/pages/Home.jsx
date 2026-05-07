import { useEffect, useState } from "react";
import API from "../api";
import { addToCart } from "../utils/useCart";

import Skeleton from "../components/Skeleton";
import Banner from "../components/Banner";
import FoodCard from "../components/FoodCard";

const categories = [
  { icon: "🍜", name: "Phở" },
  { icon: "🥗", name: "Bún Chả" },
  { icon: "🍛", name: "Cơm Tấm" },
  { icon: "🥖", name: "Bánh Mì" },
  { icon: "🍿", name: "Đồ Ăn Vặt" },
  { icon: "🍹", name: "Thức Uống" },
];

export default function Home() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    API.get("/foods").then(res => {
      setFoods(res.data);
      setLoading(false);
    });
  }, []);

  const handleAddToCart = (cartItem) => {
    // Sử dụng utility useCart - đã có migrate tự động
    addToCart(cartItem);
  };

  // Hiển tất cả món (chưa có category trong DB)
  const filteredFoods = foods;

  return (
    <div className="bg-gray-50">
      <Banner />

      {/* Menu Title */}
      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">
          Thực Đơn Đa Dạng
        </h1>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 mb-10">
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`flex flex-col items-center p-4 rounded-xl shadow-lg w-24 transition transform hover:scale-105 ${
              selectedCategory === null 
                ? "bg-green-500 text-white" 
                : "bg-white text-gray-700 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            <span className="text-2xl mb-1">🍽️</span>
            <span className="text-sm font-bold">Tất cả</span>
          </button>
          
          {categories.map((cat) => (
            <button 
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex flex-col items-center p-4 rounded-xl w-24 border border-gray-100 transition transform hover:scale-105 ${
                selectedCategory === cat.name
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-sm font-bold">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Food Grid */}
      <main className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredFoods.map(f => (
                <FoodCard key={f.id} food={f} onAdd={handleAddToCart} />
              ))}
            </div>

            {/* Pagination - placeholder (chưa có backend pagination) */}
            {filteredFoods.length > 0 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">1</button>
                <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition">2</button>
                <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition">3</button>
                <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

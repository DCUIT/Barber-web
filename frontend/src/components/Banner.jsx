import { useState } from "react";

export default function Banner() {
  const [search, setSearch] = useState("");

  return (
    <section className="relative h-[400px] flex items-center justify-center text-white text-center">
      <img
        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1350&q=80"
        className="absolute inset-0 w-full h-full object-cover brightness-50"
        alt="Banner"
      />
      <div className="relative z-10 px-4 w-full max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 uppercase tracking-wider">
          Ẩm Thực Việt Nam Trong Tầm Tay
        </h1>
        <p className="text-lg mb-8">Giao hàng nhanh chóng, món ngon nóng hổi, đa dạng lựa chọn!</p>
        <div className="max-w-2xl mx-auto flex bg-white rounded-lg overflow-hidden shadow-lg">
          <input
            type="text"
            placeholder="Tìm món ăn, nhà hàng..."
            className="flex-1 px-6 py-4 text-gray-800 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="bg-green-600 px-8 py-4 font-bold hover:bg-green-700 transition text-white">
            TÌM KIẾM
          </button>
        </div>
      </div>
    </section>
  );
}

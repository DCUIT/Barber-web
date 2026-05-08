import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";


import Skeleton from "../components/Skeleton";
import Banner from "../components/Banner";

export default function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/services")
      .then((res) => {
        setServices(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setServices([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-gray-50">
      <Banner />

      <section className="py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 uppercase tracking-tight">
          Barber Booking Web
        </h1>
        <p className="mt-3 text-gray-600">Chọn dịch vụ • chọn barber • chọn giờ • xác nhận</p>
      </section>

      <main className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 6).map((s) => (
              <div
                key={s._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow p-5"
              >
                <img
                  src={s.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600"}
                  alt={s.name}
                  className="w-full h-44 object-cover rounded-xl mb-4"
                />
                <h3 className="font-bold text-lg text-gray-900">{s.name}</h3>
                <div className="text-orange-600 font-bold mt-2">
                  {typeof s.price === "number" ? `${s.price}đ` : ""}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {s.duration ? `${s.duration} phút` : ""}
                </div>
                <button
                  onClick={() => navigate("/booking")}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold"
                >
                  Đặt lịch
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


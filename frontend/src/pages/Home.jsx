import { useEffect, useState } from "react";

import API from "../api";
import { useNavigate } from "react-router-dom";
import "../style.css";
import BarberReviewsModal from "./BarberReviewsModal";




export default function Home() {
  const navigate = useNavigate();


  // State cho form đặt lịch nhanh
  const [quickBooking, setQuickBooking] = useState({
    name: "",
    phone: "",
    date: "",
    serviceId: ""
  });

  const [services, setServices] = useState([]);

  const [selectedBarber, setSelectedBarber] = useState(null);


  useEffect(() => {
    API.get("/services")
      .then((res) => {
        setServices(res.data || []);
      })
      .catch(() => {
        setServices([]);
      });
  }, []);

  return (
    <div className="home-wrapper">


      {/* HERO SECTION - Refined layout */}
      <section className="relative min-h-[500px] lg:h-[650px] flex items-center px-4 md:px-[10%] py-12 lg:py-0 overflow-hidden bg-black">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1500')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-1"></div>

        <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#c5a059] leading-tight mb-4 drop-shadow-2xl">
              THE CUTTING <br /> EDGE BARBER
            </h1>
            <p className="text-white text-base md:text-xl tracking-[0.2em] font-light mb-8 opacity-90 uppercase">
              Chăm sóc toàn diện cho quý ông đích thực
            </p>
            <button 
              onClick={() => navigate("/booking")}
              className="border-2 border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] hover:text-black transition-all px-10 py-4 font-black uppercase tracking-widest text-sm"
            >
              Đặt lịch ngay
            </button>
          </div>

          {/* Quick Booking Form - Styled as Dark Red/Burgundy */}
          <div className="bg-[#8b0000]/90 p-8 rounded-lg w-full max-w-[360px] shadow-2xl backdrop-blur-sm border border-white/10">
            <h3 className="text-white font-black text-xl text-center mb-6 tracking-widest border-b border-white/20 pb-4">
              ĐẶT LỊCH ONLINE
            </h3>
            <form 
              className="space-y-4"
              onSubmit={(e) => { 
                e.preventDefault(); 
                navigate("/booking", { state: { quickBooking } }); 
              }}
            >
              <input 
                type="text" 
                placeholder="Tên của bạn" 
                className="w-full p-3 rounded bg-white text-black outline-none focus:ring-2 focus:ring-[#c5a059]"
                value={quickBooking.name}
                onChange={(e) => setQuickBooking({...quickBooking, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Số điện thoại" 
                className="w-full p-3 rounded bg-white text-black outline-none focus:ring-2 focus:ring-[#c5a059]"
                value={quickBooking.phone}
                onChange={(e) => setQuickBooking({...quickBooking, phone: e.target.value})}
              />
              <input 
                type="date" 
                className="w-full p-3 rounded bg-white text-black outline-none"
                value={quickBooking.date}
                onChange={(e) => setQuickBooking({...quickBooking, date: e.target.value})}
              />
              <select 
                className="w-full p-3 rounded bg-white text-black outline-none"
                value={quickBooking.serviceId}
                onChange={(e) => setQuickBooking({...quickBooking, serviceId: e.target.value})}
              >
                <option value="">Chọn dịch vụ</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <button type="submit" className="w-full py-4 bg-[#c5a059] text-black font-black uppercase tracking-widest hover:bg-white transition-colors">
                Xác nhận đặt lịch
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SERVICE HIGHLIGHTS */}
      <section className="ce-section ce-services">
        <div className="ce-container">
          <div className="ce-heading">
            <h2 className="ce-title">DỊCH VỤ NỔI BẬT</h2>
            <div className="ce-underline" />
            <p className="ce-subtitle">
              Lựa chọn nhanh — chuẩn barber, phong cách rõ nét.
            </p>
          </div>

          <div className="ce-grid">
            {(services.length ? services : []).slice(0, 3).map((s) => (
              <div key={s._id} className="ce-card ce-card--service">
                <div className="ce-cardIcon">✂️</div>
                <h3 className="ce-cardTitle">{s.name}</h3>
                <div className="ce-cardDivider" />
                <div className="ce-cardPrice">
                  {new Intl.NumberFormat("vi-VN").format(s.price)}đ
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="ce-card ce-card--service ce-card--skeleton">
                Đang tải dịch vụ...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="ce-section ce-why">
        <div className="ce-container">
          <div className="ce-heading ce-heading--center">
            <h2 className="ce-title">TẠI SAO CHỌN CHÚNG TÔI</h2>
            <div className="ce-underline" />
          </div>

          <div className="ce-whyGrid">
            <div className="ce-whyCard">
              <div className="ce-whyIcon">🏆</div>
              <h3 className="ce-whyTitle">KỸ THUẬT TỈ MỈ</h3>
              <p className="ce-whyText">Từng đường cắt được cân đo để lên form đẹp & bền dáng.</p>
            </div>
            <div className="ce-whyCard">
              <div className="ce-whyIcon">✨</div>
              <h3 className="ce-whyTitle">PHONG CÁCH RÕ RỆT</h3>
              <p className="ce-whyText">Tư vấn kiểu tóc phù hợp — tối ưu gương mặt và chất tóc.</p>
            </div>
            <div className="ce-whyCard">
              <div className="ce-whyIcon">🧴</div>
              <h3 className="ce-whyTitle">CHUẨN CHĂM SÓC</h3>
              <p className="ce-whyText">Sản phẩm & quy trình giúp mái tóc sạch, vào nếp nhanh.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY (static samples) */}
      <section className="ce-section ce-gallery">
        <div className="ce-container">
          <div className="ce-heading ce-heading--center">
            <h2 className="ce-title">TRẢI NGHIỆM TẠI STUDIO</h2>
            <div className="ce-underline" />
          </div>

          <div className="ce-galleryGrid">
            {[
              "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=80",
              "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80&dpr=2",
              "https://images.unsplash.com/photo-1593702295094-01314950b64d?auto=format&fit=crop&w=900&q=80&dpr=2",
              "https://images.unsplash.com/photo-1622286330961-a1c94474409f?auto=format&fit=crop&w=900&q=80&dpr=2",

            ].map((src, idx) => (
              <div key={src} className="ce-galleryItem">
                <img src={src} alt={`gallery-${idx}`} className="ce-galleryImg" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews modal giữ nguyên (không dùng section cũ) */}
      {selectedBarber ? (
        <BarberReviewsModal
          barber={selectedBarber}
          onClose={() => setSelectedBarber(null)}
          onSubmitted={() => {
            // Refresh barbers if needed
          }}
        />
      ) : null}


    </div>
  );
}

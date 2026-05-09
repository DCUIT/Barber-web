import { useEffect, useState } from "react";

function renderStars(rating) {
  const v = Number(rating || 0);
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} style={{ color: "#d4a373" }}>★</span>
      ))}
      {half && <span style={{ color: "#d4a373" }}>☆</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} style={{ color: "#cfcfcf" }}>★</span>
      ))}
    </span>
  );
}

import API from "../api";
import { useNavigate } from "react-router-dom";
import "../style.css";

export default function Home() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
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

    API.get("/barbers")
      .then((res) => setBarbers(res.data || []))
      .catch(() => setBarbers([]));
  }, []);

  return (
    <div className="home-wrapper">
      {/* HERO */}
      <section className="hero">
        <div className="booking-container">
          <h2>TRẢI NGHIỆM CẮT TÓC CHUẨN MỰC</h2>
          <div className="booking-form">
            <h3>ĐẶT LỊCH HẸN NGAY</h3>
            <form onSubmit={(e) => { e.preventDefault(); navigate("/booking"); }}>
              {/* SERVICE */}
              <div className="form-group">
                <label>1. CHỌN DỊCH VỤ</label>
                <select required>
                  <option value="">Cắt Tóc, Cạo Râu, Gội Đầu...</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} - {new Intl.NumberFormat("vi-VN").format(s.price)}đ
                    </option>
                  ))}
                </select>
              </div>

              {/* BARBER */}
              <div className="form-group">
                <label>2. CHỌN BARBER</label>
                <select required>
                  <option value="">Nguyễn Nam, Trần Lâm, Lê Anh...</option>
                  {barbers.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE + TIME */}
              <div className="form-row">
                <div className="form-group">
                  <label>3. CHỌN NGÀY</label>
                  <input type="date" required />
                </div>
                <div className="form-group">
                  <label>& GIỜ</label>
                  <input type="time" required />
                </div>
              </div>

              {/* BUTTON */}
              <button type="submit" className="btn-submit">ĐẶT HẸN NGAY!</button>
            </form>
          </div>
        </div>
      </section>

      {/* Simple barber rating (stars) */}
      <section className="services" style={{ marginTop: 24 }}>
        <h2>Barber Rating</h2>
        {loading ? (
          <div className="text-center">Đang tải...</div>
        ) : (
          <div className="grid-container text-black">
            {barbers.slice(0, 3).map((b) => (
              <div key={b._id} className="card">
                <img
                  src={b.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500"}
                  alt={b.name}
                />
                <div className="card-info">
                  <h4 className="font-bold">{b.name.toUpperCase()}</h4>
                  <p className="price">{b.specialty || "Barber"}</p>
                  <p className="duration">{renderStars(b.rating)} ({b.rating?.toFixed ? b.rating.toFixed(1) : b.rating})</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SERVICES */}
      <section className="services">
        <h2>DỊCH VỤ CỦA CHÚNG TÔI</h2>
        {loading ? (
          <div className="text-center">Đang tải...</div>
        ) : (
          <div className="grid-container text-black"> {/* Ensure text is black on white cards */}
            {services.slice(0, 3).map((s) => (
              <div key={s._id} className="card">
                  <img 
                  src={s.image || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500"} 
                  alt={s.name} 
                />
                <div className="card-info">
                  <h4 className="font-bold">{s.name.toUpperCase()}</h4>
                  <p className="price">{new Intl.NumberFormat("vi-VN").format(s.price)}đ</p>
                  <p className="duration">{s.durationMinutes ? `${s.durationMinutes} phút` : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
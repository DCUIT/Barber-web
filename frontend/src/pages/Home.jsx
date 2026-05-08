import { useEffect, useState } from "react";
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
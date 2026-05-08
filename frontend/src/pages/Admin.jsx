import { useEffect, useState } from "react";
import API from "../api";
import { formatCurrency as formatPrice } from "../utils/formatPrice"; // Giả sử hàm này vẫn dùng được cho VNĐ

const TABS = { DASHBOARD: "dashboard", SERVICES: "services", BARBERS: "barbers", BOOKINGS: "bookings", USERS: "users" };

export default function Admin() {
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  // Form states cho Dịch vụ & Barber
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "", image: "", description: "" });
  const [barberForm, setBarberForm] = useState({ name: "", specialty: "", experience: "" });
  
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === TABS.DASHBOARD) {
        const res = await API.get("/bookings", authHeader); // Lấy booking để tính stats tạm thời
        setStats({
          totalBookings: res.data.length,
          totalRevenue: res.data.reduce((acc, curr) => acc + (curr.serviceId?.price || 0), 0),
          totalBarbers: 6, // Hardcoded tạm thời hoặc fetch /barbers
          totalUsers: 15
        });
      }
      if (activeTab === TABS.SERVICES) {
        const res = await API.get("/services");
        setServices(res.data);
      }
      if (activeTab === TABS.BARBERS) {
        const res = await API.get("/barbers");
        setBarbers(res.data);
      }
      if (activeTab === TABS.BOOKINGS) {
        const res = await API.get("/bookings", authHeader);
        setBookings(res.data);
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await API.put(`/bookings/${id}`, { status }, authHeader);
      setSuccess("Cập nhật trạng thái thành công");
      fetchData();
    } catch (err) {
      setError("Cập nhật thất bại");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0c0c0c]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-white p-6 hidden md:block">
        <div className="text-[#d4a373] font-bold text-xl mb-10 tracking-widest uppercase">Admin Panel</div>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab(TABS.DASHBOARD)} className={`w-full text-left p-3 rounded ${activeTab === TABS.DASHBOARD ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-chart-line mr-3"></i> Dashboard
          </button>
          <button onClick={() => setActiveTab(TABS.BOOKINGS)} className={`w-full text-left p-3 rounded ${activeTab === TABS.BOOKINGS ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-calendar-alt mr-3"></i> Bookings
          </button>
          <button onClick={() => setActiveTab(TABS.SERVICES)} className={`w-full text-left p-3 rounded ${activeTab === TABS.SERVICES ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-cut mr-3"></i> Dịch vụ
          </button>
          <button onClick={() => setActiveTab(TABS.BARBERS)} className={`w-full text-left p-3 rounded ${activeTab === TABS.BARBERS ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-user-friends mr-3"></i> Barbers
          </button>
          <button onClick={() => setActiveTab(TABS.USERS)} className={`w-full text-left p-3 rounded ${activeTab === TABS.USERS ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-users mr-3"></i> Users
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 capitalize">{activeTab}</h2>
          <div className="text-gray-500">Xin chào, Admin</div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-6">{success}</div>}

        {/* DASHBOARD TAB */}
        {activeTab === TABS.DASHBOARD && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
              <div className="text-gray-400 text-sm uppercase font-bold">Total Bookings</div>
              <div className="text-3xl font-bold">{stats.totalBookings}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <div className="text-gray-400 text-sm uppercase font-bold">Revenue</div>
              <div className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div className="text-gray-400 text-sm uppercase font-bold">Users</div>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
              <div className="text-gray-400 text-sm uppercase font-bold">Barbers</div>
              <div className="text-3xl font-bold">{stats.totalBarbers}</div>
            </div>
          </div>
        )}

        {/* BOOKINGS TABLE */}
        {activeTab === TABS.BOOKINGS && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-bold">Khách hàng</th>
                  <th className="p-4 font-bold">Dịch vụ</th>
                  <th className="p-4 font-bold">Stylist</th>
                  <th className="p-4 font-bold">Ngày & Giờ</th>
                  <th className="p-4 font-bold">Trạng thái</th>
                  <th className="p-4 font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">{b.userId?.username || "Guest"}</td>
                    <td className="p-4">{b.serviceId?.name}</td>
                    <td className="p-4">{b.barberId?.name}</td>
                    <td className="p-4 text-sm">
                      {b.bookingDate} <br /> <span className="text-gray-400">{b.bookingTime}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        b.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
                        b.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        className="border rounded p-1 text-sm"
                        value={b.status}
                        onChange={(e) => updateBookingStatus(b._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accept</option>
                        <option value="Completed">Complete</option>
                        <option value="Cancelled">Cancel</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CÁC TAB KHÁC (SERVICES/BARBERS) SẼ TIẾP TỤC ĐƯỢC XÂY DỰNG THEO CẤU TRÚC NÀY */}
        {(activeTab === TABS.SERVICES || activeTab === TABS.BARBERS) && (
          <div className="text-center py-20 bg-white rounded-xl">
            <i className="fas fa-tools text-5xl text-gray-200 mb-4"></i>
            <p className="text-gray-500">Tính năng quản lý {activeTab} đang được hoàn thiện...</p>
          </div>
        )}
      </main>
      </div>
  );
}

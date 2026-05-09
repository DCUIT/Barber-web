import { useEffect, useState, useCallback, useMemo } from "react";
import API from "../api";
import { formatCurrency as formatPrice } from "../utils/formatPrice"; // Giả sử hàm này vẫn dùng được cho VNĐ
import { io } from "socket.io-client"; // Import socket.io-client
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";

const TABS = { DASHBOARD: "dashboard", SERVICES: "services", BARBERS: "barbers", BOOKINGS: "bookings", USERS: "users" };

const TAB_LABELS = {
  [TABS.DASHBOARD]: "Bảng điều khiển",
  [TABS.BOOKINGS]: "Quản lý lịch hẹn",
  [TABS.SERVICES]: "Quản lý dịch vụ",
  [TABS.BARBERS]: "Đội ngũ Stylists",
  [TABS.USERS]: "Quản lý người dùng"
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  // Form states cho Dịch vụ & Barber
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", durationMinutes: "", image: "", description: "" });
  const [barberForm, setBarberForm] = useState({ name: "", specialty: "", experienceYears: "", avatar: "" });
  const [uploadingImage, setUploadingImage] = useState(false); // State để quản lý trạng thái upload ảnh
  
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal confirmation states
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // States cho Search & Filter Bookings
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBarberId, setFilterBarberId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  // States cho Pagination Bookings
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Số lượng mục trên mỗi trang
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [dashboardChartData, setDashboardChartData] = useState([]);
  
  const { token } = useAuth(); // Sử dụng AuthContext
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  // Make fetchData a useCallback to prevent unnecessary re-renders and issues with socket.io useEffect
  const fetchData = useCallback(async () => {
    if (!token) { // Ensure token exists before fetching data
      // navigate("/login"); // Or handle re-authentication
      return;
    }
    setLoading(true);
    try {
      if (activeTab === TABS.DASHBOARD) {
        // Lấy 100 booking gần nhất để vẽ biểu đồ (thay vì chỉ 10 như mặc định)
        const res = await API.get("/bookings?limit=100", authHeader);
        const barbersRes = await API.get("/barbers");
        const usersRes = await API.get("/auth/users", authHeader);

        const allBookings = res.data.bookings || res.data; // Hỗ trợ cả 2 cấu trúc
        setBookings(Array.isArray(allBookings) ? allBookings : []);
        setStats({
          totalBookings: res.data.totalCount || allBookings.length,
          totalRevenue: Array.isArray(allBookings) ? allBookings.reduce((acc, curr) => acc + (curr.serviceId?.price || 0), 0) : 0,
          totalBarbers: barbersRes.data.length,
          totalUsers: usersRes.data.length
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
        let url = `/bookings?page=${currentPage}&limit=${itemsPerPage}&`;
        if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
        if (filterBarberId) url += `barberId=${encodeURIComponent(filterBarberId)}&`;
        if (filterStatus) url += `status=${encodeURIComponent(filterStatus)}&`;
        
        const res = await API.get(url, authHeader);
        setBookings(res.data.bookings); // Giả định backend trả về { bookings: [], totalCount: X }
        setTotalBookingsCount(res.data.totalCount);

        // Đảm bảo barbers đã được load để dùng cho filter
        const barbersRes = await API.get("/barbers");
        setBarbers(barbersRes.data || []);
      }
      if (activeTab === TABS.USERS) {
        const res = await API.get("/auth/users", authHeader); // Giả định endpoint backend
        setUsers(res.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, itemsPerPage, searchTerm, filterBarberId, filterStatus, authHeader, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on fetchData

  // Cập nhật tiêu đề trang web tương ứng với tab đang chọn
  useEffect(() => {
    document.title = `${TAB_LABELS[activeTab]} | The Cutting Edge Admin`;
  }, [activeTab]);

  // Socket.io integration
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"); // Connect to your backend socket server

    socket.on('connect', () => {
      console.log('Connected to Socket.io server from Admin');
    });

    socket.on('newBooking', (newBooking) => {
      toast.success(`Khách ${newBooking.userId?.username || 'mới'} vừa đặt lịch!`, { duration: 5000 });
      // Luôn refetch nếu ở Dashboard để cập nhật số lượng và doanh thu
      if (activeTab === TABS.BOOKINGS || activeTab === TABS.DASHBOARD) {
        fetchData();
      }
    });

    socket.on('bookingUpdated', (updatedBooking) => {
      console.log('Booking updated:', updatedBooking);
      if (activeTab === TABS.BOOKINGS) {
        fetchData(); // Refetch data to update the list
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server from Admin');
    });

    return () => { socket.disconnect(); }; // Clean up socket connection
  }, [activeTab, fetchData]); // Depend on activeTab and fetchData

  const updateBookingStatus = async (id, status) => {
    try {
      await API.put(`/bookings/${id}/status`, { status }, authHeader);
      toast.success("Cập nhật trạng thái thành công");
      fetchData();
    } catch (err) {
      toast.error("Cập nhật thất bại");
    }
  };

  const deleteBooking = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận xóa",
      message: "Bạn có chắc muốn xóa lịch hẹn này?",
      onConfirm: async () => {
        try {
          await API.delete(`/bookings/${id}`, authHeader);
          toast.success("Đã xóa lịch hẹn");
          fetchData();
        } catch (err) {
          toast.error("Xóa lịch hẹn thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  const deleteUser = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xóa người dùng",
      message: "Xóa người dùng này sẽ không thể hoàn tác. Tiếp tục?",
      onConfirm: async () => {
        try {
          await API.delete(`/auth/users/${id}`, authHeader);
          toast.success("Đã xóa người dùng");
          fetchData();
        } catch (err) {
          toast.error("Xóa người dùng thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  const toggleBlockUser = async (id, currentStatus) => {
    try {
      await API.put(`/auth/users/${id}/block`, { isBlocked: !currentStatus }, authHeader);
      toast.success(currentStatus ? "Đã bỏ chặn người dùng" : "Đã chặn người dùng");
      fetchData();
    } catch (err) {
      toast.error("Thao tác thất bại");
    }
  };

  const updateUserRole = async (id, newRole) => {
    try {
      await API.put(`/auth/users/${id}/role`, { role: newRole }, authHeader);
      toast.success("Đã cập nhật quyền hạn");
      fetchData();
    } catch (err) {
      toast.error("Cập nhật quyền thất bại");
    }
  };

  // Logic CRUD Dịch vụ
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...serviceForm, price: Number(serviceForm.price), durationMinutes: Number(serviceForm.durationMinutes) };
      if (editingId) {
        await API.put(`/services/${editingId}`, data, authHeader);
        toast.success("Cập nhật dịch vụ thành công");
      } else {
        const imageUrl = serviceForm.image; // Giả sử đã có URL từ upload hoặc nhập tay
        await API.post("/services", { ...data, image: imageUrl }, authHeader);
        toast.success("Thêm dịch vụ thành công");
      }
      // Reset form và editingId sau khi submit
      setServiceForm({ name: "", price: "", durationMinutes: "", image: "", description: "" });
      setEditingId(null);
      fetchData();
    } catch (err) { 
      toast.error("Lỗi xử lý dịch vụ"); 
    } finally { setLoading(false); }
  };

  const deleteService = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xóa dịch vụ",
      message: "Bạn có chắc muốn xóa dịch vụ này?",
      onConfirm: async () => {
        try {
          await API.delete(`/services/${id}`, authHeader);
          toast.success("Đã xóa dịch vụ");
          fetchData();
        } catch (err) {
          toast.error("Xóa thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  // Hàm xử lý upload ảnh lên Cloudinary
  const handleImageUpload = async (file, type) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      toast.success("Upload ảnh thành công!");
      return res.data.imageUrl;
    } catch (err) {
      toast.error("Upload ảnh thất bại!");
      return null;
    } finally { setUploadingImage(false); }
  };

  // Logic CRUD Barber
  const handleBarberSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...barberForm, experienceYears: Number(barberForm.experienceYears) };
      if (editingId) {
        await API.put(`/barbers/${editingId}`, data, authHeader);
        toast.success("Cập nhật Barber thành công");
      } else {
        await API.post("/barbers", { ...data, avatar: barberForm.avatar }, authHeader);
        toast.success("Thêm Barber thành công");
      }
      // Reset form và editingId sau khi submit
      setBarberForm({ name: "", specialty: "", experienceYears: "", avatar: "" });
      setEditingId(null);
      fetchData();
    } catch (err) { toast.error("Lỗi xử lý Barber"); }
    finally { setLoading(false); }
  };

  const deleteBarber = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xóa Barber",
      message: "Bạn có chắc muốn xóa Stylist này?",
      onConfirm: async () => {
        try {
          await API.delete(`/barbers/${id}`, authHeader);
          toast.success("Đã xóa Barber");
          fetchData();
        } catch (err) {
          toast.error("Xóa thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-white p-6 hidden md:block">
        <div className="text-[#d4a373] font-bold text-xl mb-10 tracking-widest uppercase">Hệ Thống Barber</div>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab(TABS.DASHBOARD)} className={`w-full text-left p-3 rounded ${activeTab === TABS.DASHBOARD ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-chart-line mr-3"></i> Thống kê
          </button>
          <button onClick={() => setActiveTab(TABS.BOOKINGS)} className={`w-full text-left p-3 rounded ${activeTab === TABS.BOOKINGS ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-calendar-alt mr-3"></i> Lịch hẹn
          </button>
          <button onClick={() => setActiveTab(TABS.SERVICES)} className={`w-full text-left p-3 rounded ${activeTab === TABS.SERVICES ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-cut mr-3"></i> Dịch vụ
          </button>
          <button onClick={() => setActiveTab(TABS.BARBERS)} className={`w-full text-left p-3 rounded ${activeTab === TABS.BARBERS ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-user-friends mr-3"></i> Stylists
          </button>
          <button onClick={() => setActiveTab(TABS.USERS)} className={`w-full text-left p-3 rounded ${activeTab === TABS.USERS ? "bg-[#d4a373] text-black" : "hover:bg-gray-900"}`}>
            <i className="fas fa-users mr-3"></i> Người dùng
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 text-gray-800">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">{TAB_LABELS[activeTab]}</h2>
          <div className="text-gray-600 font-medium">Chào mừng, Quản trị viên</div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === TABS.DASHBOARD && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                <div className="text-gray-500 text-sm uppercase font-bold">Tổng lịch hẹn</div>
                <div className="text-3xl font-bold">{stats.totalBookings}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <div className="text-gray-500 text-sm uppercase font-bold">Doanh thu</div>
                <div className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="text-gray-500 text-sm uppercase font-bold">Tổng khách hàng</div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <div className="text-gray-500 text-sm uppercase font-bold">Tổng Stylists</div>
                <div className="text-3xl font-bold">{stats.totalBarbers}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ doanh thu */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold mb-4">Biểu đồ Doanh thu (VNĐ)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                      <YAxis fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#d1fae5" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Biểu đồ lượng booking */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold mb-4">Lượng đặt lịch theo ngày</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS TABLE */}
        {activeTab === TABS.BOOKINGS && (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Search and Filter Controls */}
            <div className="p-4 border-b flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                className="border p-2 rounded flex-1 min-w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="border p-2 rounded min-w-[150px]"
                value={filterBarberId}
                onChange={(e) => setFilterBarberId(e.target.value)}
              >
                <option value="">Lọc theo Stylist</option>
                {barbers.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                className="border p-2 rounded min-w-[150px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Lọc theo trạng thái</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button
                onClick={fetchData}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-bold"
              >
                Áp dụng
              </button>
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-bold">Khách hàng</th>
                  <th className="p-4 font-bold">Dịch vụ</th>
                  <th className="p-4 font-bold">Stylist</th>
                  <th className="p-4 font-bold">Ngày & Giờ</th>
                  <th className="p-4 font-bold">Trạng thái</th>
                  <th className="p-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(bookings || []).map((b) => (
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
                    <td className="p-4 text-right flex items-center justify-end gap-3">
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
                      <button onClick={() => deleteBooking(b._id)} className="text-red-500 hover:text-red-700">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalBookingsCount > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 p-4 border-t">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="font-semibold">Trang {currentPage} / {Math.ceil(totalBookingsCount / itemsPerPage)}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalBookingsCount / itemsPerPage)))}
                disabled={currentPage === Math.ceil(totalBookingsCount / itemsPerPage)}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
          </div>
        )}

        {/* USERS TABLE */}
        {activeTab === TABS.USERS && (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-bold">Tài khoản</th>
                  <th className="p-4 font-bold">Vai trò</th>
                  <th className="p-4 font-bold">Trạng thái & Hành động</th>
                  <th className="p-4 font-bold">ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <select 
                        className="text-xs border rounded p-1"
                        value={u.role}
                        onChange={(e) => updateUserRole(u._id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="barber">Barber</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button 
                        onClick={() => toggleBlockUser(u._id, u.isBlocked)}
                        className={`text-xs px-2 py-1 rounded font-bold ${u.isBlocked ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        title={u.isBlocked ? "Bỏ chặn" : "Chặn người dùng"}
                      >
                        {u.isBlocked ? <i className="fas fa-lock"></i> : <i className="fas fa-lock-open"></i>}
                      </button>
                      <button onClick={() => deleteUser(u._id)} className="text-red-500 hover:text-red-700">
                        <i className="fas fa-user-slash"></i>
                      </button>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{u._id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SERVICES MANAGEMENT */}
        {activeTab === TABS.SERVICES && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
              <h3 className="font-bold mb-4">{editingId ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</h3>
              <form onSubmit={handleServiceSubmit} className="space-y-3">
                <input placeholder="Tên dịch vụ" className="w-full border p-2 rounded" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} required />
                <input placeholder="Giá (VNĐ)" type="number" className="w-full border p-2 rounded" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} required />
                <input placeholder="Thời gian (phút)" type="number" className="w-full border p-2 rounded" value={serviceForm.durationMinutes} onChange={e => setServiceForm({...serviceForm, durationMinutes: e.target.value})} required />
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" className="flex-1 border p-2 rounded" onChange={async (e) => {
                    const imageUrl = await handleImageUpload(e.target.files[0], 'service');
                    if (imageUrl) setServiceForm({...serviceForm, image: imageUrl});
                  }} disabled={uploadingImage} />
                  {uploadingImage && <i className="fas fa-spinner fa-spin text-gray-500"></i>}
                </div>
                {serviceForm.image && <img src={serviceForm.image} alt="Preview" className="w-24 h-24 object-cover rounded mt-2" />}
                <input placeholder="Hoặc dán Link ảnh trực tiếp" className="w-full border p-2 rounded" value={serviceForm.image} onChange={e => setServiceForm({...serviceForm, image: e.target.value})} />
                <textarea placeholder="Mô tả" className="w-full border p-2 rounded" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-black text-white p-2 rounded font-bold">Lưu</button>
                  {editingId && <button type="button" onClick={() => {setEditingId(null); setServiceForm({name:"",price:"",durationMinutes:"",image:"",description:""})}} className="bg-gray-200 p-2 rounded">Hủy</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Dịch vụ</th>
                    <th className="p-4">Giá</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s._id} className="border-b">
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4">{formatPrice(s.price)}</td>
                      <td className="p-4">{s.durationMinutes}m</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => {setEditingId(s._id); setServiceForm({name:s.name, price:s.price, durationMinutes:s.durationMinutes, image:s.image||"", description:s.description||""})}} className="text-blue-600"><i className="fas fa-edit"></i></button>
                        <button onClick={() => deleteService(s._id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BARBERS MANAGEMENT */}
        {activeTab === TABS.BARBERS && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
              <h3 className="font-bold mb-4">{editingId ? "Sửa Stylist" : "Thêm Stylist mới"}</h3>
              <form onSubmit={handleBarberSubmit} className="space-y-3">
                <input placeholder="Tên Stylist" className="w-full border p-2 rounded" value={barberForm.name} onChange={e => setBarberForm({...barberForm, name: e.target.value})} required />
                <input placeholder="Chuyên môn (ví dụ: Fade & Undercut)" className="w-full border p-2 rounded" value={barberForm.specialty} onChange={e => setBarberForm({...barberForm, specialty: e.target.value})} required />
                <input placeholder="Kinh nghiệm (năm)" type="number" className="w-full border p-2 rounded" value={barberForm.experienceYears} onChange={e => setBarberForm({...barberForm, experienceYears: e.target.value})} required />
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" className="flex-1 border p-2 rounded" onChange={async (e) => {
                    const avatarUrl = await handleImageUpload(e.target.files[0], 'barber');
                    if (avatarUrl) setBarberForm({...barberForm, avatar: avatarUrl});
                  }} disabled={uploadingImage} />
                  {uploadingImage && <i className="fas fa-spinner fa-spin text-gray-500"></i>}
                </div>
                {barberForm.avatar && <img src={barberForm.avatar} alt="Preview" className="w-24 h-24 object-cover rounded-full mt-2" />}
                <input placeholder="Hoặc dán Link Avatar trực tiếp" className="w-full border p-2 rounded" value={barberForm.avatar} onChange={e => setBarberForm({...barberForm, avatar: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-black text-white p-2 rounded font-bold">Lưu</button>
                  {editingId && <button type="button" onClick={() => {setEditingId(null); setBarberForm({name:"",specialty:"",experienceYears:"",avatar:""})}} className="bg-gray-200 p-2 rounded">Hủy</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Stylist</th>
                    <th className="p-4">Chuyên môn</th>
                    <th className="p-4">Kinh nghiệm</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {barbers.map(b => (
                    <tr key={b._id} className="border-b">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {b.avatar && <img src={b.avatar} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-bold">{b.name}</span>
                      </td>
                      <td className="p-4">{b.specialty}</td>
                      <td className="p-4">{b.experienceYears} năm</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => {setEditingId(b._id); setBarberForm({name:b.name, specialty:b.specialty, experienceYears:b.experienceYears, avatar:b.avatar||""})}} className="text-blue-600"><i className="fas fa-edit"></i></button>
                        <button onClick={() => deleteBarber(b._id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
        type="danger"
      />
      </div>
  );
}

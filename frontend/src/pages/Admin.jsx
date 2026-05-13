import { useEffect, useState, useCallback } from "react";
import API from "../api";
import { formatCurrency as formatPrice } from "../utils/formatPrice"; // Giả sử hàm này vẫn dùng được cho VNĐ
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

import RevenueChart from "../components/RevenueChart";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import notificationService from "../services/notificationService";
import "./adminDashboardStyles.css";


const TABS = { DASHBOARD: "dashboard", SERVICES: "services", BARBERS: "barbers", BOOKINGS: "bookings", USERS: "users" };

const TAB_LABELS = {
  [TABS.DASHBOARD]: "Bảng điều khiển",
  [TABS.BOOKINGS]: "Quản lý lịch hẹn",
  [TABS.SERVICES]: "Quản lý dịch vụ",
  [TABS.BARBERS]: "Đội ngũ Barber",
  [TABS.USERS]: "Quản lý người dùng"
};

export default function Admin() {
  // (TODO) Dashboard quick actions sẽ được render ở tab Dashboard

  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    bookingsToday: 0, bookingsWeekly: 0,
    revenueToday: 0, revenueWeekly: 0,
    clientsToday: 0, clientsWeekly: 0
  });
  const [chartData, setChartData] = useState([]);

  // Form states cho Dịch vụ & Barber
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "", image: "", description: "" });
  const [barberForm, setBarberForm] = useState({ name: "", specialty: "", experience: "", avatar: "" });
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
  // const [dashboardChartData, setDashboardChartData] = useState([]); // disabled recharts

  
  const { token } = useAuth(); // Sử dụng AuthContext

  // Make fetchData a useCallback to prevent unnecessary re-renders and issues with socket.io useEffect
  const fetchData = useCallback(async () => {
    if (!token) { // Ensure token exists before fetching data
      // navigate("/login"); // Or handle re-authentication
      return;
    }
    setLoading(true);
    try {
      if (activeTab === TABS.DASHBOARD) {
        // Stats tổng quan + analytics chart
        const [bookingsRes, barbersRes, usersRes, statsRes] = await Promise.all([
          API.get("/bookings?limit=100"),
          API.get("/barbers"),
          API.get("/auth/users"),
          API.get("/bookings/stats")
        ]);

        const allBookings = bookingsRes.data.bookings || bookingsRes.data; // Hỗ trợ cả 2 cấu trúc
        setBookings(Array.isArray(allBookings) ? allBookings : []);

        const chartData = Array.isArray(statsRes.data) ? statsRes.data : [];
        const revenue = chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

        setChartData(chartData);

        // Tính toán các chỉ số nhanh
        const todayStr = new Date().toISOString().split('T')[0];
        const todayStat = chartData.find(s => s.date === todayStr) || { count: 0, revenue: 0 };
        const newClientsToday = usersRes.data.filter(u => u.createdAt?.startsWith(todayStr)).length;

        setStats({
          totalBookings: bookingsRes.data.totalCount || allBookings.length,
          totalRevenue: revenue,
          totalBarbers: barbersRes.data.length,
          totalUsers: usersRes.data.length
        });

        setDashboardStats({
          bookingsToday: todayStat.count || 0,
          bookingsWeekly: allBookings.length,
          revenueToday: todayStat.revenue || 0,
          revenueWeekly: revenue,
          // Giả lập logic Client từ Users data
          clientsToday: newClientsToday,
          clientsWeekly: usersRes.data.length
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
        
        const res = await API.get(url);
        setBookings(res.data.bookings); // Giả định backend trả về { bookings: [], totalCount: X }
        setTotalBookingsCount(res.data.totalCount);

        // Đảm bảo barbers đã được load để dùng cho filter
        const barbersRes = await API.get("/barbers");
        setBarbers(barbersRes.data || []);
      }
      if (activeTab === TABS.USERS) {
        const res = await API.get("/auth/users"); // Giả định endpoint backend
        setUsers(res.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, itemsPerPage, searchTerm, filterBarberId, filterStatus, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on fetchData

  // Cập nhật tiêu đề trang web tương ứng với tab đang chọn
  useEffect(() => {
    document.title = `${TAB_LABELS[activeTab]} | The Cutting Edge Admin`;
  }, [activeTab]);

  // Notifications (DB + realtime)
  const [_, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Socket.io integration
  const { socket } = useSocket();

  // Default load notifications from backend
  useEffect(() => {
    const load = async () => {
      try {
        const { notifications: list, unreadCount: count } = await notificationService.getNotifications();
        setNotifications(list || []);
        setUnreadCount(count || 0);
      } catch {
        // ignore (optional)
      }
    };
    if (token) load();
  }, [token]);


  useEffect(() => {
    if (!socket) return;

    const handleNotificationNew = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);

      if (activeTab === TABS.BOOKINGS || activeTab === TABS.DASHBOARD) {
        fetchData();
      }
    };


    socket.on("notification:new", handleNotificationNew);

    return () => {
      socket.off("notification:new", handleNotificationNew);
    };
  }, [activeTab, fetchData, socket]);

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      // refresh list
      const { notifications: list, unreadCount: count } = await notificationService.getNotifications();
      setNotifications(list || []);
      setUnreadCount(count || 0);
    } catch {
      // ignore
    }
  };




  const updateBookingStatus = async (id, status) => {
    try {
      await API.put(`/bookings/${id}/status`, { status });
      toast.success("Cập nhật trạng thái thành công");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Cập nhật thất bại");
    }
  };

  const deleteBooking = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận xóa",
      message: "Bạn có chắc muốn xóa lịch hẹn này?",
      onConfirm: async () => {
        try {
          await API.delete(`/bookings/${id}`);
          toast.success("Đã xóa lịch hẹn");
          fetchData();
        } catch (err) {
          toast.error(err?.response?.data?.msg || "Xóa lịch hẹn thất bại");
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
          await API.delete(`/auth/users/${id}`);
          toast.success("Đã xóa người dùng");
          fetchData();
        } catch (err) {
          toast.error(err?.response?.data?.msg || "Xóa người dùng thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  const toggleBlockUser = async (id, currentStatus) => {
    try {
      await API.put(`/auth/users/${id}/block`, { isBlocked: !currentStatus });
      toast.success(currentStatus ? "Đã bỏ chặn người dùng" : "Đã chặn người dùng");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Thao tác thất bại");
    }
  };

  const updateUserRole = async (id, newRole) => {
    try {
      await API.put(`/auth/users/${id}/role`, { role: newRole });
      toast.success("Đã cập nhật quyền hạn");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Cập nhật quyền thất bại");
    }
  };

  // Logic CRUD Dịch vụ
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { 
        ...serviceForm, 
        price: Number(serviceForm.price) || 0, 
        duration: Number(serviceForm.duration) || 0 
      };

      if (editingId) {
        await API.put(`/services/${editingId}`, data);
        toast.success("Cập nhật dịch vụ thành công");
      } else {
        const imageUrl = serviceForm.image; // Giả sử đã có URL từ upload hoặc nhập tay
        await API.post("/services", { ...data, image: imageUrl });
        toast.success("Thêm dịch vụ thành công");
      }
      // Reset form và editingId sau khi submit
      setServiceForm({ name: "", price: "", duration: "", image: "", description: "" });
      setEditingId(null);
      fetchData();
    } catch (err) { 
      toast.error(err?.response?.data?.msg || "Lỗi xử lý dịch vụ"); 
    } finally { setLoading(false); }
  };

  const deleteService = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xóa dịch vụ",
      message: "Bạn có chắc muốn xóa dịch vụ này?",
      onConfirm: async () => {
        try {
          await API.delete(`/services/${id}`);
          toast.success("Đã xóa dịch vụ");
          fetchData();
        } catch (err) {
          toast.error(err?.response?.data?.msg || "Xóa thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  // Hàm xử lý upload ảnh lên Cloudinary
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success("Upload ảnh thành công!");
      return res.data.imageUrl;
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Upload ảnh thất bại!");
      return null;
    } finally { setUploadingImage(false); }
  };

  // Logic CRUD Barber
  const handleBarberSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...barberForm, experience: Number(barberForm.experience) };
      if (editingId) {
        await API.put(`/barbers/${editingId}`, data);
        toast.success("Cập nhật Barber thành công");
      } else {
        await API.post("/barbers", { ...data, avatar: barberForm.avatar });
        toast.success("Thêm Barber thành công");
      }
      // Reset form và editingId sau khi submit
      setBarberForm({ name: "", specialty: "", experience: "", avatar: "" });
      setEditingId(null);
      fetchData();
    } catch (err) { toast.error(err?.response?.data?.msg || "Lỗi xử lý Barber"); }
    finally { setLoading(false); }
  };

  const deleteBarber = async (id) => {
    setConfirmModal({
      open: true,
      title: "Xóa Barber",
      message: "Bạn có chắc muốn xóa Stylist này?",
      onConfirm: async () => {
        try {
          await API.delete(`/barbers/${id}`);
          toast.success("Đã xóa Barber");
          fetchData();
        } catch (err) {
          toast.error(err?.response?.data?.msg || "Xóa thất bại");
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f0f] text-[#e5e7eb] admin-dash">
      <style>{`
        .gold-accent { color: #c4a47c; }
        .gold-bg { background-color: #c4a47c; }
        .card-bg { background-color: #1a1a1a; border: 1px solid #2d2d2d; }
        .sidebar-item.active { background-color: #c4a47c20; color: #c4a47c; }
      `}</style>

      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#121212] border-r border-[#2d2d2d] flex-shrink-0 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 gold-bg rounded-lg text-black">
              <i className="fas fa-cut w-6 h-6 flex items-center justify-center"></i>
            </div>
            <span className="font-bold text-sm tracking-tighter leading-tight gold-accent uppercase">THE GENT'S<br/>GROOMING LOUNGE</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 p-2">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="mt-4 px-4 space-y-2 flex-1">
          {[
            { id: TABS.DASHBOARD, label: "Dashboard", icon: "fas fa-th-large" },
            { id: TABS.BOOKINGS, label: "Appointments", icon: "fas fa-calendar-alt" },
            { id: TABS.USERS, label: "Clients", icon: "fas fa-users" },
            { id: TABS.BARBERS, label: "Barbers", icon: "fas fa-user-tie" },
            { id: TABS.SERVICES, label: "Services", icon: "fas fa-cut" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={`sidebar-item w-full flex items-center p-3 rounded-lg transition-all ${
                activeTab === tab.id ? "active" : "text-gray-400"
              }`}
            >
              <i className={`${tab.icon} mr-3 w-5`}></i> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#2d2d2d]">
          <button className="sidebar-item w-full flex items-center p-3 rounded-lg text-gray-400">
            <i className="fas fa-cog mr-3"></i> Settings
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE TOP BAR (Mới thêm) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0f0f0f] border-b border-[#2d2d2d]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 gold-bg rounded text-black text-xs">
              <i className="fas fa-cut"></i>
            </div>
            <span className="font-bold text-xs gold-accent tracking-tighter uppercase">THE GENT'S Admin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {loading && (
            <div className="mb-6 bg-yellow-900/20 text-yellow-500 px-4 py-2 rounded-lg text-xs font-medium border border-yellow-900/50 w-fit">
              <i className="fas fa-spinner fa-spin mr-2"></i> Đang cập nhật dữ liệu...
            </div>
          )}

          {/* TAB CONTENTS */}
        {activeTab === TABS.DASHBOARD && stats && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="w-full lg:col-span-8 space-y-6">
              
              {/* TOP CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-bg p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-600"><i className="fas fa-calendar-check text-xs"></i></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Total Bookings</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{dashboardStats.bookingsToday}</span> <span className="text-[10px] text-gray-500">Today</span>
                        <span className="text-lg font-bold ml-auto">{dashboardStats.bookingsWeekly}</span> <span className="text-[10px] text-gray-500">Weekly</span>
                    </div>
                </div>
                <div className="card-bg p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><i className="fas fa-money-bill-wave text-xs"></i></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Revenue</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">{(dashboardStats.revenueToday / 1000000).toFixed(1)}M</span> <span className="text-[10px] text-gray-500">Today</span>
                        <span className="text-lg font-bold ml-auto text-white">{(dashboardStats.revenueWeekly / 1000000).toFixed(1)}M</span> <span className="text-[10px] text-gray-500">Weekly</span>
                    </div>
                </div>
                <div className="card-bg p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><i className="fas fa-users text-xs"></i></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">New Clients</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{dashboardStats.clientsToday}</span> <span className="text-[10px] text-gray-500">Today</span>
                        <span className="text-lg font-bold ml-auto">{dashboardStats.clientsWeekly}</span> <span className="text-[10px] text-gray-500">Weekly</span>
                    </div>
                </div>
              </div>

              {/* TABLE SECTION */}
              <div className="card-bg rounded-2xl overflow-hidden">
                <div className="p-5 font-semibold border-b border-[#2d2d2d] flex justify-between items-center">
                  Upcoming Bookings
                  <button onClick={() => setActiveTab(TABS.BOOKINGS)} className="text-xs gold-accent hover:underline">View All</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[#252525] text-gray-500">
                    <tr>
                      <th className="py-3 px-5 text-left font-medium uppercase text-[10px]">Time</th>
                      <th className="py-3 px-5 text-left font-medium uppercase text-[10px]">Client</th>
                      <th className="py-3 px-5 text-left font-medium uppercase text-[10px]">Barber</th>
                      <th className="py-3 px-5 text-left font-medium uppercase text-[10px]">Service</th>
                      <th className="py-3 px-5 text-left font-medium uppercase text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d2d2d]">
                    {(bookings || []).slice(0, 5).map((b) => (
                      <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5 font-mono text-[#c4a47c]">{b.bookingTime}</td>
                        <td className="py-4 px-5 font-medium">{b.userId?.name || b.userId?.username || 'Guest'}</td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <img src={b.barberId?.avatar || "https://i.pravatar.cc/30"} className="w-6 h-6 rounded-full border border-[#2d2d2d]" alt="" />
                            <span>{b.barberId?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-gray-400">{b.serviceId?.name || 'N/A'}</td>
                        <td className="py-4 px-5">
                          <span className={`text-[10px] px-2 py-1 rounded-full border ${
                            b.status === 'Accepted' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            b.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                            'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }`}>
                            {b.status === 'Accepted' ? 'Checked-in' : b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan="5" className="p-12 text-center text-gray-500 italic">No appointments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full lg:col-span-4 space-y-6">
              {/* CHART */}
              <div className="card-bg p-6 rounded-2xl">
                <h3 className="font-semibold mb-4">Weekly Revenue</h3>
                <div className="h-48">
                  <RevenueChart data={chartData} />
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="card-bg p-6 rounded-2xl">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab(TABS.BOOKINGS)}
                    className="w-full py-3 bg-[#252525] hover:bg-[#333] transition border border-[#3d3d3d] rounded-xl flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-plus-circle gold-accent"></i> Add Appointment
                  </button>
                  <button 
                    onClick={() => {
                      const first = bookings?.find((b) => b.status === 'Pending');
                      if (first) updateBookingStatus(first._id, 'Accepted');
                      else toast.error("No pending appointments to check-in");
                    }}
                    className="w-full py-3 bg-[#252525] hover:bg-[#333] transition border border-[#3d3d3d] rounded-xl flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-check-square gold-accent"></i> Check-In Client
                  </button>
                </div>
              </div>

              {/* BARBER PERFORMANCE */}
              <div className="card-bg p-6 rounded-2xl">
                <h3 className="font-semibold mb-4">Barber Performance</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-4 tracking-widest">Top Barbers by Booking</p>
                <div className="space-y-5">
                  {barbers.slice(0, 3).map((barber, idx) => {
                    const count = bookings.filter(b => b.barberId?._id === barber._id).length;
                    const percentage = Math.min(100, Math.round((count / (stats.totalBookings || 1)) * 100 * 2)); // Giả lập tỷ lệ
                    return (
                      <div key={barber._id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <img src={barber.avatar || `https://i.pravatar.cc/150?u=${idx}`} className="w-6 h-6 rounded-full" alt="" />
                            {barber.name}
                          </span>
                          <span className="text-gray-400 font-mono text-xs">{percentage}%</span>
                        </div>
                        <div className="w-full bg-[#333] h-1.5 rounded-full overflow-hidden">
                          <div className="gold-bg h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* BOOKINGS TABLE */}

      {activeTab === TABS.BOOKINGS && (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          {/* Search and Filter Controls */}
          <div className="p-4 border-b border-gray-800 flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="border p-2 rounded flex-1 min-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="dark-input p-2 rounded min-w-[150px]"
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
              className="dark-input p-2 rounded min-w-[150px]"
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
              className="gold-bg text-black px-6 py-2 rounded font-bold hover:opacity-90 transition"
            >
              Áp dụng
            </button>
          </div>
          
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#252525] text-gray-400 text-xs uppercase">
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
                <tr key={b._id} className="border-b border-gray-800 hover:bg-[#252525] transition">
                  <td className="p-4">{b.userId?.name || b.userId?.username || "Guest"}</td>
                  <td className="p-4">{b.serviceId?.name}</td>
                  <td className="p-4">{b.barberId?.name}</td>
                  <td className="p-4 text-sm">
                    {b.bookingDate} <br /> <span className="text-gray-500">{b.bookingTime}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      b.status === 'Accepted' ? 'bg-green-900/40 text-green-500' : 
                      b.status === 'Cancelled' ? 'bg-red-900/40 text-red-500' : 'bg-yellow-900/40 text-yellow-500'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-3">
                    <select 
                      className="dark-input rounded p-1 text-sm"
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
          <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-800">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-30"
            >
              Trước
            </button>
            <span className="font-semibold">Trang {currentPage} / {Math.ceil(totalBookingsCount / itemsPerPage)}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalBookingsCount / itemsPerPage)))}
              disabled={currentPage === Math.ceil(totalBookingsCount / itemsPerPage)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-30"
            >
              Sau
            </button>
          </div>
        )}
              </div>
      )}

        {/* USERS TABLE */}
        {activeTab === TABS.USERS && (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#252525] text-gray-400 text-xs uppercase">
                <tr>
                  <th className="p-4 font-bold">Tài khoản</th>
                  <th className="p-4 font-bold">Vai trò</th>
                  <th className="p-4 font-bold">Trạng thái & Hành động</th>
                  <th className="p-4 font-bold">ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-800 hover:bg-[#252525] transition">
                    <td className="p-4 font-medium">{u.name || u.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-900/40 text-purple-400' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <select 
                        className="text-xs dark-input rounded p-1"
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
                        title={u.isBlocked ? "Unlock" : "Lock"}
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
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 h-fit">
              <h3 className="font-bold mb-4">{editingId ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</h3>
              <form onSubmit={handleServiceSubmit} className="space-y-3">
                <input placeholder="Tên dịch vụ" className="w-full dark-input p-2 rounded" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} required />
                <input placeholder="Giá (VNĐ)" type="number" className="w-full dark-input p-2 rounded" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} required />
                <input placeholder="Thời gian (phút)" type="number" className="w-full dark-input p-2 rounded" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} required />
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" className="flex-1 dark-input p-2 rounded text-xs" onChange={async (e) => {
                    const imageUrl = await handleImageUpload(e.target.files[0], 'service');
                    if (imageUrl) setServiceForm({...serviceForm, image: imageUrl});
                  }} disabled={uploadingImage} />
                  {uploadingImage && <i className="fas fa-spinner fa-spin text-gray-500"></i>}
                </div>
                {serviceForm.image && <img src={serviceForm.image} alt="Preview" className="w-24 h-24 object-cover rounded mt-2" />}
                <input placeholder="Hoặc dán Link ảnh" className="w-full dark-input p-2 rounded text-xs" value={serviceForm.image} onChange={e => setServiceForm({...serviceForm, image: e.target.value})} />
                <textarea placeholder="Mô tả" className="w-full dark-input p-2 rounded" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 gold-bg text-black p-2 rounded font-bold">Lưu</button>
                  {editingId && <button type="button" onClick={() => {setEditingId(null); setServiceForm({name:"",price:"",duration:"",image:"",description:""})}} className="bg-gray-700 p-2 rounded">Hủy</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#252525] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Dịch vụ</th>
                    <th className="p-4">Giá</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s._id} className="border-b border-gray-800 hover:bg-[#252525]">
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4">{formatPrice(s.price)}</td>
                      <td className="p-4">{s.duration}m</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => {setEditingId(s._id); setServiceForm({name:s.name, price:s.price, duration:s.duration, image:s.image||"", description:s.description||""})}} className="text-blue-600"><i className="fas fa-edit"></i></button>
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
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 h-fit">
              <h3 className="font-bold mb-4">{editingId ? "Sửa Stylist" : "Thêm Stylist mới"}</h3>
              <form onSubmit={handleBarberSubmit} className="space-y-3">
                <input placeholder="Tên Stylist" className="w-full dark-input p-2 rounded" value={barberForm.name} onChange={e => setBarberForm({...barberForm, name: e.target.value})} required />
                <input placeholder="Chuyên môn" className="w-full dark-input p-2 rounded" value={barberForm.specialty} onChange={e => setBarberForm({...barberForm, specialty: e.target.value})} required />
                <input placeholder="Kinh nghiệm (năm)" type="number" className="w-full dark-input p-2 rounded" value={barberForm.experience} onChange={e => setBarberForm({...barberForm, experience: e.target.value})} required />
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" className="flex-1 dark-input p-2 rounded text-xs" onChange={async (e) => {
                    const avatarUrl = await handleImageUpload(e.target.files[0], 'barber');
                    if (avatarUrl) setBarberForm({...barberForm, avatar: avatarUrl});
                  }} disabled={uploadingImage} />
                  {uploadingImage && <i className="fas fa-spinner fa-spin text-gray-500"></i>}
                </div>
                {barberForm.avatar && <img src={barberForm.avatar} alt="Preview" className="w-24 h-24 object-cover rounded-full mt-2" />}
                <input placeholder="Hoặc dán Link Avatar" className="w-full dark-input p-2 rounded text-xs" value={barberForm.avatar} onChange={e => setBarberForm({...barberForm, avatar: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 gold-bg text-black p-2 rounded font-bold">Lưu</button>
                  {editingId && <button type="button" onClick={() => {setEditingId(null); setBarberForm({name:"",specialty:"",experience:"",avatar:""})}} className="bg-gray-700 p-2 rounded">Hủy</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#252525] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Stylist</th>
                    <th className="p-4">Chuyên môn</th>
                    <th className="p-4">Kinh nghiệm</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {barbers.map(b => (
                    <tr key={b._id} className="border-b border-gray-800 hover:bg-[#252525]">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
                          {b.avatar && <img src={b.avatar} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-bold text-sm">{b.name}</span>
                      </td>
                      <td className="p-4">{b.specialty}</td>
                      <td className="p-4">{b.experienceYears ?? b.experience ?? 0} năm</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => {setEditingId(b._id); setBarberForm({name:b.name, specialty:b.specialty, experience:b.experienceYears ?? b.experience ?? 0, avatar:b.avatar||""})}} className="text-blue-600"><i className="fas fa-edit"></i></button>
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
      </div>

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

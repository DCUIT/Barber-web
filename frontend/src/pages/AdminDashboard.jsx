import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import Spinner from '../components/Spinner';
import RevenueChart from '../components/RevenueChart';
import { formatCurrency } from '../utils/formatPrice';

export default function AdminDashboard() {
  const [stats, setStats] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { path: '/admin', label: 'Tổng quan', icon: 'fas fa-home' },
    { path: '/admin/bookings', label: 'Quản lý lịch hẹn', icon: 'fas fa-calendar-alt' },
    { path: '/admin/barbers', label: 'Đội ngũ Barber', icon: 'fas fa-users' },
    { path: '/admin/services', label: 'Dịch vụ', icon: 'fas fa-cut' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          axios.get('/api/bookings/stats'),
          axios.get('/api/bookings', { params: { limit: 5 } })
        ]);
        setStats(statsRes.data);
        setRecentBookings(bookingsRes.data.bookings);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  // Tính toán các chỉ số nhanh
  const totalRevenue = stats.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = stats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar links={sidebarLinks} />
      
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Hệ thống Quản trị</h1>
          <p className="text-gray-500">Chào mừng trở lại, quản trị viên.</p>
        </header>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 uppercase font-bold">Tổng doanh thu (tháng)</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500 uppercase font-bold">Tổng lịch hẹn</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{totalBookings}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 uppercase font-bold">Khách hàng mới</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">12</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-8">
          <RevenueChart data={stats} />
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Lịch hẹn gần đây</h3>
          <Table headers={['Khách hàng', 'Barber', 'Dịch vụ', 'Ngày/Giờ', 'Trạng thái']}>
            {recentBookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {b.userId?.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {b.barberId?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {b.serviceId?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                  {b.bookingDate} <span className="font-bold">@{b.bookingTime}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    b.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    b.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
          <div className="mt-4 text-right">
            <button className="text-blue-600 font-bold hover:underline text-sm">Xem tất cả lịch hẹn →</button>
          </div>
        </div>
      </main>
    </div>
  );
}

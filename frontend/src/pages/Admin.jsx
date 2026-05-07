import { useEffect, useState } from "react";
import API from "../api";
import { formatCurrency as formatPrice } from "../utils/formatPrice";
import { parseItems, getStatusBadge, ORDER_STATUSES } from "../utils/parseOrder.jsx";
import OrderModal from "../components/OrderModal";

const TABS = { FOODS: "foods", ORDERS: "orders", STATS: "stats" };

export default function Admin() {
  const [activeTab, setActiveTab] = useState(TABS.FOODS);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchFoods(); }, []);
  useEffect(() => {
    if (activeTab === TABS.ORDERS) fetchOrders();
    if (activeTab === TABS.STATS) fetchStats();
  }, [activeTab]);

  async function fetchFoods() {
    const res = await API.get("/foods");
    setFoods(res.data);
  }

  async function fetchOrders() {
    try {
      const res = await API.get("/orders", authHeader);
      setOrders(res.data);
    } catch (err) { setError("Không thể tải đơn hàng"); }
  }

  async function fetchStats() {
    try {
      const res = await API.get("/stats", authHeader);
      setStats(res.data);
    } catch (err) { setError("Không thể tải thống kê"); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (editingId) {
        await API.put(`/foods/${editingId}`, { name, price: Number(price), image }, authHeader);
        setSuccess("Cập nhật món thành công!");
      } else {
        await API.post("/foods", { name, price: Number(price), image }, authHeader);
        setSuccess("Thêm món thành công!");
      }
      resetForm();
      fetchFoods();
    } catch (err) { setError(editingId ? "Cập nhật thất bại" : "Thêm món thất bại"); }
    setLoading(false);
  }

  async function deleteFood(id) {
    if (!confirm("Bạn có chắc muốn xóa món này?")) return;
    try {
      await API.delete(`/foods/${id}`, authHeader);
      fetchFoods();
      setSuccess("Xóa món thành công!");
    } catch (err) { setError("Xóa thất bại"); }
  }

  function editFood(food) {
    setName(food.name);
    setPrice(food.price.toString());
    setImage(food.image || "");
    setEditingId(food.id);
    setSuccess("");
    setError("");
  }

  function resetForm() {
    setName("");
    setPrice("");
    setImage("");
    setEditingId(null);
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await API.put(`/orders/${orderId}`, { status: newStatus }, authHeader);
      fetchOrders();
      setSelectedOrder(null);
      setSuccess(`Đã cập nhật trạng thái đơn #${orderId}`);
    } catch (err) { setError("Cập nhật thất bại"); }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="flex gap-2 mb-6 border-b">
        {Object.values(TABS).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-semibold capitalize ${activeTab === tab ? "border-b-2 border-yellow-500 text-yellow-600" : "text-gray-500 hover:text-gray-700"}`}>
            {tab === TABS.FOODS && "🍔 Quản lý món ăn"}
            {tab === TABS.ORDERS && "📦 Đơn hàng"}
            {tab === TABS.STATS && "📊 Thống kê"}
          </button>
        ))}
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">{success}</div>}

      {activeTab === TABS.FOODS && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
            <h3 className="font-bold mb-4">{editingId ? "✏️ Sửa món" : "➕ Thêm món mới"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block mb-1 text-sm">Tên món</label>
                <input className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-sm">Giá (VNĐ)</label>
                <input type="number" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={price} onChange={e => setPrice(e.target.value)} required min={0} />
              </div>
              <div className="mb-3">
                <label className="block mb-1 text-sm">Hình ảnh (URL)</label>
                <input className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded" disabled={loading}>
                  {loading ? "Đang xử lý..." : editingId ? "Cập nhật" : "Thêm món"}
                </button>
                {editingId && <button type="button" onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded">Hủy</button>}
              </div>
            </form>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
            <h3 className="font-bold mb-4">Danh sách món ăn ({foods.length})</h3>
            {foods.length === 0 ? <p className="text-gray-500">Chưa có món nào</p> : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {foods.map(f => (
                  <li key={f.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {f.image && <img src={f.image} alt={f.name} className="w-12 h-12 object-cover rounded" />}
                      <div>
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-yellow-600 text-sm">{formatPrice(f.price)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editFood(f)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Sửa</button>
                      <button onClick={() => deleteFood(f.id)} className="text-red-600 hover:text-red-800 text-sm font-semibold">Xóa</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === TABS.ORDERS && (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h3 className="font-bold mb-4">Danh sách đơn hàng ({orders.length})</h3>
          {orders.length === 0 ? <p className="text-gray-500">Chưa có đơn hàng nào</p> : (
            <div className="space-y-4">
              {orders.map(order => {
                const items = parseItems(order.items);
                const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return (
                  <div key={order.id} onClick={() => setSelectedOrder(order)} className="border rounded p-4 dark:border-gray-600 cursor-pointer hover:border-blue-400 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-blue-600">Đơn hàng #{order.id}</div>
                        <span className="ml-2 text-gray-500 text-sm">by {order.user}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <div className="text-yellow-600 font-bold">{formatPrice(total)}</div>
                    <div className="text-xs text-gray-500 mt-2">Click để xem chi tiết →</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === TABS.STATS && stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow p-6 text-center">
            <div className="text-3xl mb-2">🍔</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.foods_count}</div>
            <div className="text-gray-500">Tổng món ăn</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-6 text-center">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-3xl font-bold text-blue-600">{stats.orders_count}</div>
            <div className="text-gray-500">Tổng đơn hàng</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-6 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-green-600">{stats.users_count}</div>
            <div className="text-gray-500">Tổng người dùng</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold text-purple-600">{formatPrice(stats.total_revenue)}</div>
            <div className="text-gray-500">Tổng doanh thu</div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdateStatus={updateOrderStatus}
      />
    </div>
  );
}

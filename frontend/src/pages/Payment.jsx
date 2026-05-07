import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { getCart } from '../utils/useCart';
import { formatPrice } from '../utils/formatPrice';

export default function Payment() {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Sử dụng utility useCart - đã có migrate tự động
    const cartData = getCart();
    
    if (cartData.length === 0) {
      navigate('/cart');
      return;
    }
    
    API.get('/foods').then(res => {
      const cartItems = cartData.map(item => {
        const food = res.data.find(f => f.id === item.id);
        return food ? { ...food, quantity: item.quantity } : null;
      }).filter(Boolean);
      setCart(cartItems);
    });
  }, [navigate]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOrder = async () => {
    if (!token) {
      setToastMessage('Vui lòng đăng nhập để đặt hàng');
      setToastType('error');
      setShowToast(true);
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      await API.post('/order', { cart: orderItems }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('storage'));
      setToastMessage('🎉 Đặt hàng thành công! Đang chuyển hướng...');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => navigate('/success'), 1500);
    } catch (error) {
      setToastMessage('Lỗi đặt hàng: ' + error.response?.data?.msg || error.message);
      setToastType('error');
      setShowToast(true);
    }
    setLoading(false);
  };

  if (cart.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Thanh toán</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cart summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Đơn hàng</h2>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 border-b">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-gray-500">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Tổng cộng:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Phương thức thanh toán</h2>
            
            <div className="space-y-4 mb-8">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-400 transition-all">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                />
                <div className="ml-4">
                  <h3 className="font-bold text-lg">Thanh toán khi nhận hàng (COD)</h3>
                  <p className="text-gray-600">Thanh toán trực tiếp khi nhận hàng</p>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-400 transition-all">
                <input
                  type="radio"
                  name="payment"
                  value="transfer"
                  checked={paymentMethod === 'transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                />
                <div className="ml-4">
                  <h3 className="font-bold text-lg">Chuyển khoản ngân hàng</h3>
                  <p className="text-gray-600">Chuyển khoản trước, giao hàng sau</p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">STK: 123456789 Vietcombank (Nguyễn Văn A)</p>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-400 transition-all">
                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                />
                <div className="ml-4">
                  <h3 className="font-bold text-lg">Ví điện tử (Giả lập)</h3>
                  <p className="text-gray-600">Momo / ZaloPay / VNPay</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Đang xử lý...
                </>
              ) : (
                `ĐẶT HÀNG NGAY (${formatPrice(total)})`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

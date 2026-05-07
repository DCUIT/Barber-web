import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Success() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 2 seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 2000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(confettiTimer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti effect - only show for 2 seconds */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeIn relative z-10">
        <div className="text-8xl mb-6">
          🎉
        </div>
        <div className="text-6xl text-green-500 mb-4 animate-pulse">
          <i className="fas fa-check-circle"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn sẽ được xử lý trong thời gian sớm nhất.
          Bạn sẽ nhận được thông tin chi tiết qua email hoặc tin nhắn.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/my-orders')}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <i className="fas fa-list mr-2"></i>
            Xem đơn hàng
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <i className="fas fa-shopping-bag mr-2"></i>
            Tiếp tục mua sắm
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Trang này sẽ tự động chuyển về trang chủ sau {countdown} giây...
        </p>
      </div>
    </div>
  );
}

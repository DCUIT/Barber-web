export default function Footer() {
  return (
    <footer className="bg-white mt-12 py-8 text-center text-gray-500 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <p className="font-medium text-green-600 mb-2">Hương Vị Việt</p>
        <p className="text-sm">© {new Date().getFullYear()} Hương Vị Việt. Đặt đồ ăn ngon mỗi ngày!</p>
      </div>
    </footer>
  );
}

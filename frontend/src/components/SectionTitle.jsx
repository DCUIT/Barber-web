// Tiêu đề section, dùng cho Home hoặc các trang khác
export default function SectionTitle({ children }) {
  return (
    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-yellow-300">
      {children}
    </h2>
  );
}

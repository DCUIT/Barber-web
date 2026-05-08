export default function Footer() {
  return (
    <footer className="bg-black mt-12 py-8 text-center text-gray-400 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <p className="font-bold text-white mb-2 uppercase tracking-widest">The Cutting Edge Barbershop</p>
        <p className="text-sm">© {new Date().getFullYear()} The Cutting Edge. Nâng tầm phong cách phái mạnh.</p>
      </div>
    </footer>
  );
}

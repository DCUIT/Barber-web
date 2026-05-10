import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ links }) {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 hidden md:block">
      <div className="mb-8 px-2 font-bold text-xl border-b border-gray-700 pb-4">
        DASHBOARD
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block py-2.5 px-4 rounded transition duration-200 ${
              location.pathname === link.path ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <i className={`${link.icon} mr-3`}></i>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
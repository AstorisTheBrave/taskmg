import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-violet-50 text-violet-600" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <span className="font-bold text-slate-900 mr-4">Nucleus</span>
        <NavLink to="/">Dashboard</NavLink>
        {user.role === "ADMIN" && <NavLink to="/users">Users</NavLink>}
        {user.role === "ADMIN" && <NavLink to="/activity">Activity</NavLink>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          {user.name} <span className="text-slate-300">·</span> {user.role}
        </span>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}

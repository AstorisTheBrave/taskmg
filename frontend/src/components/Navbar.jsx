import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100 px-6 py-3 flex items-center justify-between transition-colors duration-200 dark:bg-[#1a1a24] dark:border-white/10 dark:shadow-none">
      <div className="flex items-center gap-1">
        <span className="font-bold text-slate-900 dark:text-white mr-4">Nucleus</span>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/chat">Chat</NavLink>
        {user.role === "ADMIN" && <NavLink to="/users">Users</NavLink>}
        {user.role === "ADMIN" && <NavLink to="/activity">Activity</NavLink>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {user.name} <span className="text-slate-300 dark:text-slate-600">·</span> {user.role}
        </span>
        <button
          onClick={toggle}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-slate-500 hover:bg-slate-100 transition-colors duration-150 dark:text-slate-400 dark:hover:bg-slate-800"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span className="text-sm" aria-hidden="true">
            {theme === "light" ? "🌙" : "☀️"}
          </span>
          <span className="text-sm font-medium">
            {theme === "light" ? "Dark" : "Light"}
          </span>
        </button>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg dark:text-slate-400 dark:hover:text-white"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}

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
          className={`relative inline-flex h-7 w-14 items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${
            theme === "dark" ? "bg-violet-600" : "bg-slate-300"
          }`}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${
              theme === "dark" ? "translate-x-7" : "translate-x-0"
            }`}
            aria-hidden="true"
          >
            {theme === "light" ? "☀️" : "🌙"}
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

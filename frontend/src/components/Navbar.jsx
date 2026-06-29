import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

function NavLink({ to, children, onClick, mobile = false }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      } ${mobile ? "block w-full text-left" : ""}`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <>
      <nav className="border-b border-slate-100 bg-white px-4 py-3 shadow-sm transition-colors duration-200 dark:border-white/10 dark:bg-[#1a1a24] dark:shadow-none sm:px-6 nav">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden dark:border-white/10 dark:text-slate-300"
              aria-label="Open navigation menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-slate-900 dark:text-white">Nucleus</span>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/chat">Chat</NavLink>
            {user.role === "ADMIN" && <NavLink to="/users">Users</NavLink>}
            {user.role === "ADMIN" && <NavLink to="/activity">Activity</NavLink>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline-flex dark:text-slate-400">
              {user.name} <span className="mx-1 text-slate-300 dark:text-slate-600">·</span> {user.role}
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
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline-flex dark:text-slate-400 dark:hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-200 md:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeMenu}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[280px] bg-white p-4 shadow-xl transition-transform duration-300 dark:bg-[#1a1a24] md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900 dark:text-white">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300"
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <NavLink to="/" onClick={closeMenu} mobile>
            Dashboard
          </NavLink>
          <NavLink to="/chat" onClick={closeMenu} mobile>
            Chat
          </NavLink>
          {user.role === "ADMIN" && (
            <NavLink to="/users" onClick={closeMenu} mobile>
              Users
            </NavLink>
          )}
          {user.role === "ADMIN" && (
            <NavLink to="/activity" onClick={closeMenu} mobile>
              Activity
            </NavLink>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TaskDetail from "./pages/TaskDetail";
import Users from "./pages/Users";
import Activity from "./pages/Activity";
import Chat from "./pages/Chat";

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  return user.role === "ADMIN" ? children : <Navigate to="/" replace />;
}

function AuthenticatedLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {children}
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <RequireAuth>
            <AuthenticatedLayout>
              <TaskDetail />
            </AuthenticatedLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <AuthenticatedLayout>
              <Chat />
            </AuthenticatedLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AuthenticatedLayout>
                <Users />
              </AuthenticatedLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/activity"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AuthenticatedLayout>
                <Activity />
              </AuthenticatedLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

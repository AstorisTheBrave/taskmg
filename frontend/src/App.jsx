import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TaskDetail from "./pages/TaskDetail";
import Users from "./pages/Users";
import Activity from "./pages/Activity";

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user.role === "ADMIN" ? children : <Navigate to="/" replace />;
}

function AppShell() {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <AdminRoute>
                <Activity />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

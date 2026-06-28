import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-700 mb-4">Signed in as {user.name} ({user.role})</p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function Root() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

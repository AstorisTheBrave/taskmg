import { useEffect, useState, useCallback } from "react";
import { useApi } from "../hooks/useApi";

export default function Users() {
  const api = useApi();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || password.length < 8) {
      setError("Name, email, and a password of at least 8 characters are required.");
      return;
    }
    setCreating(true);
    try {
      await api.createUser({ name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("MEMBER");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.updateUser(id, { role: newRole });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.deleteUser(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Users</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex-1 min-w-[140px]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex-1 min-w-[160px]"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex-1 min-w-[140px]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-semibold rounded-lg"
        >
          {creating ? "Adding…" : "Add user"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{u.name}</td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-700 text-xs font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

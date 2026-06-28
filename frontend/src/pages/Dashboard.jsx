import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import TaskCard from "../components/TaskCard";
import NewTaskModal from "../components/NewTaskModal";

const VIEWS = [
  { key: "all", label: "All tasks" },
  { key: "assigned", label: "Assigned to me" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (view === "assigned") data = await api.assignedToMe();
      else if (view === "overdue") data = await api.overdueTasks();
      else if (view === "completed") data = await api.completedTasks();
      else data = await api.listTasks({ search, status, priority });
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, view, search, status, priority]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user.role === "ADMIN") {
      api.listUsers().then(setUsers).catch(() => {});
    }
  }, [api, user.role]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
        {user.role === "ADMIN" && (
          <button
            onClick={() => setShowNewTask(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg"
          >
            New task
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              view === v.key ? "bg-violet-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "all" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-400">No tasks found.</p>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}

      {showNewTask && (
        <NewTaskModal
          users={users}
          onCreate={async (data) => {
            await api.createTask(data);
            await load();
          }}
          onClose={() => setShowNewTask(false)}
        />
      )}
    </div>
  );
}

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

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      let data;
      if (view === "assigned") data = await api.assignedToMe();
      else if (view === "overdue") data = await api.overdueTasks();
      else if (view === "completed") data = await api.completedTasks();
      else data = await api.listTasks({ search, status, priority });
      setTasks(data);
      if (silent) setError("");
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api, view, search, status, priority]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const openNewTask = async () => {
    if (user.role === "ADMIN") {
      try {
        setUsers(await api.listUsers());
      } catch {
        // fall through, modal will just show whatever was last loaded
      }
    }
    setShowNewTask(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        {user.role === "ADMIN" && (
          <button
            onClick={openNewTask}
            className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            New task
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`min-h-[44px] flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              view === v.key
                ? "bg-violet-600 text-white dark:bg-violet-600 dark:text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#1e1e2e] dark:text-slate-300 dark:hover:border-violet-500/40"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "all" && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full min-h-[44px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-[#1e1e2e] dark:text-slate-100 dark:placeholder:text-slate-500 sm:min-w-[220px]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#1e1e2e] dark:text-slate-100 sm:w-auto"
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
            className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#1e1e2e] dark:text-slate-100 sm:w-auto"
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">No tasks found.</p>
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

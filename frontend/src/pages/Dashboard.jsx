import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import TaskCard from "../components/TaskCard";
import NewTaskModal from "../components/NewTaskModal";

const STATUS_COLUMNS = [
  { key: "TODO", label: "TODO" },
  { key: "IN_PROGRESS", label: "IN PROGRESS" },
  { key: "IN_REVIEW", label: "IN REVIEW" },
  { key: "DONE", label: "DONE" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("status");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);

  const normalizeStatus = useCallback((status) => {
    const value = typeof status === "string" ? status.trim().toUpperCase().replace(/\s+/g, "_") : "";
    if (value === "IN_PROGRESS" || value === "INPROGRESS") return "IN_PROGRESS";
    if (value === "IN_REVIEW" || value === "INREVIEW" || value === "REVIEW") return "IN_REVIEW";
    if (value === "DONE") return "DONE";
    if (value === "TODO" || value === "TO_DO") return "TODO";
    return "TODO";
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const data = await api.listTasks({ search });
      setTasks(data);
      if (silent) setError("");
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api, search]);

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

  const filteredTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (task.title || "").toLowerCase().includes(query);
  });

  const columns = STATUS_COLUMNS.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((task) => normalizeStatus(task.status) === column.key),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
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

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#1e1e2e] sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100 dark:placeholder:text-slate-500 sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="mr-2 hidden sm:inline">Group By</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
            >
              <option value="status">Status</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-4 xl:gap-4">
          {columns.map((column) => (
            <section
              key={column.key}
              className="flex min-h-[220px] flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm dark:border-white/10 dark:bg-[#14141c]/70"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {column.label}
                  </h2>
                  {column.key === "DONE" && (
                    <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.793 12.086l6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {column.tasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {column.tasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-3 text-sm text-slate-400 dark:border-white/10 dark:bg-[#1e1e2e]/60 dark:text-slate-500">
                    No tasks
                  </div>
                ) : (
                  column.tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </section>
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

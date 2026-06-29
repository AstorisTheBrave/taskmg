import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";

function actorName(log) {
  return log.user ? log.user.name : "Someone";
}

function taskTitle(log) {
  if (log.task) return `"${log.task.title}"`;
  if (log.metadata && log.metadata.title) return `"${log.metadata.title}"`;
  return "a task";
}

const DESCRIPTIONS = {
  TASK_CREATED: (log) => `${actorName(log)} created ${taskTitle(log)}`,
  TASK_UPDATED: (log) => `${actorName(log)} edited ${taskTitle(log)}`,
  TASK_DELETED: (log) => `${actorName(log)} deleted ${taskTitle(log)}`,
  TASK_ASSIGNED: (log) => `${actorName(log)} changed who is assigned to ${taskTitle(log)}`,
  TASK_STATUS_CHANGED: (log) =>
    `${actorName(log)} set ${taskTitle(log)} to ${(log.metadata?.status || "").replaceAll("_", " ").toLowerCase() || "a new status"}`,
  TASK_STARTED: (log) => `${actorName(log)} marked ${taskTitle(log)} as taken`,
  TASK_SUBMITTED_FOR_REVIEW: (log) => `${actorName(log)} submitted ${taskTitle(log)} for review`,
  TASK_APPROVED: (log) => `${actorName(log)} approved ${taskTitle(log)}`,
  TASK_REJECTED: (log) => `${actorName(log)} sent ${taskTitle(log)} back for more work`,
  COMMENT_CREATED: (log) => `${actorName(log)} commented on ${taskTitle(log)}`,
  USER_CREATED: (log) => `${actorName(log)} added a new user`,
  USER_UPDATED: (log) => `${actorName(log)} updated a user`,
  USER_DELETED: (log) => `${actorName(log)} removed a user`,
  PASSWORD_RESET_REQUESTED: () => "A password reset was requested",
  PASSWORD_RESET_COMPLETED: () => "A password was reset",
};

function describe(log) {
  const fn = DESCRIPTIONS[log.action];
  return fn ? fn(log) : `${actorName(log)} ${log.action.replaceAll("_", " ").toLowerCase()}`;
}

export default function Activity() {
  const api = useApi();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await api.listActivity());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white focus:text-emerald-100">Activity log</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">Showing the most recent 200 events</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">No activity yet.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm dark:bg-[#1e1e2e] dark:border-slate-700/70 dark:divide-slate-800">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700 dark:text-slate-300">{describe(log)}</span>
              <div className="flex items-center gap-3 shrink-0">
                {log.task && (
                  <Link to={`/tasks/${log.task.id}`} className="text-xs text-violet-600 hover:text-violet-700 font-medium dark:text-violet-300 dark:hover:text-violet-200">
                    View task
                  </Link>
                )}
                <span className="text-slate-400 text-xs dark:text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

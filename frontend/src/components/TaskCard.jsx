import { Link } from "react-router-dom";

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  MEDIUM: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  HIGH: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};

const STATUS_COLORS = {
  TODO: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export default function TaskCard({ task }) {
  const overdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-[#1e1e2e] dark:hover:border-violet-500/40"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="break-words pr-1 font-medium text-slate-900 dark:text-white">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 break-words text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
      )}
      {task.assignees && task.assignees.length > 0 && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{task.assignees.map((a) => a.name).join(", ")}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
          {task.status.replace("_", " ")}
        </span>
        {task.dueDate && (
          <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-400"}`}>
            Due {new Date(task.dueDate).toLocaleDateString()}
            {overdue ? " · overdue" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}

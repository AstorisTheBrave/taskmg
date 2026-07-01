import { Link } from "react-router-dom";

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  MEDIUM: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  HIGH: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};

export default function TaskCard({ task }) {
  const priority = (task.priority || "MEDIUM").toUpperCase();
  const primaryAssignee = task.assignees?.[0];
  const initials = primaryAssignee?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/5 dark:bg-[#1e1e2e] dark:hover:bg-[#22222e]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM}`}>
          {priority}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {task.id ? (
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">#{task.id}</span>
        ) : (
          <span />
        )}
        {primaryAssignee ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
            {initials}
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full border border-dashed border-slate-200 dark:border-slate-700" />
        )}
      </div>
    </Link>
  );
}

import { Link } from "react-router-dom";

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

export default function TaskCard({ task }) {
  const overdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-slate-900">{task.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
          {task.status.replace("_", " ")}
        </span>
        {task.dueDate && (
          <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
            Due {new Date(task.dueDate).toLocaleDateString()}
            {overdue ? " · overdue" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}

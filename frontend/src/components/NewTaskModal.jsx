import { useState } from "react";

export default function NewTaskModal({ users, onCreate, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeIds, setAssigneeIds] = useState(users[0] ? [users[0].id] : []);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleAssignee = (id) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title || assigneeIds.length === 0) {
      setError("Title and at least one assignee are required.");
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        title,
        description: description || undefined,
        priority,
        assigneeIds,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-3 py-3 sm:items-center sm:px-4 sm:py-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#1e1e2e] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Close modal"
        >
          ×
        </button>
        <h2 className="mb-4 pr-10 text-lg font-semibold text-slate-900 dark:text-white">New task</h2>
        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Assign to</label>
            <div className="max-h-36 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
              {users.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(u.id)}
                    onChange={() => toggleAssignee(u.id)}
                    className="rounded border-slate-300 text-violet-600"
                  />
                  {u.name} ({u.role})
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:bg-violet-400"
            >
              {loading ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

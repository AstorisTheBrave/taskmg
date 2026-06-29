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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-md p-6 dark:bg-[#1e1e2e] dark:border-white/10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-white">New task</h2>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Assign to</label>
            <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 dark:text-slate-200">
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
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-semibold rounded-lg"
            >
              {loading ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

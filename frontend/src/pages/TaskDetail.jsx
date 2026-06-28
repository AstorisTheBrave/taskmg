import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const canModify = task && (user.role === "ADMIN" || task.assignedTo === user.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [t, c] = await Promise.all([api.getTask(id), api.listComments(id)]);
      setTask(t);
      setComments(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user.role === "ADMIN") {
      api.listUsers().then(setUsers).catch(() => {});
    }
  }, [api, user.role]);

  const handleStatusChange = async (e) => {
    try {
      const updated = await api.setTaskStatus(id, e.target.value);
      setTask(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssign = async (e) => {
    try {
      const updated = await api.assignTask(id, e.target.value);
      setTask(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await api.deleteTask(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await api.createComment(id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="max-w-3xl mx-auto px-6 py-8 text-sm text-slate-400">Loading…</p>;
  if (error && !task) return <p className="max-w-3xl mx-auto px-6 py-8 text-sm text-red-600">{error}</p>;
  if (!task) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate("/")} className="text-sm text-slate-500 hover:text-slate-700 mb-4">
        &larr; Back to tasks
      </button>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold text-slate-900">{task.title}</h1>
          {user.role === "ADMIN" && (
            <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Delete
            </button>
          )}
        </div>
        {task.description && <p className="text-sm text-slate-600 mt-2">{task.description}</p>}

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={!canModify}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
            <p className="px-3 py-2 text-sm text-slate-700">{task.priority}</p>
          </div>
          {user.role === "ADMIN" && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Assigned to</label>
              <select
                value={task.assignedTo}
                onChange={handleAssign}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {task.dueDate && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Due date</label>
              <p className="px-3 py-2 text-sm text-slate-700">{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6">
        <h2 className="font-semibold text-slate-900 mb-4">Comments</h2>
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-700">{c.content}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

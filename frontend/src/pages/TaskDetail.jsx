import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";

const STATUS_LABELS = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  REVIEW: "In review",
  DONE: "Done",
};

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
  const [actionLoading, setActionLoading] = useState(false);

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [completionLink, setCompletionLink] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const [editingAssignees, setEditingAssignees] = useState(false);
  const [draftAssigneeIds, setDraftAssigneeIds] = useState([]);

  const isAdmin = user.role === "ADMIN";
  const isAssignee = task ? task.assignees.some((a) => a.id === user.id) : false;
  const canAct = isAdmin || isAssignee;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const [t, c] = await Promise.all([api.getTask(id), api.listComments(id)]);
      setTask(t);
      setComments(c);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const runAction = async (fn) => {
    setError("");
    setActionLoading(true);
    try {
      const updated = await fn();
      setTask(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () => runAction(() => api.startTask(id));

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    await runAction(() => api.submitTaskForReview(id, completionLink.trim(), completionNote.trim()));
    setShowSubmitForm(false);
    setCompletionLink("");
    setCompletionNote("");
  };

  const handleApprove = () => runAction(() => api.approveTask(id));

  const handleReject = async (e) => {
    e.preventDefault();
    await runAction(() => api.rejectTask(id, rejectNote.trim()));
    setShowRejectForm(false);
    setRejectNote("");
    load(true);
  };

  const handleOverrideStatus = (e) => runAction(() => api.setTaskStatus(id, e.target.value));

  const startEditingAssignees = async () => {
    setDraftAssigneeIds(task.assignees.map((a) => a.id));
    setEditingAssignees(true);
    try {
      setUsers(await api.listUsers());
    } catch {
      // keep showing whatever was last loaded
    }
  };

  const toggleDraftAssignee = (uid) => {
    setDraftAssigneeIds((prev) => (prev.includes(uid) ? prev.filter((a) => a !== uid) : [...prev, uid]));
  };

  const saveAssignees = async () => {
    if (draftAssigneeIds.length === 0) {
      setError("A task needs at least one assignee.");
      return;
    }
    await runAction(() => api.assignTask(id, draftAssigneeIds));
    setEditingAssignees(false);
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

  if (loading) return <p className="max-w-3xl mx-auto px-6 py-8 text-sm text-slate-400">Loading...</p>;
  if (error && !task) return <p className="max-w-3xl mx-auto px-6 py-8 text-sm text-red-600">{error}</p>;
  if (!task) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate("/")} className="text-sm text-slate-500 hover:text-slate-700 mb-4 dark:text-slate-400 dark:hover:text-slate-200">
        &larr; Back to tasks
      </button>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-[#1e1e2e] dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{task.title}</h1>
          {isAdmin && (
            <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Delete
            </button>
          )}
        </div>
        {task.description && <p className="text-sm text-slate-600 mt-2 dark:text-slate-400">{task.description}</p>}

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Status</label>
            <p className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{STATUS_LABELS[task.status]}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Priority</label>
            <p className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{task.priority}</p>
          </div>
          {task.dueDate && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Due date</label>
              <p className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Created by</label>
            <p className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200">{task.creator.name}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Assignees</label>
            {isAdmin && !editingAssignees && (
              <button onClick={startEditingAssignees} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                Edit
              </button>
            )}
          </div>
          {editingAssignees ? (
            <div>
              <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={draftAssigneeIds.includes(u.id)}
                      onChange={() => toggleDraftAssignee(u.id)}
                      className="rounded border-slate-300 text-violet-600"
                    />
                    {u.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveAssignees}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingAssignees(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {task.assignees.map((a) => (
                <span key={a.id} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {(task.completionLink || task.completionNote) && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs font-medium text-amber-700 mb-1 dark:text-amber-300">Submitted for review</p>
            {task.completionLink && (
              <a
                href={task.completionLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-violet-600 hover:text-violet-700 underline break-all"
              >
                {task.completionLink}
              </a>
            )}
            {task.completionNote && <p className="text-sm text-slate-700 mt-1 dark:text-slate-300">{task.completionNote}</p>}
          </div>
        )}

        {task.status === "DONE" && task.reviewer && (
          <p className="text-xs text-slate-400 mt-3 dark:text-slate-500">
            Approved by {task.reviewer.name} on {new Date(task.reviewedAt).toLocaleString()}
          </p>
        )}

        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2 dark:border-slate-700">
          {task.status === "TODO" && canAct && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-semibold rounded-lg"
            >
              Mark as taken
            </button>
          )}

          {task.status === "IN_PROGRESS" && canAct && !showSubmitForm && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg"
            >
              Submit for review
            </button>
          )}

          {task.status === "REVIEW" && !isAdmin && (
            <span className="px-3 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg">Waiting for review</span>
          )}

          {task.status === "REVIEW" && isAdmin && !showRejectForm && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-lg"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 rounded-lg dark:text-red-300"
              >
                Reject
              </button>
            </>
          )}

          {isAdmin && (
            <select
              value={task.status}
              onChange={handleOverrideStatus}
              disabled={actionLoading}
              className="ml-auto px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 bg-white dark:bg-[#232334] dark:border-slate-700 dark:text-slate-300"
            >
              <option value="TODO">Override: Todo</option>
              <option value="IN_PROGRESS">Override: In progress</option>
              <option value="REVIEW">Override: In review</option>
              <option value="DONE">Override: Done</option>
            </select>
          )}
        </div>

        {showSubmitForm && (
          <form onSubmit={handleSubmitReview} className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2 dark:bg-[#232334]">
            <input
              value={completionLink}
              onChange={(e) => setCompletionLink(e.target.value)}
              placeholder="Link to your work (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
            />
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Note for the reviewer (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-semibold rounded-lg"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {showRejectForm && (
          <form onSubmit={handleReject} className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2 dark:bg-[#232334]">
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="What needs to change? (optional, posted as a comment)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#16161f] dark:border-white/10 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold rounded-lg"
              >
                Send back
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6 shadow-sm dark:bg-[#1e1e2e] dark:border-slate-700/70">
        <h2 className="font-semibold text-slate-900 mb-4 dark:text-white">Comments</h2>
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-slate-50 rounded-lg p-3 dark:bg-[#232334]">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.user.name}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
                <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">{new Date(c.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none dark:bg-[#1e1e2e] dark:border-white/10 dark:text-slate-100"
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

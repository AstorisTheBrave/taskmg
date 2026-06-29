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

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-4 text-sm text-slate-400 sm:px-6 sm:py-8">Loading...</p>;
  if (error && !task) return <p className="mx-auto max-w-3xl px-4 py-4 text-sm text-red-600 sm:px-6 sm:py-8">{error}</p>;
  if (!task) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-8">
      <button onClick={() => navigate("/")} className="mb-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        &larr; Back to tasks
      </button>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">{error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1e1e2e] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{task.title}</h1>
          {isAdmin && (
            <button onClick={handleDelete} className="min-h-[44px] text-sm font-medium text-red-600 hover:text-red-700">
              Delete
            </button>
          )}
        </div>
        {task.description && <p className="text-sm text-slate-600 mt-2 dark:text-slate-400">{task.description}</p>}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <button onClick={startEditingAssignees} className="text-xs font-medium text-violet-600 hover:text-violet-700">
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
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={saveAssignees}
                  disabled={actionLoading}
                  className="min-h-[44px] rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingAssignees(false)}
                  className="min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
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

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center">
          {task.status === "TODO" && canAct && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:bg-violet-400"
            >
              Mark as taken
            </button>
          )}

          {task.status === "IN_PROGRESS" && canAct && !showSubmitForm && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
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
                className="min-h-[44px] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-400"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-300"
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
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-[#232334] dark:text-slate-300 sm:ml-auto sm:w-auto"
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
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
            />
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Note for the reviewer (optional)"
              rows={2}
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={actionLoading}
                className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:bg-violet-400"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
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
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={actionLoading}
                className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-400"
              >
                Send back
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-[#1e1e2e] sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Comments</h2>
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
        <form onSubmit={handleAddComment} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[44px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none dark:border-white/10 dark:bg-[#1e1e2e] dark:text-slate-100"
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

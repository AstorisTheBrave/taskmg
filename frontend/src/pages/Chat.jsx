import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";

export default function Chat() {
  const { user } = useAuth();
  const api = useApi();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const data = await api.listMessages();
      setMessages(data);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 1500);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setContent("");
    try {
      const message = await api.createMessage(text);
      setMessages((prev) => [...prev, message]);
      isAtBottomRef.current = true;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col px-4 pb-24 pt-4 sm:px-6 sm:pb-0 sm:py-8">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Chat</h1>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      <div
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 space-y-3 chat-scrollbar dark:border-white/10 dark:bg-[#1e1e2e]"
      >
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet. Say hi.</p>
        ) : (
          messages.map((m) => {
            const mine = m.user.id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[75%] ${
                    mine ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-[#2a2a3e] dark:text-white"
                  }`}
                >
                  {!mine && (
                    <p className="text-xs font-semibold text-slate-400 mb-0.5 dark:text-slate-300">
                      {m.user.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-violet-200" : "text-slate-400 dark:text-slate-500"}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 z-10 mt-3 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:flex-row sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none"
      >
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message the group..."
          className="min-h-[44px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-[#16161f] dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

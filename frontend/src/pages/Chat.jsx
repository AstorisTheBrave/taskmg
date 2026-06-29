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
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-64px)]">
      <h1 className="text-xl font-bold text-slate-900 mb-4 dark:text-white">Chat</h1>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
      )}

      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl p-4 space-y-3 chat-scrollbar dark:bg-[#1e1e2e] dark:border-white/10"
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
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
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

      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message the group..."
          className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-[#16161f] text-sm text-slate-100 placeholder:text-slate-500 outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
}

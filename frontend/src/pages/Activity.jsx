import { useEffect, useState, useCallback } from "react";
import { useApi } from "../hooks/useApi";

export default function Activity() {
  const api = useApi();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await api.listActivity());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Activity log</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-400">No activity yet.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{log.action.replaceAll("_", " ")}</span>
              <span className="text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

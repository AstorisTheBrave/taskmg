import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 text-sm mt-1">
            We will generate a reset link. Since this workspace has no email server, ask your
            admin to send it to you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6">
          <Link to="/login" className="text-violet-600 hover:text-violet-700 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

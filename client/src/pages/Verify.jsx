import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Verify() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || localStorage.getItem("verifyEmail");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const { data } = await api.post("/auth/verify", {
        email,
        code: code.trim(),
      });

      setInfo(data.message || "Email verified successfully!");
      localStorage.removeItem("verifyEmail");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email is missing. Please register again.");
      return;
    }

    setResending(true);
    setError("");
    setInfo("");

    try {
      const { data } = await api.post("/auth/resend-verification", { email });
      setInfo(data.message || "New verification code sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl glass-panel space-y-5"
      >
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Verify Email</h2>
          <p className="text-xs text-slate-400">
            Enter the 6-digit code sent to <span className="text-indigo-300 font-semibold">{email || "your email"}</span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {info && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium px-3 py-2 rounded-lg">
            {info}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Verification Code
          </label>
          <input
            type="text"
            placeholder="123456"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/25"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium py-2 rounded-xl border border-slate-700 transition-colors"
        >
          {resending ? "Resending..." : "Resend Verification Code"}
        </button>

        <p className="text-xs text-center text-slate-400 pt-2">
          <Link to="/" className="text-indigo-400 font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Verify;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();

  const sendResetCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Error sending reset code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        code: code.trim(),
        newPassword,
      });
      setInfo(data.message);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setInfo("");

    try {
      const { data } = await api.post("/auth/resend-reset-code", { email });
      setInfo(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl glass-panel space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400">
            {step === 1 ? "Enter email to receive reset code" : "Enter reset code and new password"}
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

        {step === 1 && (
          <form onSubmit={sendResetCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                placeholder="123456"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/25"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium py-2 rounded-xl border border-slate-700 transition-colors"
            >
              {resending ? "Resending..." : "Resend Code"}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-slate-400 pt-2">
          <Link to="/" className="text-indigo-400 font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });

      if (data?.token && data?.user) {
        login(data);
        navigate("/dashboard");
      } else {
        setError("Invalid login response");
      }
    } catch (err) {
      const message = err.response?.data?.message;
      if (message === "Verify your email first") {
        navigate("/verify", { state: { email } });
      } else {
        setError(message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl glass-panel space-y-5"
      >
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">SyncSpace</h2>
          <p className="text-xs text-slate-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="flex items-center justify-between text-xs pt-2 text-slate-400">
          <Link to="/forgot-password" className="hover:text-indigo-400 transition-colors">
            Forgot Password?
          </Link>
          <span>
            No account?{" "}
            <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
              Register
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}
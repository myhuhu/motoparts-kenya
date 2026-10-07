import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form);
      showToast("Login successful.");
      const from = location.state?.from?.pathname;
      if (!from || from === "/login" || from === "/register") {
        navigate(user?.is_staff ? "/admin" : "/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(err.response?.data?.non_field_errors?.[0] || "Invalid credentials.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold">Welcome Back</h1>
          <p className="mt-1 text-sm text-white/50">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-3 p-6">
          <input required autoFocus placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full !py-2.5 disabled:opacity-50">
            {submitting ? "Logging in..." : "Login"}
          </button>
          <p className="pt-1 text-center text-sm text-white/50">
            Don't have an account?{" "}
            <Link to="/register" className="text-ember-500 hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

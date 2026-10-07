import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "", last_name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      showToast("Account created successfully.");
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      const message = data ? Object.values(data)[0] : "Registration failed.";
      showToast(Array.isArray(message) ? message[0] : message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold">Create Account</h1>
          <p className="mt-1 text-sm text-white/50">Join MotoParts Kenya</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-3 p-6">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="First Name" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="input-field" />
            <input required placeholder="Last Name" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="input-field" />
          </div>
          <input required placeholder="Username" value={form.username} onChange={(e) => update("username", e.target.value)} className="input-field" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" />
          <input placeholder="Phone Number" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-field" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" />
          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full !py-2.5 disabled:opacity-50">
            {submitting ? "Creating account..." : "Register"}
          </button>
          <p className="pt-1 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link to="/login" className="text-ember-500 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

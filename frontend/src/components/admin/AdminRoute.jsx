import { Link, Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!user?.is_staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert size={40} className="text-ember-500" />
        <h1 className="font-display text-2xl font-semibold">Admin access only</h1>
        <p className="max-w-sm text-sm text-white/50">
          This account isn't a staff account. Ask an administrator to enable staff access for you.
        </p>
        <Link to="/" className="btn-primary mt-2">Back to shop</Link>
      </div>
    );
  }
  return children;
}
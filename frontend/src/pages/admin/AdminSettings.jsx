import { ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DJANGO_ADMIN = import.meta.env.VITE_DJANGO_ADMIN_URL || "http://127.0.0.1:8000/admin/";

export default function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="font-display text-3xl font-semibold">Settings</h2>

      <div className="card p-5">
        <h3 className="mb-3 font-display text-xl font-semibold">Your account</h3>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-white/40">Username</dt><dd>{user?.username}</dd>
          <dt className="text-white/40">Name</dt><dd>{`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "—"}</dd>
          <dt className="text-white/40">Email</dt><dd>{user?.email || "—"}</dd>
          <dt className="text-white/40">Role</dt><dd>Staff administrator</dd>
        </dl>
      </div>

      <div className="card p-5">
        <h3 className="mb-2 font-display text-xl font-semibold">Delivery fees</h3>
        <p className="mb-4 text-sm text-white/60">
          Add, edit or remove per-location delivery fees without touching code or restarting.
        </p>
        <Link to="/admin/delivery-fees" className="btn-secondary !py-2 text-sm">
          <MapPin size={14} /> Manage delivery fees
        </Link>
      </div>

      <div className="card p-5">
        <h3 className="mb-2 font-display text-xl font-semibold">Advanced settings</h3>
        <p className="mb-4 text-sm text-white/60">
          Payments and M-Pesa transactions, review moderation and staff accounts are managed in the Django admin.
        </p>
        <a href={DJANGO_ADMIN} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 text-sm">
          Open Django admin <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

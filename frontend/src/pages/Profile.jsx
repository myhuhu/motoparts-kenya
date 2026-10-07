import { Heart, MapPin, Package, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderCard from "../components/OrderCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import authService from "../services/authService";
import orderService from "../services/orderService";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "orders", label: "My Orders" },
  { key: "profile", label: "Profile" },
  { key: "addresses", label: "Addresses" },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" });
  const [addressForm, setAddressForm] = useState({ label: "Home", county: "", town: "", delivery_address: "" });

  useEffect(() => {
    Promise.all([orderService.list(), authService.listAddresses()])
      .then(([o, a]) => {
        setOrders(o.results || o);
        setAddresses(a.results || a);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.order_status === "PENDING").length,
    completed: orders.filter((o) => o.order_status === "DELIVERED").length,
    spent: orders.filter((o) => o.payment_status === "SUCCESS" || o.payment_method === "cod").reduce((s, o) => s + Number(o.total), 0),
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await authService.updateProfile(profileForm);
      updateUser(updated);
      showToast("Profile updated.");
    } catch {
      showToast("Could not update profile.", "error");
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    try {
      const created = await authService.createAddress(addressForm);
      setAddresses([...addresses, created]);
      setAddressForm({ label: "Home", county: "", town: "", delivery_address: "" });
      showToast("Address added.");
    } catch {
      showToast("Could not add address.", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">My Account</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
        <nav className="flex lg:flex-col gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 text-left px-4 py-2.5 rounded-sm text-sm whitespace-nowrap ${tab === t.key ? "bg-ember-500 text-on-ember font-semibold" : "text-white/60 hover:bg-white/5"}`}
            >
              {t.label}
            </button>
          ))}
          <Link to="/wishlist" className="shrink-0 text-left px-4 py-2.5 rounded-sm text-sm text-white/60 hover:bg-white/5 flex items-center gap-2">
            <Heart size={14} /> Wishlist
          </Link>
        </nav>

        <div>
          {tab === "overview" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Orders", value: stats.total, icon: Package },
                { label: "Pending", value: stats.pending, icon: Package },
                { label: "Completed", value: stats.completed, icon: Package },
                { label: "Total Spent", value: `KSh ${stats.spent.toLocaleString("en-KE")}`, icon: Package },
              ].map((s) => (
                <div key={s.label} className="card p-5">
                  <s.icon className="text-ember-500 mb-2" size={20} />
                  <p className="text-xl font-semibold">{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              ))}
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.slice(0, 3).map((o) => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orders.length === 0 && <p className="text-white/50">No orders yet.</p>}
              {orders.map((o) => <OrderCard key={o.id} order={o} />)}
            </div>
          )}

          {tab === "profile" && (
            <form onSubmit={saveProfile} className="card p-6 space-y-4 max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <User className="text-ember-500" />
                <span className="font-semibold">{user?.username}</span>
              </div>
              <input placeholder="First Name" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} className="input-field" />
              <input placeholder="Last Name" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} className="input-field" />
              <input placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="input-field" />
              <button type="submit" className="btn-primary w-full">Save Changes</button>
            </form>
          )}

          {tab === "addresses" && (
            <div className="space-y-6 max-w-md">
              {addresses.map((a) => (
                <div key={a.id} className="card p-4 flex items-start gap-3">
                  <MapPin size={16} className="text-ember-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{a.label}</p>
                    <p className="text-white/50">{a.delivery_address}, {a.town}, {a.county}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={addAddress} className="card p-6 space-y-4">
                <h3 className="font-semibold">Add New Address</h3>
                <input required placeholder="Label (e.g. Home, Office)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="input-field" />
                <input required placeholder="County" value={addressForm.county} onChange={(e) => setAddressForm({ ...addressForm, county: e.target.value })} className="input-field" />
                <input required placeholder="Town" value={addressForm.town} onChange={(e) => setAddressForm({ ...addressForm, town: e.target.value })} className="input-field" />
                <input required placeholder="Delivery Address" value={addressForm.delivery_address} onChange={(e) => setAddressForm({ ...addressForm, delivery_address: e.target.value })} className="input-field" />
                <button type="submit" className="btn-primary w-full">Add Address</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

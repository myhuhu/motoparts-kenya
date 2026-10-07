import { AlertTriangle, ClipboardList, Package, Plus, Truck, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import OrderStatus from "../../components/OrderStatus";
import adminService from "../../services/adminService";
import { formatDate, formatKsh } from "../../utils/format";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-5">
      <Icon size={20} className="mb-3 text-ember-500" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminService.stats().then(setStats).catch(() => setError(true));
  }, []);

  if (error) return <p className="py-16 text-center text-white/50">Unable to load dashboard. Please try again.</p>;
  if (!stats) return <LoadingSpinner label="Loading dashboard..." />;

  const max = Math.max(...stats.sales_last_7_days.map((d) => d.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold">Overview</h2>
        <Link to="/admin/products/new" className="btn-primary !py-2 text-sm"><Plus size={16} /> Add Product</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Wallet} label="Revenue" value={formatKsh(stats.total_revenue)} sub="Paid + delivered COD" />
        <StatCard icon={ClipboardList} label="Orders" value={stats.total_orders} sub={`${stats.pending_orders} pending`} />
        <StatCard icon={Truck} label="To fulfil" value={stats.to_fulfil} sub="Confirmed or processing" />
        <StatCard icon={Users} label="Customers" value={stats.total_customers} />
        <StatCard icon={Package} label="Products" value={stats.active_products} sub={`${stats.total_products} in catalog`} />
        <StatCard icon={AlertTriangle} label="Low stock" value={stats.low_stock_count} sub="5 or fewer left" />
      </div>

      <div className="card p-5">
        <h3 className="mb-4 font-display text-xl font-semibold">Revenue, last 7 days</h3>
        <div className="flex h-40 items-end gap-3">
          {stats.sales_last_7_days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2" title={`${d.date}: ${formatKsh(d.total)}`}>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-sm bg-ember-500"
                  style={{ height: max ? `${Math.max((d.total / max) * 100, d.total ? 4 : 1)}%` : "1%", opacity: d.total ? 1 : 0.25 }}
                />
              </div>
              <span className="text-xs text-white/40">{new Date(d.date).toLocaleDateString("en-KE", { weekday: "short" })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">Recent orders</h3>
            <Link to="/admin/orders" className="text-sm text-ember-500 hover:underline">View all</Link>
          </div>
          {stats.recent_orders.length === 0 ? (
            <p className="py-6 text-sm text-white/40">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-white/40">
                  <tr><th className="pb-2 font-medium">Order</th><th className="pb-2 font-medium">Customer</th><th className="pb-2 font-medium">Total</th><th className="pb-2 font-medium">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recent_orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5"><Link to={`/orders/${o.id}`} className="hover:text-ember-500">{o.order_number}</Link><span className="block text-xs text-white/35">{formatDate(o.created_at)}</span></td>
                      <td className="py-2.5 text-white/70">{o.customer}</td>
                      <td className="py-2.5">{formatKsh(o.total)}</td>
                      <td className="py-2.5"><OrderStatus status={o.order_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 font-display text-xl font-semibold">Low stock</h3>
          {stats.low_stock.length === 0 ? (
            <p className="py-6 text-sm text-white/40">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {stats.low_stock.map((p) => (
                <li key={p.slug} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link to={`/admin/products/${p.slug}/edit`} className="min-w-0 hover:text-ember-500">
                    <span className="block truncate">{p.name}</span>
                    <span className="text-xs text-white/35">{p.sku}</span>
                  </Link>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock_quantity === 0 ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                    {p.stock_quantity === 0 ? "Out" : `${p.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

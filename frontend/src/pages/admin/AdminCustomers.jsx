import { Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import adminService from "../../services/adminService";
import { apiError, formatDate, formatKsh } from "../../utils/format";

export default function AdminCustomers() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = { page };
    if (debounced) params.search = debounced;
    adminService.listCustomers(params).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [debounced, page]);
  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    try {
      const updated = await adminService.setCustomerDisabled(target.id, !target.is_disabled);
      setData((d) => ({ ...d, results: d.results.map((c) => (c.id === updated.id ? updated : c)) }));
      showToast(updated.is_disabled ? "Account disabled." : "Account enabled.");
    } catch (err) {
      showToast(apiError(err, "Could not update the account."), "error");
    } finally {
      setTarget(null);
    }
  };

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold">Customers</h2>
      <p className="mb-5 mt-1 text-sm text-white/40">{data.count} registered customers</p>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, username, email, phone..." className="input-field pl-9" aria-label="Search customers" />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading customers..." />
      ) : error ? (
        <p className="py-16 text-center text-white/50">Unable to load customers. Please try again.</p>
      ) : data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50"><Users size={36} /><p>No customers found.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Orders</th><th className="px-4 py-3 font-medium">Total spent</th>
                <th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 text-right font-medium">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.results.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3"><span className="font-medium">{`${c.first_name} ${c.last_name}`.trim() || c.username}</span><span className="block text-xs text-white/35">@{c.username}</span></td>
                  <td className="px-4 py-3 text-white/70">{c.email}<span className="block text-xs text-white/35">{c.phone || "No phone"}</span></td>
                  <td className="px-4 py-3">{c.order_count}</td>
                  <td className="px-4 py-3">{formatKsh(c.total_spent)}</td>
                  <td className="px-4 py-3 text-white/60">{formatDate(c.date_joined)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setTarget(c)} className={`rounded-sm border px-3 py-1.5 text-xs font-semibold ${c.is_disabled ? "border-green-500/40 text-green-400 hover:bg-green-500/10" : "border-white/15 text-white/70 hover:border-red-500/50 hover:text-red-400"}`}>
                      {c.is_disabled ? "Enable" : "Disable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={setPage} />

      <Modal open={!!target} onClose={() => setTarget(null)} title={target?.is_disabled ? "Enable account?" : "Disable account?"}>
        <p className="mb-5 text-sm text-white/60">
          {target?.is_disabled
            ? `${target?.username} will be able to log in and place orders again.`
            : `${target?.username} will be logged out and can't sign in or place orders until you enable the account. Their order history is kept.`}
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary !py-2 text-sm" onClick={() => setTarget(null)}>Cancel</button>
          <button className="btn-primary !py-2 text-sm" onClick={toggle}>{target?.is_disabled ? "Enable account" : "Disable account"}</button>
        </div>
      </Modal>
    </div>
  );
}

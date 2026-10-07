import { ClipboardList, Download, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import adminService from "../../services/adminService";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../../utils/constants";
import { apiError, formatDate, formatKsh } from "../../utils/format";

const PAY_COLORS = {
  SUCCESS: "bg-green-500/15 text-green-400",
  PENDING: "bg-yellow-500/15 text-yellow-400",
  FAILED: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

export default function AdminOrders() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = { page };
    if (debounced) params.search = debounced;
    if (orderStatus) params.order_status = orderStatus;
    if (paymentStatus) params.payment_status = paymentStatus;
    adminService.listOrders(params).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [debounced, orderStatus, paymentStatus, page]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (order, next) => {
    try {
      const updated = await adminService.updateOrderStatus(order.id, next);
      setData((d) => ({ ...d, results: d.results.map((o) => (o.id === order.id ? { ...o, order_status: updated.order_status } : o)) }));
      showToast(`Order ${order.order_number} marked ${next.toLowerCase()}.`);
    } catch (err) {
      showToast(apiError(err, "Could not update the order."), "error");
    }
  };

  const downloadReceipt = async (order) => {
    try {
      await orderService.downloadReceipt(order.id);
      showToast(`Receipt for ${order.order_number} downloaded.`);
    } catch (err) {
      showToast(apiError(err, "Could not download the receipt."), "error");
    }
  };

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold">Orders</h2>
      <p className="mb-5 mt-1 text-sm text-white/40">{data.count} orders</p>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order number, name, phone, email..." className="input-field pl-9" aria-label="Search orders" />
        </div>
        <select value={orderStatus} onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }} className="input-field !w-auto" aria-label="Filter by order status">
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="input-field !w-auto" aria-label="Filter by payment status">
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading orders..." />
      ) : error ? (
        <p className="py-16 text-center text-white/50">Unable to load orders. Please try again.</p>
      ) : data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50"><ClipboardList size={36} /><p>No orders match these filters.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Order status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.results.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3"><Link to={`/orders/${o.id}`} className="font-medium hover:text-ember-500">{o.order_number}</Link><span className="block text-xs text-white/35">{formatDate(o.created_at)}</span></td>
                  <td className="px-4 py-3"><span>{o.first_name} {o.last_name}</span><span className="block text-xs text-white/35">{o.phone} · {o.town}</span></td>
                  <td className="px-4 py-3">{formatKsh(o.total)}<span className="block text-xs text-white/35">{o.payment_method === "mpesa" ? "M-Pesa" : "Cash on delivery"}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PAY_COLORS[o.payment_status] || "bg-white/10 text-white/60"}`}>{o.payment_status}</span></td>
                  <td className="px-4 py-3">
                    <select value={o.order_status} onChange={(e) => changeStatus(o, e.target.value)} className="input-field !w-auto !py-1.5" aria-label={`Status for ${o.order_number}`}>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {o.order_status === "DELIVERED" && (
                      <span className="mt-1 block text-xs text-white/40">
                        {o.delivery_confirmed_by === "customer" ? "confirmed by customer" : "marked by staff"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => downloadReceipt(o)} className="rounded-sm p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label={`Receipt for ${o.order_number}`}>
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={setPage} />
    </div>
  );
}

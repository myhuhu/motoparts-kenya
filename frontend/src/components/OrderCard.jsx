import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function OrderCard({ order }) {
  return (
    <Link to={`/orders/${order.id}`} className="card block p-5 hover:border-ember-500/50 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="font-semibold">{order.order_number}</span>
        <OrderStatus status={order.order_status} />
      </div>
      <p className="text-xs text-white/40 mb-3">
        {new Date(order.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
        {" · "}{order.items?.length || 0} item(s)
      </p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">Payment: {order.payment_status}</span>
        <span className="font-semibold text-ember-500">{formatKsh(order.total)}</span>
      </div>
    </Link>
  );
}

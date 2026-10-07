const COLORS = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  PROCESSING: "bg-blue-500/15 text-blue-400",
  SHIPPED: "bg-purple-500/15 text-purple-400",
  DELIVERED: "bg-green-500/15 text-green-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

export default function OrderStatus({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COLORS[status] || "bg-white/10 text-white/60"}`}>
      {status}
    </span>
  );
}

import { Check, Download, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import OrderStatus from "../components/OrderStatus";
import { useToast } from "../context/ToastContext";
import orderService from "../services/orderService";
import { apiError } from "../utils/format";

const STAGES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const LABELS = { PENDING: "Order Placed", CONFIRMED: "Payment Confirmed", PROCESSING: "Processing", SHIPPED: "Shipped", DELIVERED: "Delivered" };

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function OrderDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    orderService.detail(id).then(setOrder);
  }, [id]);

  const confirmDelivery = async () => {
    setConfirming(true);
    try {
      const updated = await orderService.confirmDelivery(id);
      setOrder(updated);
      setShowConfirm(false);
      showToast("Thanks! Your order is marked as delivered.");
    } catch (err) {
      showToast(apiError(err, "Could not confirm delivery."), "error");
    } finally {
      setConfirming(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      await orderService.downloadReceipt(id);
      showToast("Receipt downloaded.");
    } catch (err) {
      showToast(apiError(err, "Could not download the receipt."), "error");
    }
  };

  if (!order) return <LoadingSpinner />;

  const currentIndex = order.order_status === "CANCELLED" ? -1 : STAGES.indexOf(order.order_status);
  const canConfirm = order.order_status === "SHIPPED" && order.payment_status === "SUCCESS";

  return (
    <div className="container-page py-10 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="font-display text-3xl font-semibold">Order {order.order_number}</h1>
        <button onClick={downloadReceipt} className="btn-secondary !py-2 text-sm flex items-center gap-2">
          <Download size={15} /> Receipt
        </button>
      </div>
      <p className="text-white/40 text-sm mb-8">
        Placed on {new Date(order.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      {order.order_status !== "CANCELLED" && (
        <div className="card p-6 mb-8">
          <div className="flex justify-between">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div className={`absolute top-3 right-1/2 w-full h-0.5 ${i <= currentIndex ? "bg-ember-500" : "bg-white/10"}`} />
                )}
                <div className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-xs ${i <= currentIndex ? "bg-ember-500 text-on-ember" : "bg-charcoal-800 border border-white/20 text-white/40"}`}>
                  {i <= currentIndex ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-[11px] text-white/50 mt-2 text-center">{LABELS[stage]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4">Items</h2>
        <div className="divide-y divide-white/5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <span>{item.product_name} × {item.quantity}</span>
              <span className="font-medium">{formatKsh(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-white/50"><span>Subtotal</span><span>{formatKsh(order.subtotal)}</span></div>
          <div className="flex justify-between text-white/50"><span>Delivery</span><span>{formatKsh(order.delivery_fee)}</span></div>
          <div className="flex justify-between font-semibold text-base pt-1"><span>Total</span><span className="text-ember-500">{formatKsh(order.total)}</span></div>
        </div>
      </div>

      {order.order_status === "DELIVERED" && (
        <div className="card mb-6 flex items-center gap-3 border-green-500/30 p-4">
          <PackageCheck size={22} className="shrink-0 text-green-500" />
          <div>
            <p className="font-semibold text-green-400">Delivered</p>
            <p className="text-xs text-white/50">
              {order.delivery_confirmed_by === "customer"
                ? "You confirmed you received this order."
                : "Marked as delivered by our team."}
              {order.delivered_at &&
                ` on ${new Date(order.delivered_at).toLocaleDateString("en-KE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}`}
            </p>
          </div>
        </div>
      )}

      {canConfirm && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">Already received this order?</p>
            <p className="text-xs text-white/50">
              Confirm delivery so we can close your order.
            </p>
          </div>
          <button onClick={() => setShowConfirm(true)} className="btn-primary !py-2 text-sm">
            <PackageCheck size={15} /> Confirm delivery
          </button>
        </div>
      )}

      <div className="card p-6 text-sm text-white/60 space-y-1">
        <h2 className="font-display text-xl font-semibold text-white mb-3">Delivery Info</h2>
        <p>{order.first_name} {order.last_name} · {order.phone}</p>
        <p>{order.delivery_address}, {order.town}, {order.county}</p>
        <p>Payment: {order.payment_method === "mpesa" ? "M-Pesa" : "Cash on Delivery"} — {order.payment_status}</p>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm delivery?">
        <p className="mb-5 text-sm text-white/60">
          Confirm that you have received all the items in order{" "}
          <span className="text-white">{order.order_number}</span>. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary !py-2 text-sm" onClick={() => setShowConfirm(false)}>
            Not yet
          </button>
          <button
            className="btn-primary !py-2 text-sm disabled:opacity-50"
            disabled={confirming}
            onClick={confirmDelivery}
          >
            {confirming ? "Confirming..." : "Yes, I received it"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

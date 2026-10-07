import { CheckCircle2, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import orderService from "../services/orderService";
import { apiError } from "../utils/format";

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    orderService.detail(id).then(setOrder);
  }, [id]);

  const downloadReceipt = async () => {
    try {
      await orderService.downloadReceipt(id);
      showToast("Receipt downloaded.");
    } catch (err) {
      showToast(apiError(err, "Could not download the receipt."), "error");
    }
  };

  if (!order) return <LoadingSpinner />;

  return (
    <div className="container-page py-20 max-w-lg mx-auto text-center">
      <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
      <h1 className="font-display text-3xl font-semibold mb-2">Order Placed!</h1>
      <p className="text-white/60 text-sm mb-8">
        Order <span className="text-ember-500 font-semibold">{order.order_number}</span> has been received.
      </p>

      <div className="card p-6 text-left space-y-2 text-sm mb-8">
        <div className="flex justify-between"><span className="text-white/50">Payment Method</span><span>{order.payment_method === "mpesa" ? "M-Pesa" : "Cash on Delivery"}</span></div>
        <div className="flex justify-between"><span className="text-white/50">Delivery To</span><span>{order.town}, {order.county}</span></div>
        <div className="flex justify-between font-semibold border-t border-white/10 pt-2"><span>Total</span><span className="text-ember-500">{formatKsh(order.total)}</span></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={downloadReceipt} className="btn-secondary flex items-center justify-center gap-2">
          <Download size={16} /> Download Receipt
        </button>
        <Link to={`/orders/${order.id}`} className="btn-primary">Track Order</Link>
        <Link to="/shop" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  );
}

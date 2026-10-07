import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import paymentService from "../services/paymentService";
import { formatKsh } from "../utils/format";

export default function PaymentStatus() {
  const { checkoutRequestId } = useParams();
  const location = useLocation();
  const orderId = location.state?.orderId;
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    let timer;
    const poll = async () => {
      try {
        const data = await paymentService.status(checkoutRequestId);
        setPayment(data);
        attempts.current += 1;
        if (data.status === "PENDING" && attempts.current < 30) {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        setError(true);
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [checkoutRequestId]);

  const status = payment?.status;

  return (
    <div className="container-page py-24 flex flex-col items-center text-center max-w-md mx-auto">
      {(!status || status === "PENDING") && !error && (
        <>
          <Smartphone size={48} className="text-ember-500 mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Check Your Phone</h1>
          {payment?.amount ? (
            <p className="text-2xl font-semibold text-ember-500 mb-3">
              {formatKsh(payment.amount)}
            </p>
          ) : null}
          <p className="text-white/60 text-sm mb-6">
            We've sent an M-Pesa payment request to your phone. Enter your M-Pesa PIN to complete
            the payment. This page will update automatically.
          </p>
          <Loader2 className="animate-spin text-ember-500" size={28} />
        </>
      )}

      {status === "SUCCESS" && (
        <>
          <CheckCircle2 size={56} className="text-green-500 mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Payment Successful!</h1>

          <dl className="w-full card p-5 space-y-2 text-sm text-left mb-6">
            <div className="flex items-center justify-between">
              <dt className="text-white/50">Amount paid</dt>
              <dd className="font-semibold text-ember-500">
                {formatKsh(payment.amount_paid ?? payment.amount)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-white/50">M-Pesa receipt</dt>
              <dd className="font-mono text-xs">{payment.mpesa_receipt_number || "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-white/50">Paid on</dt>
              <dd className="text-xs">{payment.transaction_date || "—"}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2">
              <dt className="text-white/50">Reference</dt>
              <dd className="font-mono text-xs break-all text-right">{payment.checkout_request_id}</dd>
            </div>
          </dl>

          <p className="text-white/60 text-sm mb-6">Your order has been confirmed.</p>
          <Link to={orderId ? `/order-success/${orderId}` : "/dashboard"} className="btn-primary">
            View Order
          </Link>
        </>
      )}

      {(status === "FAILED" || status === "CANCELLED") && (
        <>
          <XCircle size={56} className="text-red-500 mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">
            {status === "CANCELLED" ? "Payment Cancelled" : "Payment Failed"}
          </h1>
          <p className="text-white/60 text-sm mb-6">{payment.result_description || "Please try again."}</p>
          <Link to="/checkout" className="btn-primary">Try Again</Link>
        </>
      )}

      {error && (
        <>
          <XCircle size={56} className="text-red-500 mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Unable to Check Payment Status</h1>
          <Link to="/dashboard" className="btn-primary">Go to My Orders</Link>
        </>
      )}
    </div>
  );
}

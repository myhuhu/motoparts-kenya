import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";

const FALLBACK_COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Other"];

export default function Checkout() {
  const { cart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Counties and fees come from the backend so they can be changed in .env.
  const [delivery, setDelivery] = useState({ counties: FALLBACK_COUNTIES, fees: {}, default_fee: 0 });

  useEffect(() => {
    let active = true;
    orderService
      .deliveryInfo()
      .then((data) => {
        if (active && data?.counties?.length) {
          setDelivery({
            counties: data.counties,
            fees: data.fees || {},
            default_fee: data.default_fee || 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    county: "Nairobi",
    town: "",
    delivery_address: "",
    notes: "",
    payment_method: "mpesa",
  });
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [step, setStep] = useState("form"); // form | paying
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = delivery.fees[form.county] ?? delivery.default_fee ?? 0;

  useEffect(() => {
    if (cart.items?.length === 0 && step === "form") {
      navigate("/cart");
    }
  }, [cart, navigate, step]);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await orderService.create(form);

      if (form.payment_method === "cod") {
        showToast("Order placed successfully.");
        navigate(`/order-success/${order.id}`);
        return;
      }

      // M-Pesa flow
      const phoneToUse = mpesaPhone || form.phone;
      const { checkout_request_id } = await paymentService.stkPush(order.id, phoneToUse);
      showToast("Payment initiated. Check your phone.", "info");
      navigate(`/payment-status/${checkout_request_id}`, { state: { orderId: order.id } });
    } catch (err) {
      const data = err.response?.data;
      const message = typeof data === "string" ? data : data?.detail || Object.values(data || {})[0] || "Checkout failed.";
      showToast(Array.isArray(message) ? message[0] : message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="card p-6 space-y-5">
          <h2 className="font-display text-xl font-semibold">Delivery Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="First Name" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="input-field" />
            <input required placeholder="Last Name" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="input-field" />
            <input required type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-field" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" />
            <select required value={form.county} onChange={(e) => update("county", e.target.value)} className="input-field">
              {delivery.counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required placeholder="Town" value={form.town} onChange={(e) => update("town", e.target.value)} className="input-field" />
          </div>
          <input required placeholder="Delivery Address (street, building, landmark)" value={form.delivery_address} onChange={(e) => update("delivery_address", e.target.value)} className="input-field" />
          <textarea placeholder="Additional Notes (optional)" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input-field" />

          <h2 className="font-display text-xl font-semibold pt-2">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 card p-4 cursor-pointer border-white/10 has-[:checked]:border-ember-500">
              <input type="radio" name="payment_method" checked={form.payment_method === "mpesa"} onChange={() => update("payment_method", "mpesa")} className="accent-ember-500" />
              <span className="text-sm font-medium">M-Pesa</span>
            </label>
            {form.payment_method === "mpesa" && (
              <input
                type="tel"
                placeholder="M-Pesa Phone Number e.g. 0712345678"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="input-field ml-8 w-[calc(100%-2rem)]"
              />
            )}
            <label className="flex items-center gap-3 card p-4 cursor-pointer border-white/10 has-[:checked]:border-ember-500">
              <input type="radio" name="payment_method" checked={form.payment_method === "cod"} onChange={() => update("payment_method", "cod")} className="accent-ember-500" />
              <span className="text-sm font-medium">Cash on Delivery</span>
            </label>
          </div>
        </div>

        <CartSummary
          subtotal={cart.subtotal}
          deliveryFee={deliveryFee}
          ctaLabel={submitting ? "Processing..." : form.payment_method === "mpesa" ? "Pay with M-Pesa" : "Place Order"}
          onCta={handleSubmit}
          ctaDisabled={submitting}
        />
      </form>
    </div>
  );
}

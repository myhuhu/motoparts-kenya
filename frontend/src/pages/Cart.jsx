import { ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CartItemRow from "../components/CartItemRow";
import CartSummary from "../components/CartSummary";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, loading } = useCart();
  const navigate = useNavigate();
  const items = cart.items || [];

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">Shopping Cart</h1>

      {!loading && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-white/50">
          <ShoppingBag size={40} />
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn-primary mt-2">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="card p-5">
            {items.map((item) => <CartItemRow key={item.id} item={item} />)}
          </div>
          <CartSummary
            subtotal={cart.subtotal}
            ctaLabel="Proceed to Checkout"
            onCta={() => navigate("/checkout")}
          />
        </div>
      )}
    </div>
  );
}

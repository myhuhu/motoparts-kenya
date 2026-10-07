import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

const PLACEHOLDER = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=200&q=60";

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function CartItemRow({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
      <img
        src={item.product.image || PLACEHOLDER}
        alt={item.product.name}
        className="h-16 w-16 rounded-sm object-cover bg-charcoal-800"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
        <p className="text-xs text-white/40">{formatKsh(item.unit_price)} each</p>
      </div>
      <div className="flex items-center gap-2 border border-white/10 rounded-sm">
        <button
          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
          className="p-1.5 hover:text-ember-500"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm w-5 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="p-1.5 hover:text-ember-500"
        >
          <Plus size={14} />
        </button>
      </div>
      <span className="w-24 text-right text-sm font-semibold">{formatKsh(item.subtotal)}</span>
      <button onClick={() => removeFromCart(item.id)} className="text-white/40 hover:text-red-500">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

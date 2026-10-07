import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import wishlistService from "../services/wishlistService";

const PLACEHOLDER = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=60";

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    wishlistService.list().then((data) => {
      setItems(data.results || data);
      setLoading(false);
    });
  }, []);

  const moveToCart = async (item) => {
    const ok = await addToCart(item.product.id, 1);
    if (ok) {
      await wishlistService.remove(item.id);
      setItems(items.filter((i) => i.id !== item.id));
    }
  };

  const remove = async (item) => {
    await wishlistService.remove(item.id);
    setItems(items.filter((i) => i.id !== item.id));
    showToast("Removed from wishlist.", "info");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50">
          <Heart size={36} />
          <p>Your wishlist is empty.</p>
          <Link to="/shop" className="btn-primary mt-2">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex gap-4">
              <img src={item.product.image || PLACEHOLDER} alt="" className="h-20 w-20 rounded-sm object-cover bg-charcoal-800" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                <p className="text-ember-500 font-semibold mt-1">{formatKsh(item.product.discount_price || item.product.price)}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => moveToCart(item)} className="btn-primary !py-1.5 !px-3 text-xs"><ShoppingCart size={13} /> Add to Cart</button>
                  <button onClick={() => remove(item)} className="text-white/40 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

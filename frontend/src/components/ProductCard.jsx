import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import wishlistService from "../services/wishlistService";
import RatingStars from "./RatingStars";

const PLACEHOLDER = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=60";

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Log in to save items to your wishlist.", "info");
      return;
    }
    try {
      await wishlistService.add(product.id);
      showToast("Added to wishlist.");
    } catch {
      showToast("Could not add to wishlist.", "error");
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="card group relative flex flex-col overflow-hidden hover:border-ember-500/50 transition-colors"
    >
      <div className="relative aspect-square bg-charcoal-800 overflow-hidden">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-ember-500 text-on-ember text-xs font-bold px-2 py-1 rounded-sm">
            -{product.discount_percentage}%
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute top-2 right-2 bg-charcoal-950/90 text-white/70 text-xs font-semibold px-2 py-1 rounded-sm border border-white/10">
            OUT OF STOCK
          </span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute bottom-2 right-2 bg-charcoal-950/80 hover:bg-ember-500 hover:text-on-ember text-white p-2 rounded-full transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-[11px] uppercase tracking-wide text-ember-500 font-semibold">
          {product.motorcycle_model || product.motorcycle_brand}
        </span>
        <h3 className="font-medium leading-snug line-clamp-2">{product.name}</h3>
        {product.compatibility && (
          <p className="text-xs text-white/40 line-clamp-1">Compatible: {product.compatibility}</p>
        )}
        <RatingStars rating={product.average_rating} count={product.review_count} />

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-ember-500">{formatKsh(product.effective_price ?? product.discount_price ?? product.price)}</span>
          {product.discount_price && (
            <span className="text-xs text-white/40 line-through">{formatKsh(product.price)}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            addToCart(product.id, 1);
          }}
          disabled={!product.in_stock}
          className="btn-primary mt-2 w-full !py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>
    </Link>
  );
}

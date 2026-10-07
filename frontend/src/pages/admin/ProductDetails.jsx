import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import RatingStars from "../components/RatingStars";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import productService from "../services/productService";
import reviewService from "../services/reviewService";
import { sanitizeHtml } from "../utils/sanitize";

const PLACEHOLDER = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=700&q=70";

function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function ProductDetails() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(PLACEHOLDER);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    setLoading(true);
    productService.detail(slug).then((data) => {
      setProduct(data);
      setActiveImage(data.image || PLACEHOLDER);
      setLoading(false);
      reviewService.list(data.id).then((r) => setReviews(r.results || r));
    });
  }, [slug]);

  if (loading) return <LoadingSpinner label="Loading product..." />;
  if (!product) return <div className="container-page py-20 text-center text-white/50">Product not found.</div>;

  const gallery = [product.image, ...(product.additional_images || []).map((i) => i.image)].filter(Boolean);

  const handleBuyNow = async () => {
    const added = await addToCart(product.id, qty);
    if (added) navigate("/checkout");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return showToast("Log in to leave a review.", "info");
    try {
      await reviewService.create({ product: product.id, ...reviewForm });
      showToast("Review submitted.");
      const r = await reviewService.list(product.id);
      setReviews(r.results || r);
      setReviewForm({ rating: 5, comment: "" });
    } catch (err) {
      showToast(err.response?.data?.non_field_errors?.[0] || "Could not submit review.", "error");
    }
  };

  return (
    <div className="container-page py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="card aspect-square overflow-hidden mb-3">
            <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2">
              {gallery.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(img)} className="h-16 w-16 rounded-sm overflow-hidden border border-white/10">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-ember-500 font-semibold">{product.category_name}</span>
          <h1 className="font-display text-3xl font-semibold mt-1 mb-2">{product.name}</h1>
          <RatingStars rating={product.average_rating} count={product.review_count} size={16} />

          <div className="flex items-baseline gap-3 mt-4 mb-2">
            <span className="text-3xl font-bold text-ember-500">{formatKsh(product.effective_price ?? product.discount_price ?? product.price)}</span>
            {product.discount_price && <span className="text-white/40 line-through">{formatKsh(product.price)}</span>}
          </div>

          <p className={`text-sm font-medium mb-4 ${product.in_stock ? "text-green-400" : "text-red-400"}`}>
            {product.in_stock ? `In Stock (${product.stock_quantity} available)` : "Out of Stock"}
          </p>

          <div className="text-sm text-white/60 space-y-1 mb-6">
            <p><span className="text-white/40">SKU:</span> {product.sku}</p>
            <p><span className="text-white/40">Brand:</span> {product.brand || product.motorcycle_brand}</p>
            <p><span className="text-white/40">Compatibility:</span> {product.compatibility || "Universal"}</p>
          </div>

          {product.short_description && <p className="text-white/80 text-sm mb-3">{product.short_description}</p>}
          {product.description && (
            <div
              className="rich-text text-white/70 text-sm leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
            />
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 border border-white/10 rounded-sm px-3 py-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
              <span className="w-6 text-center">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}><Plus size={16} /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(product.id, qty)}
              disabled={!product.in_stock}
              className="btn-secondary flex-1 disabled:opacity-30"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={!product.in_stock} className="btn-primary flex-1 disabled:opacity-30">
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-2xl font-semibold mb-4">Customer Reviews</h2>
          {reviews.length === 0 && <p className="text-white/40 text-sm">No reviews yet.</p>}
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <RatingStars rating={r.rating} />
                  <span className="text-xs text-white/40">Verified Customer</span>
                </div>
                <p className="text-sm text-white/70">{r.comment}</p>
                <p className="text-xs text-white/30 mt-1">— {r.username}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold mb-4">Write a Review</h2>
          <form onSubmit={submitReview} className="card p-5 space-y-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="input-field"
              >
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-2">Comment</label>
              <textarea
                required
                rows={3}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="input-field"
                placeholder="Share your experience with this product..."
              />
            </div>
            <button type="submit" className="btn-primary w-full">Submit Review</button>
            <p className="text-xs text-white/30">Only customers who purchased this product can review it.</p>
          </form>
        </div>
      </div>
    </div>
  );
}

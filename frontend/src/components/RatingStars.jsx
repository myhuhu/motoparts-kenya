import { Star } from "lucide-react";

export default function RatingStars({ rating = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(rating) ? "fill-ember-500 text-ember-500" : "text-white/20"}
          />
        ))}
      </div>
      {typeof count === "number" && <span className="text-xs text-white/40">({count})</span>}
    </div>
  );
}

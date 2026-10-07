export default function DiscountBadge({ percentage }) {
  if (!percentage) return null;
  return (
    <span className="absolute top-2 left-2 bg-ember-500 text-on-ember text-xs font-bold px-2 py-1 rounded-sm">
      -{percentage}%
    </span>
  );
}

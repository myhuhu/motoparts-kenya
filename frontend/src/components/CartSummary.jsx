function formatKsh(value) {
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function CartSummary({ subtotal, deliveryFee = 0, discount = 0, ctaLabel, onCta, ctaDisabled }) {
  const total = Number(subtotal) + Number(deliveryFee) - Number(discount);
  return (
    <div className="card p-5 space-y-3 h-fit">
      <h3 className="font-display text-xl font-semibold">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-white/60">
          <span>Subtotal</span>
          <span>{formatKsh(subtotal)}</span>
        </div>
        <div className="flex justify-between text-white/60">
          <span>Delivery</span>
          <span>{deliveryFee ? formatKsh(deliveryFee) : "Calculated at checkout"}</span>
        </div>        {discount > 0 && (
          <div className="flex justify-between text-ember-500">
            <span>Discount</span>
            <span>-{formatKsh(discount)}</span>
          </div>
        )}
      </div>
      <div className="border-t border-white/10 pt-3 flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span className="text-ember-500">{formatKsh(total)}</span>
      </div>
      {ctaLabel && (
        <button onClick={onCta} disabled={ctaDisabled} className="btn-primary w-full disabled:opacity-40">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

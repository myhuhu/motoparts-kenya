const MOTO_BRANDS = [
  { value: "", label: "All Brands" },
  { value: "bajaj", label: "Bajaj" },
  { value: "honda", label: "Honda" },
  { value: "tvs", label: "TVS" },
  { value: "boxer", label: "Boxer" },
  { value: "suzuki", label: "Suzuki" },
  { value: "yamaha", label: "Yamaha" },
  { value: "electric", label: "Electric Bike" },
  { value: "other", label: "Other" },
];

export default function FilterSidebar({ filters, onChange, categories = [] }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="card p-5 space-y-6 h-fit">
      <div>
        <h4 className="font-display text-lg font-semibold mb-3">Motorcycle</h4>
        <select
          value={filters.motorcycle_brand || ""}
          onChange={(e) => update("motorcycle_brand", e.target.value)}
          className="input-field"
        >
          {MOTO_BRANDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="font-display text-lg font-semibold mb-3">Category</h4>
        <select
          value={filters.category || ""}
          onChange={(e) => update("category", e.target.value)}
          className="input-field"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="font-display text-lg font-semibold mb-3">Price Range (KSh)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price || ""}
            onChange={(e) => update("min_price", e.target.value)}
            className="input-field"
          />
          <span className="text-white/30">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price || ""}
            onChange={(e) => update("max_price", e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <h4 className="font-display text-lg font-semibold mb-3">Availability</h4>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={filters.in_stock === "true"}
            onChange={(e) => update("in_stock", e.target.checked ? "true" : "")}
            className="accent-ember-500"
          />
          In Stock Only
        </label>
      </div>

      <div>
        <h4 className="font-display text-lg font-semibold mb-3">Sort By</h4>
        <select
          value={filters.ordering || ""}
          onChange={(e) => update("ordering", e.target.value)}
          className="input-field"
        >
          <option value="">Newest</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      <button
        onClick={() => onChange({})}
        className="btn-secondary w-full !py-2 text-sm"
      >
        Clear Filters
      </button>
    </aside>
  );
}

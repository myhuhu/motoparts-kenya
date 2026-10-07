import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import adminService from "../../services/adminService";
import { MOTO_BRANDS } from "../../utils/constants";

export default function AdminBrands() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminService.stats().then((s) => setCounts(s.products_by_brand)).catch(() => setError(true));
  }, []);

  if (error) return <p className="py-16 text-center text-white/50">Unable to load brands. Please try again.</p>;
  if (!counts) return <LoadingSpinner label="Loading brands..." />;

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold">Brands</h2>
      <p className="mb-5 mt-1 text-sm text-white/40">Motorcycle brands your parts are sorted under. Choose one when adding a product.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MOTO_BRANDS.map((b) => (
          <Link key={b.value} to={`/admin/products?brand=${b.value}`} className="card flex items-center gap-4 p-5 transition-colors hover:border-ember-500/50">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-ember-500 font-display text-xl font-bold text-on-ember">{b.label[0]}</span>
            <span>
              <span className="block font-medium">{b.label}</span>
              <span className="text-xs text-white/40">{counts[b.value] || 0} products</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

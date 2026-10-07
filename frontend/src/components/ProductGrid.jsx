import { PackageSearch } from "lucide-react";
import ProductCard from "./ProductCard";
import LoadingSpinner from "./LoadingSpinner";

export default function ProductGrid({ products, loading, error }) {
  if (loading) return <LoadingSpinner label="Loading products..." />;
  if (error)
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-white/50">
        <PackageSearch size={36} />
        <p>Unable to load products. Please try again.</p>
      </div>
    );
  if (!products || products.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-white/50">
        <PackageSearch size={36} />
        <p>No products found.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

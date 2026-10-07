import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilterSidebar from "../components/FilterSidebar";
import Pagination from "../components/Pagination";
import ProductGrid from "../components/ProductGrid";
import productService from "../services/productService";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageInfo, setPageInfo] = useState({ next: null, previous: null, count: 0 });
  const [page, setPage] = useState(1);

  const filters = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  useEffect(() => {
    productService.categories().then((c) => setCategories(c.results || c));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const params = { ...filters, page };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    productService
      .list(params)
      .then((data) => {
        setProducts(data.results || data);
        setPageInfo({ next: data.next, previous: data.previous, count: data.count });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const handleFilterChange = (newFilters) => {
    setPage(1);
    setSearchParams(newFilters);
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Shop Spare Parts</h1>
      <p className="text-white/50 text-sm mb-8">
        {pageInfo.count ? `${pageInfo.count} products found` : "Browse our full catalog"}
        {filters.search && ` for "${filters.search}"`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <FilterSidebar filters={filters} onChange={handleFilterChange} categories={categories} />
        <div>
          <ProductGrid products={products} loading={loading} error={error} />
          <Pagination
            page={page}
            hasNext={!!pageInfo.next}
            hasPrev={!!pageInfo.previous}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

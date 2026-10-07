import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import adminService from "../../services/adminService";
import { MOTO_BRANDS } from "../../utils/constants";
import { apiError, formatKsh } from "../../utils/format";

function StockBadge({ product }) {
  if (product.stock_quantity === 0 || product.stock_status === "out_of_stock")
    return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">Out of stock</span>;
  if (product.stock_quantity <= 5)
    return <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-400">{product.stock_quantity} left</span>;
  return <span className="text-white/70">{product.stock_quantity}</span>;
}

export default function AdminProducts() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = { page, ordering: "-created_at" };
    if (debounced) params.search = debounced;
    if (brand) params.motorcycle_brand = brand;
    if (status) params.is_active = status;
    adminService.listProducts(params).then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  }, [debounced, brand, status, page]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminService.deleteProduct(toDelete.slug);
      showToast("Product deleted.");
      setToDelete(null);
      if (data.results.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      showToast(apiError(err, "Could not delete the product."), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold">Products</h2>
          <p className="text-sm text-white/40">{data.count} in your catalog</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary !py-2 text-sm"><Plus size={16} /> Add Product</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU, brand..." className="input-field pl-9" aria-label="Search products" />
        </div>
        <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} className="input-field !w-auto" aria-label="Filter by brand">
          <option value="">All brands</option>
          {MOTO_BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field !w-auto" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Draft / disabled</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading products..." />
      ) : error ? (
        <p className="py-16 text-center text-white/50">Unable to load products. Please try again.</p>
      ) : data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50">
          <Package size={36} />
          <p>No products match these filters.</p>
          <Link to="/admin/products/new" className="btn-primary mt-1">Add your first product</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.results.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-11 w-11 rounded-sm bg-charcoal-800 object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-charcoal-800 text-white/30"><Package size={18} /></span>
                      )}
                      <div className="min-w-0">
                        <Link to={`/admin/products/${p.slug}/edit`} className="block truncate font-medium hover:text-ember-500">{p.name}</Link>
                        <span className="text-xs text-white/35">{p.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{p.category_name || "—"}</td>
                  <td className="px-4 py-3">
                    {p.discount_price ? (
                      <>{formatKsh(p.discount_price)} <span className="text-xs text-white/35 line-through">{formatKsh(p.price)}</span></>
                    ) : formatKsh(p.price)}
                  </td>
                  <td className="px-4 py-3"><StockBadge product={p} /></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.is_active ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {p.is_active ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/products/${p.slug}/edit`} className="rounded-sm p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label={`Edit ${p.name}`}><Pencil size={16} /></Link>
                      <button onClick={() => setToDelete(p)} className="rounded-sm p-2 text-white/50 hover:bg-red-500/10 hover:text-red-400" aria-label={`Delete ${p.name}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={setPage} />

      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} title="Delete product?">
        <p className="mb-5 text-sm text-white/60">
          <span className="text-white">{toDelete?.name}</span> will be removed from the catalog. Past orders keep their
          recorded name and price. To just hide it from the shop, save it as a draft instead.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary !py-2 text-sm" onClick={() => setToDelete(null)} disabled={deleting}>Keep product</button>
          <button className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50" onClick={confirmDelete} disabled={deleting}>
            {deleting && <Loader2 size={14} className="animate-spin" />} Delete product
          </button>
        </div>
      </Modal>
    </div>
  );
}

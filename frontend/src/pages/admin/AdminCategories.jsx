import { Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import adminService from "../../services/adminService";
import { apiError, fieldErrors } from "../../utils/format";

const EMPTY = { name: "", description: "", icon: "" };

export default function AdminCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | category
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setError(false);
    adminService.listCategories()
      .then((d) => setCategories(d.results || d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openForm = (cat) => {
    setEditing(cat || "new");
    setForm(cat ? { name: cat.name, description: cat.description || "", icon: cat.icon || "" } : EMPTY);
    setErrors({});
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: "Enter a category name." });
    setSaving(true);
    try {
      if (editing === "new") await adminService.createCategory(form);
      else await adminService.updateCategory(editing.slug, form);
      showToast(editing === "new" ? "Category added." : "Category updated.");
      setEditing(null);
      load();
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast(apiError(err, "Could not save the category."), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminService.deleteCategory(toDelete.slug);
      showToast("Category deleted.");
      setToDelete(null);
      load();
    } catch (err) {
      showToast(apiError(err, "Could not delete the category."), "error");
    }
  };

  if (loading) return <LoadingSpinner label="Loading categories..." />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold">Categories</h2>
        <button onClick={() => openForm()} className="btn-primary !py-2 text-sm"><Plus size={16} /> Add Category</button>
      </div>

      {error ? (
        <p className="py-16 text-center text-white/50">Unable to load categories. Please try again.</p>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50">
          <Tag size={36} /><p>No categories yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-white/40">
              <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Icon</th><th className="px-4 py-3 font-medium">Products</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3"><span className="font-medium">{c.name}</span><span className="block text-xs text-white/35">{c.slug}</span></td>
                  <td className="px-4 py-3 text-white/60">{c.icon || "—"}</td>
                  <td className="px-4 py-3 text-white/60">{c.product_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openForm(c)} className="rounded-sm p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label={`Edit ${c.name}`}><Pencil size={16} /></button>
                      <button onClick={() => setToDelete(c)} className="rounded-sm p-2 text-white/50 hover:bg-red-500/10 hover:text-red-400" aria-label={`Delete ${c.name}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add category" : "Edit category"}>
        <form onSubmit={save} className="space-y-4" noValidate>
          <div>
            <label htmlFor="cat-name" className="mb-1.5 block text-xs font-medium text-white/70">Name</label>
            <input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`input-field ${errors.name ? "!border-red-500/70" : ""}`} />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="cat-icon" className="mb-1.5 block text-xs font-medium text-white/70">Icon <span className="font-normal text-white/35">lucide icon name, e.g. disc, zap, battery</span></label>
            <input id="cat-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input-field" />
          </div>
          <div>
            <label htmlFor="cat-desc" className="mb-1.5 block text-xs font-medium text-white/70">Description</label>
            <textarea id="cat-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary !py-2 text-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary !py-2 text-sm disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />} Save category
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete category?">
        <p className="mb-5 text-sm text-white/60">
          <span className="text-white">{toDelete?.name}</span> will be deleted. Its {toDelete?.product_count} product(s) stay in the
          catalog but will have no category until you reassign them.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary !py-2 text-sm" onClick={() => setToDelete(null)}>Keep category</button>
          <button className="rounded-sm bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-700" onClick={remove}>Delete category</button>
        </div>
      </Modal>
    </div>
  );
}

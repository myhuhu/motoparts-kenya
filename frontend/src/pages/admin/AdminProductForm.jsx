import { ArrowLeft, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../../components/admin/RichTextEditor";
import TagInput from "../../components/admin/TagInput";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import adminService from "../../services/adminService";
import { CONDITIONS, LOCATIONS, MOTO_BRANDS, STOCK_STATUSES } from "../../utils/constants";
import { apiError, fieldErrors } from "../../utils/format";
import { isEmptyHtml, sanitizeHtml } from "../../utils/sanitize";

const MAX_IMAGE_MB = 5;
const MAX_GALLERY = 8;

const EMPTY = {
  name: "", sku: "", category: "", price: "", discount_price: "", stock_quantity: "",
  motorcycle_brand: "bajaj", stock_status: "in_stock", compatible_models: [],
  part_number: "", condition: "new", location: "", description: "", short_description: "",
  is_active: false,
};

function Field({ id, label, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium text-white/70">
        {label}
        {hint && <span className="font-normal text-white/35">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function MoneyInput({ id, value, onChange, error }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">KSh</span>
      <input
        id={id} type="number" min="0" step="0.01" inputMode="decimal"
        value={value} onChange={(e) => onChange(e.target.value)}
        className={`input-field pl-11 ${error ? "!border-red-500/70" : ""}`}
      />
    </div>
  );
}

export default function AdminProductForm() {
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // "draft" | "publish" | null

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingGallery, setExistingGallery] = useState([]);
  const [newGallery, setNewGallery] = useState([]);

  const mainInput = useRef(null);
  const galleryInput = useRef(null);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  useEffect(() => {
    let cancelled = false;
    const requests = [adminService.listCategories()];
    if (isEdit) requests.push(adminService.getProduct(slug));

    Promise.all(requests)
      .then(([cats, p]) => {
        if (cancelled) return;
        setCategories(cats.results || cats);
        if (p) {
          const fromLegacy = (p.compatibility || "").split(",").map((s) => s.trim()).filter(Boolean);
          setForm({
            name: p.name, sku: p.sku, category: p.category ?? "",
            price: p.price, discount_price: p.discount_price ?? "",
            stock_quantity: p.stock_quantity, motorcycle_brand: p.motorcycle_brand,
            stock_status: p.stock_status || "in_stock",
            compatible_models: p.compatible_models?.length ? p.compatible_models : fromLegacy,
            part_number: p.part_number || "", condition: p.condition || "new",
            location: p.location || "", description: p.description || "",
            short_description: p.short_description || "", is_active: p.is_active,
          });
          setImagePreview(p.image || "");
          setExistingGallery(p.additional_images || []);
        }
      })
      .catch(() => showToast("Unable to load this page. Please try again.", "error"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug, isEdit, showToast]);

  const validImage = (file) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (JPG, PNG or WebP).", "error");
      return false;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showToast(`Each image must be under ${MAX_IMAGE_MB} MB.`, "error");
      return false;
    }
    return true;
  };

  const pickMain = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validImage(file)) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const pickGallery = (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    const room = MAX_GALLERY - existingGallery.length - newGallery.length;
    if (files.length > room) showToast(`You can add up to ${MAX_GALLERY} gallery images.`, "info");
    const accepted = files.filter(validImage).slice(0, Math.max(room, 0));
    setNewGallery((g) => [
      ...g,
      ...accepted.map((file) => ({ key: `${file.name}-${file.lastModified}-${Math.random()}`, file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeNew = (key) => {
    setNewGallery((g) => {
      const target = g.find((i) => i.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return g.filter((i) => i.key !== key);
    });
  };

  const removeExisting = async (img) => {
    try {
      await adminService.deleteGalleryImage(img.id);
      setExistingGallery((g) => g.filter((i) => i.id !== img.id));
    } catch (err) {
      showToast(apiError(err, "Could not remove the image."), "error");
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter a product name.";
    if (!form.sku.trim()) e.sku = "Enter a SKU.";
    if (!form.category) e.category = "Choose a category.";
    if (form.price === "" || Number(form.price) <= 0) e.price = "Enter a price above 0.";
    if (form.discount_price !== "" && Number(form.discount_price) >= Number(form.price)) {
      e.discount_price = "Must be lower than the price.";
    }
    if (form.stock_quantity === "" || Number(form.stock_quantity) < 0 || !Number.isInteger(Number(form.stock_quantity))) {
      e.stock_quantity = "Enter a whole number, 0 or more.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (publish) => {
    if (!validate()) {
      showToast("Fix the highlighted fields and try again.", "error");
      return;
    }
    setSaving(publish ? "publish" : "draft");

    const brandLabel = MOTO_BRANDS.find((b) => b.value === form.motorcycle_brand)?.label || "";
    const description = isEmptyHtml(form.description) ? "" : sanitizeHtml(form.description);

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("sku", form.sku.trim());
    fd.append("category", form.category);
    fd.append("price", form.price);
    if (form.discount_price !== "") fd.append("discount_price", form.discount_price);
    else if (isEdit) fd.append("discount_price", ""); // clears an existing special price
    fd.append("stock_quantity", form.stock_quantity);
    fd.append("motorcycle_brand", form.motorcycle_brand);
    fd.append("brand", brandLabel);
    fd.append("motorcycle_model", form.compatible_models[0] || "");
    fd.append("compatible_models", JSON.stringify(form.compatible_models));
    fd.append("stock_status", form.stock_status);
    fd.append("part_number", form.part_number.trim());
    fd.append("condition", form.condition);
    fd.append("location", form.location);
    fd.append("description", description);
    fd.append("short_description", form.short_description.trim());
    fd.append("is_active", publish ? "true" : "false");
    if (imageFile) fd.append("image", imageFile);

    let saved;
    try {
      saved = isEdit ? await adminService.updateProduct(slug, fd) : await adminService.createProduct(fd);
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast(apiError(err, "Could not save the product."), "error");
      setSaving(null);
      return;
    }

    const targetSlug = saved.slug || slug;
    if (newGallery.length) {
      try {
        await adminService.uploadGalleryImages(targetSlug, newGallery.map((g) => g.file));
      } catch (err) {
        showToast(`Product saved, but gallery upload failed: ${apiError(err)}`, "error");
        setSaving(null);
        navigate(`/admin/products/${targetSlug}/edit`, { replace: true });
        return;
      }
    }

    showToast(publish ? "Product published." : "Draft saved.");
    navigate("/admin/products");
  };

  if (loading) return <LoadingSpinner label="Loading product form..." />;

  const wasPublished = isEdit && form.is_active;
  const galleryCount = existingGallery.length + newGallery.length;
  const errClass = (k) => (errors[k] ? "!border-red-500/70" : "");
  const brand = MOTO_BRANDS.find((b) => b.value === form.motorcycle_brand);

  return (
    <div>
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={14} /> Products
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl font-semibold">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          {isEdit && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${form.is_active ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
              {form.is_active ? "Published" : "Draft"}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => submit(false)} disabled={!!saving} className="btn-secondary !py-2 text-sm disabled:opacity-50">
            {saving === "draft" && <Loader2 size={15} className="animate-spin" />}
            {wasPublished ? "Move to Draft" : "Save Draft"}
          </button>
          <button type="button" onClick={() => submit(true)} disabled={!!saving} className="btn-primary !py-2 text-sm disabled:opacity-50">
            {saving === "publish" && <Loader2 size={15} className="animate-spin" />}
            {wasPublished ? "Save Changes" : "Publish Product"}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} noValidate className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        {/* ---------- Left: information + details ---------- */}
        <div className="card p-5 sm:p-6">
          <h3 className="mb-4 font-display text-xl font-semibold">Product Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_170px_150px]">
            <Field id="pf-name" label="Product Name" error={errors.name}>
              <input id="pf-name" value={form.name} onChange={(e) => set("name", e.target.value)} className={`input-field ${errClass("name")}`} placeholder="e.g. Bajaj Boxer Clutch Plate Set" />
            </Field>
            <Field id="pf-sku" label="SKU" error={errors.sku}>
              <input id="pf-sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} className={`input-field ${errClass("sku")}`} placeholder="BJX-CLU-SET-01" />
            </Field>
            <Field id="pf-category" label="Category" error={errors.category}>
              <select id="pf-category" value={form.category} onChange={(e) => set("category", e.target.value)} className={`input-field ${errClass("category")}`}>
                <option value="">Select...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <hr className="my-6 border-white/10" />

          <h3 className="mb-4 font-display text-xl font-semibold">Product Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="pf-price" label="Price" error={errors.price}>
              <MoneyInput id="pf-price" value={form.price} onChange={(v) => set("price", v)} error={errors.price} />
            </Field>
            <Field id="pf-special" label="Special Price" hint="optional" error={errors.discount_price}>
              <MoneyInput id="pf-special" value={form.discount_price} onChange={(v) => set("discount_price", v)} error={errors.discount_price} />
            </Field>
            <Field id="pf-stock" label="Stock Quantity" error={errors.stock_quantity}>
              <input id="pf-stock" type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} className={`input-field ${errClass("stock_quantity")}`} />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="pf-brand" label="Brand" error={errors.motorcycle_brand}>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm bg-ember-500 text-[11px] font-bold text-on-ember">
                  {brand?.label[0]}
                </span>
                <select id="pf-brand" value={form.motorcycle_brand} onChange={(e) => set("motorcycle_brand", e.target.value)} className="input-field pl-10">
                  {MOTO_BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            </Field>
            <Field id="pf-status" label="Stock Status" error={errors.stock_status}>
              <select id="pf-status" value={form.stock_status} onChange={(e) => set("stock_status", e.target.value)} className="input-field">
                {STOCK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <Field id="pf-models" label="Compatible Models" className="mt-4">
            <TagInput id="pf-models" tags={form.compatible_models} onChange={(t) => set("compatible_models", t)} />
          </Field>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="pf-part" label="Part Number" error={errors.part_number}>
              <input id="pf-part" value={form.part_number} onChange={(e) => set("part_number", e.target.value)} className="input-field" placeholder="BJ-24-150-CL" />
            </Field>
            <Field id="pf-condition" label="Condition" error={errors.condition}>
              <select id="pf-condition" value={form.condition} onChange={(e) => set("condition", e.target.value)} className="input-field">
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <Field id="pf-location" label="Location" className="mt-4">
            <select id="pf-location" value={form.location} onChange={(e) => set("location", e.target.value)} className="input-field">
              <option value="">Not set</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
        </div>

        {/* ---------- Right: media + description ---------- */}
        <div className="card h-fit p-5 sm:p-6">
          <h3 className="mb-4 font-display text-xl font-semibold">Product Media</h3>

          <p className="mb-1.5 text-xs font-medium text-white/70">Main Image</p>
          <input ref={mainInput} type="file" accept="image/*" onChange={pickMain} className="hidden" />
          <button
            type="button"
            onClick={() => mainInput.current.click()}
            className="group relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-sm border border-dashed border-white/20 bg-charcoal-800 hover:border-ember-500"
            aria-label={imagePreview ? "Replace main image" : "Upload main image"}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Main product preview" className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">Replace</span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs text-white/50">
                <ImagePlus size={22} /> Upload image
              </span>
            )}
          </button>
          {errors.image && <p className="mt-1 text-xs text-red-400">{errors.image}</p>}

          <p className="mb-1.5 mt-5 text-xs font-medium text-white/70">Gallery Images</p>
          <input ref={galleryInput} type="file" accept="image/*" multiple onChange={pickGallery} className="hidden" />
          <div className="flex flex-wrap gap-2">
            {existingGallery.map((img) => (
              <div key={img.id} className="group relative h-14 w-14 overflow-hidden rounded-sm border border-white/10">
                <img src={img.image} alt="Gallery" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeExisting(img)} className="absolute right-0 top-0 bg-black/80 p-0.5 opacity-0 group-hover:opacity-100" aria-label="Remove image">
                  <X size={12} />
                </button>
              </div>
            ))}
            {newGallery.map((img) => (
              <div key={img.key} className="group relative h-14 w-14 overflow-hidden rounded-sm border border-ember-500/50">
                <img src={img.preview} alt="New gallery upload" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeNew(img.key)} className="absolute right-0 top-0 bg-black/80 p-0.5 opacity-0 group-hover:opacity-100" aria-label="Remove image">
                  <X size={12} />
                </button>
              </div>
            ))}
            {galleryCount < MAX_GALLERY && (
              <button type="button" onClick={() => galleryInput.current.click()} className="flex h-14 w-14 items-center justify-center rounded-sm border border-dashed border-white/20 text-white/50 hover:border-ember-500 hover:text-ember-500" aria-label="Add gallery images">
                <Plus size={18} />
              </button>
            )}
          </div>
          {newGallery.length > 0 && <p className="mt-2 text-xs text-white/40">New images upload when you save.</p>}

          <hr className="my-6 border-white/10" />

          <h3 className="mb-4 font-display text-xl font-semibold">Description</h3>
          <p className="mb-1.5 text-xs font-medium text-white/70">Product Description</p>
          <RichTextEditor value={form.description} onChange={(v) => set("description", v)} placeholder="Describe the part, its material and what it fits..." />
          {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}

          <Field id="pf-short" label="Short Description" className="mt-4" error={errors.short_description}>
            <textarea id="pf-short" rows={2} maxLength={300} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className="input-field" placeholder="One line shown in listings" />
          </Field>
        </div>
      </form>
    </div>
  );
}

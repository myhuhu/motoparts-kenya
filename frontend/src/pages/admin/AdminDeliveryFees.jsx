import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import adminService from "../../services/adminService";
import { apiError, fieldErrors, formatKsh } from "../../utils/format";

const EMPTY = { location: "", amount: "", is_active: true };

export default function AdminDeliveryFees() {
  const { showToast } = useToast();
  const [fees, setFees] = useState([]);
  const [defaultFee, setDefaultFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | fee
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setError(false);
    Promise.all([adminService.listDeliveryFees(), adminService.deliveryInfo()])
      .then(([list, info]) => {
        setFees(Array.isArray(list) ? list : list.results || []);
        setDefaultFee(info?.default_fee ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = (fee) => {
    setEditing(fee || "new");
    setForm(
      fee
        ? { location: fee.location, amount: String(fee.amount), is_active: fee.is_active }
        : EMPTY
    );
    setErrors({});
  };

  const save = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.location.trim()) return setErrors({ location: "Enter a location." });
    if (!form.amount || Number.isNaN(amount) || amount < 0) {
      return setErrors({ amount: "Enter a valid amount, e.g. 300" });
    }
    setSaving(true);
    try {
      const payload = { location: form.location, amount, is_active: form.is_active };
      if (editing === "new") await adminService.createDeliveryFee(payload);
      else await adminService.updateDeliveryFee(editing.id, payload);
      showToast(editing === "new" ? "Delivery fee added." : "Delivery fee updated.");
      setEditing(null);
      load();
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast(apiError(err, "Could not save the delivery fee."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (fee) => {
    try {
      await adminService.updateDeliveryFee(fee.id, { is_active: !fee.is_active });
      showToast(fee.is_active ? `${fee.location} hidden from checkout.` : `${fee.location} now available.`);
      load();
    } catch (err) {
      showToast(apiError(err, "Could not update the delivery fee."), "error");
    }
  };

  const remove = async () => {
    try {
      await adminService.deleteDeliveryFee(toDelete.id);
      showToast("Delivery fee deleted.");
      setToDelete(null);
      load();
    } catch (err) {
      showToast(apiError(err, "Could not delete the delivery fee."), "error");
    }
  };

  if (loading) return <LoadingSpinner label="Loading delivery fees..." />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold">Delivery Fees</h2>
        <button onClick={() => openForm()} className="btn-primary !py-2 text-sm">
          <Plus size={16} /> Add Location
        </button>
      </div>

      <p className="mb-5 max-w-2xl text-sm text-white/60">
        These amounts are what customers are charged at checkout and on the M-Pesa
        prompt. Changes apply immediately and only affect new orders &mdash; existing
        orders keep the fee they were placed with.
      </p>

      {error ? (
        <p className="py-16 text-center text-white/50">Unable to load delivery fees. Please try again.</p>
      ) : fees.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50">
          <MapPin size={36} /><p>No delivery fees yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">At checkout</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fees.map((f) => (
                <tr key={f.id} className={f.is_active ? "" : "opacity-50"}>
                  <td className="px-4 py-3 font-medium">{f.location}</td>
                  <td className="px-4 py-3">{formatKsh(f.amount)}</td>
                  <td className="px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
                      <input
                        type="checkbox"
                        checked={f.is_active}
                        onChange={() => toggleActive(f)}
                        className="accent-ember-500"
                      />
                      {f.is_active ? "Shown" : "Hidden"}
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openForm(f)}
                        className="rounded-sm p-2 text-white/50 hover:bg-white/10 hover:text-white"
                        aria-label={`Edit ${f.location}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setToDelete(f)}
                        className="rounded-sm p-2 text-white/50 hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Delete ${f.location}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {defaultFee !== null && (
        <p className="mt-4 text-xs text-white/40">
          Locations not listed above are charged the default fee of {formatKsh(defaultFee)}.
        </p>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add delivery fee" : "Edit delivery fee"}
      >
        <form onSubmit={save} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fee-location" className="mb-1.5 block text-xs font-medium text-white/70">
              Location <span className="font-normal text-white/35">county or town, e.g. Nairobi</span>
            </label>
            <input
              id="fee-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={`input-field ${errors.location ? "!border-red-500/70" : ""}`}
            />
            {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location}</p>}
          </div>
          <div>
            <label htmlFor="fee-amount" className="mb-1.5 block text-xs font-medium text-white/70">
              Amount (KSh)
            </label>
            <input
              id="fee-amount"
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`input-field ${errors.amount ? "!border-red-500/70" : ""}`}
              placeholder="300"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount}</p>}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-ember-500"
            />
            Offer this location at checkout
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary !py-2 text-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary !py-2 text-sm disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />} Save fee
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete delivery fee?">
        <p className="mb-5 text-sm text-white/60">
          <span className="text-white">{toDelete?.location}</span> will be removed from the fee table.
          New orders for that location will fall back to the default fee. Existing orders are
          unaffected.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary !py-2 text-sm" onClick={() => setToDelete(null)}>
            Keep it
          </button>
          <button
            className="rounded-sm bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-700"
            onClick={remove}
          >
            Delete fee
          </button>
        </div>
      </Modal>
    </div>
  );
}

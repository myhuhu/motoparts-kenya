export const formatKsh = (value) => `KSh ${Number(value || 0).toLocaleString("en-KE")}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

/** Turn a DRF error response into one readable sentence. */
export function apiError(err, fallback = "Something went wrong. Please try again.") {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data.length > 200 ? fallback : data;
  if (data.detail) return data.detail;
  const first = Object.entries(data)[0];
  if (!first) return fallback;
  const [key, val] = first;
  const msg = Array.isArray(val) ? val[0] : typeof val === "object" ? JSON.stringify(val) : val;
  return key === "non_field_errors" ? msg : `${key.replace(/_/g, " ")}: ${msg}`;
}

/** Map DRF field errors to { field: "message" } so forms can highlight inputs. */
export function fieldErrors(err) {
  const data = err?.response?.data;
  if (!data || typeof data !== "object") return {};
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])
  );
}

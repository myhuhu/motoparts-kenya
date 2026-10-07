import api from "./api";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

const adminService = {
  stats: () => api.get("/admin/stats/").then((r) => r.data),

  // Products (all=true lets staff see drafts and disabled products)
  listProducts: (params = {}) =>
    api.get("/products/", { params: { all: "true", ...params } }).then((r) => r.data),
  getProduct: (slug) => api.get(`/products/${slug}/`).then((r) => r.data),
  createProduct: (formData) => api.post("/products/", formData, multipart).then((r) => r.data),
  updateProduct: (slug, formData) => api.patch(`/products/${slug}/`, formData, multipart).then((r) => r.data),
  deleteProduct: (slug) => api.delete(`/products/${slug}/`),
  uploadGalleryImages: (slug, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("image", f));
    return api.post(`/products/${slug}/images/`, fd, multipart).then((r) => r.data);
  },
  deleteGalleryImage: (id) => api.delete(`/products/images/${id}/`),

  // Categories
  listCategories: () => api.get("/categories/").then((r) => r.data),
  createCategory: (payload) => api.post("/categories/", payload).then((r) => r.data),
  updateCategory: (slug, payload) => api.patch(`/categories/${slug}/`, payload).then((r) => r.data),
  deleteCategory: (slug) => api.delete(`/categories/${slug}/`),

  // Orders
  listOrders: (params = {}) => api.get("/orders/", { params: { all: "true", ...params } }).then((r) => r.data),
  updateOrderStatus: (id, order_status) =>
    api.patch(`/orders/${id}/status/`, { order_status }).then((r) => r.data),

  // Customers
  listCustomers: (params = {}) => api.get("/admin/customers/", { params }).then((r) => r.data),
  setCustomerDisabled: (id, is_disabled) =>
    api.patch(`/admin/customers/${id}/`, { is_disabled }).then((r) => r.data),

  // Delivery fees
  deliveryInfo: () => api.get("/orders/delivery-info/").then((r) => r.data),
  listDeliveryFees: () => api.get("/admin/delivery-fees/").then((r) => r.data),
  createDeliveryFee: (payload) => api.post("/admin/delivery-fees/", payload).then((r) => r.data),
  updateDeliveryFee: (id, payload) =>
    api.patch(`/admin/delivery-fees/${id}/`, payload).then((r) => r.data),
  deleteDeliveryFee: (id) => api.delete(`/admin/delivery-fees/${id}/`),
};

export default adminService;

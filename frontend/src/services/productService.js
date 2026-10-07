import api from "./api";

const productService = {
  list: (params = {}) => api.get("/products/", { params }).then((r) => r.data),
  detail: (slug) => api.get(`/products/${slug}/`).then((r) => r.data),
  featured: () => api.get("/products/featured/").then((r) => r.data),
  categories: () => api.get("/categories/").then((r) => r.data),
};

export default productService;

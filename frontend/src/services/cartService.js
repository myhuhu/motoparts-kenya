import api from "./api";

const cartService = {
  get: () => api.get("/cart/").then((r) => r.data),
  add: (productId, quantity = 1) =>
    api.post("/cart/", { product_id: productId, quantity }).then((r) => r.data),
  updateItem: (itemId, quantity) =>
    api.put(`/cart/${itemId}/`, { quantity }).then((r) => r.data),
  removeItem: (itemId) => api.delete(`/cart/${itemId}/`).then((r) => r.data),
  clear: () => api.delete("/cart/clear/").then((r) => r.data),
};

export default cartService;

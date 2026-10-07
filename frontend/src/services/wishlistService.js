import api from "./api";

const wishlistService = {
  list: () => api.get("/wishlist/").then((r) => r.data),
  add: (productId) => api.post("/wishlist/", { product_id: productId }).then((r) => r.data),
  remove: (id) => api.delete(`/wishlist/${id}/`).then((r) => r.data),
};

export default wishlistService;

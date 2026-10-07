import api from "./api";

const reviewService = {
  list: (productId) => api.get("/reviews/", { params: { product: productId } }).then((r) => r.data),
  create: (payload) => api.post("/reviews/", payload).then((r) => r.data),
};

export default reviewService;

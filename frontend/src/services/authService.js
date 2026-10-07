import api from "./api";

const authService = {
  register: (payload) => api.post("/auth/register/", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login/", payload).then((r) => r.data),
  me: () => api.get("/auth/me/").then((r) => r.data),
  updateProfile: (payload) => api.patch("/auth/me/", payload).then((r) => r.data),
  changePassword: (payload) => api.post("/auth/change-password/", payload).then((r) => r.data),
  listAddresses: () => api.get("/auth/addresses/").then((r) => r.data),
  createAddress: (payload) => api.post("/auth/addresses/", payload).then((r) => r.data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}/`).then((r) => r.data),
};

export default authService;

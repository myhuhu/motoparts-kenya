import api from "./api";

const orderService = {
  create: (payload) => api.post("/orders/create/", payload).then((r) => r.data),
  list: () => api.get("/orders/").then((r) => r.data),
  detail: (id) => api.get(`/orders/${id}/`).then((r) => r.data),
  confirmDelivery: (id) => api.post(`/orders/${id}/confirm-delivery/`).then((r) => r.data),
  receipt: (id) => api.get(`/orders/${id}/receipt/`, { responseType: "blob" }).then((r) => r.data),
  downloadReceipt: (id) => {
    const filename = `MotoParts-Receipt-${id}.html`;
    return orderService.receipt(id).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  },
  // Authoritative county list + delivery fees, served from backend settings.
  deliveryInfo: () => api.get("/orders/delivery-info/").then((r) => r.data),
};

export default orderService;

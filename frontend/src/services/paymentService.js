import api from "./api";

const paymentService = {
  stkPush: (orderId, phoneNumber) =>
    api.post("/payments/mpesa/stk/", { order_id: orderId, phone_number: phoneNumber }).then((r) => r.data),
  status: (checkoutRequestId) =>
    api.get(`/payments/status/${checkoutRequestId}/`).then((r) => r.data),
};

export default paymentService;

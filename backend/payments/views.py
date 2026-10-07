import logging

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order

from .mpesa import DarajaError, handle_callback, initiate_stk_push, reconcile_payment
from .models import Payment
from .serializers import PaymentSerializer, STKPushRequestSerializer

logger = logging.getLogger(__name__)


class STKPushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = STKPushRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            order = Order.objects.get(pk=data["order_id"], user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=404)

        if order.payment_status == "SUCCESS":
            return Response({"detail": "This order has already been paid."}, status=400)

        try:
            payment, daraja_response = initiate_stk_push(order, data["phone_number"])
        except DarajaError as exc:
            # Daraja rejected the push; no prompt was sent and no callback will come.
            return Response({"detail": f"M-Pesa rejected the request: {exc}"}, status=400)
        except Exception as exc:  # noqa: BLE001
            logger.exception("STK push failed")
            return Response({"detail": f"Could not initiate M-Pesa payment: {exc}"}, status=502)

        return Response(
            {
                "detail": "STK push sent. Enter your M-Pesa PIN on your phone to complete payment.",
                "payment": PaymentSerializer(payment).data,
                "checkout_request_id": payment.checkout_request_id,
            },
            status=status.HTTP_200_OK,
        )


class MpesaCallbackView(APIView):
    """Public endpoint - Safaricom posts here directly. No auth (Daraja can't send JWTs)."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        logger.info("M-Pesa callback received: %s", request.data)
        handle_callback(request.data)
        # Always acknowledge receipt so Safaricom doesn't retry indefinitely.
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class PaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # Daraja spike-arrests the query endpoint (~3 per burst / 30 per minute), so
    # only reconcile if this payment hasn't been queried recently.
    QUERY_THROTTLE_SECONDS = 20
    QUERY_AFTER_SECONDS = 8

    def get(self, request, checkout_request_id):
        try:
            payment = Payment.objects.get(
                checkout_request_id=checkout_request_id, order__user=request.user
            )
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=404)

        if self._should_query(payment):
            try:
                payment = reconcile_payment(payment) or payment
            except Exception:  # noqa: BLE001
                # Never fail the status read just because Daraja is unreachable.
                logger.exception("STK reconciliation failed for %s", checkout_request_id)

        return Response(PaymentSerializer(payment).data)

    def _should_query(self, payment):
        if payment.status != "PENDING" or not payment.checkout_request_id:
            return False
        age = timezone.now() - payment.created_at
        if age.total_seconds() < self.QUERY_AFTER_SECONDS:
            return False
        since_update = timezone.now() - payment.updated_at
        return since_update.total_seconds() >= self.QUERY_THROTTLE_SECONDS

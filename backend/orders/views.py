from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeliveryFee, Order, OrderItem
from .serializers import (
    CreateOrderSerializer,
    DeliveryFeeSerializer,
    OrderSerializer,
)
from .services import (
    CUSTOMER_CONFIRMABLE,
    apply_status,
    can_transition,
    create_order_from_cart,
    get_delivery_fee_table,
)


class DeliveryFeeListCreateView(generics.ListCreateAPIView):
    """Staff-only CRUD for the delivery fee table."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = DeliveryFeeSerializer
    pagination_class = None

    def get_queryset(self):
        return DeliveryFee.objects.all()


class DeliveryFeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = DeliveryFeeSerializer

    def get_queryset(self):
        return DeliveryFee.objects.all()


class DeliveryInfoView(APIView):
    """Public fee table so checkout can show a county list and a real price.

    The frontend must never hardcode fees; this is the authoritative source.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        table = get_delivery_fee_table()
        counties = sorted(table)
        default = settings.DEFAULT_DELIVERY_FEE
        options = [{"county": c, "fee": table[c]} for c in counties]
        # "Other" is only appended when it isn't already an explicit fee entry.
        if "Other" not in table:
            options.append({"county": "Other", "fee": default})
        return Response(
            {
                "counties": counties,
                "fees": {c: table[c] for c in counties},
                "default_fee": default,
                "options": options,
            }
        )


class OrderListCreateView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["order_number", "phone", "email", "first_name", "last_name"]
    filterset_fields = ["payment_status", "order_status", "payment_method"]
    ordering_fields = ["created_at", "total"]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related("items")
        if user.is_staff and self.request.query_params.get("all") == "true":
            return qs
        return qs.filter(user=user)


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = create_order_from_cart(request.user, serializer.validated_data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related("items")
        if user.is_staff:
            return qs
        return qs.filter(user=user)

class OrderStatusUpdateView(APIView):
    """Admin-only: update order fulfilment status.

    Approve (CONFIRMED) -> PROCESSING -> SHIPPED -> DELIVERED, or CANCELLED.
    Transitions are validated so a paid pipeline can't be walked backwards or
    an unpaid M-Pesa order can't be shipped.
    """

    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=404)

        new_status = request.data.get("order_status")
        allowed, reason = can_transition(order, new_status)
        if not allowed:
            return Response({"detail": reason}, status=400)

        apply_status(order, new_status, by="staff")
        return Response(OrderSerializer(order).data)


class ConfirmDeliveryView(APIView):
    """Customer confirms they received the goods, closing the order.

    Only the buyer can do this, only once the order has shipped, and only when
    the payment settled. Lets an order finish without waiting for staff.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=404)

        if order.order_status == "DELIVERED":
            # Idempotent - a double tap or a page refresh shouldn't error.
            return Response(OrderSerializer(order).data)

        if order.order_status not in CUSTOMER_CONFIRMABLE:
            return Response(
                {
                    "detail": (
                        "You can only confirm delivery once the order has shipped. "
                        f"This order is currently {order.order_status.lower()}."
                    )
                },
                status=400,
            )

        if order.payment_status != "SUCCESS":
            return Response(
                {"detail": "This order's payment has not been confirmed yet."},
                status=400,
            )

        apply_status(order, "DELIVERED", by="customer")
        return Response(OrderSerializer(order).data)


class ReceiptView(APIView):
    """Return a print-ready HTML receipt for a paid order.

    The owner or any staff member may download it. The HTML includes print
    styles so the browser's "Save as PDF" produces a clean A4 receipt with no
    chrome. We intentionally avoid a server-side PDF library — browser print
    is higher quality, supports page-breaks natively, and adds zero deps.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.prefetch_related("items"), pk=pk
        )
        if order.user != request.user and not request.user.is_staff:
            return Response({"detail": "Not allowed."}, status=403)

        payment = order.payments.first()
        html = render_to_string(
            "orders/receipt.html",
            {"order": order, "payment": payment},
        )
        filename = f"MotoParts-Receipt-{order.order_number}.html"
        response = HttpResponse(html, content_type="text/html")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

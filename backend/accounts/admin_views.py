from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from products.models import Product

from .models import User
from .serializers import AdminCustomerSerializer

LOW_STOCK_THRESHOLD = 5


def revenue_orders():
    """Orders that count as revenue: paid via M-Pesa, or cash-on-delivery once delivered."""
    return Order.objects.filter(
        Q(payment_status="SUCCESS") | Q(payment_method="cod", order_status="DELIVERED")
    )


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        revenue_qs = revenue_orders()

        # Last 7 days of revenue. Uses explicit datetime bounds (not __date) so it
        # also works on MySQL installs without timezone tables loaded.
        today = timezone.localdate()
        sales = []
        for offset in range(6, -1, -1):
            day = today - timedelta(days=offset)
            start = timezone.make_aware(datetime.combine(day, time.min))
            end = start + timedelta(days=1)
            total = revenue_qs.filter(created_at__gte=start, created_at__lt=end).aggregate(t=Sum("total"))["t"]
            sales.append({"date": day.isoformat(), "total": float(total or Decimal("0"))})

        recent_orders = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer": f"{o.first_name} {o.last_name}".strip(),
                "total": o.total,
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "created_at": o.created_at,
            }
            for o in Order.objects.order_by("-created_at")[:6]
        ]

        low_stock = list(
            Product.objects.filter(is_active=True, stock_quantity__lte=LOW_STOCK_THRESHOLD)
            .order_by("stock_quantity")
            .values("name", "slug", "sku", "stock_quantity")[:6]
        )

        by_brand = {
            row["motorcycle_brand"]: row["count"]
            for row in Product.objects.values("motorcycle_brand").annotate(count=Count("id"))
        }

        return Response(
            {
                "total_revenue": revenue_qs.aggregate(t=Sum("total"))["t"] or 0,
                "total_orders": Order.objects.count(),
                "pending_orders": Order.objects.filter(order_status="PENDING").count(),
                "to_fulfil": Order.objects.filter(order_status__in=["CONFIRMED", "PROCESSING"]).count(),
                "delivered_orders": Order.objects.filter(order_status="DELIVERED").count(),
                "total_customers": User.objects.filter(is_staff=False).count(),
                "total_products": Product.objects.count(),
                "active_products": Product.objects.filter(is_active=True).count(),
                "low_stock_count": Product.objects.filter(
                    is_active=True, stock_quantity__lte=LOW_STOCK_THRESHOLD
                ).count(),
                "sales_last_7_days": sales,
                "recent_orders": recent_orders,
                "low_stock": low_stock,
                "products_by_brand": by_brand,
            }
        )


def customers_queryset():
    return (
        User.objects.filter(is_staff=False)
        .annotate(
            order_count=Count("orders", distinct=True),
            total_spent=Sum("orders__total", filter=Q(orders__payment_status="SUCCESS")),
        )
        .order_by("-date_joined")
    )


class AdminCustomerListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminCustomerSerializer
    search_fields = ["username", "email", "first_name", "last_name", "phone"]

    def get_queryset(self):
        return customers_queryset()


class AdminCustomerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminCustomerSerializer

    def get_queryset(self):
        return customers_queryset()

from django.urls import path

from .views import (
    ConfirmDeliveryView,
    CreateOrderView,
    DeliveryFeeDetailView,
    DeliveryFeeListCreateView,
    DeliveryInfoView,
    OrderDetailView,
    OrderListCreateView,
    OrderStatusUpdateView,
    ReceiptView,
)

urlpatterns = [
    path("delivery-info/", DeliveryInfoView.as_view(), name="delivery_info"),
    path("", OrderListCreateView.as_view(), name="order_list"),
    path("create/", CreateOrderView.as_view(), name="order_create"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order_detail"),
    path("<int:pk>/status/", OrderStatusUpdateView.as_view(), name="order_status_update"),
    path("<int:pk>/confirm-delivery/", ConfirmDeliveryView.as_view(), name="order_confirm_delivery"),
    path("<int:pk>/receipt/", ReceiptView.as_view(), name="order_receipt"),
]

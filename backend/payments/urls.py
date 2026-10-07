from django.urls import path

from .views import MpesaCallbackView, PaymentStatusView, STKPushView

urlpatterns = [
    path("mpesa/stk/", STKPushView.as_view(), name="mpesa_stk"),
    path("mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa_callback"),
    path("status/<str:checkout_request_id>/", PaymentStatusView.as_view(), name="payment_status"),
]

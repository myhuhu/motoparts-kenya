from django.urls import path

from .views import CartClearView, CartItemDetailView, CartView

urlpatterns = [
    path("", CartView.as_view(), name="cart"),
    path("clear/", CartClearView.as_view(), name="cart_clear"),
    path("<int:pk>/", CartItemDetailView.as_view(), name="cart_item_detail"),
]

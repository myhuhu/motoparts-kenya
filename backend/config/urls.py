from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from orders.views import DeliveryFeeDetailView, DeliveryFeeListCreateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/admin/delivery-fees/", DeliveryFeeListCreateView.as_view(), name="admin_delivery_fees"),
    path("api/admin/delivery-fees/<int:pk>/", DeliveryFeeDetailView.as_view(), name="admin_delivery_fee_detail"),
    path("api/admin/", include("accounts.admin_urls")),
    path("api/", include("products.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/wishlist/", include("products.wishlist_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

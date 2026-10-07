from django.urls import path

from .views import WishlistDeleteView, WishlistListCreateView

urlpatterns = [
    path("", WishlistListCreateView.as_view(), name="wishlist_list"),
    path("<int:pk>/", WishlistDeleteView.as_view(), name="wishlist_delete"),
]

from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListCreateView,
    FeaturedProductsView,
    ProductDetailView,
    ProductImageDeleteView,
    ProductImageUploadView,
    ProductListCreateView,
)

urlpatterns = [
    path("products/", ProductListCreateView.as_view(), name="product_list"),
    path("products/featured/", FeaturedProductsView.as_view(), name="product_featured"),
    path("products/images/<int:pk>/", ProductImageDeleteView.as_view(), name="product_image_delete"),
    path("products/<slug:slug>/images/", ProductImageUploadView.as_view(), name="product_image_upload"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product_detail"),
    path("categories/", CategoryListCreateView.as_view(), name="category_list"),
    path("categories/<slug:slug>/", CategoryDetailView.as_view(), name="category_detail"),
]

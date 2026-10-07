from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage, Wishlist


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "product_count"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]

    def product_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "image_preview", "name", "sku", "motorcycle_brand", "category",
        "price", "discount_price", "stock_quantity", "is_featured", "is_active",
    ]
    list_filter = ["motorcycle_brand", "category", "condition", "is_featured", "is_active"]
    search_fields = ["name", "sku", "brand", "motorcycle_model"]
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ["price", "discount_price", "stock_quantity", "is_featured", "is_active"]
    inlines = [ProductImageInline]

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Image"


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ["user", "product", "created_at"]
    search_fields = ["user__username", "product__name"]

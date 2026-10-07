from django.contrib import admin

from .models import DeliveryFee, Order, OrderItem


@admin.register(DeliveryFee)
class DeliveryFeeAdmin(admin.ModelAdmin):
    list_display = ["location", "amount", "is_active", "updated_at"]
    list_filter = ["is_active"]
    search_fields = ["location"]
    list_editable = ["amount", "is_active"]
    ordering = ["location"]
    fieldsets = (
        (None, {"fields": ("location", "amount")}),
        ("Availability", {"fields": ("is_active",)}),
    )


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "product_name", "quantity", "unit_price", "subtotal"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number", "first_name", "last_name", "phone", "total",
        "payment_status", "order_status", "created_at",
    ]
    list_filter = ["payment_status", "order_status", "payment_method", "county"]
    search_fields = ["order_number", "phone", "email", "first_name", "last_name"]
    list_editable = ["order_status"]
    readonly_fields = ["order_number", "subtotal", "delivery_fee", "discount", "total", "payment_status"]
    inlines = [OrderItemInline]

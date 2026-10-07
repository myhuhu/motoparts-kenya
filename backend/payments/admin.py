from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "order", "phone_number", "amount", "status",
        "mpesa_receipt_number", "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["order__order_number", "phone_number", "mpesa_receipt_number", "checkout_request_id"]
    readonly_fields = [
        "order", "phone_number", "amount", "merchant_request_id", "checkout_request_id",
        "mpesa_receipt_number", "transaction_date", "result_code", "result_description",
        "raw_callback", "created_at", "updated_at",
    ]

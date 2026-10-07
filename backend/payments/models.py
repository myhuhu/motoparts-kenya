from django.db import models

from orders.models import Order


class Payment(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    ]

    order = models.ForeignKey(Order, related_name="payments", on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    merchant_request_id = models.CharField(max_length=100, blank=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, unique=True, null=True)

    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    transaction_date = models.CharField(max_length=30, blank=True)
    # Amount Safaricom confirms was actually paid. Falls back to `amount` when
    # the callback/query carries no Amount field.
    amount_paid = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Amount confirmed as paid by Safaricom",
    )

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING")
    result_code = models.CharField(max_length=10, blank=True)
    result_description = models.TextField(blank=True)

    raw_callback = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment({self.order.order_number}, {self.status})"

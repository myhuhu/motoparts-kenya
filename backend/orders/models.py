import random
import string
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from products.models import Product


def generate_order_number():
    from django.utils import timezone
    date_part = timezone.now().strftime("%Y%m%d")
    rand_part = "".join(random.choices(string.digits, k=4))
    return f"MPK-{date_part}-{rand_part}"


class DeliveryFee(models.Model):
    """Per-location delivery fee, editable at runtime by staff.

    Takes precedence over settings.DELIVERY_FEES so fees can be changed from the
    admin dashboard or Django admin without editing code or restarting.
    """

    location = models.CharField(
        max_length=100, unique=True, help_text="County / town, e.g. Nairobi"
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Flat delivery fee in KSh",
    )
    is_active = models.BooleanField(
        default=True, help_text="Uncheck to stop offering this location"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["location"]

    def __str__(self):
        return f"{self.location}: {self.amount}"

    def save(self, *args, **kwargs):
        # Normalise so "nairobi" and "Nairobi" cannot become two rows, and the
        # fee lookup always matches regardless of how it was typed.
        if self.location:
            self.location = self.location.strip().title()
        super().save(*args, **kwargs)


class Order(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    ]
    ORDER_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("PROCESSING", "Processing"),
        ("SHIPPED", "Shipped"),
        ("DELIVERED", "Delivered"),
        ("CANCELLED", "Cancelled"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("mpesa", "M-Pesa"),
        ("cod", "Cash on Delivery"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.CASCADE)
    order_number = models.CharField(max_length=30, unique=True, default=generate_order_number, editable=False)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    county = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    delivery_address = models.CharField(max_length=255)
    notes = models.TextField(blank=True)

    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, default="mpesa")

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default="PENDING")
    order_status = models.CharField(max_length=12, choices=ORDER_STATUS_CHOICES, default="PENDING")

    stock_deducted = models.BooleanField(default=False)

    delivered_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the order was marked delivered",
    )
    delivery_confirmed_by = models.CharField(
        max_length=10, blank=True,
        help_text="'customer' if the buyer confirmed receipt, 'staff' if marked by admin",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="order_items", null=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

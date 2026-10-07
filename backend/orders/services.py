from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from cart.models import Cart

from .models import Order, OrderItem

# The fulfilment pipeline, in order. DELIVERED and CANCELLED are terminal.
FULFILMENT_STAGES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]
TERMINAL_STATUSES = {"DELIVERED", "CANCELLED"}

# A customer may only confirm receipt of an order that is actually on its way.
CUSTOMER_CONFIRMABLE = {"SHIPPED"}
# M-Pesa orders must be paid before goods move; cash-on-delivery may ship unpaid.
NEEDS_PAID = {"PROCESSING", "SHIPPED", "DELIVERED"}


def can_transition(order, new_status):
    """Return (allowed, reason) for moving an order to new_status."""
    current = order.order_status
    valid = dict(Order.ORDER_STATUS_CHOICES)
    if new_status not in valid:
        return False, f"Unknown status '{new_status}'."

    if current == new_status:
        return False, f"This order is already {new_status.lower()}."

    if current in TERMINAL_STATUSES:
        return False, (
            f"This order is {current.lower()} and can no longer be changed. "
            "Place a new order if you need to."
        )

    if (
        order.payment_method == "mpesa"
        and order.payment_status != "SUCCESS"
        and new_status in NEEDS_PAID
    ):
        return False, (
            f"Cannot mark this order {new_status.lower()} because the M-Pesa "
            "payment has not been confirmed yet."
        )

    return True, ""


def apply_status(order, new_status, by="staff"):
    """Transition an order, stamping delivery metadata. Assumes can_transition passed."""
    from django.utils import timezone

    order.order_status = new_status
    if new_status == "DELIVERED":
        order.delivered_at = timezone.now()
        order.delivery_confirmed_by = by
    else:
        # Moving away from delivered clears the stamp.
        order.delivered_at = None
        order.delivery_confirmed_by = ""
    order.save(
        update_fields=[
            "order_status", "delivered_at", "delivery_confirmed_by", "updated_at"
        ]
    )
    return order


def normalise_county(county):
    """Normalise a county name so fee lookup can't silently miss.

    The checkout sends whatever the customer typed, so "nakuru" or " NAIROBI "
    would otherwise miss DELIVERY_FEES and be charged the default fee.
    """
    return (county or "").strip().title()


def get_delivery_fee_table():
    """Effective fee per location.

    Staff-managed DeliveryFee rows win; anything they haven't defined still
    falls back to settings.DELIVERY_FEES so upgrades keep working.
    """
    from .models import DeliveryFee

    table = dict(settings.DELIVERY_FEES)
    for row in DeliveryFee.objects.filter(is_active=True):
        table[row.location.strip().title()] = row.amount
    return table


def calculate_delivery_fee(county):
    return get_delivery_fee_table().get(
        normalise_county(county), settings.DEFAULT_DELIVERY_FEE
    )


@transaction.atomic
def create_order_from_cart(user, validated_data):
    try:
        cart = Cart.objects.select_related(None).get(user=user)
    except Cart.DoesNotExist:
        raise ValidationError("Your cart is empty.")

    items = list(cart.items.select_related("product").select_for_update())
    if not items:
        raise ValidationError("Your cart is empty.")

    subtotal = 0
    order_items_data = []

    for item in items:
        product = item.product
        if not product.is_active:
            raise ValidationError(f"{product.name} is no longer available.")
        if not product.in_stock:
            raise ValidationError(f"{product.name} is out of stock.")
        if item.quantity > product.stock_quantity:
            raise ValidationError(
                f"Only {product.stock_quantity} unit(s) of {product.name} left in stock."
            )
        unit_price = product.effective_price  # server-side authoritative price
        line_subtotal = unit_price * item.quantity
        subtotal += line_subtotal
        order_items_data.append(
            {
                "product": product,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "subtotal": line_subtotal,
            }
        )

    delivery_fee = calculate_delivery_fee(validated_data["county"])
    discount = 0
    total = subtotal + delivery_fee - discount

    order = Order.objects.create(
        user=user,
        first_name=validated_data["first_name"],
        last_name=validated_data["last_name"],
        phone=validated_data["phone"],
        email=validated_data["email"],
        county=normalise_county(validated_data["county"]),
        town=validated_data["town"],
        delivery_address=validated_data["delivery_address"],
        notes=validated_data.get("notes", ""),
        payment_method=validated_data.get("payment_method", "mpesa"),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount=discount,
        total=total,
    )

    OrderItem.objects.bulk_create(
        [OrderItem(order=order, **data) for data in order_items_data]
    )

    # Cash on delivery orders are confirmed immediately; M-Pesa waits for callback.
    if order.payment_method == "cod":
        order.order_status = "CONFIRMED"
        order.save(update_fields=["order_status"])
        deduct_stock_for_order(order)

    cart.items.all().delete()
    return order


@transaction.atomic
def deduct_stock_for_order(order):
    """Idempotent stock deduction - only runs once per order."""
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.stock_deducted:
        return
    for item in order.items.select_related("product"):
        if item.product:
            product = item.product
            if item.quantity > product.stock_quantity:
                # Shouldn't normally happen since we validated at order creation,
                # but guard against race conditions.
                product.stock_quantity = 0
            else:
                product.stock_quantity -= item.quantity
            product.save(update_fields=["stock_quantity"])
    order.stock_deducted = True
    order.save(update_fields=["stock_deducted"])

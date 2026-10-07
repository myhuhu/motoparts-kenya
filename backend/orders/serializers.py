from rest_framework import serializers

from .models import DeliveryFee, Order, OrderItem


class DeliveryFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryFee
        fields = ["id", "location", "amount", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_location(self, value):
        value = value.strip().title()
        if not value:
            raise serializers.ValidationError("Location is required.")
        qs = DeliveryFee.objects.filter(location=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f"A fee for {value} already exists.")
        return value

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price", "subtotal"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "first_name", "last_name", "phone", "email",
            "county", "town", "delivery_address", "notes", "payment_method",
            "subtotal", "delivery_fee", "discount", "total",
            "payment_status", "order_status", "delivered_at",
            "delivery_confirmed_by", "items", "created_at", "updated_at",
        ]
        read_only_fields = [
            "order_number", "subtotal", "delivery_fee", "discount", "total",
            "payment_status", "order_status", "delivered_at",
            "delivery_confirmed_by",
        ]


class CreateOrderSerializer(serializers.Serializer):
    """
    Only takes delivery/contact info from the client. Cart items, prices and
    totals are ALWAYS computed server-side from the database - never trusted
    from the frontend.
    """
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    county = serializers.CharField(max_length=100)
    town = serializers.CharField(max_length=100)
    delivery_address = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default="mpesa")

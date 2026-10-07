from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "order", "phone_number", "amount", "amount_paid",
            "merchant_request_id", "checkout_request_id", "mpesa_receipt_number",
            "transaction_date", "status", "result_code", "result_description",
            "created_at",
        ]
        read_only_fields = fields


class STKPushRequestSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    phone_number = serializers.RegexField(
        regex=r"^(?:254|0)7\d{8}$",
        error_messages={"invalid": "Enter a valid Kenyan phone number, e.g. 0712345678."},
    )

from rest_framework import serializers

from orders.models import OrderItem

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "username", "rating", "comment", "created_at"]
        read_only_fields = ["id", "username", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        product = attrs.get("product")
        has_purchased = OrderItem.objects.filter(
            order__user=request.user,
            product=product,
            order__payment_status="SUCCESS",
        ).exists() or OrderItem.objects.filter(
            order__user=request.user, product=product, order__payment_method="cod"
        ).exists()
        if not has_purchased:
            raise serializers.ValidationError("You can only review products you have purchased.")
        if Review.objects.filter(product=product, user=request.user).exists():
            raise serializers.ValidationError("You have already reviewed this product.")
        return attrs

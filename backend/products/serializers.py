from rest_framework import serializers

from .models import Category, Product, ProductImage, Wishlist


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon", "product_count"]
        read_only_fields = ["slug"]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "brand", "motorcycle_brand", "motorcycle_model",
            "compatibility", "category", "category_name", "sku", "price",
            "discount_price", "discount_percentage", "stock_quantity", "in_stock",
            "image", "condition", "is_featured", "is_active", "average_rating", "review_count",
        ]

    def get_review_count(self, obj):
        return obj.reviews.count()


class ProductDetailSerializer(ProductListSerializer):
    additional_images = ProductImageSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "description", "short_description", "specifications", "part_number",
            "location", "compatible_models", "stock_status",
            "additional_images", "created_at", "updated_at",
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    compatible_models = serializers.JSONField(required=False)

    class Meta:
        model = Product
        fields = [
            "id", "slug", "name", "description", "short_description", "specifications",
            "brand", "motorcycle_brand", "motorcycle_model", "compatibility",
            "compatible_models", "part_number", "location", "stock_status",
            "category", "sku", "price", "discount_price", "stock_quantity",
            "image", "condition", "is_featured", "is_active",
        ]
        read_only_fields = ["id", "slug"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_compatible_models(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of model names.")
        cleaned = []
        for item in value:
            item = str(item).strip()
            if item and item not in cleaned:
                cleaned.append(item)
        return cleaned

    def validate(self, attrs):
        discount = attrs.get("discount_price")
        price = attrs.get("price", getattr(self.instance, "price", None))
        if discount and price and discount >= price:
            raise serializers.ValidationError(
                {"discount_price": "Special price must be lower than the regular price."}
            )
        return attrs

    def _sync_compatibility(self, data):
        # Keep the plain-text field used by storefront cards in step with the model list.
        if "compatible_models" in data:
            data["compatibility"] = ", ".join(data["compatible_models"])[:255]
        return data

    def create(self, validated_data):
        return super().create(self._sync_compatibility(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._sync_compatibility(validated_data))


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )

    class Meta:
        model = Wishlist
        fields = ["id", "product", "product_id", "created_at"]

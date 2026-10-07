import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(method="filter_min_price")
    max_price = django_filters.NumberFilter(method="filter_max_price")
    brand = django_filters.CharFilter(field_name="brand", lookup_expr="iexact")
    motorcycle_brand = django_filters.CharFilter(field_name="motorcycle_brand", lookup_expr="iexact")
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["brand", "motorcycle_brand", "motorcycle_model", "category", "condition", "is_featured", "is_active"]

    def filter_min_price(self, queryset, name, value):
        return queryset.filter(price__gte=value)

    def filter_max_price(self, queryset, name, value):
        return queryset.filter(price__lte=value)

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock_quantity__gt=0) if value else queryset

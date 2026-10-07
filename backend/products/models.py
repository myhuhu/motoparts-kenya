from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="lucide-react icon name")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    CONDITION_CHOICES = [
        ("new", "New"),
        ("used", "Used"),
        ("refurbished", "Refurbished"),
    ]

    STOCK_STATUS_CHOICES = [
        ("in_stock", "In Stock"),
        ("out_of_stock", "Out of Stock"),
    ]

    MOTORCYCLE_BRAND_CHOICES = [
        ("bajaj", "Bajaj"),
        ("honda", "Honda"),
        ("tvs", "TVS"),
        ("boxer", "Boxer"),
        ("suzuki", "Suzuki"),
        ("yamaha", "Yamaha"),
        ("electric", "Electric Bike"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    specifications = models.TextField(blank=True, help_text="Line separated key: value specs")

    brand = models.CharField(max_length=100, blank=True, help_text="Parts manufacturer/brand")
    motorcycle_brand = models.CharField(max_length=20, choices=MOTORCYCLE_BRAND_CHOICES, default="other")
    motorcycle_model = models.CharField(max_length=100, blank=True)
    compatibility = models.CharField(max_length=255, blank=True, help_text="e.g. Boxer 100, Boxer 125")
    compatible_models = models.JSONField(default=list, blank=True, help_text="List of compatible model names")
    part_number = models.CharField(max_length=100, blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    location = models.CharField(max_length=100, blank=True, help_text="Warehouse / store location")
    stock_status = models.CharField(max_length=20, choices=STOCK_STATUS_CHOICES, default="in_stock")

    category = models.ForeignKey(Category, related_name="products", on_delete=models.SET_NULL, null=True)

    sku = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)

    image = models.ImageField(upload_to="products/", blank=True, null=True)

    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default="new")
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        return self.discount_price if self.discount_price else self.price

    @property
    def discount_percentage(self):
        if self.discount_price and self.price:
            return round((1 - (self.discount_price / self.price)) * 100)
        return 0

    @property
    def in_stock(self):
        return self.stock_quantity > 0 and self.stock_status != "out_of_stock"

    @property
    def average_rating(self):
        agg = self.reviews.aggregate(models.Avg("rating"))
        return round(agg["rating__avg"] or 0, 1)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name="additional_images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="products/gallery/")
    created_at = models.DateTimeField(auto_now_add=True)


class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="wishlist_items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="wishlisted_by", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "product"]

    def __str__(self):
        return f"{self.user} - {self.product}"

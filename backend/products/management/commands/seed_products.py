from decimal import Decimal

from django.core.management.base import BaseCommand

from products.models import Category, Product

CATEGORIES = [
    ("Engine Parts", "cog"), ("Brake System", "disc"), ("Electrical Parts", "zap"),
    ("Body Parts", "shield"), ("Suspension", "move-vertical"), ("Transmission", "settings"),
    ("Tyres & Tubes", "circle"), ("Chains & Sprockets", "link"), ("Batteries", "battery"),
    ("Lights", "lightbulb"), ("Accessories", "package"), ("Electric Bike Parts", "battery-charging"),
]

# name, category, moto_brand, moto_model, compatibility, sku, price, discount_price, stock
PRODUCTS = [
    ("Bajaj Boxer Engine Oil Filter", "Engine Parts", "bajaj", "Boxer", "Boxer 100/125", "BX-EOF-001", 450, None, 40),
    ("Bajaj Boxer Brake Shoe Set", "Brake System", "bajaj", "Boxer", "Boxer 100/125", "BS-BX-001", 850, 1000, 35),
    ("Bajaj Boxer Chain & Sprocket Kit", "Chains & Sprockets", "bajaj", "Boxer", "Boxer 100/125/150", "BX-CSK-001", 3200, None, 20),
    ("Bajaj Boxer Clutch Plate Set", "Engine Parts", "bajaj", "Boxer", "Boxer 150", "BX-CPS-001", 2400, None, 15),
    ("Bajaj Boxer Front Brake Cable", "Brake System", "bajaj", "Boxer", "Boxer 100/125", "BX-FBC-001", 350, None, 60),
    ("Honda Ace Brake Pads", "Brake System", "honda", "Ace", "Honda Ace 110/125", "HD-ABP-001", 950, None, 30),
    ("Honda CB125 Air Filter", "Engine Parts", "honda", "CB", "Honda CB125", "HD-CAF-001", 700, None, 25),
    ("Honda Motorcycle Chain Kit", "Chains & Sprockets", "honda", "CB", "Honda CB/Ace series", "HD-MCK-001", 3500, None, 18),
    ("Honda Indicator Light", "Lights", "honda", "CB", "Universal Honda", "HD-IND-001", 650, None, 50),
    ("Honda Spark Plug", "Electrical Parts", "honda", "CB", "Universal Honda", "HD-SPK-001", 450, None, 80),
    ("TVS HLX Brake Shoe", "Brake System", "tvs", "HLX", "TVS HLX 100/125", "TV-HBS-001", 850, None, 28),
    ("TVS HLX Chain Set", "Chains & Sprockets", "tvs", "HLX", "TVS HLX", "TV-HCS-001", 3100, None, 22),
    ("TVS HLX Air Filter", "Engine Parts", "tvs", "HLX", "TVS HLX", "TV-HAF-001", 650, None, 33),
    ("Electric Bike Lithium Battery", "Batteries", "electric", "E-Bike", "Universal electric bike", "EB-LIB-001", 28000, None, 10),
    ("Electric Bike Controller", "Electric Bike Parts", "electric", "E-Bike", "Universal electric bike", "EB-CTL-001", 7500, None, 12),
    ("Electric Bike Brake Pads", "Brake System", "electric", "E-Bike", "Universal electric bike", "EB-BRP-001", 1200, None, 25),
    ("Electric Bike Charger", "Electric Bike Parts", "electric", "E-Bike", "Universal electric bike", "EB-CHG-001", 4500, None, 20),
    ("Electric Bike LED Headlight", "Lights", "electric", "E-Bike", "Universal electric bike", "EB-LED-001", 1800, None, 30),
]


class Command(BaseCommand):
    help = "Seed the database with sample categories and products."

    def handle(self, *args, **options):
        cat_objs = {}
        for name, icon in CATEGORIES:
            cat, _ = Category.objects.get_or_create(name=name, defaults={"icon": icon})
            cat_objs[name] = cat
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(cat_objs)} categories."))

        created = 0
        for name, cat_name, moto_brand, moto_model, compat, sku, price, discount, stock in PRODUCTS:
            _, was_created = Product.objects.get_or_create(
                sku=sku,
                defaults=dict(
                    name=name,
                    category=cat_objs[cat_name],
                    motorcycle_brand=moto_brand,
                    motorcycle_model=moto_model,
                    compatibility=compat,
                    price=Decimal(price),
                    discount_price=Decimal(discount) if discount else None,
                    stock_quantity=stock,
                    is_featured=stock % 2 == 0,
                    description=f"{name} - genuine/compatible replacement part for {compat}.",
                ),
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new products."))

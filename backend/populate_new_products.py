import os
import django
import sys
import random

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import Product, CustomerReview
from django.contrib.auth import get_user_model

User = get_user_model()

users = list(User.objects.all())
if not users:
    dummy_user = User.objects.create_user(username='guest_shopper_2', password='password123')
    users = [dummy_user]

GENERIC_COMMENTS = [
    "Great product! Highly recommend.",
    "Very happy with this purchase. Good quality.",
    "Works perfectly. Fast shipping.",
    "Good value for the price.",
    "Exactly as described. Would buy again.",
    "Exceeded my expectations!",
    "Decent product, does the job well."
]

def generate_specs(name, cat):
    # Base generic specs
    specs = [
        {"name": "Brand", "value": "Collabo"},
        {"name": "Material", "value": "Premium"},
        {"name": "Warranty", "value": "1 Year Manufacturer"}
    ]
    # Add a little flavor based on name
    name_lower = name.lower()
    if "fan" in name_lower or "electric" in name_lower:
        specs.extend([
            {"name": "Power Source", "value": "Battery/USB"},
            {"name": "Voltage", "value": "5V"}
        ])
    elif "mop" in name_lower or "clean" in name_lower:
        specs.extend([
            {"name": "Usage", "value": "Home/Office"},
            {"name": "Reusable", "value": "Yes"}
        ])
    return specs

products = Product.objects.all()
specs_added = 0
reviews_added = 0

for product in products:
    # 1. Check Specifications
    if not product.specifications or len(product.specifications) == 0:
        product.specifications = generate_specs(product.name, product.category.name if product.category else "")
        product.save()
        specs_added += 1

    # 2. Check Reviews
    review_count = CustomerReview.objects.filter(product=product).count()
    if review_count == 0:
        num_reviews = random.randint(2, 4) # Add a few reviews
        for _ in range(num_reviews):
            CustomerReview.objects.create(
                product=product,
                user=random.choice(users),
                rating=random.randint(4, 5),
                comment=random.choice(GENERIC_COMMENTS)
            )
            reviews_added += 1

print(f"Updated {specs_added} products with new specifications.")
print(f"Added {reviews_added} new reviews for previously unreviewed products.")

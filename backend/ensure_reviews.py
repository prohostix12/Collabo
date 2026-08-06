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

# Get or create a default user for these reviews if no users exist
users = list(User.objects.all())
if not users:
    # If there are no users, we need to create one to attach the reviews to
    dummy_user = User.objects.create_user(username='guest_shopper', password='password123')
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

products = Product.objects.all()
updated_products = 0
total_new_reviews = 0

for product in products:
    review_count = CustomerReview.objects.filter(product=product).count()
    if review_count == 0:
        # Add 1 or 2 random reviews
        num_reviews = random.randint(1, 2)
        for _ in range(num_reviews):
            CustomerReview.objects.create(
                product=product,
                user=random.choice(users),
                rating=random.randint(4, 5), # 4 or 5 stars
                comment=random.choice(GENERIC_COMMENTS),
                verified_purchase=True
            )
            total_new_reviews += 1
        updated_products += 1

print(f"Added {total_new_reviews} reviews across {updated_products} previously unreviewed products.")

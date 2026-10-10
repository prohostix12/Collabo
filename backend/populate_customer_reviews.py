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

# Create dummy users for reviews if they don't exist
reviewer_names = ['Alex M.', 'Sam K.', 'Jordan P.', 'Taylor S.', 'Chris D.']
users = []
for name in reviewer_names:
    username = name.lower().replace(' ', '_').replace('.', '')
    user, created = User.objects.get_or_create(username=username, defaults={'email': f'{username}@example.com'})
    users.append(user)

positive_comments = [
    "Absolutely love this! The quality is way better than I expected.",
    "Works perfectly as described. Highly recommend it to anyone.",
    "Very satisfied with this purchase. Good value for money.",
    "Looks exactly like the pictures and feels premium. 5 stars!",
    "Amazing product. I use it every day now. Shipping was fast too.",
    "Super impressed with the build quality. Will definitely buy again from this brand.",
    "Exceeded my expectations! One of my best purchases this year."
]

products = Product.objects.all()

for product in products:
    # Check if this product already has enough reviews
    existing = CustomerReview.objects.filter(product=product).count()
    if existing < 3:
        # add 3-4 random reviews
        num_reviews = random.randint(3, 4)
        for i in range(num_reviews):
            reviewer = random.choice(users)
            comment = random.choice(positive_comments)
            CustomerReview.objects.create(
                product=product,
                user=reviewer,
                rating=5,
                comment=comment
            )

print("Customer reviews populated successfully!")

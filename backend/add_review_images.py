import os
import django
import sys
import random

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

# List of placeholder images representing review photos
review_images = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=200"
]

all_reviews = list(CustomerReview.objects.all())
if not all_reviews:
    print("No reviews found.")
    sys.exit(0)

# Pick ~15% of the reviews randomly to add images
num_to_update = max(1, int(len(all_reviews) * 0.15))
reviews_to_update = random.sample(all_reviews, num_to_update)

for review in reviews_to_update:
    review.image = random.choice(review_images)
    review.save()

print(f"Added images to {num_to_update} random reviews!")

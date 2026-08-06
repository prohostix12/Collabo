import os
import django
import sys
import random

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

# Get all reviews that currently don't have images
reviews = list(CustomerReview.objects.filter(image=''))

if not reviews:
    print("No reviews available to update.")
    sys.exit(0)

# Pick a small random sample (e.g. 5 reviews) across different products
num_to_update = min(5, len(reviews))
selected_reviews = random.sample(reviews, num_to_update)

updated_count = 0
for rev in selected_reviews:
    # Use the product's own main image to guarantee 100% relevance!
    # A customer taking a picture of the product will look just like the product.
    if rev.product and rev.product.image:
        # If the product has multiple images, maybe pick the second one, else the first
        if rev.product.images and len(rev.product.images) > 1:
            rev.image = rev.product.images[1] # Use an alternate angle if available
        else:
            rev.image = rev.product.image
        
        rev.save()
        updated_count += 1

print(f"Successfully added highly relevant images to {updated_count} reviews!")

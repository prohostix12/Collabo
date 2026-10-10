import os
import django
import sys

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

# Clear all images from customer reviews
reviews = CustomerReview.objects.all()
updated_count = 0

for rev in reviews:
    if rev.image:
        rev.image = ''
        rev.save()
        updated_count += 1

print(f"Successfully removed images from {updated_count} reviews!")

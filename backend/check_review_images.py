import os
import django
import sys

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import CustomerReview

for r in CustomerReview.objects.exclude(image=''):
    print(f"ID: {r.id} | Image: {r.image}")

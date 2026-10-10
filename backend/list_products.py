import os
import django
import sys

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import Product

for p in Product.objects.all()[:15]:
    print(f"ID: {p.id} | NAME: {p.name}")

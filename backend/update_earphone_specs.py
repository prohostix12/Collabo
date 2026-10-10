import os
import django
import sys

# Setup Django
sys.path.append(r'C:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import Product

p = Product.objects.filter(name__icontains="Premium Wired Earphones").first()
if p:
    p.specifications = {
        "Color": "Black",
        "Connectivity": "Wired",
        "Headphone Type": "In the Ear",
        "Microphone": "Yes",
        "Connector Size": "3.5mm"
    }
    p.save()
    print("Successfully updated specifications for:", p.name)
else:
    print("Product not found")

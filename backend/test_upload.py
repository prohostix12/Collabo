import os
import sys
import django

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from django.test import RequestFactory
from ecommerce.views import upload_influencer_media
from accounts.models import User
from ecommerce.models import Product

admin = User.objects.filter(is_staff=True).first()
p = Product.objects.first()

if not p:
    print("No product")
    sys.exit()

rf = RequestFactory()
with open('manage.py', 'rb') as f:
    req = rf.post('/upload', {'files': f, 'media_type': 'image'})
    req.user = admin
    req._dont_enforce_csrf_checks = True
    try:
        res = upload_influencer_media(req, product_id=p.id)
        print(res.status_code, getattr(res, 'data', ''))
    except Exception as e:
        import traceback
        traceback.print_exc()

import os
import sys
import django

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from django.test import RequestFactory
from accounts.views import reject_influencer
from accounts.models import User

admin = User.objects.filter(is_staff=True).first()
# Find an influencer to reject, or create a mock one
inf = User.objects.filter(user_type='influencer').first()
if not inf:
    print("No influencer found")
    sys.exit()

rf = RequestFactory()
req = rf.post('/reject')
req.user = admin
req._dont_enforce_csrf_checks = True

try:
    res = reject_influencer(req, user_id=inf.id)
    print(res.status_code, getattr(res, 'data', ''))
except Exception as e:
    import traceback
    traceback.print_exc()

import os
import django
import sys

sys.path.append(r'C:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import Product

offers_list = [
    "Bank Offer: 10% instant discount on SBI Credit Card EMI Transactions, up to ₹1,500 on orders of ₹5,000 and above",
    "Special Price: Get extra 15% off (price inclusive of cashback/coupon)",
    "Partner Offer: Sign up for Collabo Pay Later and get Collabo Gift Card worth ₹500*"
]

seller_info_text = "7 Days Replacement Policy • 1 Year Brand Warranty • Ships within 24 hours"

qa_data = [
    {"q": "Is the product durable?", "a": "Yes, it is built with high-quality premium materials designed to last."},
    {"q": "Does it support fast charging?", "a": "Yes, if applicable to the product type, it supports fast charging protocols."},
    {"q": "What is the return policy?", "a": "We offer a 7-day hassle-free replacement for defective items."}
]

updated_count = 0
for p in Product.objects.all():
    changed = False
    if not p.offers:
        p.offers = offers_list
        changed = True
    if not p.seller_info:
        p.seller_info = seller_info_text
        changed = True
    if not p.qa_section:
        p.qa_section = qa_data
        changed = True
        
    if changed:
        p.save()
        updated_count += 1

print(f"Successfully populated Flipkart-like rich content for {updated_count} products.")

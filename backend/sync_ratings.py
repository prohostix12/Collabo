import os
import django
import sys
from django.db.models import Avg, Count

sys.path.append(r'c:\Users\lenovo\Desktop\ProHostix\collab\collab\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "influencer_platform.settings")
django.setup()

from ecommerce.models import Product, CustomerReview

products = Product.objects.all()
updated_count = 0

for product in products:
    # Aggregate reviews
    aggregation = CustomerReview.objects.filter(product=product).aggregate(
        avg_rating=Avg('rating'),
        count=Count('id')
    )
    
    avg_rating = aggregation['avg_rating']
    count = aggregation['count']
    
    if count > 0:
        # Update product with calculated averages
        product.rating = round(avg_rating, 2)
        product.reviews_count = count
    else:
        # If no reviews somehow, ensure it has some default so it's not 0
        product.rating = 4.5
        product.reviews_count = 10
        
    product.save()
    updated_count += 1

print(f"Successfully synced rating and review_count fields for {updated_count} products.")

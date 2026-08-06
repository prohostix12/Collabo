import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from ecommerce.models import (
    Product, CartItem, OrderItem, Order, ProductReview, 
    CustomerReview, Wishlist, ProductInfluencerMedia, CustomerReferralLink
)

def reindex_products():
    print("Fetching existing products...")
    products = list(Product.objects.all().order_by('id'))
    print(f"Found {len(products)} products.")
    
    # Store product data in memory
    products_data = []
    for p in products:
        products_data.append({
            'seller': p.seller,
            'name': p.name,
            'category': p.category,
            'brand': p.brand,
            'price': p.price,
            'discount_price': p.discount_price,
            'discount_percent': p.discount_percent,
            'rating': p.rating,
            'reviews_count': p.reviews_count,
            'image': p.image,
            'images': p.images,
            'description': p.description,
            'stock': p.stock,
            'delivery': p.delivery,
            'specifications': p.specifications,
            'highlights': p.highlights,
            'offers': p.offers,
            'seller_info': p.seller_info,
            'qa_section': p.qa_section,
            'product_shipping_charge': p.product_shipping_charge,
            'commission_rate': p.commission_rate,
            'link_discount_percent': p.link_discount_percent
        })

    print("Clearing dependent tables to avoid ForeignKey constraint errors...")
    CartItem.objects.all().delete()
    OrderItem.objects.all().delete()
    Order.objects.all().delete()
    ProductReview.objects.all().delete()
    CustomerReview.objects.all().delete()
    Wishlist.objects.all().delete()
    ProductInfluencerMedia.objects.all().delete()
    CustomerReferralLink.objects.all().delete()
    
    print("Deleting all products...")
    Product.objects.all().delete()
    
    print("Resetting PostgreSQL autoincrement ID sequence for ecommerce_product table...")
    with connection.cursor() as cursor:
        try:
            cursor.execute("ALTER SEQUENCE ecommerce_product_id_seq RESTART WITH 1;")
            print("PostgreSQL sequence reset successfully.")
        except Exception as e:
            print("Failed to reset PostgreSQL sequence (might not be PostgreSQL or sequence name differs):", e)
            try:
                # Fallback for SQLite sequence reset if needed
                cursor.execute("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'ecommerce_product';")
                print("SQLite sequence reset successfully.")
            except Exception as e2:
                print("SQLite sequence reset fallback failed:", e2)

    print("Re-creating products sequentially...")
    for idx, p_data in enumerate(products_data):
        new_prod = Product.objects.create(**p_data)
        print(f"Created product: {new_prod.name} with new sequential ID: {new_prod.id}")
        
    print("\nSUCCESS: All products re-indexed continuously starting from ID 1!")

if __name__ == "__main__":
    reindex_products()

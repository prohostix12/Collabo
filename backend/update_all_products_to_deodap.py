import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from ecommerce.models import Product, Vendor

def update_products():
    try:
        deodap_vendor = Vendor.objects.get(name="DeoDap")
    except Vendor.DoesNotExist:
        print("Vendor 'DeoDap' does not exist. Creating it now.")
        deodap_vendor = Vendor.objects.create(
            name="DeoDap",
            return_policy="7 Days Replacement Policy",
            delivery_time="Free delivery by Tomorrow",
            delivery_charge=0.00
        )
    
    products = Product.objects.all()
    count = products.count()
    
    for product in products:
        product.vendor = deodap_vendor
        product.return_policy = deodap_vendor.return_policy
        product.delivery = deodap_vendor.delivery_time
        product.shipping_charge = deodap_vendor.delivery_charge
        product.save()
        
    print(f"Successfully updated {count} products to use vendor '{deodap_vendor.name}' and its default policies.")

if __name__ == '__main__':
    update_products()

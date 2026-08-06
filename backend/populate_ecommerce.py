import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from ecommerce.models import Product

User = get_user_model()

# Ensure we have at least one user to be the seller
seller = User.objects.filter(is_superuser=True).first()
if not seller:
    seller = User.objects.first()
if not seller:
    seller = User.objects.create_user(
        username='admin_seller',
        email='admin@collabo.com',
        password='adminpassword123',
        user_type='admin',
        is_staff=True,
        is_superuser=True
    )

print(f"Using seller user: {seller.username} ({seller.email})")

# Sample products to populate
PRODUCTS_DATA = [
    {
        'name': 'NovaPro ANC Wireless Headphones',
        'category': 'Electronics',
        'brand': 'NovaSound',
        'price': 19999,
        'discount_price': 14999,
        'rating': 4.80,
        'reviews_count': 128,
        'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'Experience pure sonic bliss with the NovaPro Wireless Headphones. Featuring Active Noise Cancellation (ANC), custom 40mm dynamic drivers, and 45 hours of battery life.',
        'stock': 14,
        'delivery': 'Free delivery by Tomorrow',
        'specifications': [
            { 'name': 'Driver Size', 'value': '40mm Dynamic' },
            { 'name': 'Battery Life', 'value': 'Up to 45 Hours' }
        ]
    },
    {
        'name': 'StealthPro Mechanical Keyboard',
        'category': 'Electronics',
        'brand': 'GhostKey',
        'price': 12999,
        'discount_price': 8999,
        'rating': 4.70,
        'reviews_count': 96,
        'image': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'A premium 75% mechanical keyboard featuring hot-swappable linear yellow switches and gasket-mounted structure.',
        'stock': 8,
        'delivery': 'Delivery in 2 days',
        'specifications': [
            { 'name': 'Layout', 'value': '75% Compact' },
            { 'name': 'Switches', 'value': 'Linear Yellow' }
        ]
    },
    {
        'name': 'Aero X1 Pro Ultra',
        'category': 'Mobiles',
        'brand': 'AeroCorp',
        'price': 89999,
        'discount_price': 79999,
        'rating': 4.90,
        'reviews_count': 342,
        'image': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'Breathtaking 6.8" 120Hz LTPO AMOLED display, Octa-core Tensor-S chip, and a professional-grade 200MP triple camera system.',
        'stock': 25,
        'delivery': 'Free delivery by Saturday',
        'specifications': [
            { 'name': 'Display', 'value': '6.8 inch 120Hz' },
            { 'name': 'Processor', 'value': 'Tensor-S Octa-Core' }
        ]
    },
    {
        'name': 'Urban Vanguard Denim Jacket',
        'category': 'Fashion',
        'brand': 'Vanguard',
        'price': 5999,
        'discount_price': 3599,
        'rating': 4.50,
        'reviews_count': 184,
        'image': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'A classic silhouette modernized. Made from premium heavy-weight selvedge denim that ages beautifully over time.',
        'stock': 19,
        'delivery': 'Free delivery by Monday',
        'specifications': [
            { 'name': 'Material', 'value': '100% Selvedge Cotton' },
            { 'name': 'Fit', 'value': 'Modern Tailored' }
        ]
    },
    {
        'name': 'Ceremonial Grade Matcha Powder (50g)',
        'category': 'Grocery',
        'brand': 'KyotoOrganics',
        'price': 1999,
        'discount_price': 1699,
        'rating': 4.80,
        'reviews_count': 74,
        'image': 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80'
        ],
        'description': '100% stone-ground ceremonial green tea leaves imported directly from Kyoto, Japan. Vibrant green color, rich umami taste.',
        'stock': 45,
        'delivery': 'Free delivery by Tomorrow',
        'specifications': [
            { 'name': 'Origin', 'value': 'Kyoto, Japan' },
            { 'name': 'Grade', 'value': 'Ceremonial Grade' }
        ]
    },
    {
        'name': 'Celestial Hydra-Glow Face Serum',
        'category': 'Beauty',
        'brand': 'CelestialSkin',
        'price': 2499,
        'discount_price': 1999,
        'rating': 4.70,
        'reviews_count': 218,
        'image': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'Hydrating serum formulated with 2% Hyaluronic Acid and Niacinamide. Plumps fine lines, creates a radiant glow.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'specifications': [
            { 'name': 'Key Ingredients', 'value': 'Hyaluronic Acid, Niacinamide' }
        ]
    },
    {
        'name': 'Elysian Ergonomic Swivel Chair',
        'category': 'Furniture',
        'brand': 'Elysian',
        'price': 18999,
        'discount_price': 12999,
        'rating': 4.80,
        'reviews_count': 88,
        'image': 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'Ultimate support with adjustable 3D armrests, dynamic lumbar support, and breathable high-tensile mesh back.',
        'stock': 5,
        'delivery': 'Delivery in 4-5 days',
        'specifications': [
            { 'name': 'Frame Material', 'value': 'Aluminum Alloy' }
        ]
    },
    {
        'name': 'StealthCore Dumbbells (20kg Set)',
        'category': 'Sports',
        'brand': 'StealthGym',
        'price': 7999,
        'discount_price': 5199,
        'rating': 4.60,
        'reviews_count': 110,
        'image': 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'Cast iron plates with non-slip knurled handles. Dial mechanism adjusts the weight from 2kg to 10kg per dumbbell.',
        'stock': 10,
        'delivery': 'Free delivery by Monday',
        'specifications': [
            { 'name': 'Total Weight', 'value': '20kg' }
        ]
    },
    {
        'name': 'Designing Agentic Systems',
        'category': 'Books',
        'brand': 'DeepMind Press',
        'price': 999,
        'discount_price': 799,
        'rating': 4.90,
        'reviews_count': 205,
        'image': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
        'images': [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'
        ],
        'description': 'Definitive guide to understanding LLM architecture, agentic workflows, memory, tool use, and cognitive computing.',
        'stock': 32,
        'delivery': 'Free delivery by Tomorrow',
        'specifications': [
            { 'name': 'Format', 'value': 'Hardcover' },
            { 'name': 'Pages', 'value': '412' }
        ]
    }
]

created_count = 0
for prod_data in PRODUCTS_DATA:
    if not Product.objects.filter(name=prod_data['name']).exists():
        Product.objects.create(seller=seller, **prod_data)
        created_count += 1

print(f"Successfully populated {created_count} products!")

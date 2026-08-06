import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from ecommerce.models import Product

User = get_user_model()

seller = User.objects.filter(is_superuser=True).first()
if not seller:
    seller = User.objects.first()

print(f"Using seller user: {seller.username} ({seller.email})")

RETURN_QA = {
    "q": "What if I'm not happy with it after delivery?",
    "a": "You can request a return within 7 days of delivery as per our standard return policy, as long as the item is unused and in its original packaging."
}

FAST_DELIVERY = "Free delivery by Tomorrow"
SLOW_DELIVERY = "Delivery within 4-5 days"

PRODUCTS_DATA = [
    {
        'name': 'Face Massage Roller – Dual-Ended for Radiant Skin',
        'category': 'Health & Personal Care',
        'brand': 'DeoDap',
        'price': 139,
        'discount_price': 99,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/01_52bac1bc-1eeb-4209-b900-f1725c782724.jpg?v=1759380601&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/01_52bac1bc-1eeb-4209-b900-f1725c782724.jpg?v=1759380601&width=990',
            'https://deodap.in/cdn/shop/files/04_85cfe2c5-e4d7-4e72-baa2-91c477705d44.jpg?v=1759380601&width=1100',
            'https://deodap.in/cdn/shop/files/05_d772ccf9-c28a-45b5-806a-7db57b58a579.jpg?v=1759380601&width=600',
            'https://deodap.in/cdn/shop/files/06_9c17d155-d0c1-4476-87e4-b01099697f95.jpg?v=1759380601&width=600',
        ],
        'description': (
            "Dual-Ended Design: Features two different sized cooling stone rollers – a large head for broad areas like the face and neck, and a smaller head for delicate regions such as under the eyes and around the mouth.\n\n"
            "Cooling Stone Surface: Crafted with a naturally cool stone that instantly soothes and de-puffs skin, reducing inflammation and redness.\n\n"
            "Enhanced Serum Absorption: Gently massages the skin, helping your skincare products penetrate deeper for maximum efficacy and better results.\n\n"
            "Promotes Circulation & Lymphatic Drainage: Regular use stimulates blood flow and aids in flushing out toxins, leading to a brighter, more even skin tone.\n\n"
            "Ergonomic & Silent Operation: Designed for comfortable grip and smooth, quiet rolling, ensuring a relaxing and effortless massage experience.\n\n"
            "Durable & Travel-Friendly: Made with high-quality materials for longevity and compact enough to fit into your travel kit for on-the-go skincare.\n\n"
            "Versatile Skincare Tool: Ideal for morning de-puffing to awaken the skin, and evening relaxation to unwind and prepare for restorative sleep."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Dual-ended cooling stone rollers',
            'De-puffs & soothes skin',
            'Boosts serum absorption',
            'Silent, ergonomic operation',
            'Travel-friendly size',
        ],
        'specifications': [
            {'name': 'Type', 'value': 'Dual-ended facial roller'},
            {'name': 'Material', 'value': 'Natural cooling stone'},
            {'name': 'Roller Heads', 'value': 'Large + small (2)'},
            {'name': 'Use Areas', 'value': 'Face, neck, under-eyes'},
            {'name': 'Operation', 'value': 'Manual, silent rolling'},
        ],
        'qa_section': [
            {'q': 'How do I use this roller?', 'a': 'Use the large roller on your face and neck, and the smaller roller around the eyes and mouth, gliding gently outward and upward.'},
            {'q': 'Does it need to be refrigerated?', 'a': 'No — the stone naturally stays cool to the touch, though chilling it briefly in the fridge can enhance the de-puffing effect.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Transparent Dome Umbrella – Windproof with Comfortable Curved Handle',
        'category': 'Home & Kitchen',
        'brand': 'DeoDap',
        'price': 379,
        'discount_price': 269,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/Umbrella-01_652250d5-4622-498a-8977-c70f5a0d2bcd.jpg?v=1751631202&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/Umbrella-01_652250d5-4622-498a-8977-c70f5a0d2bcd.jpg?v=1751631202&width=990',
            'https://deodap.in/cdn/shop/files/WhatsAppImage2025-07-03at09.16.24_1_fc6b1e91-85be-4877-8310-aa15fb68d261.jpg?v=1751631202&width=1100',
            'https://deodap.in/cdn/shop/files/Umbrella-04_2dff6a9a-7ce3-467e-b739-5619ee0de4af.jpg?v=1751631202&width=600',
            'https://deodap.in/cdn/shop/files/Umbrella-03_96bbe1bf-68f9-4afe-b61a-fe9c0df24ec9.jpg?v=1751631202&width=1100',
        ],
        'description': (
            "Clear PVC dome canopy provides full visibility and keeps you dry.\n\n"
            "Windproof metal shaft with reinforced ribs resists strong gusts.\n\n"
            "High-arch dome shape offers extended coverage for full protection.\n\n"
            "Lightweight design makes it easy to carry around daily.\n\n"
            "Ergonomic curved handle delivers a comfortable and secure grip.\n\n"
            "Manual push-button mechanism ensures quick and smooth opening."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Clear PVC dome for full visibility',
            'Windproof reinforced ribs',
            'High-arch extended coverage',
            'Comfortable curved handle',
            'Lightweight, easy to carry',
        ],
        'specifications': [
            {'name': 'Canopy', 'value': 'Clear PVC dome'},
            {'name': 'Frame', 'value': 'Windproof metal shaft, reinforced ribs'},
            {'name': 'Handle', 'value': 'Ergonomic curved handle'},
            {'name': 'Opening Mechanism', 'value': 'Manual push-button'},
            {'name': 'Shape', 'value': 'High-arch dome'},
        ],
        'qa_section': [
            {'q': 'Will it hold up in heavy wind?', 'a': 'Yes, the windproof metal shaft and reinforced ribs are designed to resist strong gusts without turning inside out.'},
            {'q': 'Can I see through the canopy while walking?', 'a': 'Yes, the clear PVC dome offers full visibility so you can see the path ahead while staying dry.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Kitchen Faucet Sprayer – 3-Function Pull Down',
        'category': 'Home & Kitchen',
        'brand': 'DeoDap',
        'price': 359,
        'discount_price': 259,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/02_f46ca527-5b1c-4574-a375-c01b4d4e0ad6.jpg?v=1737614364&width=1946',
        'images': [
            'https://deodap.in/cdn/shop/files/02_f46ca527-5b1c-4574-a375-c01b4d4e0ad6.jpg?v=1737614364&width=1946',
            'https://deodap.in/cdn/shop/files/05_8946449a-f689-4217-9fc3-d604fa81daaf.jpg?v=1737614364&width=600',
            'https://deodap.in/cdn/shop/files/04_09ad4e9b-a1db-46a1-97ba-e390b81eb3e0.jpg?v=1737614364&width=600',
            'https://deodap.in/cdn/shop/files/06_54b8da41-b52a-4b97-88da-f5112bea9664.jpg?v=1737614364&width=600',
        ],
        'description': (
            "3 Spray Functions: Easily switch between a gentle stream for daily tasks, a medium-pressure flow for sink cleaning, and a powerful high-pressure spray for tackling tough dish stains.\n\n"
            "Water-Saving Aerator: Equipped with a built-in honeycomb foaming core that mixes water with air, this kitchen faucet sprayer reduces water consumption by up to 70% while maintaining a smooth, soft, and splash-free flow.\n\n"
            "720° Double Rotatable Design: Featuring two independent axes, the innovative 720° rotatable faucet attachment allows you to direct water precisely, reaching every corner of your sink with ease.\n\n"
            "Premium Durability: Crafted from high-quality Brass and ABS materials, ensuring long-lasting performance and a brilliant, new-like shine even after extensive use.\n\n"
            "Universal Fit & Easy Installation: This universal sink attachment is designed for hassle-free setup. It can also be connected to existing pull-out faucets by simply removing the top rotating shaft."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            '3 spray functions in one',
            '720° double rotation',
            'Up to 70% water-saving aerator',
            'Brass & ABS build',
            'Easy universal installation',
        ],
        'specifications': [
            {'name': 'Spray Functions', 'value': '3 (gentle, medium, high-pressure)'},
            {'name': 'Rotation', 'value': '720° double rotatable'},
            {'name': 'Material', 'value': 'Brass + ABS'},
            {'name': 'Water Saving', 'value': 'Up to 70% via honeycomb aerator'},
            {'name': 'Installation', 'value': 'Universal fit, tool-free'},
        ],
        'qa_section': [
            {'q': 'Will this fit my existing kitchen faucet?', 'a': "Yes, it's designed as a universal attachment and can also connect to existing pull-out faucets by removing the top rotating shaft."},
            {'q': 'Does it reduce water pressure?', 'a': 'No, the honeycomb aerator mixes air with water to maintain a smooth, full flow while using less water.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Mini Heat Sealer – Portable Food Bag Sealing Machine',
        'category': 'Home & Kitchen',
        'brand': 'DeoDap',
        'price': 189,
        'discount_price': 139,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/5_57c2bbd8-6d2e-4165-a9b0-54b7c14bb6b1.jpg?v=1737622407&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/5_57c2bbd8-6d2e-4165-a9b0-54b7c14bb6b1.jpg?v=1737622407&width=990',
            'https://deodap.in/cdn/shop/files/20291_62d0ba78-95b3-4f95-b69b-15f2450b33be.png?v=1762764230&width=1100',
            'https://deodap.in/cdn/shop/files/20292_2f23cd73-c47f-4412-a320-dafaa4110bd9.png?v=1762764230&width=1100',
            'https://deodap.in/cdn/shop/files/20294_f6f0c70e-169e-4374-b6d9-23f8cf537bfd.png?v=1762764230&width=600',
        ],
        'description': (
            "Airtight Freshness: Locks in flavour and prevents spoilage, keeping your food tasting delicious and extending its shelf life.\n\n"
            "Effortless Operation: Simply glide the portable heat sealer along the edge of any plastic or Mylar bag to create a professional seal in seconds.\n\n"
            "Eco-Friendly Solution: Reseal original packaging to reduce food waste and protect contents from dust, moisture, and bacteria.\n\n"
            "Compact & Portable: Lightweight design makes this snack bag sealer easy to use, store, and carry, perfect for home, office, or travel.\n\n"
            "Magnetic Base: Features a convenient magnetic strip for easy attachment to your refrigerator or other metal surfaces, keeping it always within reach.\n\n"
            "Quick Heat-Up: The durable ceramic heating head reaches optimal sealing temperature in just a few seconds after activation."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Seals bags airtight in seconds',
            'Quick ceramic heat-up',
            'Magnetic base for easy storage',
            'Compact & portable',
            'Reduces food waste',
        ],
        'specifications': [
            {'name': 'Heating Head', 'value': 'Ceramic, quick heat-up'},
            {'name': 'Compatible With', 'value': 'Plastic & Mylar bags'},
            {'name': 'Mounting', 'value': 'Magnetic base'},
            {'name': 'Design', 'value': 'Compact, portable'},
            {'name': 'Ideal For', 'value': 'Home, office, travel'},
        ],
        'qa_section': [
            {'q': 'What can I use this on?', 'a': 'It works on most plastic and Mylar bags used for snacks, chips, and other food storage, creating a professional seal in seconds.'},
            {'q': 'Where can I keep it when not in use?', 'a': "The built-in magnetic base lets you attach it directly to your fridge or any metal surface, so it's always within reach."},
            RETURN_QA,
        ],
    },
    {
        'name': 'Car Key Case – Durable PU Leather with Zipper & Clip',
        'category': 'Home & Kitchen',
        'brand': 'DeoDap',
        'price': 249,
        'discount_price': 179,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/21979-01-no-sku_8bef4102-b671-4f13-8b58-234178b25dea.jpg?v=1781334350&width=1946',
        'images': [
            'https://deodap.in/cdn/shop/files/21979-01-no-sku_8bef4102-b671-4f13-8b58-234178b25dea.jpg?v=1781334350&width=1946',
            'https://deodap.in/cdn/shop/files/21979-02-sku_c1a1166e-755d-4f8c-9a72-5a02807d3c08.jpg?v=1781334350&width=1100',
            'https://deodap.in/cdn/shop/files/21979-04-live_404e73af-70fc-4f76-b98a-afb0e7b6031e.jpg?v=1781334350&width=600',
        ],
        'description': (
            "Made from durable, high-quality PU leather for longevity and a premium feel.\n\n"
            "All-around zipper closure protecting your smart key from dust and impacts.\n\n"
            "Integrated internal ring for attaching additional keys or keychains.\n\n"
            "Sturdy metal clip hook for attaching to belts, bags, or purses.\n\n"
            "Soft-lined interior to prevent scratches and provide cushioning.\n\n"
            "Compact and slim design for easy carrying in pockets or bags.\n\n"
            "Sophisticated black finish suitable for both men and women.\n\n"
            "Universal fit designed to accommodate most smart remote keys."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Durable PU leather build',
            'All-around zipper protection',
            'Metal clip + internal keyring',
            'Soft-lined scratch-proof interior',
            'Universal smart key fit',
        ],
        'specifications': [
            {'name': 'Material', 'value': 'PU leather'},
            {'name': 'Closure', 'value': 'All-around zipper'},
            {'name': 'Attachment', 'value': 'Metal clip hook + internal keyring'},
            {'name': 'Interior', 'value': 'Soft-lined'},
            {'name': 'Fit', 'value': 'Universal, most smart remote keys'},
            {'name': 'Finish', 'value': 'Black'},
        ],
        'qa_section': [
            {'q': "Will this fit my car's smart key?", 'a': "Yes, it's designed with a universal fit to accommodate most smart remote keys."},
            {'q': 'Can I attach my house keys too?', 'a': 'Yes, the integrated internal ring lets you attach additional keys or keychains alongside your smart key.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Detangling Hair Brush – Faster Drying & Gentle Scalp Massage',
        'category': 'Health & Personal Care',
        'brand': 'DeoDap',
        'price': 109,
        'discount_price': 79,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/CurvedHairbrush-01.jpg?v=1781261993&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/CurvedHairbrush-01.jpg?v=1781261993&width=1100',
            'https://deodap.in/cdn/shop/files/CurvedHairbrush-02.jpg?v=1781261993&width=1100',
        ],
        'description': (
            "The Detangling Hair Brush is your go-to tool for achieving smooth, healthy hair effortlessly.\n\n"
            "Designed for both men and women, this innovative hairbrush combines detangling, massage, and drying efficiency in one sleek package."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Detangles gently, reduces breakage',
            'Scalp massage while brushing',
            'Speeds up drying time',
            'Suitable for men & women',
            'Ergonomic curved design',
        ],
        'specifications': [
            {'name': 'Type', 'value': 'Detangling hair brush'},
            {'name': 'Suitable For', 'value': 'Men & women'},
            {'name': 'Functions', 'value': 'Detangling, scalp massage, faster drying'},
            {'name': 'Design', 'value': 'Curved ergonomic handle'},
        ],
        'qa_section': [
            {'q': 'Is this brush suitable for all hair types?', 'a': "Yes, it's designed for both men and women and works well for detangling everyday hair types."},
            {'q': 'Does it help hair dry faster?', 'a': 'Yes, its bristle design is built to speed up drying time while gently massaging the scalp.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Paper Soap Sheets – Portable Hand & Face Wash',
        'category': 'Health & Personal Care',
        'brand': 'DeoDap',
        'price': 109,
        'discount_price': 79,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/products/Untitled-3_220eb287-76b2-4236-9d75-75dc3e8932ce.jpg?v=1750911342&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/products/Untitled-3_220eb287-76b2-4236-9d75-75dc3e8932ce.jpg?v=1750911342&width=1100',
            'https://deodap.in/cdn/shop/files/20258.png?v=1762162894&width=600',
            'https://deodap.in/cdn/shop/files/20259.png?v=1762162894&width=600',
        ],
        'description': (
            "Portable & Travel-Friendly: Ultra-thin, single-use paper soap sheets are ideal for travel, office, gym, or camping, fitting easily into any bag or pocket.\n\n"
            "Gentle Cleansing: Formulated to be mild on all skin types, leaving hands and face feeling soft, clean, and refreshed without dryness.\n\n"
            "Natural Antiseptic Properties: Provides a hygienic cleanse, helping to keep germs at bay, ensuring cleanliness wherever you are.\n\n"
            "Easy to Use: Simply add water to one or two flakes for a colourful, scented lather that rinses clean, leaving no residue.\n\n"
            "Versatile Application: Suitable for a refreshing hand wash, a gentle face cleanse, and even a quick, light shower.\n\n"
            "Delightful Apple Design: Fun, appealing apple-shaped flakes add a touch of joy and uniqueness to your daily hygiene routine."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Ultra-thin, single-use sheets',
            'Lathers instantly with water',
            'Gentle on all skin types',
            'Travel, gym & office friendly',
            'Fun apple-shaped design',
        ],
        'specifications': [
            {'name': 'Format', 'value': 'Paper soap sheets (flakes)'},
            {'name': 'Use', 'value': 'Hand wash, face wash, light body wash'},
            {'name': 'Activation', 'value': 'Add water to lather'},
            {'name': 'Packaging', 'value': 'Travel-friendly, single-use'},
            {'name': 'Design', 'value': 'Apple-shaped flakes'},
        ],
        'qa_section': [
            {'q': 'How do I use the soap sheets?', 'a': 'Just add water to one or two flakes and rub your hands together for a scented lather that rinses off clean.'},
            {'q': 'Can I use these on my face?', 'a': "Yes, they're formulated to be mild enough for a refreshing hand wash, face cleanse, or even a quick light shower."},
            RETURN_QA,
        ],
    },
    {
        'name': '3 Stage Manual Knife Sharpener Tool for Steel and Ceramic Knives',
        'category': 'Home & Kitchen',
        'brand': 'DeoDap',
        'price': 209,
        'discount_price': 149,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/blackKnifeSharpener-01.jpg?v=1782462873&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/blackKnifeSharpener-01.jpg?v=1782462873&width=1100',
            'https://deodap.in/cdn/shop/files/blackKnifeSharpener-02.jpg?v=1782462873&width=1100',
            'https://deodap.in/cdn/shop/files/blackKnifeSharpener-03.jpg?v=1782462873&width=600',
        ],
        'description': (
            "Reliable home & kitchen for everyday use.\n\n"
            "Useful design with practical value for customers.\n\n"
            "Suitable for gifting, resale, and regular household needs."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            '3-stage sharpening system',
            'Works on steel & ceramic blades',
            'Simple manual operation',
            'Compact kitchen essential',
            'Great for gifting or resale',
        ],
        'specifications': [
            {'name': 'Sharpening Stages', 'value': '3'},
            {'name': 'Compatible With', 'value': 'Steel & ceramic knives'},
            {'name': 'Operation', 'value': 'Manual, no power needed'},
            {'name': 'Use Case', 'value': 'Home kitchen, gifting, resale'},
        ],
        'qa_section': [
            {'q': 'Does this work on ceramic knives?', 'a': "Yes, it's built with a 3-stage system suitable for both steel and ceramic knife blades."},
            {'q': 'Do I need any power source to use it?', 'a': 'No, it\'s a fully manual sharpener — just draw the blade through each stage by hand.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Flat Mop – 360° Rotating Head, Easy Squeeze',
        'category': 'Home & Kitchen',
        'brand': 'DeoDap',
        'price': 839,
        'discount_price': 599,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/07_b45ab297-1d41-43f3-b0c2-bbe504df6204.jpg?v=1737627439&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/07_b45ab297-1d41-43f3-b0c2-bbe504df6204.jpg?v=1737627439&width=990',
            'https://deodap.in/cdn/shop/files/09_5b26db68-8939-4ddd-bb60-e152ab135846.jpg?v=1763488628&width=1100',
            'https://deodap.in/cdn/shop/files/20396_564b08d2-3fbc-4ab3-ab19-62eec0b76fc2.png?v=1763488628&width=600',
            'https://deodap.in/cdn/shop/files/20398.png?v=1763488628&width=600',
        ],
        'description': (
            "360° Rotating X-Shape Head: Effortlessly navigate around furniture and into tight corners, ensuring no spot is missed. The unique X-shape design maximises cleaning surface area.\n\n"
            "Easy Squeeze Compression: Integrated wringing mechanism allows you to quickly remove excess water with a simple push and pull, keeping your hands dry and clean.\n\n"
            "Premium Microfiber Cleaning Pad: Ultra-absorbent microfiber material effectively captures fine dirt, dust, and pet hair, leaving surfaces streak-free and pristine without damage.\n\n"
            "Versatile Multi-Surface Cleaning: Ideal for a wide range of floor types including wood, ceramic tile, laminate, and stone. Also perfect for cleaning walls, windows, and high ceilings.\n\n"
            "Detachable & Adjustable Handle: The lightweight, extendable handle provides comfortable reach for high-up areas and can be detached for compact storage or focused cleaning tasks.\n\n"
            "Durable & Lightweight Design: Constructed for longevity and ease of use, making your daily cleaning chores feel less like a burden."
        ),
        'stock': 50,
        'delivery': FAST_DELIVERY,
        'highlights': [
            '360° rotating X-shape head',
            'Easy-squeeze water wringing',
            'Ultra-absorbent microfiber pad',
            'Multi-surface: floors, walls, windows',
            'Detachable, adjustable handle',
        ],
        'specifications': [
            {'name': 'Head Design', 'value': '360° rotating X-shape'},
            {'name': 'Cleaning Pad', 'value': 'Premium microfiber'},
            {'name': 'Wringing', 'value': 'Easy-squeeze compression mechanism'},
            {'name': 'Handle', 'value': 'Detachable & adjustable'},
            {'name': 'Surfaces', 'value': 'Wood, tile, laminate, stone, walls, windows'},
        ],
        'qa_section': [
            {'q': 'Can I use this mop on walls and windows too?', 'a': 'Yes, the detachable extendable handle makes it easy to reach and clean walls, windows, and high ceilings, not just floors.'},
            {'q': 'How do I wring out the water?', 'a': 'Simply use the built-in easy-squeeze compression mechanism — a quick push and pull removes excess water without touching the mop head.'},
            RETURN_QA,
        ],
    },
    {
        'name': 'Waterproof Travel Cosmetic Pouch Holographic Makeup Toiletry Bag',
        'category': 'Beauty & Personal Care',
        'brand': 'DeoDap',
        'price': 279,
        'discount_price': 199,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/Girl-purse-1.jpg?v=1785134685&width=600',
        'images': [
            'https://deodap.in/cdn/shop/files/Girl-purse-1.jpg?v=1785134685&width=600',
            'https://deodap.in/cdn/shop/files/Girl-purse-3.jpg?v=1785134685&width=600',
            'https://deodap.in/cdn/shop/files/Girl-purse-7.jpg?v=1785134685&width=600',
        ],
        'description': (
            "Waterproof surface protects clothes and luggage from spills and leaking bottles.\n\n"
            "Slim flat shape slides easily between clothes in a suitcase or cabin bag.\n\n"
            "Roomy single compartment holds makeup, brushes, toiletries and small accessories.\n\n"
            "Smooth zip closure keeps everything sealed inside while your bag is in transit.\n\n"
            "Eye catching holographic finish looks stylish enough to carry out of the bag too.\n\n"
            "Lightweight body adds almost no weight to your travel luggage allowance.\n\n"
            "Wipe clean interior handles spilled powder, cream and liquid without staining.\n\n"
            "Multipurpose use for jewellery, chargers, medicines and travel documents too."
        ),
        'stock': 50,
        'delivery': SLOW_DELIVERY,
        'highlights': [
            'Waterproof holographic finish',
            'Slim shape fits easily in luggage',
            'Wipe-clean interior',
            'Lightweight, travel-friendly',
            'Multipurpose storage',
        ],
        'specifications': [
            {'name': 'Material', 'value': 'Waterproof holographic exterior'},
            {'name': 'Interior', 'value': 'Wipe-clean single compartment'},
            {'name': 'Closure', 'value': 'Smooth zip closure'},
            {'name': 'Shape', 'value': 'Slim, flat profile'},
            {'name': 'Use Case', 'value': 'Makeup, toiletries, travel documents, chargers'},
        ],
        'qa_section': [
            {'q': 'Will it protect my clothes from leaking bottles?', 'a': "Yes, the waterproof surface is designed to protect the rest of your luggage from spills and leaking toiletries."},
            {'q': 'Can I use this for things other than makeup?', 'a': "Yes, it's roomy enough for toiletries, chargers, medicines, jewellery, or travel documents too."},
            RETURN_QA,
        ],
    },
]

created_count = 0
for prod_data in PRODUCTS_DATA:
    if not Product.objects.filter(name=prod_data['name']).exists():
        Product.objects.create(seller=seller, **prod_data)
        created_count += 1
        print(f"  Created: {prod_data['name']} [{prod_data['category']}] - MRP INR {prod_data['price']} / Selling INR {prod_data['discount_price']}")
    else:
        print(f"  Skipped (already exists): {prod_data['name']}")

print(f"\nSuccessfully populated {created_count} new products!")

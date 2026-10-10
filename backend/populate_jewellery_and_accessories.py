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

PRODUCTS_DATA = [
    {
        'name': 'Mini Tripod – Universal Phone & Camera Stand for Stable Shots',
        'category': 'Electronics',
        'brand': 'DeoDap',
        'price': 129,
        'discount_price': 129,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/products/1_2de756e8-3f97-46a4-b101-dbd5bd968946.jpg?v=1737629161&width=990',
        'images': [
            'https://deodap.in/cdn/shop/products/1_2de756e8-3f97-46a4-b101-dbd5bd968946.jpg?v=1737629161&width=990',
            'https://deodap.in/cdn/shop/products/0272.jpg?v=1737629161&width=600',
            'https://deodap.in/cdn/shop/products/Mini-Phone-Stabilizer-Tripod-Tabletop-Stand-with-Ballhead-mini-Projector-DSLR-Digital-Cameras-Video-for-Gopro_3_3106bc62-d4fb-4494-adc5-7056a98df222.jpg?v=1737629162&width=600',
            'https://deodap.in/cdn/shop/products/3_fc7823cf-1d53-470d-b131-e02c0ba09c22.jpg?v=1737629162&width=600',
            'https://deodap.in/cdn/shop/products/2_f563fbd4-18a2-4973-af11-0d32039aa5ca.jpg?v=1737629162&width=600'
        ],
        'description': 'Universal Compatibility: Fits smartphones (5.8 to 10.5 cm width), digital cameras, and pico projectors with standard 1/4" screw threads.\n\nInstant Adjustments: Push-button ball head allows for quick, 360-degree angle adjustments.\n\nSuperior Stability: Silica gel anti-skid pads on legs prevent sliding on any surface.\n\nCompact & Portable: Folds down to 16 cm, weighing just 133g for effortless transport.\n\nDurable Construction: Made from premium ABS and steel for long-lasting performance.\n\nVersatile Use: Functions as a stable tripod or a comfortable handheld grip for dynamic shots.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Universal Compatibility: Fits smartphones (5.8 to 10.5 cm width), digital cameras, and pico projectors with standard 1/4" screw threads.',
            'Instant Adjustments: Push-button ball head allows for quick, 360-degree angle adjustments.',
            'Superior Stability: Silica gel anti-skid pads on legs prevent sliding on any surface.',
            'Compact & Portable: Folds down to 16 cm, weighing just 133g for effortless transport.',
            'Durable Construction: Made from premium ABS and steel for long-lasting performance.',
            'Versatile Use: Functions as a stable tripod or a comfortable handheld grip for dynamic shots.'
        ],
        'specifications': [],
    },
    {
        'name': 'Camera Tripod – Portable 41-Inch Mobile Phone Stand',
        'category': 'Electronics',
        'brand': 'DeoDap',
        'price': 349,
        'discount_price': 349,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/products/4_98b27e7c-6714-4df9-ae02-ef694e6d5901.jpg?v=1737629155&width=990',
        'images': [
            'https://deodap.in/cdn/shop/products/4_98b27e7c-6714-4df9-ae02-ef694e6d5901.jpg?v=1737629155&width=990',
            'https://deodap.in/cdn/shop/products/0280.jpg?v=1737629155&width=1100',
            'https://deodap.in/cdn/shop/products/6_311778c0-8ef1-45f0-b762-0cdc9bc3ebfc.jpg?v=1737629156&width=1100',
            'https://deodap.in/cdn/shop/products/Morjava-3110A-Lightweight-Tripod-with-Adjustable-height-legs-Free-Phone-Holder-with-Bag_4_60ec4bfd-e9a0-4f09-9045-9a4972ca6a53.jpg?v=1737629156&width=600',
            'https://deodap.in/cdn/shop/products/2_90725a48-1a98-46c2-93a0-2166d47e0839.jpg?v=1737629156&width=600'
        ],
        'description': 'Excellent 3-Way Pan Head: Easily switch between 360° horizontal and 90° vertical shooting, including a 90° portrait orientation and 180° tilt motion.\n\nCompact & Lightweight Design: With a folded size of just 43 cm (17 inches) and a net weight of 0.45 kg, it\'s perfect for travel and on-the-go photography.\n\nAdjustable 4-Section Aluminum Legs: Quickly extend and retract the legs from 43 cm (17 inches) to 106 cm (41 inches) using smooth leg locks.\n\nNon-Slip Rubber Leg Bases: Provides superior grip and stability on various surfaces, preventing accidental slips.\n\nWide Compatibility: Features a universal 1/4" screw quick-release plate and an adjustable phone clip, making it suitable for most cameras and mobile devices.\n\nIntegrated Bubble Level: Helps achieve perfect balance and precise alignment for consistently professional shots.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Excellent 3-Way Pan Head: Easily switch between 360° horizontal and 90° vertical shooting, including a 90° portrait orientation and 180° tilt motion.',
            'Compact & Lightweight Design: With a folded size of just 43 cm (17 inches) and a net weight of 0.45 kg, it\'s perfect for travel and on-the-go photography.',
            'Adjustable 4-Section Aluminum Legs: Quickly extend and retract the legs from 43 cm (17 inches) to 106 cm (41 inches) using smooth leg locks.',
            'Non-Slip Rubber Leg Bases: Provides superior grip and stability on various surfaces, preventing accidental slips.',
            'Wide Compatibility: Features a universal 1/4" screw quick-release plate and an adjustable phone clip, making it suitable for most cameras and mobile devices.',
            'Integrated Bubble Level: Helps achieve perfect balance and precise alignment for consistently professional shots.'
        ],
        'specifications': [],
    },
    {
        'name': 'Electronic Tally Counter – Manual Digital Finger Counter',
        'category': 'Electronics',
        'brand': 'DeoDap',
        'price': 99,
        'discount_price': 99,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/products/6_bd7933cc-9ca8-42fe-b3fa-cce36ea9f918.jpg?v=1750999630&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/products/6_bd7933cc-9ca8-42fe-b3fa-cce36ea9f918.jpg?v=1750999630&width=1100',
            'https://deodap.in/cdn/shop/products/7_7da8be7e-c7e8-48ac-90bb-dd94e795c570.jpg?v=1750999630&width=1100',
            'https://deodap.in/cdn/shop/products/2_32412b09-d927-40fb-9123-e3fb49b472b6.jpg?v=1750999630&width=600'
        ],
        'description': 'Finger Ring Design: Ergonomically designed adjustable ring allows for comfortable, hands-free operation.\n\nQuick Response Button: Mechanically jumps with every press, ensuring precise and rapid counting.\n\nInstant Reset Function: A dedicated button allows you to quickly clear the count to zero for new tasks.\n\nPortable & Lightweight: Small and compact, it\'s ideal for carrying anywhere you need to count.\n\nDurable Construction: Crafted from robust plastic for long-lasting performance\n\nDigital Display: Clear LCD screen provides instant, easy-to-read numeric feedback.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Finger Ring Design: Ergonomically designed adjustable ring allows for comfortable, hands-free operation.',
            'Quick Response Button: Mechanically jumps with every press, ensuring precise and rapid counting.',
            'Instant Reset Function: A dedicated button allows you to quickly clear the count to zero for new tasks.',
            'Portable & Lightweight: Small and compact, it\'s ideal for carrying anywhere you need to count.',
            'Durable Construction: Crafted from robust plastic for long-lasting performance',
            'Digital Display: Clear LCD screen provides instant, easy-to-read numeric feedback.'
        ],
        'specifications': [],
    },
    {
        'name': 'Suction Phone Holder Mount – Silicone Grip, Mix Colors',
        'category': 'Mobile Accessories',
        'brand': 'DeoDap',
        'price': 59,
        'discount_price': 59,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/03_a3d63e40-d17f-4fa0-9b27-6df7fd4730de.jpg?v=1766728824&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/03_a3d63e40-d17f-4fa0-9b27-6df7fd4730de.jpg?v=1766728824&width=1100',
            'https://deodap.in/cdn/shop/files/11_874c3309-851d-40a8-ad82-0099289ff9ad.webp?v=1766728824&width=1100',
            'https://deodap.in/cdn/shop/files/15.webp?v=1766728824&width=600',
            'https://deodap.in/cdn/shop/files/22.webp?v=1766728736&width=600'
        ],
        'description': 'Strong Silicone Suction: Provides a secure hold on your phone to prevent slips or drops.\n\nMulti-Surface Mounting: Easily attaches to dashboards, windshields, mirrors, and other flat surfaces.\n\nIncluded Adhesive Pad: Specially designed for iPhones, ensuring extra stability during use.\n\nClear Design: Transparent sticker blends seamlessly without distracting from your device\'s look.\n\nDurable Material: Crafted with premium silicone to offer long-lasting, sturdy performance.\n\nContent Creator Friendly: Ideal accessory for bloggers, vloggers, and social media enthusiasts.\n\nQuick Setup: Peel and stick installation for immediate use without tools',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Strong Silicone Suction: Provides a secure hold on your phone to prevent slips or drops.',
            'Multi-Surface Mounting: Easily attaches to dashboards, windshields, mirrors, and other flat surfaces.',
            'Included Adhesive Pad: Specially designed for iPhones, ensuring extra stability during use.',
            'Clear Design: Transparent sticker blends seamlessly without distracting from your device\'s look.',
            'Durable Material: Crafted with premium silicone to offer long-lasting, sturdy performance.',
            'Content Creator Friendly: Ideal accessory for bloggers, vloggers, and social media enthusiasts.',
            'Quick Setup: Peel and stick installation for immediate use without tools'
        ],
        'specifications': [],
    },
    {
        'name': 'Earphone Carrying Case – Cute Round Multi-Use Pouch',
        'category': 'Mobile Accessories',
        'brand': 'DeoDap',
        'price': 59,
        'discount_price': 59,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/01_d8b84c35-b29a-4fed-965e-a163944dce95.jpg?v=1737627657&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/01_d8b84c35-b29a-4fed-965e-a163944dce95.jpg?v=1737627657&width=990',
            'https://deodap.in/cdn/shop/files/02_33f7478b-d8aa-4216-a81b-05ee85cce5c6.jpg?v=1737627658&width=1100',
            'https://deodap.in/cdn/shop/files/03_aa901b6d-c3fa-47fe-9bac-71dc592e0ba9.jpg?v=1737627658&width=600'
        ],
        'description': '**Triple Protection:** Engineered with shock-proof, water-proof, and anti-theft features to safeguard your earphones and accessories from daily wear and tear.\n\n**Premium Build:** Made from high-quality, smooth fabric that is both durable and pleasant to touch, ensuring longevity.\n\n**Lightweight & Portable:** Designed to be light and attractive, this round pocket pouch is incredibly easy to carry anywhere you go.\n\n**Spacious Interior:** Generous enough to comfortably hold earphones, headphones, data cables, chargers, AirPods, and even loose coins or pen drives.\n\n**Vibrant & Stylish:** Available in a mix of colourful designs, adding a touch of personality to your everyday essentials.\n\n**Versatile Use:** Perfect as an earphone case organizer, a coin pouch, or a mini storage solution for various small electronic accessories.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            '**Triple Protection:** Engineered with shock-proof, water-proof, and anti-theft features to safeguard your earphones and accessories from daily wear and tear.',
            '**Premium Build:** Made from high-quality, smooth fabric that is both durable and pleasant to touch, ensuring longevity.',
            '**Lightweight & Portable:** Designed to be light and attractive, this round pocket pouch is incredibly easy to carry anywhere you go.',
            '**Spacious Interior:** Generous enough to comfortably hold earphones, headphones, data cables, chargers, AirPods, and even loose coins or pen drives.',
            '**Vibrant & Stylish:** Available in a mix of colourful designs, adding a touch of personality to your everyday essentials.',
            '**Versatile Use:** Perfect as an earphone case organizer, a coin pouch, or a mini storage solution for various small electronic accessories.'
        ],
        'specifications': [],
    },
    {
        'name': 'Spiral Cable Protector Sleeve – Durable Flexible Cord Saver',
        'category': 'Mobile Accessories',
        'brand': 'DeoDap',
        'price': 59,
        'discount_price': 59,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/91b9af21-7986-4827-ba11-f497894f49d6.jpg?v=1783334803&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/91b9af21-7986-4827-ba11-f497894f49d6.jpg?v=1783334803&width=990',
            'https://deodap.in/cdn/shop/files/BrownSpiralCableProtector-03.jpg?v=1776403856&width=1100',
            'https://deodap.in/cdn/shop/files/SpiralChargerCableProtector-03.jpg?v=1776507607&width=600',
            'https://deodap.in/cdn/shop/files/BrownSpiralCableProtector-live.jpg?v=1776403856&width=600'
        ],
        'description': 'Flexible spiral design guards cables against bending and fraying\n\nExtends cable life by preventing breakage at joints\n\nSimple installation and removal without any tools required\n\nLightweight and compact, perfect for home or travel use\n\nReusable and compatible with most charging and data cables\n\nMix color options add a practical touch of style and organization',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Flexible spiral design guards cables against bending and fraying',
            'Extends cable life by preventing breakage at joints',
            'Simple installation and removal without any tools required',
            'Lightweight and compact, perfect for home or travel use',
            'Reusable and compatible with most charging and data cables',
            'Mix color options add a practical touch of style and organization'
        ],
        'specifications': [],
    },
    {
        'name': 'Gold Finish Jhumka Earrings – Traditional Indian Handcrafted Design',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 59,
        'discount_price': 59,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/M57Or1D6mF.jpg?v=1767443262&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/M57Or1D6mF.jpg?v=1767443262&width=1100',
            'https://deodap.in/cdn/shop/files/qkTXFI4XTx.jpg?v=1767443262&width=1100',
            'https://deodap.in/cdn/shop/files/t9aTe5nBdm.png?v=1767443263&width=600'
        ],
        'description': 'Handcrafted Artistry: Intricately designed with fine oxidized silver detailing for a traditional look.\n\nDual Tone Elegance: Combines rich gold-tone ghungroo beads with oxidized silver for a stunning visual appeal.\n\nLightweight Comfort: Designed for prolonged wear at weddings, festivals, or daily ethnic styling.\n\nVersatile Accessory: Complements a wide range of traditional and contemporary ethnic outfits.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Handcrafted Artistry: Intricately designed with fine oxidized silver detailing for a traditional look.',
            'Dual Tone Elegance: Combines rich gold-tone ghungroo beads with oxidized silver for a stunning visual appeal.',
            'Lightweight Comfort: Designed for prolonged wear at weddings, festivals, or daily ethnic styling.',
            'Versatile Accessory: Complements a wide range of traditional and contemporary ethnic outfits.'
        ],
        'specifications': [],
    },
    {
        'name': 'Oxidised Silver Geometric Jhumka Earrings – Perfect for Festive Wear',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 69,
        'discount_price': 69,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/QpCeKjTta0.png?v=1780752070&width=600',
        'images': [
            'https://deodap.in/cdn/shop/files/QpCeKjTta0.png?v=1780752070&width=600',
            'https://deodap.in/cdn/shop/files/AWWoGem2iB.png?v=1780752070&width=1100',
            'https://deodap.in/cdn/shop/files/SEve5JEOfb.png?v=1780752070&width=1100'
        ],
        'description': 'Beautiful geometric design with traditional patterns\n\nPremium antique finish enhances vintage appeal\n\nLightweight and comfortable for extended wear\n\nVersatile styling with sarees, kurtis, lehengas & casual outfits\n\nPerfect accessory for weddings & festival celebrations',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Beautiful geometric design with traditional patterns',
            'Premium antique finish enhances vintage appeal',
            'Lightweight and comfortable for extended wear',
            'Versatile styling with sarees, kurtis, lehengas & casual outfits',
            'Perfect accessory for weddings & festival celebrations'
        ],
        'specifications': [],
    },
    {
        'name': 'Oxidised Jhumka Earrings Peacock Dual Stone Statement for Women',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 79,
        'discount_price': 79,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/Je36jZmVG7.png?v=1782563208&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/Je36jZmVG7.png?v=1782563208&width=990',
            'https://deodap.in/cdn/shop/files/lW6D4zGuPZ.png?v=1782563208&width=1100',
            'https://deodap.in/cdn/shop/files/vCpKjlnhPj.png?v=1782563209&width=1100'
        ],
        'description': 'Elegant peacock motifs with intricate tribal detailing\n\nVibrant red and green dual stone embellishments\n\nCharming dangling bead accents for added flair\n\nCrafted in a stylish oxidised silver-tone finish\n\nLightweight design ensures comfortable wear all day long\n\nVersatile for festive occasions, weddings, and casual ethnic outfits',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Elegant peacock motifs with intricate tribal detailing',
            'Vibrant red and green dual stone embellishments',
            'Charming dangling bead accents for added flair',
            'Crafted in a stylish oxidised silver-tone finish',
            'Lightweight design ensures comfortable wear all day long',
            'Versatile for festive occasions, weddings, and casual ethnic outfits'
        ],
        'specifications': [],
    },
    {
        'name': 'Traditional silver peacock jhumka earrings – Elegant tribal design',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 69,
        'discount_price': 69,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/1SATZLKBX1.png?v=1772447942&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/1SATZLKBX1.png?v=1772447942&width=990',
            'https://deodap.in/cdn/shop/files/l7etMH0kiM.png?v=1772447942&width=600',
            'https://deodap.in/cdn/shop/files/VHg7viVjQn.png?v=1772447941&width=600'
        ],
        'description': 'Oxidized silver finish with detailed tribal-inspired carvings\n\nVibrant peacock-eye stone centerpiece\n\nClassic jhumka bell with hanging beads for graceful movement\n\nLightweight and comfortable for regular wear\n\nPerfect for festive, ethnic, and statement occasions\n\nHigh-quality craftsmanship with durable materials',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Oxidized silver finish with detailed tribal-inspired carvings',
            'Vibrant peacock-eye stone centerpiece',
            'Classic jhumka bell with hanging beads for graceful movement',
            'Lightweight and comfortable for regular wear',
            'Perfect for festive, ethnic, and statement occasions',
            'High-quality craftsmanship with durable materials'
        ],
        'specifications': [],
    },
    {
        'name': 'Oxidised Mirror Work Drop Earrings – Lightweight Ethnic Design',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 59,
        'discount_price': 59,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/1C1i8rpo1A.jpg?v=1767443262&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/1C1i8rpo1A.jpg?v=1767443262&width=990',
            'https://deodap.in/cdn/shop/files/V4nScNqIAQ.jpg?v=1767443262&width=1100',
            'https://deodap.in/cdn/shop/files/ADnK4SKBXx.png?v=1767443263&width=600'
        ],
        'description': 'Oxidised silver finish with an antique look\n\nElegant round mirror work accentuating ethnic design\n\nDelicately carved with traditional motifs and ghungroo drops\n\nLightweight construction for all-day comfort\n\nSecure push back closure ensuring ease of wear',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Oxidised silver finish with an antique look',
            'Elegant round mirror work accentuating ethnic design',
            'Delicately carved with traditional motifs and ghungroo drops',
            'Lightweight construction for all-day comfort',
            'Secure push back closure ensuring ease of wear'
        ],
        'specifications': [],
    },
    {
        'name': 'White Pearl Kaan Chain – Secure Support for Heavy Earrings',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/L76MuX1Mf8.png?v=1767781830&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/L76MuX1Mf8.png?v=1767781830&width=990',
            'https://deodap.in/cdn/shop/files/v38sEuXbiZ.jpg?v=1767781830&width=600',
            'https://deodap.in/cdn/shop/files/4zA9CkrbDO.jpg?v=1767781830&width=600'
        ],
        'description': 'Front-load primary keyword in first sentence: White Pearl Kaan Chain\n\nElegant design complements ethnic and wedding wear\n\nOffers strong support for heavy earrings to prevent discomfort\n\nMade from high-quality, lustrous white pearls for a classic look\n\nSuitable for festivals, weddings, and traditional celebrations\n\nLightweight and comfortable for extended wear\n\nEnhances overall traditional aesthetic with a subtle shine',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Front-load primary keyword in first sentence: White Pearl Kaan Chain',
            'Elegant design complements ethnic and wedding wear',
            'Offers strong support for heavy earrings to prevent discomfort',
            'Made from high-quality, lustrous white pearls for a classic look',
            'Suitable for festivals, weddings, and traditional celebrations',
            'Lightweight and comfortable for extended wear',
            'Enhances overall traditional aesthetic with a subtle shine'
        ],
        'specifications': [],
    },
    {
        'name': 'Gold Plated Triple Strand Ear Chains – Multi-Color Stones for Weddings',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 179,
        'discount_price': 179,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/z0GZLpr8v7.png?v=1767086017&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/z0GZLpr8v7.png?v=1767086017&width=990',
            'https://deodap.in/cdn/shop/files/EPNBGsINd5.png?v=1767086017&width=1100',
            'https://deodap.in/cdn/shop/files/tU2DrAjtBW.png?v=1767086017&width=1100'
        ],
        'description': 'Three-layer tiered design combining gold chains and micro beads for textured beauty\n\nOuter layer adorned with bezel-set sparkling round multi-color stones (CZ/American Diamonds)\n\nDelicate gold-toned micro bead inner layers add rich contrast and shimmer\n\nHigh-quality micro gold plating ensures lasting shine and a premium finish\n\nSecure S-hook and circular loop fastenings for easy attachment to earrings or hair\n\nVersatile accessory that enhances wedding, party, and festive celebration outfits',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Three-layer tiered design combining gold chains and micro beads for textured beauty',
            'Outer layer adorned with bezel-set sparkling round multi-color stones (CZ/American Diamonds)',
            'Delicate gold-toned micro bead inner layers add rich contrast and shimmer',
            'High-quality micro gold plating ensures lasting shine and a premium finish',
            'Secure S-hook and circular loop fastenings for easy attachment to earrings or hair',
            'Versatile accessory that enhances wedding, party, and festive celebration outfits'
        ],
        'specifications': [],
    },
    {
        'name': 'Elegant Traditional Pearl & Stone Embellished Jhumkas',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 149,
        'discount_price': 149,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/6Uxbikucq5.png?v=1783682216&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/6Uxbikucq5.png?v=1783682216&width=1100',
            'https://deodap.in/cdn/shop/files/SuNRjNCkvd.png?v=1783682216&width=1100',
            'https://deodap.in/cdn/shop/files/E1c380frhl.png?v=1783682216&width=1100',
            'https://deodap.in/cdn/shop/files/EBjM1QpK6Z.png?v=1783682216&width=600'
        ],
        'description': 'Intricate Design: Featuring a classic bell-shaped Jhumka design, these earrings are adorned with shimmering pearls and vibrant red and green stones.\n\nRich Detailing: The top circular stud is delicately encircled with pearls and a central stone, perfectly complementing the ornate bell base.\n\nPerfect Finish: Finished in a beautiful antique gold tone, these earrings offer a sophisticated, regal look suitable for weddings, festive occasions, or cultural events.\n\nVersatile Styling: The classic color palette of pearls, red, and green makes these earrings a versatile addition to your jewelry collection, pairing effortlessly with sarees, lehengas, or kurtis.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Intricate Design: Featuring a classic bell-shaped Jhumka design, these earrings are adorned with shimmering pearls and vibrant red and green stones.',
            'Rich Detailing: The top circular stud is delicately encircled with pearls and a central stone, perfectly complementing the ornate bell base.',
            'Perfect Finish: Finished in a beautiful antique gold tone, these earrings offer a sophisticated, regal look suitable for weddings, festive occasions, or cultural events.',
            'Versatile Styling: The classic color palette of pearls, red, and green makes these earrings a versatile addition to your jewelry collection, pairing effortlessly with sarees, lehengas, or kurtis.'
        ],
        'specifications': [],
    },
    {
        'name': 'Red Lotus Necklace Set – Adjustable Thread Ethnic Jewellery',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/01_013e56c9-566e-46fa-b6b1-db99bd2d6fba.jpg?v=1783749748&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/01_013e56c9-566e-46fa-b6b1-db99bd2d6fba.jpg?v=1783749748&width=1100',
            'https://deodap.in/cdn/shop/files/02_a8761339-60b3-43ad-afc6-f94db9b48dfc.jpg?v=1783749749&width=1100',
            'https://deodap.in/cdn/shop/files/03_496c0d45-0cdd-4632-8c01-8784ad22d4d1.jpg?v=1783749749&width=600'
        ],
        'description': 'Coordinated necklace and stud earrings set\n\nClassic red lotus flower motif for cultural elegance\n\nAdjustable thread closure for customizable sizing\n\nLightweight design for all-day comfort\n\nPerfect for festivals, pooja ceremonies, and weddings\n\nEthnic styling complements traditional attire\n\nReady-to-wear festive jewellery set',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Coordinated necklace and stud earrings set',
            'Classic red lotus flower motif for cultural elegance',
            'Adjustable thread closure for customizable sizing',
            'Lightweight design for all-day comfort',
            'Perfect for festivals, pooja ceremonies, and weddings',
            'Ethnic styling complements traditional attire',
            'Ready-to-wear festive jewellery set'
        ],
        'specifications': [],
    },
    {
        'name': 'Ruby floral necklace – Elegant jewelry with diamond accents',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/DhFOMGqzrJ.jpg?v=1773807076&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/DhFOMGqzrJ.jpg?v=1773807076&width=1100',
            'https://deodap.in/cdn/shop/files/6Jnjwopn26.jpg?v=1773807086&width=600',
            'https://deodap.in/cdn/shop/files/UcFRUf7H4G.jpg?v=1773807086&width=600'
        ],
        'description': 'Exquisite floral design with delicate craftsmanship\n\nHighlighted with subtle red stone accents\n\nFeatures sparkling diamond detailing for added elegance\n\nLightweight and comfortable for all-day wear\n\nPerfect for elevating casual and festive outfits',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Exquisite floral design with delicate craftsmanship',
            'Highlighted with subtle red stone accents',
            'Features sparkling diamond detailing for added elegance',
            'Lightweight and comfortable for all-day wear',
            'Perfect for elevating casual and festive outfits'
        ],
        'specifications': [],
    },
    {
        'name': 'Gold Heart Pendant Necklace – Minimalist Love Charm for Women',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/Rk3zYatQie.jpg?v=1770641273&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/Rk3zYatQie.jpg?v=1770641273&width=990',
            'https://deodap.in/cdn/shop/files/nprb9LvHjm.jpg?v=1770641273&width=1100',
            'https://deodap.in/cdn/shop/files/8CZG0byTAN.jpg?v=1770641273&width=1100',
            'https://deodap.in/cdn/shop/files/hocJeuhiqK.jpg?v=1770641273&width=600'
        ],
        'description': 'Timeless gold heart pendant necklace showcasing minimalist charm.\n\nDelicate gold-toned chain with a smooth, polished heart pendant.\n\nLightweight design ensures comfort during all-day wear.\n\nIdeal for daily wear, special occasions, or as a romantic gift.\n\nVersatile accessory that pairs well with various styles.\n\nSymbolizes love, making it meaningful for all occasions.\n\nStainless craftsmanship for lasting shine and durability.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Timeless gold heart pendant necklace showcasing minimalist charm.',
            'Delicate gold-toned chain with a smooth, polished heart pendant.',
            'Lightweight design ensures comfort during all-day wear.',
            'Ideal for daily wear, special occasions, or as a romantic gift.',
            'Versatile accessory that pairs well with various styles.',
            'Symbolizes love, making it meaningful for all occasions.',
            'Stainless craftsmanship for lasting shine and durability.'
        ],
        'specifications': [],
    },
    {
        'name': 'Gold Chain Black Stone Necklace – Minimal Elegant Jewelry for Daily Wear',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 99,
        'discount_price': 99,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/rk9ginBetj.jpg?v=1781687767&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/rk9ginBetj.jpg?v=1781687767&width=990',
            'https://deodap.in/cdn/shop/files/B6PeR1XSZZ.jpg?v=1781687766&width=1100',
            'https://deodap.in/cdn/shop/files/Y2Y11101po.jpg?v=1781687766&width=600',
            'https://deodap.in/cdn/shop/files/uoiH9fCKvf.jpg?v=1781687766&width=600'
        ],
        'description': 'Gold chain with a minimalistic design\n\nBlack stone accents for an elegant touch\n\nLightweight and comfortable to wear all day\n\nModern, stylish look suitable for daily fashion\n\nSkin-friendly finish for sensitive skin',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Gold chain with a minimalistic design',
            'Black stone accents for an elegant touch',
            'Lightweight and comfortable to wear all day',
            'Modern, stylish look suitable for daily fashion',
            'Skin-friendly finish for sensitive skin'
        ],
        'specifications': [],
    },
    {
        'name': 'Antique Temple Gold Jhumka Earrings – Intricate Floral Design, Festive Wear',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 249,
        'discount_price': 249,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/jE0H9OkyMO.jpg?v=1772861278&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/jE0H9OkyMO.jpg?v=1772861278&width=1100',
            'https://deodap.in/cdn/shop/files/FxelRCaBZL_dd2cdefc-3814-40ea-976e-49e3fb66a01a.jpg?v=1772861278&width=1100',
            'https://deodap.in/cdn/shop/files/vMCxvX4ZhB.jpg?v=1772861278&width=600'
        ],
        'description': 'Intricately handcrafted floral motifs and detailed filigree work\n\nVibrant ruby and emerald-toned stones enhancing traditional design\n\nSet of 4 versatile earrings suitable for various occasions\n\nMade with high-quality gold plating ensuring lasting shine\n\nPerfect for bridal, festive, and cultural celebrations',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Intricately handcrafted floral motifs and detailed filigree work',
            'Vibrant ruby and emerald-toned stones enhancing traditional design',
            'Set of 4 versatile earrings suitable for various occasions',
            'Made with high-quality gold plating ensuring lasting shine',
            'Perfect for bridal, festive, and cultural celebrations'
        ],
        'specifications': [],
    },
    {
        'name': 'Radha Krishna Antique Gold Earrings – Traditional South Indian Design',
        'category': 'Jewellery',
        'brand': 'DeoDap',
        'price': 149,
        'discount_price': 149,
        'rating': 0,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/mh3br2c1rb.jpg?v=1779800797&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/mh3br2c1rb.jpg?v=1779800797&width=990',
            'https://deodap.in/cdn/shop/files/vbTYSIXPEw.jpg?v=1779800797&width=1100',
            'https://deodap.in/cdn/shop/files/zni9HotvXK.jpg?v=1779800797&width=600'
        ],
        'description': 'Traditional Radha Krishna motifs & floral detailing\n\nRich maroon beads for a vibrant splash of color\n\nElegant vintage antique gold finish\n\nLightweight design for comfortable all-day wear\n\nVersatile style with ethnic outfits and festive wear\n\nPerfect for special occasions like weddings and festivals',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Traditional Radha Krishna motifs & floral detailing',
            'Rich maroon beads for a vibrant splash of color',
            'Elegant vintage antique gold finish',
            'Lightweight design for comfortable all-day wear',
            'Versatile style with ethnic outfits and festive wear',
            'Perfect for special occasions like weddings and festivals'
        ],
        'specifications': [],
    },
]

created_count = 0
for prod_data in PRODUCTS_DATA:
    if not Product.objects.filter(name=prod_data['name']).exists():
        Product.objects.create(seller=seller, **prod_data)
        created_count += 1
        print(f"  Created: {prod_data['name']} [{prod_data['category']}] - INR {prod_data['price']}")
    else:
        print(f"  Skipped (already exists): {prod_data['name']}")

print(f"\nSuccessfully populated {created_count} new products!")

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

PRODUCTS_DATA = [
    {
        'name': 'Adjustable Pink Bunny Ear Phone Stand – Cute & Stable Desk Accessory',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 80,
        'discount_price': 80,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/pCEjADZWTa.jpg?v=1774000583&width=600',
        'images': [
            'https://deodap.in/cdn/shop/files/pCEjADZWTa.jpg?v=1774000583&width=600',
            'https://deodap.in/cdn/shop/files/YBizvF0ArL.png?v=1774000583&width=600',
            'https://deodap.in/cdn/shop/files/QWHNZzr6V1.png?v=1774000583&width=600'
        ],
        'description': 'Cute Bunny Ear Design: Adds a charming and decorative element to your workspace.\n\nStable Base Support: Provides reliable stability, securely holding your phone in place.\n\nAdjustable Viewing Angle: Flexible design for comfortable use during video calls or content browsing.\n\nUniversal Compatibility: Suitable for most smartphones and small devices.\n\nCompact & Lightweight: Easy to relocate and ideal for small spaces like desks and bedside tables.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Cute Bunny Ear Design: Adds a charming and decorative element to your workspace.',
            'Stable Base Support: Provides reliable stability, securely holding your phone in place.',
            'Adjustable Viewing Angle: Flexible design for comfortable use during video calls or content browsing.',
            'Universal Compatibility: Suitable for most smartphones and small devices.',
            'Compact & Lightweight: Easy to relocate and ideal for small spaces like desks and bedside tables.'
        ],
        'specifications': [],
    },
    {
        'name': 'Unicorn Coin Pouch – Cute Round Zipper Wallet for Kids',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 70,
        'discount_price': 70,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/6v6sPqS1yB.jpg?v=1767676376&width=1946',
        'images': [
            'https://deodap.in/cdn/shop/files/6v6sPqS1yB.jpg?v=1767676376&width=1946',
            'https://deodap.in/cdn/shop/files/1S44FgMgB2.png?v=1767676376&width=600',
            'https://deodap.in/cdn/shop/files/zGpfgxSXil.png?v=1767676376&width=600'
        ],
        'description': 'Charming pastel unicorn print popular with kids\n\nCompact round shape ideal for coins and small accessories\n\nDurable zipper closure secures items safely inside\n\nConvenient wrist strap for easy carrying on the go\n\nLightweight design great for school or travel\n\nPerfect gift choice for children who love unicorns',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Charming pastel unicorn print popular with kids',
            'Compact round shape ideal for coins and small accessories',
            'Durable zipper closure secures items safely inside',
            'Convenient wrist strap for easy carrying on the go',
            'Lightweight design great for school or travel',
            'Perfect gift choice for children who love unicorns'
        ],
        'specifications': [],
    },
    {
        'name': 'Hair Clips Set – Cute 4 Pc Cartoon Style Pins with Strong Grip',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 40,
        'discount_price': 40,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/CutemultiHairclip-WOSKU-01.jpg?v=1770702718&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/CutemultiHairclip-WOSKU-01.jpg?v=1770702718&width=990',
            'https://deodap.in/cdn/shop/files/CutemultiHairclip-WSKU-01.jpg?v=1770702718&width=1100',
            'https://deodap.in/cdn/shop/files/CutemultiHairclip-03.jpg?v=1770800634&width=600',
            'https://deodap.in/cdn/shop/files/CutemultiHairclip-02.jpg?v=1770702718&width=1100'
        ],
        'description': 'Includes 4 unique cartoon-style pins with fun designs\n\nStrong grip that holds hair firmly without pulling\n\nLightweight and comfortable for everyday use\n\nEasy to clip on and remove without hassle\n\nSuitable for all hair types and versatile occasions\n\nDurable and reusable for repeated styling\n\nPerfect for styling bangs, side hair, or small sections',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Includes 4 unique cartoon-style pins with fun designs',
            'Strong grip that holds hair firmly without pulling',
            'Lightweight and comfortable for everyday use',
            'Easy to clip on and remove without hassle',
            'Suitable for all hair types and versatile occasions',
            'Durable and reusable for repeated styling',
            'Perfect for styling bangs, side hair, or small sections'
        ],
        'specifications': [],
    },
    {
        'name': 'Pet Hair Remover – Double-Sided Self-Cleaning Brush | Waggy Tales',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 119,
        'discount_price': 119,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/4_c5ff4b75-46d2-4fa0-8f2c-98d08b270ae3_1.jpg?v=1737628660&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/4_c5ff4b75-46d2-4fa0-8f2c-98d08b270ae3_1.jpg?v=1737628660&width=1100',
            'https://deodap.in/cdn/shop/files/04708fa1-662b-40ea-88a8-27a4bd39463a.jpg?v=1737628660&width=1100',
            'https://deodap.in/cdn/shop/files/6_4b3bfac5-4952-467a-9a4e-2b825f8429e4.jpg?v=1737628660&width=1100',
            'https://deodap.in/cdn/shop/files/5_d8b0243d-e601-41a0-8018-f0faedd5ecf1.jpg?v=1737628660&width=600'
        ],
        'description': 'Double-Sided Efficiency: Quickly removes pet fur from clothes, upholstery, and carpets with a single sweep, covering more area in less time.\n\nSelf-Cleaning Base: Features an integrated self-cleaning base that effortlessly removes collected fur from the brush, readying it for the next use.\n\nReusable & Eco-Friendly: A sustainable alternative to disposable lint rollers, requiring no refills, batteries, or power.\n\nVersatile Application: Effectively picks up dog and cat hair from a wide range of surfaces including clothing, sofas, beds, car interiors, and rugs.\n\nCompact & Portable: Lightweight and easy to store, making it perfect for both home use and travel, ensuring you\'re always prepared for pet hair emergencies.\n\nDurable Construction: Built with high-quality materials to withstand repeated use, providing a long-lasting solution for pet hair removal',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Double-Sided Efficiency: Quickly removes pet fur from clothes, upholstery, and carpets with a single sweep, covering more area in less time.',
            'Self-Cleaning Base: Features an integrated self-cleaning base that effortlessly removes collected fur from the brush, readying it for the next use.',
            'Reusable & Eco-Friendly: A sustainable alternative to disposable lint rollers, requiring no refills, batteries, or power.',
            'Versatile Application: Effectively picks up dog and cat hair from a wide range of surfaces including clothing, sofas, beds, car interiors, and rugs.',
            'Compact & Portable: Lightweight and easy to store, making it perfect for both home use and travel, ensuring you\'re always prepared for pet hair emergencies.',
            'Durable Construction: Built with high-quality materials to withstand repeated use, providing a long-lasting solution for pet hair removal'
        ],
        'specifications': [],
    },
    {
        'name': 'Flexible USB LED Light – Portable Laptop Study Lamp',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 49,
        'discount_price': 49,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/PE-lamp-computer-3.jpg?v=1776327700&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/PE-lamp-computer-3.jpg?v=1776327700&width=1100',
            'https://deodap.in/cdn/shop/files/sku_b48e86ed-bbc8-4ad3-8439-f9cd35f085ce.jpg?v=1776327739&width=1100',
            'https://deodap.in/cdn/shop/files/PE-lamp-computer-5.jpg?v=1776327739&width=600',
            'https://deodap.in/cdn/shop/files/PE-lamp-computer-8.jpg?v=1776327739&width=600'
        ],
        'description': 'Adjustable Flexible Neck: Effortlessly position this flexible USB LED light for precise, targeted illumination on your keyboard, notes, or reading material.\n\nUSB Powered Convenience: Simply plug into any USB port on your laptop, power bank, or adapter – no batteries required, ensuring continuous and reliable lighting.\n\nEnergy-Efficient Soft Light: Emits a gentle, non-flickering light that helps reduce eye strain during prolonged use, promoting better focus and comfort.\n\nUltra-Portable & Lightweight: Designed for travel, its compact size and minimal weight make it an ideal companion for students and professionals on the move.\n\nVersatile Use: Perfect as a laptop light, a study lamp, or a portable task light for any USB-compatible device, enhancing visibility wherever you are.\n\nDurable Construction: Crafted from robust materials to withstand daily use, providing long-lasting performance and flexibility.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Adjustable Flexible Neck: Effortlessly position this flexible USB LED light for precise, targeted illumination on your keyboard, notes, or reading material.',
            'USB Powered Convenience: Simply plug into any USB port on your laptop, power bank, or adapter – no batteries required, ensuring continuous and reliable lighting.',
            'Energy-Efficient Soft Light: Emits a gentle, non-flickering light that helps reduce eye strain during prolonged use, promoting better focus and comfort.',
            'Ultra-Portable & Lightweight: Designed for travel, its compact size and minimal weight make it an ideal companion for students and professionals on the move.',
            'Versatile Use: Perfect as a laptop light, a study lamp, or a portable task light for any USB-compatible device, enhancing visibility wherever you are.',
            'Durable Construction: Crafted from robust materials to withstand daily use, providing long-lasting performance and flexibility.'
        ],
        'specifications': [],
    },
    {
        'name': 'Kids Lunch Box – Cute Cat Design with Multi-Compartment Storage',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/13VC16yQOo.jpg?v=1766999254&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/13VC16yQOo.jpg?v=1766999254&width=990',
            'https://deodap.in/cdn/shop/files/lH9gubXKBK.jpg?v=1766999254&width=1100',
            'https://deodap.in/cdn/shop/files/4d4VcaEhiW.jpg?v=1766999254&width=1100',
            'https://deodap.in/cdn/shop/files/NlMI04wmYN.jpg?v=1766999254&width=600'
        ],
        'description': 'Adorable cat print with fun whisker details and bright orange and white colours that kids love\n\nMultiple compartments to keep snacks and meals neatly separated and fresh\n\nSecure snap-lock closure to prevent spills and keep food safely enclosed during travel\n\nCompact, lightweight design ideal for easy carrying by children\n\nMade from food-grade, easy-to-clean, BPA-free plastic for daily use\n\nSuitable for school lunches, picnics, and snack storage',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Adorable cat print with fun whisker details and bright orange and white colours that kids love',
            'Multiple compartments to keep snacks and meals neatly separated and fresh',
            'Secure snap-lock closure to prevent spills and keep food safely enclosed during travel',
            'Compact, lightweight design ideal for easy carrying by children',
            'Made from food-grade, easy-to-clean, BPA-free plastic for daily use',
            'Suitable for school lunches, picnics, and snack storage'
        ],
        'specifications': [],
    },
    {
        'name': 'Nail Art Sticker Set – Easy DIY Creative Manicure Kit',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 69,
        'discount_price': 69,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/02_nailart.jpg?v=1777465298&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/02_nailart.jpg?v=1777465298&width=990',
            'https://deodap.in/cdn/shop/files/sku_8e1afce2-185f-4827-8819-8da6f3e675b2.jpg?v=1777465298&width=1100',
            'https://deodap.in/cdn/shop/files/03_nailart.jpg?v=1777465298&width=1100',
            'https://deodap.in/cdn/shop/files/04_nailart.jpg?v=1777465299&width=600'
        ],
        'description': 'Attractive cartoon nail sticker designs for stylish nails\n\nEasy peel-and-apply application for quick use\n\nIncludes applicator tool for precise placement\n\nSuitable for DIY nail art at home\n\nLightweight and travel-friendly packaging\n\nPerfect for beginners and professionals alike\n\nInstantly enhances nail appearance',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Attractive cartoon nail sticker designs for stylish nails',
            'Easy peel-and-apply application for quick use',
            'Includes applicator tool for precise placement',
            'Suitable for DIY nail art at home',
            'Lightweight and travel-friendly packaging',
            'Perfect for beginners and professionals alike',
            'Instantly enhances nail appearance'
        ],
        'specifications': [],
    },
    {
        'name': 'Ice Cream Themed Water Bottle – 1300ML Large Capacity Leakproof Sipper',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 269,
        'discount_price': 269,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/01_8a579727-5a3f-46e6-95b6-375cd62ccb53.jpg?v=1751955138&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/01_8a579727-5a3f-46e6-95b6-375cd62ccb53.jpg?v=1751955138&width=990',
            'https://deodap.in/cdn/shop/files/3b7e92ed-7a28-4603-83c8-9e7f8e7f7156.jpg?v=1751955138&width=1100',
            'https://deodap.in/cdn/shop/files/04_05e963d9-40b1-4875-a88a-aed0378612c3.jpg?v=1751955138&width=600',
            'https://deodap.in/cdn/shop/files/05_4f6df7df-4a57-4890-a1a5-b22e8828a475.jpg?v=1751955138&width=600'
        ],
        'description': 'Adorable ice cream-inspired design with playful printed details\n\nSpacious 1300ML capacity to keep you refreshed throughout the day\n\nIntegrated fruit infuser core to naturally enhance your water with fresh flavours\n\nSoft silicone straw with flip-top lid for easy and convenient sipping\n\nErgonomic side handle for comfortable carrying on the go\n\nMade from high-quality BPA-free plastic, ensuring safety and durability\n\nLeakproof and spill-resistant, ideal for bags, desks, school, gym, or travel',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Adorable ice cream-inspired design with playful printed details',
            'Spacious 1300ML capacity to keep you refreshed throughout the day',
            'Integrated fruit infuser core to naturally enhance your water with fresh flavours',
            'Soft silicone straw with flip-top lid for easy and convenient sipping',
            'Ergonomic side handle for comfortable carrying on the go',
            'Made from high-quality BPA-free plastic, ensuring safety and durability',
            'Leakproof and spill-resistant, ideal for bags, desks, school, gym, or travel'
        ],
        'specifications': [],
    },
    {
        'name': 'Floral Gold Plated Bracelet – Elegant Korean Style Accessory',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/po4OCon2ck.jpg?v=1770811739&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/po4OCon2ck.jpg?v=1770811739&width=990',
            'https://deodap.in/cdn/shop/files/xqlvPYQvE6.jpg?v=1770811739&width=1100',
            'https://deodap.in/cdn/shop/files/5jSYjHSzeQ.jpg?v=1770811739&width=600',
            'https://deodap.in/cdn/shop/files/7DXiknIseH.jpg?v=1770811739&width=600'
        ],
        'description': 'Stylish floral design inspired by Korean fashion trends\n\nRich gold plating for a luxurious look and feel\n\nIntricately crafted petals offering delicate texture and detail\n\nSeamlessly connected flowers for a continuous elegant pattern\n\nComplements both contemporary and traditional Indian wear\n\nIdeal for festive gatherings, weddings, parties, and special events\n\nAdds a timeless charm and sophistication to everyday outfits',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Stylish floral design inspired by Korean fashion trends',
            'Rich gold plating for a luxurious look and feel',
            'Intricately crafted petals offering delicate texture and detail',
            'Seamlessly connected flowers for a continuous elegant pattern',
            'Complements both contemporary and traditional Indian wear',
            'Ideal for festive gatherings, weddings, parties, and special events',
            'Adds a timeless charm and sophistication to everyday outfits'
        ],
        'specifications': [],
    },
    {
        'name': 'USB Humidifier – Cute Bear LED Air Mist Diffuser for Home',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 249,
        'discount_price': 249,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/04_c01510f1-c2d2-4ceb-9d2e-bdb3d2f227c1.jpg?v=1746791450&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/04_c01510f1-c2d2-4ceb-9d2e-bdb3d2f227c1.jpg?v=1746791450&width=990',
            'https://deodap.in/cdn/shop/files/bfd098c3-9c52-4070-801f-6c3cfb44c80b.jpg?v=1746791450&width=1100',
            'https://deodap.in/cdn/shop/files/05_b6ac8586-201b-4fb4-b2de-55276b8db887.jpg?v=1746791450&width=600',
            'https://deodap.in/cdn/shop/files/01_0d33fab2-7808-444e-b4c8-b7d838ff79be.jpg?v=1746791450&width=600'
        ],
        'description': 'Charming Bear Design: An adorable bear shape adds a playful and cute aesthetic to any desk, bedside table, or car interior.\n\nMulticolor LED Light: Enjoy a calming ambiance with soft, cycling LED colors, perfect for mood setting or as a soothing night light.\n\nWhisper-Quiet Operation: Designed for peaceful humidification, it operates silently, ensuring no disruption to your sleep, work, or relaxation.\n\nPortable & USB Powered: Extremely convenient, power this mini air mist diffuser easily via any USB port – from laptops, power banks, or car chargers.\n\nEnhances Comfort: Effectively combats dry air, helping to alleviate dry skin, irritated throats, congestion, and generally improving overall respiratory comfort.\n\nCold Mist Technology: Delivers a fine, cool mist that is safe for all environments and helps maintain optimal humidity levels without heat',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Charming Bear Design: An adorable bear shape adds a playful and cute aesthetic to any desk, bedside table, or car interior.',
            'Multicolor LED Light: Enjoy a calming ambiance with soft, cycling LED colors, perfect for mood setting or as a soothing night light.',
            'Whisper-Quiet Operation: Designed for peaceful humidification, it operates silently, ensuring no disruption to your sleep, work, or relaxation.',
            'Portable & USB Powered: Extremely convenient, power this mini air mist diffuser easily via any USB port – from laptops, power banks, or car chargers.',
            'Enhances Comfort: Effectively combats dry air, helping to alleviate dry skin, irritated throats, congestion, and generally improving overall respiratory comfort.',
            'Cold Mist Technology: Delivers a fine, cool mist that is safe for all environments and helps maintain optimal humidity levels without heat'
        ],
        'specifications': [],
    },
    {
        'name': 'Wooden Piggy Bank – Cute House Shape for Kids',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 199,
        'discount_price': 199,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/products/HTB1XdcvgTnI8KJjSszgq6A8ApXa5.jpg?v=1750911093&width=990',
        'images': [
            'https://deodap.in/cdn/shop/products/HTB1XdcvgTnI8KJjSszgq6A8ApXa5.jpg?v=1750911093&width=990',
            'https://deodap.in/cdn/shop/products/SKUCODE_77ddcdb5-f7fa-4874-aabd-9e9fc07c79a3.jpg?v=1750911093&width=1100',
            'https://deodap.in/cdn/shop/products/H908f64dfb63c40029411ecbf78a48461V.jpg?v=1750911093&width=600',
            'https://deodap.in/cdn/shop/products/H04aabcab4e8547e8adfdaf53b00cad49n.jpg?v=1750911093&width=600'
        ],
        'description': 'Cute House Shape: Designed like a charming cartoon house with an animal cut-out on the front.\n\nEasy Saving: Features a convenient coin slot located on the roof.\n\nDurable Material: Crafted from high-quality, sturdy wood for long-lasting use.\n\nSimple Access: Equipped with a removable lid at the bottom for easy retrieval of savings.\n\nDecorative & Functional: Doubles as a lovely decoration item for any child\'s bedroom or play area.\n\nIdeal for Gifting: Makes a wonderful return gift or birthday present for kids aged 3 years and above',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Cute House Shape: Designed like a charming cartoon house with an animal cut-out on the front.',
            'Easy Saving: Features a convenient coin slot located on the roof.',
            'Durable Material: Crafted from high-quality, sturdy wood for long-lasting use.',
            'Simple Access: Equipped with a removable lid at the bottom for easy retrieval of savings.',
            'Decorative & Functional: Doubles as a lovely decoration item for any child\'s bedroom or play area.',
            'Ideal for Gifting: Makes a wonderful return gift or birthday present for kids aged 3 years and above'
        ],
        'specifications': [],
    },
    {
        'name': 'Panda with Hat LED Night Light, Cute Silicone Bedside Lamp for Kids',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 149,
        'discount_price': 149,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/PandaLEDNightLight-01.jpg?v=1783329569&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/PandaLEDNightLight-01.jpg?v=1783329569&width=1100',
            'https://deodap.in/cdn/shop/files/PandaLEDNightLight-05.jpg?v=1783329569&width=600',
            'https://deodap.in/cdn/shop/files/PandaLEDNightLight-03.jpg?v=1783329569&width=1100'
        ],
        'description': 'Cute sitting panda with hat design kids instantly love\n\nSoft silicone body is squeezable and safe to touch\n\nWarm, soothing glow that is gentle on the eyes\n\nGreat as a bedside sleep companion and night light\n\nDoubles as a cute decor piece for kids rooms\n\nCompact size fits on bedside tables and study desks\n\nComfortable soft light for night feeds and bedtime stories\n\nLightweight and easy for kids to carry around',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Cute sitting panda with hat design kids instantly love',
            'Soft silicone body is squeezable and safe to touch',
            'Warm, soothing glow that is gentle on the eyes',
            'Great as a bedside sleep companion and night light',
            'Doubles as a cute decor piece for kids rooms',
            'Compact size fits on bedside tables and study desks',
            'Comfortable soft light for night feeds and bedtime stories',
            'Lightweight and easy for kids to carry around'
        ],
        'specifications': [],
    },
    {
        'name': 'Kids 3-Sided Toothbrush – Gentle Silicone Head for Ages 2-12 | MintGuard',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 99,
        'discount_price': 99,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/3f801931-1f30-4f75-9535-4c338db816dc.jpg?v=1737627872&width=1100',
        'images': [
            'https://deodap.in/cdn/shop/files/3f801931-1f30-4f75-9535-4c338db816dc.jpg?v=1737627872&width=1100',
            'https://deodap.in/cdn/shop/files/02_4936aa77-ef53-4f58-9d66-d901c63903bb.jpg?v=1737627872&width=1100',
            'https://deodap.in/cdn/shop/files/05_f0df6e8b-c321-4ef5-9671-ecaa13617513.jpg?v=1737627872&width=600',
            'https://deodap.in/cdn/shop/files/03_79aded86-dc8c-49ec-9b99-ad2b535d6096.jpg?v=1737627872&width=600'
        ],
        'description': 'Unique 3-Sided Design: Simultaneously cleans all three surfaces of the tooth for comprehensive oral care, making brushing easier and more effective for children.\n\nGentle Silicone Bristles: Features an ultra-soft, inverted silicone head that protects delicate gums and emerging teeth, perfect for sensitive mouths.\n\nErgonomic & Kid-Friendly: Designed with an easy-grip handle that fits comfortably in small hands, promoting independent brushing habits from an early age.\n\nDurable & Safe Materials: Crafted from rustproof PP (Polypropylene) and medical-grade silicone for lasting use and child safety, ensuring peace of mind for parents.\n\nBuilt-in Gum Massager: The clever bottom handle doubles as a soothing gum massager or teether, providing comfort during various teething phases.\n\nPromotes Healthy Habits: Its fun, non-reversing design encourages consistent and effective brushing, laying the foundation for lifelong oral hygiene.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Unique 3-Sided Design: Simultaneously cleans all three surfaces of the tooth for comprehensive oral care, making brushing easier and more effective for children.',
            'Gentle Silicone Bristles: Features an ultra-soft, inverted silicone head that protects delicate gums and emerging teeth, perfect for sensitive mouths.',
            'Ergonomic & Kid-Friendly: Designed with an easy-grip handle that fits comfortably in small hands, promoting independent brushing habits from an early age.',
            'Durable & Safe Materials: Crafted from rustproof PP (Polypropylene) and medical-grade silicone for lasting use and child safety, ensuring peace of mind for parents.',
            'Built-in Gum Massager: The clever bottom handle doubles as a soothing gum massager or teether, providing comfort during various teething phases.',
            'Promotes Healthy Habits: Its fun, non-reversing design encourages consistent and effective brushing, laying the foundation for lifelong oral hygiene.'
        ],
        'specifications': [],
    },
    {
        'name': 'Kids Faucet Extender – Easy Hand Wash & Splash-Free Design for Children',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 99,
        'discount_price': 99,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/01_fd371259-b2ef-40ae-ab2f-b0ae59cabb9d.jpg?v=1773997727&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/01_fd371259-b2ef-40ae-ab2f-b0ae59cabb9d.jpg?v=1773997727&width=990',
            'https://deodap.in/cdn/shop/files/02_1601eb6c-73d1-4c25-a66c-ddb3185e5f4f.jpg?v=1774090193&width=1100',
            'https://deodap.in/cdn/shop/files/03_cdce5600-2da2-4b01-a23c-2e719c6aa5b0.jpg?v=1774090193&width=600',
            'https://deodap.in/cdn/shop/files/04_3c6cfbae-605e-4946-bf24-401c18bb48d2.jpg?v=1774090193&width=600',
            'https://deodap.in/cdn/shop/files/05_0e83c033-d39f-47f9-97c5-a316fff73465.jpg?v=1774090193&width=600'
        ],
        'description': 'Extends water flow, making handwashing easier for children\n\nEffectively reduces water splashing and floor mess\n\nCharming child-friendly cartoon design to engage kids\n\nSimple to install and remove without requiring tools\n\nUniversally designed to fit most standard taps\n\nLightweight, durable, and crafted from child-safe materials\n\nPromotes independence and better hygiene for young ones',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Extends water flow, making handwashing easier for children',
            'Effectively reduces water splashing and floor mess',
            'Charming child-friendly cartoon design to engage kids',
            'Simple to install and remove without requiring tools',
            'Universally designed to fit most standard taps',
            'Lightweight, durable, and crafted from child-safe materials',
            'Promotes independence and better hygiene for young ones'
        ],
        'specifications': [],
    },
    {
        'name': 'Mini Slide Projector for Kids – Learning Toy | Spark Tots',
        'category': 'Korean Products',
        'brand': 'DeoDap',
        'price': 189,
        'discount_price': 189,
        'rating': 4.40,
        'reviews_count': 0,
        'image': 'https://deodap.in/cdn/shop/files/sku_197e5248-e98f-45bb-a6a2-d5ae955ec42f.jpg?v=1737617679&width=990',
        'images': [
            'https://deodap.in/cdn/shop/files/sku_197e5248-e98f-45bb-a6a2-d5ae955ec42f.jpg?v=1737617679&width=990',
            'https://deodap.in/cdn/shop/files/1_a884141a-4561-4d8d-b86a-bb959c565543.jpg?v=1737617679&width=600',
            'https://deodap.in/cdn/shop/files/5_c88c0040-8bdc-46b1-b3c5-01133d6bc964.jpg?v=1737617679&width=600'
        ],
        'description': 'Includes 3 colourful slide cards with engaging animated patterns.\n\nEasy-to-use projector torch, perfectly sized for little hands.\n\nCrafted from high-quality, eco-friendly ABS material for durability.\n\nFeatures safe, smooth edges to protect children during play.\n\nDoubles as a convenient flashlight, ideal for night-time adventures.\n\nCompact and lightweight design ensures easy portability for travel or playdates.\n\nAn excellent gift choice for birthdays, festivals, and special occasions.',
        'stock': 50,
        'delivery': 'Free delivery by Tomorrow',
        'highlights': [
            'Includes 3 colourful slide cards with engaging animated patterns.',
            'Easy-to-use projector torch, perfectly sized for little hands.',
            'Crafted from high-quality, eco-friendly ABS material for durability.',
            'Features safe, smooth edges to protect children during play.',
            'Doubles as a convenient flashlight, ideal for night-time adventures.',
            'Compact and lightweight design ensures easy portability for travel or playdates.',
            'An excellent gift choice for birthdays, festivals, and special occasions.'
        ],
        'specifications': [],
    },
]

created_count = 0
for prod_data in PRODUCTS_DATA:
    if not Product.objects.filter(name=prod_data['name']).exists():
        Product.objects.create(seller=seller, **prod_data)
        created_count += 1
        print(f"  Created: {prod_data['name']} - INR {prod_data['price']}")
    else:
        print(f"  Skipped (already exists): {prod_data['name']}")

print(f"\nSuccessfully populated {created_count} new Korean Products!")

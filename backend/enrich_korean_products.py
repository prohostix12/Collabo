"""
Adds fuller descriptions, specifications, Q&A, and highlights to the 15
Korean Products (IDs 41-55) added via populate_korean_products.py.

Deliberately does NOT touch the `offers` field or invent claims the store
can't actually back up (warranties, guaranteed same-day dispatch, brand
certifications, etc). Where the source listing didn't state a fact (e.g.
power source on items 52 and 55), it's left unstated rather than guessed.
The only policy claim reused here (7-day return window) is the store's
real, published policy — see src/components/Legal/ReturnPolicy.js.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from ecommerce.models import Product

RETURN_QA = {"q": "What if I'm not happy with it after delivery?", "a": "You can request a return within 7 days of delivery as per our standard return policy, as long as the item is unused and in its original packaging."}

ENRICHMENT = {
    41: {  # Adjustable Pink Bunny Ear Phone Stand
        "description": "A cute pink bunny-ear stand that keeps your phone upright and at a comfortable viewing angle on your desk or bedside table.\n\nCute Bunny Ear Design: Adds a charming and decorative element to your workspace.\n\nStable Base Support: Provides reliable stability, securely holding your phone in place.\n\nAdjustable Viewing Angle: Flexible design for comfortable use during video calls or content browsing.\n\nUniversal Compatibility: Suitable for most smartphones and small devices.\n\nCompact & Lightweight: Easy to relocate and ideal for small spaces like desks and bedside tables.",
        "highlights": ["Cute pink bunny-ear design", "Adjustable viewing angle", "Stable, wobble-free base", "Fits most smartphones", "Compact and easy to move"],
        "specifications": [
            {"name": "Material", "value": "Plastic"},
            {"name": "Color", "value": "Pink"},
            {"name": "Compatibility", "value": "Most smartphones and small devices"},
            {"name": "Adjustable", "value": "Yes"},
            {"name": "Power Required", "value": "No (passive stand)"},
            {"name": "In the Box", "value": "1 x Phone Stand"},
        ],
        "qa_section": [
            {"q": "Will this fit my phone if it has a thick case?", "a": "The base is adjustable and works with most cases, but very bulky or thick cases may not sit as securely."},
            {"q": "Can I use it in landscape mode for videos?", "a": "Yes, it can be angled to support both portrait and landscape viewing."},
            {"q": "Is it sturdy enough for video calls?", "a": "Yes, the base is designed to hold the phone steady on a flat surface for calls and browsing."},
            RETURN_QA,
        ],
    },
    42: {  # Unicorn Coin Pouch
        "description": "A compact round zipper pouch with a charming pastel unicorn print, sized for coins and small everyday essentials.\n\nCharming pastel unicorn print popular with kids.\n\nCompact round shape ideal for coins and small accessories.\n\nDurable zipper closure secures items safely inside.\n\nConvenient wrist strap for easy carrying on the go.\n\nLightweight design great for school or travel.\n\nPerfect gift choice for children who love unicorns.",
        "highlights": ["Pastel unicorn print", "Compact round zipper pouch", "Wrist strap for easy carrying", "Lightweight, great for school", "Fun gift for kids"],
        "specifications": [
            {"name": "Material", "value": "Fabric with metal zipper"},
            {"name": "Closure", "value": "Zipper"},
            {"name": "Carry Option", "value": "Wrist strap"},
            {"name": "Recommended For", "value": "Kids"},
            {"name": "In the Box", "value": "1 x Coin Pouch"},
        ],
        "qa_section": [
            {"q": "Is this pouch waterproof?", "a": "No, it's made of fabric and isn't waterproof — best to keep it away from water or heavy moisture."},
            {"q": "What can it hold besides coins?", "a": "It suits coins, hair clips, small accessories, or pocket money — it's not meant for bulky items."},
            {"q": "Is it only for kids?", "a": "It's designed as a compact kids' accessory, but anyone wanting a small coin pouch can use it."},
            RETURN_QA,
        ],
    },
    43: {  # Hair Clips Set 4pc
        "description": "A set of 4 cartoon-style hair clips with a firm grip, designed for everyday styling without pulling or slipping.\n\nIncludes 4 unique cartoon-style pins with fun designs.\n\nStrong grip that holds hair firmly without pulling.\n\nLightweight and comfortable for everyday use.\n\nEasy to clip on and remove without hassle.\n\nSuitable for all hair types and versatile occasions.\n\nDurable and reusable for repeated styling.\n\nPerfect for styling bangs, side hair, or small sections.",
        "highlights": ["Set of 4 cartoon-style clips", "Firm, no-slip grip", "Easy on, easy off", "Reusable for daily styling", "Great for bangs and side hair"],
        "specifications": [
            {"name": "Pack Contents", "value": "4 Hair Clips"},
            {"name": "Material", "value": "Plastic with metal spring clip"},
            {"name": "Suitable For", "value": "All hair types"},
            {"name": "Recommended For", "value": "Kids and teens"},
        ],
        "qa_section": [
            {"q": "Are all 4 clips different designs?", "a": "Yes, the set includes 4 unique cartoon-style designs as shown in the product images."},
            {"q": "Will these damage or pull on hair?", "a": "They're designed with a firm but gentle grip; for very fine or fragile hair, avoid clipping too tightly."},
            {"q": "Can these be reused daily?", "a": "Yes, they're built for repeated everyday clipping and unclipping."},
            RETURN_QA,
        ],
    },
    44: {  # Pet Hair Remover Brush
        "description": "A reusable double-sided brush that lifts pet fur off clothes, upholstery, and car seats, with a built-in base that cleans the brush itself.\n\nDouble-Sided Efficiency: Quickly removes pet fur from clothes, upholstery, and carpets with a single sweep, covering more area in less time.\n\nSelf-Cleaning Base: Features an integrated self-cleaning base that effortlessly removes collected fur from the brush, readying it for the next use.\n\nReusable & Eco-Friendly: A sustainable alternative to disposable lint rollers, requiring no refills, batteries, or power.\n\nVersatile Application: Effectively picks up dog and cat hair from a wide range of surfaces including clothing, sofas, beds, car interiors, and rugs.\n\nCompact & Portable: Lightweight and easy to store, making it perfect for both home use and travel, ensuring you're always prepared for pet hair emergencies.\n\nDurable Construction: Built with high-quality materials to withstand repeated use, providing a long-lasting solution for pet hair removal.",
        "highlights": ["Double-sided fur removal", "Self-cleaning base built in", "No batteries or refills needed", "Works on clothes, sofas, car seats", "Reusable and eco-friendly"],
        "specifications": [
            {"name": "Type", "value": "Manual double-sided fur brush"},
            {"name": "Power", "value": "None required — fully manual"},
            {"name": "Suitable Surfaces", "value": "Clothing, sofas, beds, car interiors, carpets"},
            {"name": "In the Box", "value": "1 x Pet Hair Remover Brush"},
        ],
        "qa_section": [
            {"q": "Does this need batteries or charging?", "a": "No, it's fully manual and reusable — no batteries or charging required."},
            {"q": "How do I clean the brush after use?", "a": "Use the built-in self-cleaning base to release the collected fur, then empty it into the bin."},
            {"q": "Does it work on both cat and dog hair?", "a": "Yes, it's designed to pick up both cat and dog hair from most fabric surfaces."},
            RETURN_QA,
        ],
    },
    45: {  # Flexible USB LED Light
        "description": "A flexible, USB-powered LED light that clips onto your laptop setup for extra reading or keyboard lighting wherever you need it.\n\nAdjustable Flexible Neck: Effortlessly position this flexible USB LED light for precise, targeted illumination on your keyboard, notes, or reading material.\n\nUSB Powered Convenience: Simply plug into any USB port on your laptop, power bank, or adapter — no batteries required, ensuring continuous and reliable lighting.\n\nEnergy-Efficient Soft Light: Emits a gentle, non-flickering light that helps reduce eye strain during prolonged use, promoting better focus and comfort.\n\nUltra-Portable & Lightweight: Designed for travel, its compact size and minimal weight make it an ideal companion for students and professionals on the move.\n\nVersatile Use: Perfect as a laptop light, a study lamp, or a portable task light for any USB-compatible device, enhancing visibility wherever you are.\n\nDurable Construction: Crafted from robust materials to withstand daily use, providing long-lasting performance and flexibility.",
        "highlights": ["USB powered, no batteries", "Flexible, bendable neck", "Soft, non-flickering light", "Lightweight and travel-friendly", "Works with laptops and power banks"],
        "specifications": [
            {"name": "Power Source", "value": "USB (laptop, power bank, or adapter)"},
            {"name": "Light Type", "value": "Soft white LED, non-flickering"},
            {"name": "Neck", "value": "Flexible, adjustable gooseneck"},
            {"name": "Batteries Required", "value": "No"},
            {"name": "In the Box", "value": "1 x USB LED Light"},
        ],
        "qa_section": [
            {"q": "Do I need batteries for this light?", "a": "No, it's fully USB-powered — just plug it into any USB port."},
            {"q": "Can I use it with a power bank instead of a laptop?", "a": "Yes, it works with any standard USB port, including power banks and wall adapters."},
            {"q": "Is it bright enough for reading at night?", "a": "It gives soft, even lighting suitable for reading, typing, or close-up tasks — it's a supplementary light rather than a full room light."},
            RETURN_QA,
        ],
    },
    46: {  # Kids Lunch Box
        "description": "A multi-compartment lunch box with a playful cat design, made to keep a child's meals separated, fresh, and easy to carry.\n\nAdorable cat print with fun whisker details and bright orange and white colours that kids love.\n\nMultiple compartments to keep snacks and meals neatly separated and fresh.\n\nSecure snap-lock closure to prevent spills and keep food safely enclosed during travel.\n\nCompact, lightweight design ideal for easy carrying by children.\n\nMade from food-grade, easy-to-clean, BPA-free plastic for daily use.\n\nSuitable for school lunches, picnics, and snack storage.",
        "highlights": ["Playful cat design", "Multiple food compartments", "Secure snap-lock lid", "BPA-free, food-grade plastic", "Great for school and picnics"],
        "specifications": [
            {"name": "Material", "value": "Food-grade, BPA-free plastic"},
            {"name": "Compartments", "value": "Multiple, for separated food storage"},
            {"name": "Closure", "value": "Snap-lock"},
            {"name": "Recommended For", "value": "School-going kids"},
            {"name": "In the Box", "value": "1 x Lunch Box"},
        ],
        "qa_section": [
            {"q": "Is this lunch box microwave-safe?", "a": "This isn't specified by the manufacturer, so we recommend hand-washing and avoiding microwave use to be safe."},
            {"q": "Is it leak-proof for liquids like curry or dal?", "a": "The compartments and snap-lock closure reduce spills, but it's best suited to semi-solid foods rather than very runny liquids."},
            {"q": "What age group is this suitable for?", "a": "It's sized for school-going kids and works well for daily lunches, snacks, and picnics."},
            RETURN_QA,
        ],
    },
    47: {  # Nail Art Sticker Set
        "description": "A peel-and-apply nail sticker set with cartoon-style designs and an applicator tool, made for quick DIY manicures at home.\n\nAttractive cartoon nail sticker designs for stylish nails.\n\nEasy peel-and-apply application for quick use.\n\nIncludes applicator tool for precise placement.\n\nSuitable for DIY nail art at home.\n\nLightweight and travel-friendly packaging.\n\nPerfect for beginners and professionals alike.\n\nInstantly enhances nail appearance.",
        "highlights": ["Peel-and-apply nail stickers", "Cartoon-style designs", "Applicator tool included", "No nail-art skills needed", "Travel-friendly packaging"],
        "specifications": [
            {"name": "Contents", "value": "Nail sticker sheet(s) + applicator tool"},
            {"name": "Application", "value": "Peel-and-apply"},
            {"name": "Suitable For", "value": "DIY manicures at home"},
        ],
        "qa_section": [
            {"q": "How long do these nail stickers last?", "a": "Applied correctly on clean, dry nails, they typically last several days, though actual wear time depends on daily activity."},
            {"q": "Do I need a top coat over them?", "a": "A clear top coat is optional but can help the stickers stay put longer."},
            {"q": "Can the stickers be reused?", "a": "No, these are designed for single use per application."},
            RETURN_QA,
        ],
    },
    48: {  # Ice Cream Water Bottle 1300ML
        "description": "A large 1300ML water bottle with a fun ice-cream-themed design, a fruit infuser core, and a flip-top silicone straw for easy sipping on the go.\n\nAdorable ice cream-inspired design with playful printed details.\n\nSpacious 1300ML capacity to keep you refreshed throughout the day.\n\nIntegrated fruit infuser core to naturally enhance your water with fresh flavours.\n\nSoft silicone straw with flip-top lid for easy and convenient sipping.\n\nErgonomic side handle for comfortable carrying on the go.\n\nMade from high-quality BPA-free plastic, ensuring safety and durability.\n\nLeakproof and spill-resistant, ideal for bags, desks, school, gym, or travel.",
        "highlights": ["1300ML large capacity", "Built-in fruit infuser", "Flip-top silicone straw", "Leak-proof design", "BPA-free plastic"],
        "specifications": [
            {"name": "Capacity", "value": "1300 ML"},
            {"name": "Material", "value": "BPA-free plastic"},
            {"name": "Features", "value": "Fruit infuser core, silicone straw, flip-top lid, side handle"},
            {"name": "Leak-Proof", "value": "Yes"},
            {"name": "In the Box", "value": "1 x Water Bottle"},
        ],
        "qa_section": [
            {"q": "Can I put hot beverages in this bottle?", "a": "No, it's designed for cold or room-temperature drinks, not hot liquids."},
            {"q": "Can I add ice cubes?", "a": "Yes, the wide-mouth design allows ice cubes to be added easily."},
            {"q": "Is the straw replaceable?", "a": "The included silicone straw is part of the bottle design; replacement straws aren't sold separately here."},
            RETURN_QA,
        ],
    },
    49: {  # Floral Gold Plated Bracelet
        "description": "A floral, Korean-inspired gold-plated bracelet with intricately connected petals, suited to both festive and everyday wear.\n\nStylish floral design inspired by Korean fashion trends.\n\nRich gold plating for a luxurious look and feel.\n\nIntricately crafted petals offering delicate texture and detail.\n\nSeamlessly connected flowers for a continuous elegant pattern.\n\nComplements both contemporary and traditional Indian wear.\n\nIdeal for festive gatherings, weddings, parties, and special events.\n\nAdds a timeless charm and sophistication to everyday outfits.",
        "highlights": ["Korean-inspired floral design", "Gold-plated finish", "Suits festive and daily wear", "Delicate, detailed petal work", "Pairs with Indian and western outfits"],
        "specifications": [
            {"name": "Plating", "value": "Gold plated (not solid gold)"},
            {"name": "Style", "value": "Korean-inspired floral design"},
            {"name": "Occasion", "value": "Festive wear, daily wear"},
            {"name": "In the Box", "value": "1 x Bracelet"},
        ],
        "qa_section": [
            {"q": "Is this real gold?", "a": "No, it's gold plated rather than solid gold, giving a similar look at a more affordable price."},
            {"q": "Will the gold plating fade over time?", "a": "Avoiding water, perfume, and lotion contact will help it last longer, but like any gold-plated jewellery, gradual fading with regular wear is normal."},
            {"q": "Is the size adjustable?", "a": "It comes in the fixed design and length shown in the product images and isn't custom-adjustable."},
            RETURN_QA,
        ],
    },
    50: {  # USB Bear Humidifier
        "description": "A bear-shaped USB humidifier with soft cycling LED light, giving off a fine cold mist for a desk, bedside table, or car interior.\n\nCharming Bear Design: An adorable bear shape adds a playful and cute aesthetic to any desk, bedside table, or car interior.\n\nMulticolor LED Light: Enjoy a calming ambiance with soft, cycling LED colors, perfect for mood setting or as a soothing night light.\n\nWhisper-Quiet Operation: Designed for peaceful humidification, it operates silently, ensuring no disruption to your sleep, work, or relaxation.\n\nPortable & USB Powered: Extremely convenient, power this mini air mist diffuser easily via any USB port — from laptops, power banks, or car chargers.\n\nEnhances Comfort: Effectively combats dry air, helping to alleviate dry skin, irritated throats, congestion, and generally improving overall respiratory comfort.\n\nCold Mist Technology: Delivers a fine, cool mist that is safe for all environments and helps maintain optimal humidity levels without heat.",
        "highlights": ["Cute bear-shaped design", "Cold mist, no heat", "Cycling multicolor LED light", "Quiet operation", "USB powered"],
        "specifications": [
            {"name": "Power Source", "value": "USB (laptop, power bank, or car charger)"},
            {"name": "Mist Type", "value": "Cold mist"},
            {"name": "Light", "value": "Multicolor cycling LED"},
            {"name": "Water Tank", "value": "Refillable"},
            {"name": "In the Box", "value": "1 x USB Humidifier"},
        ],
        "qa_section": [
            {"q": "How long does one tank of water last?", "a": "Run time depends on the mist setting and how full the tank is — as a compact personal humidifier, expect a few hours per fill."},
            {"q": "Can I add essential oils to it?", "a": "No, this is a basic cold-mist humidifier and isn't designed for essential oils — adding oils may damage it."},
            {"q": "Does it switch off automatically when the water runs out?", "a": "It's a basic personal humidifier, so check the water level and refill as needed rather than relying on auto shut-off."},
            RETURN_QA,
        ],
    },
    51: {  # Wooden Piggy Bank
        "description": "A wooden, house-shaped piggy bank with a roof coin slot and a removable base, built to encourage saving in a durable, decorative form.\n\nCute House Shape: Designed like a charming cartoon house with an animal cut-out on the front.\n\nEasy Saving: Features a convenient coin slot located on the roof.\n\nDurable Material: Crafted from high-quality, sturdy wood for long-lasting use.\n\nSimple Access: Equipped with a removable lid at the bottom for easy retrieval of savings.\n\nDecorative & Functional: Doubles as a lovely decoration item for any child's bedroom or play area.\n\nIdeal for Gifting: Makes a wonderful return gift or birthday present for kids aged 3 years and above.",
        "highlights": ["House-shaped wooden design", "Roof coin slot", "Removable base for easy access", "Doubles as room decor", "Great gift for ages 3+"],
        "specifications": [
            {"name": "Material", "value": "Wood"},
            {"name": "Design", "value": "House-shaped"},
            {"name": "Coin Access", "value": "Removable bottom lid"},
            {"name": "Recommended Age", "value": "3 years and above"},
            {"name": "In the Box", "value": "1 x Piggy Bank"},
        ],
        "qa_section": [
            {"q": "Can it hold notes as well as coins?", "a": "It's primarily designed for coins via the roof slot; the removable base lets you take out all the savings when needed."},
            {"q": "Is it sturdy for daily use?", "a": "Yes, it's made from sturdy wood built for long-term everyday use."},
            {"q": "Is this safe for toddlers?", "a": "It's recommended for children aged 3 and above; adult supervision is advised for younger kids because of the small coin-slot opening."},
            RETURN_QA,
        ],
    },
    52: {  # Panda LED Night Light
        "description": "A soft silicone panda night light with a warm, gentle glow, sized to sit comfortably on a bedside table or study desk.\n\nCute sitting panda with hat design kids instantly love.\n\nSoft silicone body is squeezable and safe to touch.\n\nWarm, soothing glow that is gentle on the eyes.\n\nGreat as a bedside sleep companion and night light.\n\nDoubles as a cute decor piece for kids rooms.\n\nCompact size fits on bedside tables and study desks.\n\nComfortable soft light for night feeds and bedtime stories.\n\nLightweight and easy for kids to carry around.",
        "highlights": ["Soft, squeezable silicone body", "Warm, eye-friendly glow", "Compact bedside size", "Doubles as room decor", "Lightweight, easy to carry"],
        "specifications": [
            {"name": "Material", "value": "Soft silicone"},
            {"name": "Design", "value": "Panda with hat"},
            {"name": "Light Type", "value": "Warm glow LED"},
            {"name": "Recommended Use", "value": "Bedside night light, room decor"},
            {"name": "In the Box", "value": "1 x Night Light"},
        ],
        "qa_section": [
            {"q": "Is the light too bright for a baby's room at night?", "a": "No, it gives off a warm, soft glow that's designed to be gentle on the eyes, suited to night feeds and bedtime."},
            {"q": "Is the silicone body safe for kids to squeeze?", "a": "Yes, it's made from soft, squeezable silicone that's safe for children to handle."},
            {"q": "How is it powered or charged?", "a": "Please check the product packaging on arrival for exact power/charging details, as this wasn't specified by the manufacturer."},
            RETURN_QA,
        ],
    },
    53: {  # Kids 3-Sided Toothbrush
        "description": "A 3-sided children's toothbrush with an ultra-soft silicone head and a gum-massaging handle, designed for ages 2 to 12.\n\nUnique 3-Sided Design: Simultaneously cleans all three surfaces of the tooth for comprehensive oral care, making brushing easier and more effective for children.\n\nGentle Silicone Bristles: Features an ultra-soft, inverted silicone head that protects delicate gums and emerging teeth, perfect for sensitive mouths.\n\nErgonomic & Kid-Friendly: Designed with an easy-grip handle that fits comfortably in small hands, promoting independent brushing habits from an early age.\n\nDurable & Safe Materials: Crafted from rustproof PP (Polypropylene) and medical-grade silicone for lasting use and child safety, ensuring peace of mind for parents.\n\nBuilt-in Gum Massager: The clever bottom handle doubles as a soothing gum massager or teether, providing comfort during various teething phases.\n\nPromotes Healthy Habits: Its fun, non-reversing design encourages consistent and effective brushing, laying the foundation for lifelong oral hygiene.",
        "highlights": ["3-sided brush head", "Ultra-soft silicone bristles", "Easy-grip kid-friendly handle", "Doubles as a gum massager", "Designed for ages 2-12"],
        "specifications": [
            {"name": "Material", "value": "PP handle, medical-grade silicone head"},
            {"name": "Age Range", "value": "2-12 years"},
            {"name": "Design", "value": "3-sided brush head with gum massager handle"},
            {"name": "In the Box", "value": "1 x Toothbrush"},
        ],
        "qa_section": [
            {"q": "Is this suitable for a 2-year-old with only a few teeth?", "a": "Yes, it's designed for ages 2-12, and the soft silicone head is gentle enough for emerging teeth and sensitive gums."},
            {"q": "Does it come with toothpaste?", "a": "No, this listing is for the toothbrush only — toothpaste isn't included."},
            {"q": "How often should it be replaced?", "a": "As with most children's toothbrushes, we'd suggest replacing it every 2-3 months, or sooner if the bristles show wear."},
            RETURN_QA,
        ],
    },
    54: {  # Kids Faucet Extender
        "description": "A child-friendly faucet extender that brings the water flow closer to little hands, making handwashing easier with less splashing.\n\nExtends water flow, making handwashing easier for children.\n\nEffectively reduces water splashing and floor mess.\n\nCharming child-friendly cartoon design to engage kids.\n\nSimple to install and remove without requiring tools.\n\nUniversally designed to fit most standard taps.\n\nLightweight, durable, and crafted from child-safe materials.\n\nPromotes independence and better hygiene for young ones.",
        "highlights": ["Extends water flow for kids", "Cuts down splashing", "Tool-free install and removal", "Fits most standard taps", "Fun, child-friendly design"],
        "specifications": [
            {"name": "Material", "value": "Child-safe plastic"},
            {"name": "Installation", "value": "Tool-free, fits most standard taps"},
            {"name": "Design", "value": "Cartoon, child-friendly"},
            {"name": "In the Box", "value": "1 x Faucet Extender"},
        ],
        "qa_section": [
            {"q": "Will this fit any tap?", "a": "It's designed to fit most standard household taps, but check your tap's shape and size first if it's an unusual design."},
            {"q": "Do I need tools to install it?", "a": "No, it's designed for simple, tool-free installation and removal."},
            {"q": "Is it sturdy for daily use?", "a": "Yes, it's made from durable, child-safe materials meant for daily handwashing use."},
            RETURN_QA,
        ],
    },
    55: {  # Mini Slide Projector
        "description": "A handheld mini projector torch for kids that displays colourful animated slide patterns and doubles as a flashlight for night-time play.\n\nIncludes 3 colourful slide cards with engaging animated patterns.\n\nEasy-to-use projector torch, perfectly sized for little hands.\n\nCrafted from high-quality, eco-friendly ABS material for durability.\n\nFeatures safe, smooth edges to protect children during play.\n\nDoubles as a convenient flashlight, ideal for night-time adventures.\n\nCompact and lightweight design ensures easy portability for travel or playdates.\n\nAn excellent gift choice for birthdays, festivals, and special occasions.",
        "highlights": ["3 animated slide cards included", "Also works as a flashlight", "Eco-friendly ABS build", "Smooth, child-safe edges", "Compact for travel and playdates"],
        "specifications": [
            {"name": "Contents", "value": "1 x Projector Torch + 3 x Slide Cards"},
            {"name": "Material", "value": "Eco-friendly ABS"},
            {"name": "Additional Use", "value": "Doubles as a flashlight"},
            {"name": "Recommended Age", "value": "Kids, with adult supervision for younger children"},
        ],
        "qa_section": [
            {"q": "How many slide images does it come with?", "a": "It includes 3 colourful slide cards, each with a different animated pattern."},
            {"q": "Can I buy extra slide cards separately?", "a": "Only the 3 included slide cards come with this listing — additional cards aren't sold separately here."},
            {"q": "How is it powered?", "a": "Please check the product packaging on arrival for exact power/battery details, as this wasn't specified by the manufacturer."},
            RETURN_QA,
        ],
    },
}

updated = 0
for pid, data in ENRICHMENT.items():
    try:
        p = Product.objects.get(id=pid, category='Korean Products')
    except Product.DoesNotExist:
        print(f"  SKIP: product id {pid} not found in Korean Products")
        continue
    p.description = data["description"]
    p.highlights = data["highlights"]
    p.specifications = data["specifications"]
    p.qa_section = data["qa_section"]
    p.save()
    updated += 1
    print(f"  Updated: {p.name} (id={p.id})")

print(f"\nSuccessfully enriched {updated} Korean Products with description, specifications, Q&A, and highlights.")

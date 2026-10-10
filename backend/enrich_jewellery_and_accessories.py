"""
Adds fuller descriptions, specifications, and Q&A to the 20 products
added via populate_jewellery_and_accessories.py (IDs 69-88).

Same discipline as enrich_korean_products.py: nothing stated here goes
beyond what the source listing said or what's reasonably and honestly
inferable. Every jewellery item explicitly says "not real gold/silver"
where the source described a plated/oxidised/toned finish (which is
all of them) — these are costume/fashion jewellery pieces, not precious
metal, and saying so plainly avoids misleading buyers. Unconfirmed
facts (battery type, pearl authenticity, hypoallergenic claims) are
flagged as unconfirmed in the Q&A rather than guessed. Ratings/reviews
were left at 0 at creation time — no fabricated social proof.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from ecommerce.models import Product

RETURN_QA = {"q": "What if I'm not happy with it after delivery?", "a": "You can request a return within 7 days of delivery as per our standard return policy, as long as the item is unused and in its original packaging."}

ENRICHMENT = {
    69: {  # Mini Tripod
        "description": "A compact mini tripod with a push-button ball head, sized to hold a phone, camera, or pico projector steady for photos and video.\n\nUniversal Compatibility: Fits smartphones (5.8 to 10.5 cm width), digital cameras, and pico projectors with standard 1/4\" screw threads.\n\nInstant Adjustments: Push-button ball head allows for quick, 360-degree angle adjustments.\n\nSuperior Stability: Silica gel anti-skid pads on legs prevent sliding on any surface.\n\nCompact & Portable: Folds down to 16 cm, weighing just 133g for effortless transport.\n\nDurable Construction: Made from premium ABS and steel for long-lasting performance.\n\nVersatile Use: Functions as a stable tripod or a comfortable handheld grip for dynamic shots.",
        "highlights": ["Fits phones, cameras & projectors", "360° push-button ball head", "Folds to just 16cm", "Only 133g", "Non-slip leg pads"],
        "specifications": [
            {"name": "Compatibility", "value": "Smartphones (5.8–10.5cm width), cameras, pico projectors"},
            {"name": "Mount", "value": "Standard 1/4\" screw thread"},
            {"name": "Folded Length", "value": "16 cm"},
            {"name": "Weight", "value": "133 g"},
            {"name": "Material", "value": "ABS and steel"},
            {"name": "Head Type", "value": "Push-button 360° ball head"},
        ],
        "qa_section": [
            {"q": "Will this fit my phone with a case on?", "a": "As long as your phone (with case) falls within the 5.8–10.5 cm width range, it will clip on securely."},
            {"q": "Can I use it with a DSLR camera?", "a": "Yes, it has a standard 1/4\" screw thread compatible with most digital cameras."},
            {"q": "Can it be used as a handheld grip instead of a tripod?", "a": "Yes, it doubles as a comfortable handheld grip for dynamic shots when not set up as a stand."},
            RETURN_QA,
        ],
    },
    70: {  # Camera Tripod 41-inch
        "description": "A portable aluminum tripod that extends from 43cm to a full 41 inches, with a 3-way pan head and built-in bubble level for steady phone and camera shots.\n\nExcellent 3-Way Pan Head: Easily switch between 360° horizontal and 90° vertical shooting, including a 90° portrait orientation and 180° tilt motion.\n\nCompact & Lightweight Design: With a folded size of just 43 cm (17 inches) and a net weight of 0.45 kg, it's perfect for travel and on-the-go photography.\n\nAdjustable 4-Section Aluminum Legs: Quickly extend and retract the legs from 43 cm (17 inches) to 106 cm (41 inches) using smooth leg locks.\n\nNon-Slip Rubber Leg Bases: Provides superior grip and stability on various surfaces, preventing accidental slips.\n\nWide Compatibility: Features a universal 1/4\" screw quick-release plate and an adjustable phone clip, making it suitable for most cameras and mobile devices.\n\nIntegrated Bubble Level: Helps achieve perfect balance and precise alignment for consistently professional shots.",
        "highlights": ["Extends to 106cm (41\")", "3-way pan head, 360°", "Only 0.45kg", "Built-in bubble level", "Fits phones and cameras"],
        "specifications": [
            {"name": "Folded Length", "value": "43 cm (17 in)"},
            {"name": "Max Height", "value": "106 cm (41 in)"},
            {"name": "Weight", "value": "0.45 kg"},
            {"name": "Legs", "value": "4-section aluminum"},
            {"name": "Head", "value": "3-way pan head (360° horizontal, 90° vertical, 180° tilt)"},
            {"name": "Mount", "value": "1/4\" screw quick-release plate + adjustable phone clip"},
        ],
        "qa_section": [
            {"q": "How tall does it extend?", "a": "From a folded 43cm up to a full 106cm (41 inches)."},
            {"q": "Is it suitable for both phones and cameras?", "a": "Yes, it comes with a universal 1/4\" screw plate and an adjustable phone clip."},
            {"q": "Does it come with a carry bag?", "a": "This isn't specified in the listing — check the product images for exactly what's included in the box."},
            RETURN_QA,
        ],
    },
    71: {  # Electronic Tally Counter
        "description": "A wearable finger-ring tally counter with an LCD display and instant reset, built for quick, hands-free manual counting.\n\nFinger Ring Design: Ergonomically designed adjustable ring allows for comfortable, hands-free operation.\n\nQuick Response Button: Mechanically jumps with every press, ensuring precise and rapid counting.\n\nInstant Reset Function: A dedicated button allows you to quickly clear the count to zero for new tasks.\n\nPortable & Lightweight: Small and compact, it's ideal for carrying anywhere you need to count.\n\nDurable Construction: Crafted from robust plastic for long-lasting performance.\n\nDigital Display: Clear LCD screen provides instant, easy-to-read numeric feedback.",
        "highlights": ["Wearable finger-ring design", "Instant reset button", "Clear LCD display", "Lightweight and portable", "Durable plastic build"],
        "specifications": [
            {"name": "Design", "value": "Adjustable finger-ring, wearable"},
            {"name": "Display", "value": "LCD digital screen"},
            {"name": "Material", "value": "Plastic"},
            {"name": "Functions", "value": "Manual count + instant reset"},
        ],
        "qa_section": [
            {"q": "Does it need batteries?", "a": "This isn't specified by the manufacturer — check the packaging on arrival for battery details."},
            {"q": "Can I reset the count mid-use?", "a": "Yes, there's a dedicated reset button to clear the count to zero at any time."},
            {"q": "Is it comfortable for long counting sessions?", "a": "Yes, the adjustable finger-ring design is made for hands-free, comfortable extended use."},
            RETURN_QA,
        ],
    },
    72: {  # Suction Phone Holder Mount
        "description": "A silicone suction phone mount that sticks to dashboards, windshields, and mirrors, with an included adhesive pad for extra hold.\n\nStrong Silicone Suction: Provides a secure hold on your phone to prevent slips or drops.\n\nMulti-Surface Mounting: Easily attaches to dashboards, windshields, mirrors, and other flat surfaces.\n\nIncluded Adhesive Pad: Specially designed for iPhones, ensuring extra stability during use.\n\nClear Design: Transparent sticker blends seamlessly without distracting from your device's look.\n\nDurable Material: Crafted with premium silicone to offer long-lasting, sturdy performance.\n\nContent Creator Friendly: Ideal accessory for bloggers, vloggers, and social media enthusiasts.\n\nQuick Setup: Peel and stick installation for immediate use without tools.",
        "highlights": ["Strong silicone suction", "Mounts on dashboards, mirrors, glass", "Includes adhesive pad", "Tool-free peel-and-stick setup", "Transparent, low-profile design"],
        "specifications": [
            {"name": "Material", "value": "Silicone"},
            {"name": "Mounting", "value": "Suction cup — dashboards, windshields, mirrors, flat surfaces"},
            {"name": "Includes", "value": "Adhesive pad (designed for iPhones)"},
            {"name": "Installation", "value": "Peel-and-stick, no tools required"},
        ],
        "qa_section": [
            {"q": "Will the suction hold on a textured dashboard?", "a": "It works best on smooth, flat surfaces like glass or a polished dashboard — very textured surfaces may reduce grip."},
            {"q": "Is the adhesive pad reusable?", "a": "This isn't specified by the manufacturer — treat it as a one-time application for the strongest hold."},
            {"q": "Does it fit all phone sizes?", "a": "It's designed as a universal suction mount; check your phone's dimensions against the product images for the best fit."},
            RETURN_QA,
        ],
    },
    73: {  # Earphone Carrying Case
        "description": "A round fabric pouch sized to organize earphones, cables, and small accessories, with a shock- and water-resistant build.\n\nTriple Protection: Engineered with shock-proof, water-proof, and anti-theft features to safeguard your earphones and accessories from daily wear and tear.\n\nPremium Build: Made from high-quality, smooth fabric that is both durable and pleasant to touch, ensuring longevity.\n\nLightweight & Portable: Designed to be light and attractive, this round pocket pouch is incredibly easy to carry anywhere you go.\n\nSpacious Interior: Generous enough to comfortably hold earphones, headphones, data cables, chargers, AirPods, and even loose coins or pen drives.\n\nVibrant & Stylish: Available in a mix of colourful designs, adding a touch of personality to your everyday essentials.\n\nVersatile Use: Perfect as an earphone case organizer, a coin pouch, or a mini storage solution for various small electronic accessories.",
        "highlights": ["Shock and water resistant", "Fits earphones, cables & AirPods", "Soft, durable fabric build", "Lightweight round pouch", "Comes in mixed colour designs"],
        "specifications": [
            {"name": "Shape", "value": "Round pouch"},
            {"name": "Material", "value": "Fabric"},
            {"name": "Capacity", "value": "Earphones, cables, chargers, AirPods, coins, pen drives"},
        ],
        "qa_section": [
            {"q": "Is this fully waterproof or just water-resistant?", "a": "The manufacturer describes it as water-proof; for full submersion protection with valuable electronics we'd still recommend caution."},
            {"q": "Will it fit AirPods Pro or a similar case?", "a": "Yes, the interior is spacious enough for AirPods, earphones, and small cables."},
            {"q": "What colours does it come in?", "a": "It's available in a mix of colourful designs — check the product images for the current options."},
            RETURN_QA,
        ],
    },
    74: {  # Spiral Cable Protector Sleeve
        "description": "A flexible spiral sleeve that wraps around charging and data cables to stop them fraying or breaking at the joints.\n\nFlexible spiral design guards cables against bending and fraying.\n\nExtends cable life by preventing breakage at joints.\n\nSimple installation and removal without any tools required.\n\nLightweight and compact, perfect for home or travel use.\n\nReusable and compatible with most charging and data cables.\n\nMix color options add a practical touch of style and organization.",
        "highlights": ["Protects cables from fraying", "Tool-free install and removal", "Reusable on multiple cables", "Compact and travel-friendly", "Mixed colour options"],
        "specifications": [
            {"name": "Design", "value": "Flexible spiral wrap"},
            {"name": "Compatibility", "value": "Most charging and data cables"},
            {"name": "Installation", "value": "No tools required"},
            {"name": "Reusable", "value": "Yes"},
        ],
        "qa_section": [
            {"q": "Will this fit a thick charging cable?", "a": "It's designed as a flexible spiral wrap for most standard charging and data cables; very thick cables may need a larger size."},
            {"q": "Can I remove and reuse it on a different cable?", "a": "Yes, it installs and removes without tools and is reusable."},
            {"q": "Does it come in one colour or a set?", "a": "It's available in mixed colour options."},
            RETURN_QA,
        ],
    },
    75: {  # Gold Finish Jhumka Earrings
        "description": "A dual-tone jhumka earring pairing oxidized silver detailing with gold-tone ghungroo beads, made for everyday ethnic styling and festive wear.\n\nHandcrafted Artistry: Intricately designed with fine oxidized silver detailing for a traditional look.\n\nDual Tone Elegance: Combines rich gold-tone ghungroo beads with oxidized silver for a stunning visual appeal.\n\nLightweight Comfort: Designed for prolonged wear at weddings, festivals, or daily ethnic styling.\n\nVersatile Accessory: Complements a wide range of traditional and contemporary ethnic outfits.",
        "highlights": ["Dual-tone oxidized silver & gold-tone", "Handcrafted jhumka design", "Lightweight for all-day wear", "Suits traditional & contemporary outfits"],
        "specifications": [
            {"name": "Style", "value": "Jhumka (bell-shaped)"},
            {"name": "Finish", "value": "Oxidized silver detailing with gold-tone ghungroo beads"},
            {"name": "Occasion", "value": "Weddings, festivals, daily ethnic wear"},
        ],
        "qa_section": [
            {"q": "Is this real gold or silver?", "a": "No, it's a dual-tone oxidized silver and gold-tone finish, not precious metal."},
            {"q": "Will the finish fade with regular wear?", "a": "Avoiding water, perfume, and lotion contact will help the finish last longer, as with any oxidized or plated jewellery."},
            {"q": "Is it comfortable for all-day wear?", "a": "Yes, it's designed to be lightweight for prolonged wear at weddings, festivals, or daily styling."},
            RETURN_QA,
        ],
    },
    76: {  # Oxidised Silver Geometric Jhumka Earrings
        "description": "A geometric jhumka earring in an antique oxidised silver-tone finish, styled for both festive and everyday ethnic wear.\n\nBeautiful geometric design with traditional patterns.\n\nPremium antique finish enhances vintage appeal.\n\nLightweight and comfortable for extended wear.\n\nVersatile styling with sarees, kurtis, lehengas & casual outfits.\n\nPerfect accessory for weddings & festival celebrations.",
        "highlights": ["Geometric traditional pattern", "Antique oxidised silver finish", "Lightweight for extended wear", "Pairs with sarees, kurtis & lehengas"],
        "specifications": [
            {"name": "Style", "value": "Geometric jhumka"},
            {"name": "Finish", "value": "Oxidised silver-tone, antique"},
            {"name": "Occasion", "value": "Festive, wedding, casual wear"},
        ],
        "qa_section": [
            {"q": "Is this made of real silver?", "a": "No, it has an oxidised silver-tone finish rather than solid silver."},
            {"q": "Does it suit both traditional and western outfits?", "a": "It's designed for versatile styling with sarees, kurtis, lehengas, and casual outfits alike."},
            {"q": "How should I store it to prevent tarnishing?", "a": "Keep it in a dry pouch away from moisture and perfume to help the antique finish last longer."},
            RETURN_QA,
        ],
    },
    77: {  # Oxidised Jhumka Earrings Peacock Dual Stone
        "description": "A peacock-motif jhumka earring with tribal detailing and red-and-green dual stone embellishments in an oxidised silver-tone finish.\n\nElegant peacock motifs with intricate tribal detailing.\n\nVibrant red and green dual stone embellishments.\n\nCharming dangling bead accents for added flair.\n\nCrafted in a stylish oxidised silver-tone finish.\n\nLightweight design ensures comfortable wear all day long.\n\nVersatile for festive occasions, weddings, and casual ethnic outfits.",
        "highlights": ["Peacock motif with tribal detailing", "Red & green dual stone accents", "Dangling bead design", "Oxidised silver-tone finish", "Comfortable all-day wear"],
        "specifications": [
            {"name": "Motif", "value": "Peacock, tribal detailing"},
            {"name": "Stones", "value": "Red & green dual stone embellishments"},
            {"name": "Finish", "value": "Oxidised silver-tone"},
        ],
        "qa_section": [
            {"q": "Are the red and green stones real gemstones?", "a": "No, these are decorative stone embellishments as part of the costume jewellery design, not precious gemstones."},
            {"q": "Is it heavy to wear?", "a": "No, it's designed to be lightweight for comfortable all-day wear."},
            {"q": "Suitable for daily wear or only special occasions?", "a": "It's styled for festive occasions and weddings, but works for casual ethnic outfits too."},
            RETURN_QA,
        ],
    },
    78: {  # Traditional silver peacock jhumka earrings
        "description": "A classic peacock-eye jhumka earring with tribal-inspired carvings in an oxidized silver-tone finish, built for comfortable regular wear.\n\nOxidized silver finish with detailed tribal-inspired carvings.\n\nVibrant peacock-eye stone centerpiece.\n\nClassic jhumka bell with hanging beads for graceful movement.\n\nLightweight and comfortable for regular wear.\n\nPerfect for festive, ethnic, and statement occasions.\n\nHigh-quality craftsmanship with durable materials.",
        "highlights": ["Peacock-eye stone centerpiece", "Tribal-inspired carvings", "Classic jhumka bell with beads", "Lightweight for regular wear"],
        "specifications": [
            {"name": "Motif", "value": "Peacock-eye stone centerpiece"},
            {"name": "Finish", "value": "Oxidized silver-tone, tribal carvings"},
            {"name": "Style", "value": "Classic jhumka bell with hanging beads"},
        ],
        "qa_section": [
            {"q": "Is this solid silver?", "a": "No, it's an oxidized silver-tone finish, not solid silver."},
            {"q": "Does it make noise when worn (jhumka bells)?", "a": "The hanging beads and bell design offer gentle, graceful movement rather than a loud jingle."},
            {"q": "Good for daily wear or special occasions?", "a": "It's comfortable enough for regular wear and also suited to festive and statement occasions."},
            RETURN_QA,
        ],
    },
    79: {  # Oxidised Mirror Work Drop Earrings
        "description": "A lightweight drop earring with round mirror work and ghungroo drops, finished in an antique oxidised silver look.\n\nOxidised silver finish with an antique look.\n\nElegant round mirror work accentuating ethnic design.\n\nDelicately carved with traditional motifs and ghungroo drops.\n\nLightweight construction for all-day comfort.\n\nSecure push back closure ensuring ease of wear.",
        "highlights": ["Round mirror work design", "Antique oxidised silver finish", "Ghungroo drop detailing", "Secure push-back closure"],
        "specifications": [
            {"name": "Finish", "value": "Oxidised silver, antique look"},
            {"name": "Design", "value": "Round mirror work with ghungroo drops"},
            {"name": "Closure", "value": "Push-back"},
        ],
        "qa_section": [
            {"q": "Is this real silver?", "a": "No, it has an oxidised silver finish with an antique look, not solid silver."},
            {"q": "What's the closure type?", "a": "A secure push-back closure."},
            {"q": "Is it lightweight?", "a": "Yes, it's built for all-day comfort."},
            RETURN_QA,
        ],
    },
    80: {  # White Pearl Kaan Chain
        "description": "A white pearl kaan chain designed to support and stabilize heavy earrings, reducing strain during long wear.\n\nElegant design complements ethnic and wedding wear.\n\nOffers strong support for heavy earrings to prevent discomfort.\n\nMade from high-quality, lustrous white pearls for a classic look.\n\nSuitable for festivals, weddings, and traditional celebrations.\n\nLightweight and comfortable for extended wear.\n\nEnhances overall traditional aesthetic with a subtle shine.",
        "highlights": ["Supports heavy earrings", "Lustrous white pearl design", "Lightweight, comfortable fit", "Suited to weddings & festivals"],
        "specifications": [
            {"name": "Material", "value": "White pearls (decorative)"},
            {"name": "Function", "value": "Ear support chain for heavy earrings"},
        ],
        "qa_section": [
            {"q": "Will this work with my existing earrings?", "a": "It's designed as a general support chain for heavy earrings — check that the attachment style matches your earrings."},
            {"q": "Are these real pearls?", "a": "The listing doesn't specify natural vs. imitation pearls — treat them as decorative pearls typical of fashion jewellery at this price point."},
            {"q": "What is a \"Kaan chain\" used for?", "a": "It's worn looped over the ear to help support and stabilize heavy earrings, reducing ear strain."},
            RETURN_QA,
        ],
    },
    81: {  # Gold Plated Triple Strand Ear Chains
        "description": "A three-layer gold-plated ear chain with CZ/American Diamond stones and micro bead detailing, made for weddings and festive wear.\n\nThree-layer tiered design combining gold chains and micro beads for textured beauty.\n\nOuter layer adorned with bezel-set sparkling round multi-color stones (CZ/American Diamonds).\n\nDelicate gold-toned micro bead inner layers add rich contrast and shimmer.\n\nHigh-quality micro gold plating ensures lasting shine and a premium finish.\n\nSecure S-hook and circular loop fastenings for easy attachment to earrings or hair.\n\nVersatile accessory that enhances wedding, party, and festive celebration outfits.",
        "highlights": ["Three-layer tiered chain design", "CZ/American Diamond stone accents", "Micro gold plating", "Secure S-hook fastening", "Suited to weddings & parties"],
        "specifications": [
            {"name": "Layers", "value": "Three-tier design"},
            {"name": "Plating", "value": "Micro gold plating"},
            {"name": "Stones", "value": "CZ / American Diamond, multi-color"},
            {"name": "Fastening", "value": "S-hook and circular loop"},
        ],
        "qa_section": [
            {"q": "Are these real diamonds?", "a": "No, they're CZ (cubic zirconia) / American Diamond stones — simulated stones, not natural diamonds."},
            {"q": "Will the gold plating last?", "a": "With care (avoiding water and perfume contact), the micro gold plating will last longer, though gradual fading is normal with regular wear."},
            {"q": "How does it attach — clip-on or with existing earrings?", "a": "It fastens via S-hook and circular loop, designed to attach to earrings or hair."},
            RETURN_QA,
        ],
    },
    82: {  # Elegant Traditional Pearl & Stone Embellished Jhumkas
        "description": "A bell-shaped jhumka earring finished in antique gold tone, set with pearls and red-and-green stones for a regal, festive look.\n\nIntricate Design: Featuring a classic bell-shaped Jhumka design, these earrings are adorned with shimmering pearls and vibrant red and green stones.\n\nRich Detailing: The top circular stud is delicately encircled with pearls and a central stone, perfectly complementing the ornate bell base.\n\nPerfect Finish: Finished in a beautiful antique gold tone, these earrings offer a sophisticated, regal look suitable for weddings, festive occasions, or cultural events.\n\nVersatile Styling: The classic color palette of pearls, red, and green makes these earrings a versatile addition to your jewelry collection, pairing effortlessly with sarees, lehengas, or kurtis.",
        "highlights": ["Classic bell-shaped jhumka", "Pearl & dual stone detailing", "Antique gold-tone finish", "Pairs with sarees, lehengas & kurtis"],
        "specifications": [
            {"name": "Style", "value": "Bell-shaped jhumka"},
            {"name": "Stones", "value": "Pearls with red & green stones"},
            {"name": "Finish", "value": "Antique gold tone"},
        ],
        "qa_section": [
            {"q": "Is this real gold?", "a": "No, it has an antique gold-tone finish, not solid gold."},
            {"q": "Are the pearls and stones real?", "a": "These are decorative pearls and stones as part of the costume jewellery design, not natural gemstones."},
            {"q": "What outfits does it pair well with?", "a": "It pairs well with sarees, lehengas, or kurtis for weddings and festive occasions."},
            RETURN_QA,
        ],
    },
    83: {  # Red Lotus Necklace Set
        "description": "A coordinated necklace and stud earring set with a red lotus motif and adjustable thread closure, made for festivals and pooja ceremonies.\n\nCoordinated necklace and stud earrings set.\n\nClassic red lotus flower motif for cultural elegance.\n\nAdjustable thread closure for customizable sizing.\n\nLightweight design for all-day comfort.\n\nPerfect for festivals, pooja ceremonies, and weddings.\n\nEthnic styling complements traditional attire.\n\nReady-to-wear festive jewellery set.",
        "highlights": ["Necklace + stud earring set", "Red lotus flower motif", "Adjustable thread closure", "Ready-to-wear for festivals & pooja"],
        "specifications": [
            {"name": "Set Includes", "value": "Necklace + stud earrings"},
            {"name": "Motif", "value": "Red lotus flower"},
            {"name": "Closure", "value": "Adjustable thread"},
        ],
        "qa_section": [
            {"q": "Is the size adjustable?", "a": "Yes, it has an adjustable thread closure for a customizable fit."},
            {"q": "What's included in this set?", "a": "A coordinated necklace and matching stud earrings."},
            {"q": "Is it suitable for pooja or religious ceremonies?", "a": "Yes, it's designed with a classic lotus motif suited for pooja ceremonies, festivals, and weddings."},
            RETURN_QA,
        ],
    },
    84: {  # Ruby floral necklace
        "description": "A floral-design necklace with red stone accents and diamond-style detailing, made for both casual and festive wear.\n\nExquisite floral design with delicate craftsmanship.\n\nHighlighted with subtle red stone accents.\n\nFeatures sparkling diamond detailing for added elegance.\n\nLightweight and comfortable for all-day wear.\n\nPerfect for elevating casual and festive outfits.",
        "highlights": ["Delicate floral design", "Red stone accents", "Sparkling diamond-style detailing", "Lightweight, all-day comfort"],
        "specifications": [
            {"name": "Design", "value": "Floral motif"},
            {"name": "Accents", "value": "Red stone with diamond-style detailing (simulated)"},
        ],
        "qa_section": [
            {"q": "Is this a real ruby or diamond?", "a": "No — \"Ruby\" refers to the red-stone floral design theme; the stones are decorative, not natural ruby or diamond."},
            {"q": "Is it lightweight for daily wear?", "a": "Yes, it's designed to be comfortable for all-day wear."},
            {"q": "What occasions does it suit?", "a": "It works for both casual and festive outfits."},
            RETURN_QA,
        ],
    },
    85: {  # Gold Heart Pendant Necklace
        "description": "A minimalist gold-toned heart pendant necklace on a stainless steel base, made for daily wear or as a meaningful gift.\n\nTimeless gold heart pendant necklace showcasing minimalist charm.\n\nDelicate gold-toned chain with a smooth, polished heart pendant.\n\nLightweight design ensures comfort during all-day wear.\n\nIdeal for daily wear, special occasions, or as a romantic gift.\n\nVersatile accessory that pairs well with various styles.\n\nSymbolizes love, making it meaningful for all occasions.\n\nStainless craftsmanship for lasting shine and durability.",
        "highlights": ["Minimalist heart pendant", "Gold-toned chain", "Stainless steel base for durability", "Lightweight, all-day comfort", "Popular as a romantic gift"],
        "specifications": [
            {"name": "Pendant", "value": "Polished heart shape"},
            {"name": "Chain Finish", "value": "Gold-toned"},
            {"name": "Base Material", "value": "Stainless steel"},
        ],
        "qa_section": [
            {"q": "Is this solid gold?", "a": "No, it's a gold-toned finish over stainless steel construction, not solid gold."},
            {"q": "Is it hypoallergenic?", "a": "This isn't specified by the manufacturer — if you have sensitive skin or metal allergies, we'd suggest caution as with any fashion jewellery."},
            {"q": "Good as a gift?", "a": "Yes, its heart pendant design is commonly chosen as a romantic or meaningful gift."},
            RETURN_QA,
        ],
    },
    86: {  # Gold Chain Black Stone Necklace
        "description": "A minimalist gold-toned chain necklace with a black stone accent, designed for comfortable daily wear.\n\nGold chain with a minimalistic design.\n\nBlack stone accents for an elegant touch.\n\nLightweight and comfortable to wear all day.\n\nModern, stylish look suitable for daily fashion.\n\nSkin-friendly finish for sensitive skin.",
        "highlights": ["Minimalist gold-toned chain", "Black stone accent", "Lightweight, all-day wear", "Skin-friendly finish"],
        "specifications": [
            {"name": "Design", "value": "Minimalist chain"},
            {"name": "Accent", "value": "Black stone"},
            {"name": "Finish", "value": "Gold-toned"},
        ],
        "qa_section": [
            {"q": "Is this real gold?", "a": "No, it's a gold-toned finish, not solid gold."},
            {"q": "Is it suitable for sensitive skin?", "a": "The manufacturer describes it as having a skin-friendly finish, but individual sensitivity can vary."},
            {"q": "Is it good for daily wear?", "a": "Yes, it's designed as a lightweight, minimal piece for everyday fashion."},
            RETURN_QA,
        ],
    },
    87: {  # Antique Temple Gold Jhumka Earrings
        "description": "A set of gold-plated temple-style jhumka earrings with floral filigree work and ruby-and-emerald-toned stones, made for bridal and festive wear.\n\nIntricately handcrafted floral motifs and detailed filigree work.\n\nVibrant ruby and emerald-toned stones enhancing traditional design.\n\nSet of 4 versatile earrings suitable for various occasions.\n\nMade with high-quality gold plating ensuring lasting shine.\n\nPerfect for bridal, festive, and cultural celebrations.",
        "highlights": ["Temple-style floral filigree", "Ruby & emerald-toned stones", "Set of 4 earrings", "Gold plated finish", "Suited to bridal & festive wear"],
        "specifications": [
            {"name": "Design", "value": "Floral filigree, temple-style"},
            {"name": "Stones", "value": "Ruby & emerald-toned (decorative)"},
            {"name": "Finish", "value": "Gold plated"},
            {"name": "Set Contents", "value": "4 earrings"},
        ],
        "qa_section": [
            {"q": "Does this come as one pair or multiple?", "a": "This listing is a set of 4 earrings as described by the manufacturer — check the product images to confirm exactly what's included."},
            {"q": "Are the ruby and emerald stones real?", "a": "No, they're ruby and emerald-toned decorative stones, not natural gemstones."},
            {"q": "Will the gold plating last?", "a": "With care (avoiding water, perfume, and lotion contact), the plating holds up better over time, though gradual fading is normal with regular wear."},
            RETURN_QA,
        ],
    },
    88: {  # Radha Krishna Antique Gold Earrings
        "description": "A South Indian-style earring featuring Radha Krishna motifs and maroon beads, finished in vintage antique gold tone.\n\nTraditional Radha Krishna motifs & floral detailing.\n\nRich maroon beads for a vibrant splash of color.\n\nElegant vintage antique gold finish.\n\nLightweight design for comfortable all-day wear.\n\nVersatile style with ethnic outfits and festive wear.\n\nPerfect for special occasions like weddings and festivals.",
        "highlights": ["Radha Krishna motif design", "Maroon bead detailing", "Vintage antique gold finish", "Lightweight, comfortable fit"],
        "specifications": [
            {"name": "Motif", "value": "Radha Krishna, floral detailing"},
            {"name": "Beads", "value": "Maroon"},
            {"name": "Finish", "value": "Vintage antique gold tone"},
        ],
        "qa_section": [
            {"q": "Is this real gold?", "a": "No, it has an antique gold-tone finish, not solid gold."},
            {"q": "Is it traditional South Indian style?", "a": "Yes, it features traditional Radha Krishna motifs typical of South Indian temple jewellery design."},
            {"q": "Suitable for weddings?", "a": "Yes, it's designed for weddings, festivals, and other special occasions."},
            RETURN_QA,
        ],
    },
}

updated = 0
for pid, data in ENRICHMENT.items():
    try:
        p = Product.objects.get(id=pid)
    except Product.DoesNotExist:
        print(f"  SKIP: product id {pid} not found")
        continue
    p.description = data["description"]
    p.highlights = data["highlights"]
    p.specifications = data["specifications"]
    p.qa_section = data["qa_section"]
    p.save()
    updated += 1
    print(f"  Updated: {p.name} (id={p.id})")

print(f"\nSuccessfully enriched {updated} products with description, specifications, and Q&A.")

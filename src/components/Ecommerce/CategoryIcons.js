import React from 'react';

const DEFAULT_ACCENT = '#F97316';

const svgProps = (className) => ({
  viewBox: '0 0 36 36',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2.4',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className,
  'aria-hidden': true,
});

// 1. Home & Kitchen — rounded house with orange-filled door
export const HomeKitchenIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path
      d="M14.5 29.6V21.6C14.5 20.4 15.4 19.5 16.6 19.5H19.4C20.6 19.5 21.5 20.4 21.5 21.6V29.6Z"
      fill={accentColor}
      stroke="none"
    />
    <path d="M5.5 16.8L18 6.8L30.5 16.8" />
    <path d="M9.2 14.8V28.2C9.2 29.1 9.9 29.8 10.8 29.8H25.2C26.1 29.8 26.8 29.1 26.8 28.2V14.8" />
  </svg>
);

// 2. Fashion & Apparel — rounded t-shirt with orange collar
export const FashionApparelIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M13.2 8.5L8.4 10.3C7.1 10.8 6.4 12.1 6.9 13.4L8.2 16.6C8.6 17.6 9.7 18.1 10.7 17.8L11.5 17.5V27.6C11.5 28.7 12.4 29.6 13.5 29.6H22.5C23.6 29.6 24.5 28.7 24.5 27.6V17.5L25.3 17.8C26.3 18.1 27.4 17.6 27.8 16.6L29.1 13.4C29.6 12.1 28.9 10.8 27.6 10.3L22.8 8.5" />
    <path
      d="M13 8.6C14.2 12.4 21.8 12.4 23 8.6"
      stroke={accentColor}
      strokeWidth="3"
    />
  </svg>
);

// 3. Electronics — rounded monitor with orange screen glint & indicator
export const ElectronicsIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <rect x="6" y="8" width="24" height="16.5" rx="3" />
    <path d="M18 24.5V29.2M12.5 29.2H23.5" />
    <path d="M23.5 12H26V14.5" stroke={accentColor} strokeWidth="2.4" />
    <circle cx="18" cy="21.4" r="1.4" fill={accentColor} stroke="none" />
  </svg>
);

// 4. Mobile & Accessories — rounded smartphone with orange home dot
export const MobileAccessoriesIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <rect x="10.2" y="5.5" width="15.6" height="25" rx="3.2" />
    <path d="M15.4 8.8H20.6" strokeWidth="2.2" />
    <circle cx="18" cy="25.6" r="2.2" fill={accentColor} stroke="none" />
  </svg>
);

// 5. Health & Personal Care — rounded heart with orange plus sign
export const HealthCareIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M21.8 26.6C20.5 27.7 19.2 28.6 18 29.4C18 29.4 6.8 22.3 6.8 14.3C6.8 10.4 9.8 7.6 13.4 7.6C15.6 7.6 17.2 8.7 18 10.3C18.8 8.7 20.4 7.6 22.6 7.6C26.2 7.6 29.2 10.4 29.2 14.3C29.2 16 28.6 17.7 27.7 19.3" />
    <path d="M25.4 20.4V28.4M21.4 24.4H29.4" stroke={accentColor} strokeWidth="3.2" />
  </svg>
);

// 6. Beauty & Personal Care — rounded pump bottle with orange circle accent
export const BeautyCareIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M14.2 7.2H21.8M18 7.2V11.2" />
    <path d="M14.8 11.2H21.2V14H14.8Z" />
    <path d="M14.8 14C10.8 15.5 8.8 19.4 8.8 23.6C8.8 27.1 11.3 29.5 14.6 29.5H19.4" />
    <path d="M21.2 14C24.6 15.3 26.6 18 27 21.2" />
    <circle cx="24.5" cy="25.5" r="3.6" stroke={accentColor} strokeWidth="2.8" />
  </svg>
);

// 7. Kids — kawaii plush teddy bear with big round ears, orange muzzle & belly heart
export const KidsIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    {/* Orange inner-ear dots */}
    <circle cx="10.4" cy="9.2" r="1.4" fill={accentColor} stroke="none" />
    <circle cx="25.6" cy="9.2" r="1.4" fill={accentColor} stroke="none" />
    {/* Big round ears */}
    <path d="M9.6 12.2C7.4 11.4 6.8 8.8 8.2 7.2C9.6 5.6 12.4 5.8 13.6 7.8" />
    <path d="M26.4 12.2C28.6 11.4 29.2 8.8 27.8 7.2C26.4 5.6 23.6 5.8 22.4 7.8" />
    {/* Chubby kawaii head */}
    <ellipse cx="18" cy="14.2" rx="8.4" ry="7.1" />
    {/* Wide-set cute eyes */}
    <circle cx="14.1" cy="13.1" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="21.9" cy="13.1" r="1.3" fill="currentColor" stroke="none" />
    {/* Soft orange muzzle + tiny button nose */}
    <ellipse cx="18" cy="16.3" rx="3.1" ry="2.2" fill={accentColor} stroke="none" />
    <ellipse cx="18" cy="15.6" rx="1.25" ry="0.9" fill="currentColor" stroke="none" />
    {/* Smooth plump seated body */}
    <path d="M12 20.2C9.4 22 8.8 25.4 10.2 27.8C11.4 29.6 14.4 30.2 18 30.2C21.6 30.2 24.6 29.6 25.8 27.8C27.2 25.4 26.6 22 24 20.2" />
    {/* Cute orange heart on the tummy */}
    <path
      d="M18 28.1C18 28.1 14.1 25.8 14.1 23.6C14.1 22.4 15 21.5 16.2 21.5C17 21.5 17.6 21.9 18 22.6C18.4 21.9 19 21.5 19.8 21.5C21 21.5 21.9 22.4 21.9 23.6C21.9 25.8 18 28.1 18 28.1Z"
      fill={accentColor}
      stroke="none"
    />
  </svg>
);

// 8. Korean Products — crisp 5-petal Korean blossom with radiant orange center & K-beauty sparkle
export const KoreanProductsIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    {[0, 72, 144, 216, 288].map((deg) => (
      <path
        key={deg}
        d="M15.4 14.4C13.6 11.2 14.6 6.8 18 6.8C21.4 6.8 22.4 11.2 20.6 14.4"
        transform={`rotate(${deg} 18 18.5)`}
        strokeWidth="2.2"
      />
    ))}
    <circle cx="18" cy="18.5" r="4.2" fill={accentColor} stroke="none" />
    <circle cx="18" cy="18.5" r="1.4" fill="#ffffff" stroke="none" />
    {/* Subtle K-beauty sparkle */}
    <path
      d="M29.5 5.2L30.2 7.1L32.1 7.8L30.2 8.5L29.5 10.4L28.8 8.5L26.9 7.8L28.8 7.1Z"
      fill={accentColor}
      stroke="none"
    />
  </svg>
);

// 9. Jewellery — rounded diamond with orange upper facets
export const JewelleryIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M8.2 15.2H27.8" stroke={accentColor} strokeWidth="2.2" />
    <path d="M11.6 8.8L14.2 15.2L18 8.8L21.8 15.2L24.4 8.8" stroke={accentColor} strokeWidth="2.1" />
    <path d="M11.2 8.5H24.8L29.5 15.2L18 29.5L6.5 15.2Z" />
    <path d="M14.2 15.2L18 29.5L21.8 15.2" strokeWidth="2" />
  </svg>
);

// 10. Furniture — rounded armchair with bold orange backrest & seat cushions
export const FurnitureIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    {/* Vibrant orange cushions */}
    <rect x="12.2" y="10.4" width="11.6" height="5.6" rx="2.2" fill={accentColor} stroke="none" />
    <rect x="10.2" y="18.2" width="15.6" height="4.4" rx="1.8" fill={accentColor} stroke="none" />
    {/* Navy rounded armchair frame */}
    <path d="M10 17.2V11.6C10 9.6 11.6 8 13.6 8H22.4C24.4 8 26 9.6 26 11.6V17.2" />
    <path d="M10 17.2H8.2C7 17.2 6 18.2 6 19.4V21.2C6 22.3 6.8 23.2 7.8 23.4V25.2C7.8 26.2 8.6 27 9.6 27H26.4C27.4 27 28.2 26.2 28.2 25.2V23.4C29.2 23.2 30 22.3 30 21.2V19.4C30 18.2 29 17.2 27.8 17.2H26" />
    <path d="M10.4 22.8H25.6M11.2 27V29.8M24.8 27V29.8" />
  </svg>
);

// 11. Home Improvement — rounded wrench/hammer tool with orange head
export const HomeImprovementIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M14.5 14.5L7.8 21.2C6.7 22.3 6.7 24.1 7.8 25.2L10.8 28.2C11.9 29.3 13.7 29.3 14.8 28.2L21.5 21.5" />
    <path
      d="M27.8 11.4C28.8 13.6 28.3 16.3 26.5 18.1C24.5 20.1 21.5 20.4 19.2 19L17 16.8C15.6 14.5 15.9 11.5 17.9 9.5C19.7 7.7 22.4 7.2 24.6 8.2L21.8 11L25 14.2L27.8 11.4Z"
      stroke={accentColor}
      strokeWidth="2.4"
    />
  </svg>
);

// 12. Toys & Games — rounded gamepad with orange D-pad plus & buttons
export const ToysGamesIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M11 12.5H25C27.8 12.5 30 14.8 30 17.6L29.2 24.2C28.9 26.4 26.5 27.6 24.6 26.5L21.8 24.5H14.2L11.4 26.5C9.5 27.6 7.1 26.4 6.8 24.2L6 17.6C6 14.8 8.2 12.5 11 12.5Z" />
    <path d="M12.2 16.5V20.5M10.2 18.5H14.2" stroke={accentColor} strokeWidth="2.4" />
    <circle cx="23.2" cy="17.2" r="1.45" fill={accentColor} stroke="none" />
    <circle cx="25.8" cy="19.8" r="1.45" fill={accentColor} stroke="none" />
  </svg>
);

// 13. Industrial & Scientific — rounded gear/flask with orange center
export const IndustrialScientificIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M14 7.5H22M15.5 7.5V14.2L9.2 25.4C8.2 27.1 9.4 29.2 11.4 29.2H24.6C26.6 29.2 27.8 27.1 26.8 25.4L20.5 14.2V7.5" />
    <path d="M11.6 22.8H24.4" stroke={accentColor} strokeWidth="2.6" />
    <circle cx="16.2" cy="25.8" r="1.3" fill={accentColor} stroke="none" />
    <circle cx="20.4" cy="25.2" r="1.1" fill={accentColor} stroke="none" />
  </svg>
);

// 14. Grocery — rounded basket with orange fruit accent
export const GroceryIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M7 15.5H29L26.8 27.2C26.5 28.4 25.4 29.2 24.2 29.2H11.8C10.6 29.2 9.5 28.4 9.2 27.2L7 15.5Z" />
    <path d="M12.5 15.5L16 8.5M23.5 15.5L20 8.5" />
    <circle cx="18" cy="22.4" r="3" fill={accentColor} stroke="none" />
  </svg>
);

// 15. Sports — rounded dumbbell with orange accent plates
export const SportsIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M12.5 18H23.5" strokeWidth="2.6" />
    <rect x="8.2" y="11.5" width="4.2" height="13" rx="2" />
    <rect x="23.6" y="11.5" width="4.2" height="13" rx="2" />
    <path d="M6 14.5V21.5M30 14.5V21.5" stroke={accentColor} strokeWidth="2.8" />
  </svg>
);

// 16. Books — rounded open book with orange bookmark
export const BooksIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M18 11.2C15.8 9.4 12.2 8.8 7.5 9.6V26.2C12.2 25.4 15.8 26 18 27.8C20.2 26 23.8 25.4 28.5 26.2V9.6C23.8 8.8 20.2 9.4 18 11.2Z" />
    <path d="M18 11.2V27.8" />
    <path d="M22.5 9.6V17.5L24.5 15.8L26.5 17.5V9.8" stroke={accentColor} strokeWidth="2.2" />
  </svg>
);

// 17. Appliances — rounded electric plug with orange power accent
export const AppliancesIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <path d="M13.5 7.5V13.5M22.5 7.5V13.5" stroke={accentColor} strokeWidth="2.6" />
    <path d="M10.5 13.5H25.5V17.8C25.5 21.8 22.1 25 18 25C13.9 25 10.5 21.8 10.5 17.8V13.5Z" />
    <path d="M18 25V29.5" />
  </svg>
);

// 18. All / Default — rounded 2x2 grid with orange top-right tile
export const AllCategoriesIcon = ({ className = 'w-8 h-8', accentColor = DEFAULT_ACCENT }) => (
  <svg {...svgProps(className)}>
    <rect x="7.5" y="7.5" width="8.5" height="8.5" rx="2.4" />
    <rect x="20" y="7.5" width="8.5" height="8.5" rx="2.4" stroke={accentColor} />
    <rect x="7.5" y="20" width="8.5" height="8.5" rx="2.4" />
    <rect x="20" y="20" width="8.5" height="8.5" rx="2.4" />
  </svg>
);

export const ROUNDED_LINE_CAT_ICONS = {
  'All': AllCategoriesIcon,
  'Home & Kitchen': HomeKitchenIcon,
  'Fashion & Apparel': FashionApparelIcon,
  'Fashion': FashionApparelIcon,
  'Electronics': ElectronicsIcon,
  'Mobile & Accessories': MobileAccessoriesIcon,
  'Mobiles': MobileAccessoriesIcon,
  'Health & Personal Care': HealthCareIcon,
  'Beauty & Personal Care': BeautyCareIcon,
  'Beauty': BeautyCareIcon,
  'Kids': KidsIcon,
  'Korean Products': KoreanProductsIcon,
  'Jewellery': JewelleryIcon,
  'Jewelry': JewelleryIcon,
  'Furniture': FurnitureIcon,
  'Home Improvement': HomeImprovementIcon,
  'Toys & Games': ToysGamesIcon,
  'Toys': ToysGamesIcon,
  'Industrial & Scientific': IndustrialScientificIcon,
  'Grocery': GroceryIcon,
  'Sports': SportsIcon,
  'Books': BooksIcon,
  'Appliances': AppliancesIcon,
};

export const getRoundedCategoryIcon = (name) => {
  if (!name) return AllCategoriesIcon;
  if (ROUNDED_LINE_CAT_ICONS[name]) return ROUNDED_LINE_CAT_ICONS[name];
  const n = name.toLowerCase();
  if (n.includes('home improvement')) return HomeImprovementIcon;
  if (n.includes('home') || n.includes('kitchen')) return HomeKitchenIcon;
  if (n.includes('fashion') || n.includes('apparel') || n.includes('cloth')) return FashionApparelIcon;
  if (n.includes('mobile') || n.includes('phone')) return MobileAccessoriesIcon;
  if (n.includes('electronic') || n.includes('tech') || n.includes('computer')) return ElectronicsIcon;
  if (n.includes('health')) return HealthCareIcon;
  if (n.includes('beauty') || n.includes('personal care') || n.includes('skin')) return BeautyCareIcon;
  if (n.includes('kid') || n.includes('baby')) return KidsIcon;
  if (n.includes('korean')) return KoreanProductsIcon;
  if (n.includes('jewel')) return JewelleryIcon;
  if (n.includes('furniture') || n.includes('sofa') || n.includes('chair')) return FurnitureIcon;
  if (n.includes('toy') || n.includes('game')) return ToysGamesIcon;
  if (n.includes('industrial') || n.includes('scientific')) return IndustrialScientificIcon;
  if (n.includes('grocery') || n.includes('food')) return GroceryIcon;
  if (n.includes('sport') || n.includes('fitness')) return SportsIcon;
  if (n.includes('book')) return BooksIcon;
  if (n.includes('appliance')) return AppliancesIcon;
  return AllCategoriesIcon;
};


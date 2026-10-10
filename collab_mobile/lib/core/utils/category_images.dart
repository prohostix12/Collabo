/// Representative photos for the Categories page, so each tile looks like its
/// category rather than whichever product happens to be listed first.
class CategoryImages {
  const CategoryImages._();

  static String _u(String id) =>
      'https://images.unsplash.com/$id?auto=format&fit=crop&w=400&q=80';

  static final Map<String, String> _map = {
    'Electronics': _u('photo-1498049860654-af1a5c566876'),
    'Gadgets & Electronics': _u('photo-1498049860654-af1a5c566876'),
    'Mobiles': _u('photo-1511707171634-5f897ff02aa9'),
    'Mobile & Accessories': _u('photo-1511707171634-5f897ff02aa9'),
    'Fashion': _u('photo-1483985988355-763728e1935b'),
    'Grocery': _u('photo-1542838132-92c53300491e'),
    'Home & Kitchen': _u('photo-1556911220-e15b29be8c8f'),
    'Home & Lifestyle': _u('photo-1556911220-e15b29be8c8f'),
    'Beauty': _u('photo-1522337360788-8b13dee7a37e'),
    'Beauty & Personal Care': _u('photo-1522337360788-8b13dee7a37e'),
    'Health & Personal Care': _u('photo-1584308666744-24d5c474f2ae'),
    'Furniture': _u('photo-1555041469-a586c61ea9bc'),
    'Sports': _u('photo-1461896836934-ffe607ba8211'),
    'Books': _u('photo-1495446815901-a7297e633e8d'),
    'Toys': _u('photo-1566576912321-d58ddd7a6088'),
    'Kids': _u('photo-1515488042361-ee00e0ddd4e4'),
    'Korean Products': _u('photo-1556228720-195a672e8a03'),
    'Jewellery': _u('photo-1515562141207-7a88fb7ce338'),
    'Appliances': _u('photo-1585338107529-13afc5f02586'),
  };

  static String? of(String name) => _map[name];
}

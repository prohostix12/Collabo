import 'package:collabo/core/providers.dart';
import 'package:collabo/core/storage/token_storage.dart';
import 'package:collabo/core/theme/app_theme.dart';
import 'package:collabo/data/models/product.dart';
import 'package:collabo/shared/widgets/product_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

final _product = Product.fromJson({
  'id': 1,
  'name': 'Ergonomic Foldable Aluminium Laptop Stand with Six Adjustable Angles',
  'brand': 'DeoDap',
  'price': '1899.00',
  'discount_price': '299.00',
  'discount_percent': 84,
  'rating': '4.30',
  'reviews_count': 128,
  'image': '',
  'stock': 3,
});

Widget _harness({required ThemeData theme, required double textScale, required double width}) {
  return ProviderScope(
    overrides: [tokenStorageProvider.overrideWithValue(TokenStorage())],
    child: MaterialApp(
      theme: theme,
      home: MediaQuery(
        data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
        child: Builder(
          builder: (context) => Scaffold(
            body: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: SizedBox(width: width)),
                SliverProductGrid(products: List.filled(4, _product)),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

void main() {
  final theme = AppTheme.light();
  {
    for (final scale in [1.0, 1.3, 1.6]) {
      testWidgets('ProductCard lays out without overflow (text x$scale)', (tester) async {
        tester.view.physicalSize = const Size(360 * 3, 800 * 3);
        tester.view.devicePixelRatio = 3;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(_harness(theme: theme, textScale: scale, width: 360));
        await tester.pump();

        expect(tester.takeException(), isNull);
        expect(find.text('84% OFF'), findsWidgets);
        expect(find.bySemanticsLabel(RegExp(r'Price ₹299, was ₹1,899')), findsWidgets);
        expect(find.byTooltip('Add to wishlist'), findsWidgets);
      });
    }
  }

  testWidgets('Grid uses more columns on tablets', (tester) async {
    tester.view.physicalSize = const Size(1024 * 2, 1366 * 2);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_harness(theme: AppTheme.light(), textScale: 1, width: 1024));
    await tester.pump();

    final cards = tester.widgetList(find.byType(ProductCard)).length;
    expect(cards, 4);
    final first = tester.getTopLeft(find.byType(ProductCard).at(0));
    final fourth = tester.getTopLeft(find.byType(ProductCard).at(3));
    expect(first.dy, fourth.dy, reason: 'four cards fit on one row at tablet width');
  });
}

import 'package:collabo/shared/widgets/animated_wallet_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _host(Widget child) => MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.deepPurple,
        body: Row(children: [const Spacer(), child]),
      ),
    );

void main() {
  testWidgets('is on screen and taps through', (tester) async {
    var taps = 0;
    await tester.pumpWidget(_host(AnimatedWalletButton(balance: 0, label: 'Earn', onPressed: () => taps++)));

    expect(find.byType(AnimatedWalletButton), findsOneWidget);
    await tester.tap(find.byType(AnimatedWalletButton));
    expect(taps, 1);

    await tester.pumpWidget(const SizedBox()); // dispose: cancels its timers
  });

  testWidgets('pops the balance out of the wallet, then tucks it away again', (tester) async {
    await tester.pumpWidget(_host(AnimatedWalletButton(balance: 250, onPressed: () {})));

    expect(find.text('₹250'), findsNothing); // resting state: just the icon
    await tester.pump(const Duration(milliseconds: 1500)); // first run starts
    await tester.pump(const Duration(milliseconds: 1200));
    expect(find.text('₹250'), findsOneWidget); // chip is out

    await tester.pump(const Duration(milliseconds: 2500)); // run finishes (3s)
    expect(find.text('₹250'), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('guests see a label instead of a balance', (tester) async {
    await tester.pumpWidget(_host(AnimatedWalletButton(balance: 0, label: 'Earn', onPressed: () {})));
    await tester.pump(const Duration(milliseconds: 1500));
    await tester.pump(const Duration(milliseconds: 1200));

    expect(find.text('Earn'), findsOneWidget);
    expect(find.text('₹0'), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });
}

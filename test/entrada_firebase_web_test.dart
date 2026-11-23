// Execute em Chrome com o Firebase Auth Emulator ativo em 127.0.0.1:9099.
import 'dart:math';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/tela_login.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/firebase_options.dart';
import 'package:sentinela/main.dart';

void main() {
  testWidgets('sessão existente no emulador não redireciona a abertura', (tester) async {
    await tester.runAsync(() async {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      await FirebaseAuth.instance.useAuthEmulator('127.0.0.1', 9099);
      final suffix = '${DateTime.now().microsecondsSinceEpoch}${Random.secure().nextInt(1 << 32)}';
      await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: 'entrada-$suffix@example.test', password: 'Sentinela$suffix!',
      );
    });
    final uid = FirebaseAuth.instance.currentUser!.uid;
    try {
      await tester.pumpWidget(const MeuApp());
      expect(find.byType(TelaLogin), findsOneWidget);
      expect(find.byType(TelaHome), findsNothing);
      await tester.pumpAndSettle();
      expect(find.byType(TelaLogin), findsOneWidget);
      expect(find.byType(TelaHome), findsNothing);
      expect(FirebaseAuth.instance.currentUser?.uid, uid);
    } finally {
      await tester.runAsync(() async { await FirebaseAuth.instance.currentUser?.delete(); });
    }
  }, skip: !kIsWeb);
}

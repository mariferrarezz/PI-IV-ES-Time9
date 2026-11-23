// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'features/auth/tela_login.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sentinela/firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  const enderecoConfigurado = String.fromEnvironment('FIREBASE_EMULATOR_HOST');
  final endereco = enderecoConfigurado.isNotEmpty
      ? enderecoConfigurado
      : (!kIsWeb && defaultTargetPlatform == TargetPlatform.android
          ? '10.0.2.2' : '127.0.0.1');
  await FirebaseAuth.instance.useAuthEmulator(endereco, 9099);
  runApp(const MeuApp());
}

class MeuApp extends StatelessWidget {
  const MeuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sentinela',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Color(0xFF1B5E20)),
      home: const TelaLogin(),
    );
  }
}

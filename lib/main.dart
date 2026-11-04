// lib/main.dart
import 'package:flutter/material.dart';
// import 'features/auth/tela_bem_vindo.dart';
<<<<<<< HEAD:mobile/lib/main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sentinela/firebase_options.dart';
import 'features/auth/tela_questionario1.dart';
import 'features/auth/tela_culturaEspecifica.dart';
=======
// import 'features/auth/tela_questionario1.dart';
// import 'features/auth/tela_cultura_especifica.dart';
import 'features/dashboard/home/tela_home.dart';
>>>>>>> b53b703de97be24b9a1171aba4aadb11888d55b6:lib/main.dart

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await FirebaseAuth.instance.useAuthEmulator(
    '127.0.0.1',
    9099,
  );
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
      home: const TelaHome(),
    );
  }
}

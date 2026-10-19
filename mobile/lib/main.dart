// lib/main.dart
import 'package:flutter/material.dart';
import 'features/auth/tela_cadastro_verificacao.dart';

void main() {
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
      home: const TelaVerificacaoCodigo(),
    );
  }
}

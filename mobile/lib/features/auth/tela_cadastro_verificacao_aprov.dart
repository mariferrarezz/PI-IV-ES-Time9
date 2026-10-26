import 'package:flutter/material.dart';

class TelaCadastroVerificacaoAprov extends StatefulWidget {
  const TelaCadastroVerificacaoAprov({super.key});

  @override
  State<TelaCadastroVerificacaoAprov> createState() =>
      _TelaCadastroVerificacaoAprovState();
}

class _TelaCadastroVerificacaoAprovState
    extends State<TelaCadastroVerificacaoAprov> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 1. TÍTULO DA LOGO (Substituído temporariamente por texto para garantir que não é erro de asset)
                const Text(
                  'SENTINELA',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF5C4033), // Tom marrom da logo
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 40),

                // 2. CAIXA CINZA COM O CONTEÚDO
                Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 450),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 40,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F4F3),
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Verificação concluída!',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1B5E20),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 30),

                      // CÍRCULO VERDE COM O ÍCONE
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Color(0xFF1B5E20),
                          size: 45,
                        ),
                      ),

                      const SizedBox(height: 30),

                      const Text(
                        'Redirecionando para a tela principal...',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF4E6B51),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

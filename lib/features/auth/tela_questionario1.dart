import 'package:flutter/material.dart';

import 'tela_questionario2.dart';

class TelaQuestionario1 extends StatefulWidget {
  const TelaQuestionario1({super.key});

  @override
  State<TelaQuestionario1> createState() => _TelaQuestionario1();
}

class _TelaQuestionario1 extends State<TelaQuestionario1> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. HEADER: LOGO E TÍTULO SENTINELA
              Center(
                child: Image.asset(
                  'assets/images/logoSentinela.png',
                  height: 180,
                  width: 220,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 16.0),

              // 3. CAIXA CINZA ARREDONDADA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F4F3),
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Vamos conhecer sua propriedade',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                    SizedBox(height: 25),
                    const Text(
                      'Essas informações nos ajudam a entender a situação atual da sua propriedade',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color.fromARGB(255, 151, 150, 150),
                        height: 1.3,
                      ),
                    ),
                    SizedBox(height: 20),
                    // 3. CAIXA BRANCA INTERNA COM OS ÍCONES MANUAIS E LINHAS
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Ícone 1 (ATIVO NESTA TELA - Casinha)
                          Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(
                                0xFFF4F6F4,
                              ), // Fundo mais marcado por estar ativo
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.house_outlined,
                              size: 18,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          // Linha 1
                          Expanded(
                            child: Container(
                              height: 1.5,
                              color: const Color(0xFFD3DCD5),
                            ),
                          ),

                          // Ícone 2 (Inativo)
                          Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF4F6F4),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.eco_outlined,
                              size: 18,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          // Linha 2
                          Expanded(
                            child: Container(
                              height: 1.5,
                              color: const Color(0xFFD3DCD5),
                            ),
                          ),

                          // Ícone 3 (Inativo)
                          Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF4F6F4),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.straighten_outlined,
                              size: 18,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          // Linha 3
                          Expanded(
                            child: Container(
                              height: 1.5,
                              color: const Color(0xFFD3DCD5),
                            ),
                          ),

                          // Ícone 4 (Inativo)
                          Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF4F6F4),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.error_outline,
                              size: 18,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          // Linha 4
                          Expanded(
                            child: Container(
                              height: 1.5,
                              color: const Color(0xFFD3DCD5),
                            ),
                          ),

                          // Ícone 5 (Inativo)
                          Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF4F6F4),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.search,
                              size: 18,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          // Linha 5
                          Expanded(
                            child: Container(
                              height: 1.5,
                              color: const Color(0xFFD3DCD5),
                            ),
                          ),

                          // Ícone 6 (Inativo)
                          Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF4F6F4),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.science_outlined,
                              size: 18,
                              color: Color(0xFF00501E),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52.0,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TelaQuestionario2(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF135323),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30.0),
                    ),
                  ),
                  child: const Text(
                    'CONTINUAR',
                    style: TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

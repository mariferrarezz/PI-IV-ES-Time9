import 'package:flutter/material.dart';
import 'tela_questionario3.dart'; // Ajuste conforme a sua próxima tela

class TelaQuestionario6 extends StatefulWidget {
  const TelaQuestionario6({super.key});

  @override
  State<TelaQuestionario6> createState() => _TelaQuestionario6State();
}

class _TelaQuestionario6State extends State<TelaQuestionario6> {
  // Variáveis separadas para controlar a seleção de cada pergunta
  int? _frequenciaSelecionada;
  int? _identificacaoSelecionada;

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
                  errorBuilder: (context, error, stackTrace) {
                    return const Text(
                      'Sentinela',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16.0),

              // 2. CAIXA CINZA ARREDONDADA PRINCIPAL
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // TÍTULO DA SEÇÃO
                    const Text(
                      'Últimas informações',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1B5E20),
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // PERGUNTA 1
                    const Text(
                      'Com que frequencia voce encontra pragas ou doenças ?',
                      style: TextStyle(
                        fontSize: 15,
                        color: Color(0xFF1B5E20),
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // OPÇÕES DA PERGUNTA 1
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'Raramente',
                      indice: 0,
                      grupoSelecionado: _frequenciaSelecionada,
                      onTap: () {
                        setState(() {
                          _frequenciaSelecionada = 0;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'As vezes',
                      indice: 1,
                      grupoSelecionado: _frequenciaSelecionada,
                      onTap: () {
                        setState(() {
                          _frequenciaSelecionada = 1;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'Frequentemente',
                      indice: 2,
                      grupoSelecionado: _frequenciaSelecionada,
                      onTap: () {
                        setState(() {
                          _frequenciaSelecionada = 2;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'Sempre',
                      indice: 3,
                      grupoSelecionado: _frequenciaSelecionada,
                      onTap: () {
                        setState(() {
                          _frequenciaSelecionada = 3;
                        });
                      },
                    ),

                    const SizedBox(height: 32),

                    // PERGUNTA 2
                    const Text(
                      'Voce costuma identificar as pragas/ doenças sozinho ?',
                      style: TextStyle(
                        fontSize: 15,
                        color: Color(0xFF1B5E20),
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // OPÇÕES DA PERGUNTA 2
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'Sim',
                      indice: 0,
                      grupoSelecionado: _identificacaoSelecionada,
                      onTap: () {
                        setState(() {
                          _identificacaoSelecionada = 0;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'Não',
                      indice: 1,
                      grupoSelecionado: _identificacaoSelecionada,
                      onTap: () {
                        setState(() {
                          _identificacaoSelecionada = 1;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _construirOpcaoComBolinhaEsquerda(
                      texto: 'As vezes',
                      indice: 2,
                      grupoSelecionado: _identificacaoSelecionada,
                      onTap: () {
                        setState(() {
                          _identificacaoSelecionada = 2;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // 3. BOTÃO CONTINUAR
              SizedBox(
                width: double.infinity,
                height: 70.0,
                child: ElevatedButton(
                  onPressed: () {
                    // Ação ao continuar
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TelaQuestionario3(),
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
                      fontSize: 20,
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

  // Widget auxiliar local para criar o item com a bolinha à esquerda e borda verde ao selecionar
  Widget _construirOpcaoComBolinhaEsquerda({
    required String texto,
    required int indice,
    required int? grupoSelecionado,
    required VoidCallback onTap,
  }) {
    bool selecionado = grupoSelecionado == indice;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: selecionado ? const Color(0xFF1B5E20) : Colors.transparent,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Bolinha à esquerda
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF66806E), width: 2),
              ),
              child: selecionado
                  ? Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF1B5E20),
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 16),
            // Texto da opção
            Text(
              texto,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1B5E20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

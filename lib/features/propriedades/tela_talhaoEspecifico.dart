import 'package:flutter/material.dart';
import 'package:sentinela/navegacao.dart';

import 'package:sentinela/features/ocorrencias/tela_registroEvolucao.dart';

class TelaTalhaoEspecifico extends StatefulWidget {
  const TelaTalhaoEspecifico({super.key});

  @override
  State<TelaTalhaoEspecifico> createState() => _TelaTalhaoEspecificoState();
}

class _TelaTalhaoEspecificoState extends State<TelaTalhaoEspecifico> {
  final int _indiceAtualNav = 1;

  // Card informativo da grade 2x2 (Cultura, Área, Plantio, Dias de ciclo)
  Widget _buildCardInfo({
    required IconData icone,
    required String rotulo,
    required String valor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F7F4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE1EBE3), width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFFD6E5D8),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(icone, color: const Color(0xFF00501E), size: 22),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rotulo,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF5A7363),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  valor,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00501E),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Mini-cards internos do bloco de ocorrência (Intensidade, Desde, Área afetada)
  Widget _buildMiniCardOcorrencia({
    required String titulo,
    required String valor,
    required Color corValor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titulo,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Color(0xFF5A7363),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              valor,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: corValor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget auxiliar para montar cada aba da barra de navegação
  Widget _buildItemNav({
    required IconData icon,
    required String label,
    required int indice,
    required bool ativo,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFF00501E), size: 22),
            const SizedBox(height: 3),
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00501E),
              ),
            ),
            const SizedBox(height: 3),
            Container(
              height: 3,
              width: 24,
              decoration: BoxDecoration(
                color: ativo ? const Color(0xFF00501E) : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Barra Superior (Voltar e Notificações)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF00501E),
                      size: 26,
                    ),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(
                      Icons.notifications_none_rounded,
                      color: Color(0xFF00501E),
                      size: 28,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 2. Cabeçalho do Talhão + Selo de Urgência
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Talhão 03',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Fazenda Boa Vista',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF88968D),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF6C8B6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'ALTA URGÊNCIA',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF9E3012),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // 3. Grade 2x2 de Informações do Talhão
              Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildCardInfo(
                          icone: Icons.eco_outlined,
                          rotulo: 'Cultura',
                          valor: 'Soja',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildCardInfo(
                          icone: Icons.map_outlined,
                          rotulo: 'Área',
                          valor: '12,5 ha',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildCardInfo(
                          icone: Icons.calendar_today_outlined,
                          rotulo: 'Plantio',
                          valor: '20/09',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildCardInfo(
                          icone: Icons.access_time_rounded,
                          rotulo: 'Dias de ciclo',
                          valor: '53 dias',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // 4. Card de Ocorrência Ativa
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCF0EA),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFF3D5C8), width: 1),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Cabeçalho da Ocorrência
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFFF3D5C8),
                              width: 1,
                            ),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.warning_amber_rounded,
                              color: Color(0xFF9E3012),
                              size: 24,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Ocorrência ativa',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF9E3012),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Ferrugem asiática da soja',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Tag DOENÇA + Sintoma
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'DOENÇA',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Manchas e amarelecimento das folhas',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF33473B),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 3 Mini-Cards Brancos (Intensidade, Desde, Área afetada)
                    Row(
                      children: [
                        _buildMiniCardOcorrencia(
                          titulo: 'Intensidade',
                          valor: 'Alta',
                          corValor: const Color(0xFF9E3012),
                        ),
                        const SizedBox(width: 8),
                        _buildMiniCardOcorrencia(
                          titulo: 'Desde',
                          valor: '20/10',
                          corValor: const Color(0xFF00501E),
                        ),
                        const SizedBox(width: 8),
                        _buildMiniCardOcorrencia(
                          titulo: 'Área afetada',
                          valor: '4,0 ha',
                          corValor: const Color(0xFF00501E),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Recomendação
                    const Text(
                      'Alta intensidade e alto potencial de disseminação. Recomenda-se buscar avaliação de um agrônomo ou especialista presencialmente.',
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: Color(0xFF33473B),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Botões de Ação
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              // Ação futura: Buscar agrônomo
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF9E3012),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                            child: const Text(
                              'Buscar agrônomo',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              // Ação futura: Registrar evolução
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const TelaRegistroEvolucao(),
                                ),
                              );
                            },
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF00501E),
                              side: const BorderSide(
                                color: Color(0xFF00501E),
                                width: 1.2,
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                            child: const Text(
                              'Registrar evolução',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE1EBE3), width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Evolução da ocorrência',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(height: 4),

                    Text(
                      'Ferrugem asiática · intensidade registrada por semana',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Área do grafico
                    SizedBox(
                      height: 170,
                      child: CustomPaint(
                        size: const Size(double.infinity, 170),
                        painter: _GraficoEvolucaoPainter(),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Texto de Observação no Rodapé
                    Text(
                      'O fungicida foi aplicado em 04/11 e a intensidade segue alta. Resultado em observação.',
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: Color(0xFF33473B),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Produtos já utilizados',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),

                  Text(
                    '3 aplicações',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF33473B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // 6. Lista de Aplicações / Histórico de Manejo
              Column(
                children: [
                  // Card 1: Fungicida triazol + estrobilurina (OBSERVANDO)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Ícone quadrado arredondado à esquerda
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.science_outlined,
                              color: Color(0xFF00501E),
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Nome do produto e alvo no centro
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Fungicida triazol +\nestrobilurina',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Contra ferrugem asiática',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Data e selo de status à direita
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '04/11',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFFAE6B1,
                                ), // Fundo amarelo claro
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'OBSERVANDO',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(
                                    0xFF7A4E00,
                                  ), // Texto marrom-dourado
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Card 2: Inseticida diamida (CONTROLADA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.science_outlined,
                              color: Color(0xFF00501E),
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Inseticida diamida',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Contra lagarta-da-soja',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '19/10',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFD6E5D8,
                                ), // Fundo verde claro
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'CONTROLADA',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(
                                    0xFF00501E,
                                  ), // Texto verde escuro
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Card 3: Fungicida estrobilurina (CONTROLADA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.science_outlined,
                              color: Color(0xFF00501E),
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Fungicida\nestrobilurina',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Contra mancha-alvo',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '12/10',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD6E5D8),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'CONTROLADA',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Produtos já utilizados',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),

                  Text(
                    '3 aplicações',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF33473B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // 6. Lista de Aplicações / Histórico de Manejo
              Column(
                children: [
                  // Card 1: Fungicida triazol + estrobilurina (OBSERVANDO)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Ícone quadrado arredondado à esquerda
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.science_outlined,
                              color: Color(0xFF00501E),
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Nome do produto e alvo no centro
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Fungicida triazol +\nestrobilurina',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Contra ferrugem asiática',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Data e selo de status à direita
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '04/11',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFFAE6B1,
                                ), // Fundo amarelo claro
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'OBSERVANDO',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(
                                    0xFF7A4E00,
                                  ), // Texto marrom-dourado
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Card 2: Inseticida diamida (CONTROLADA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.science_outlined,
                              color: Color(0xFF00501E),
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Inseticida diamida',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Contra lagarta-da-soja',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '19/10',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFD6E5D8,
                                ), // Fundo verde claro
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'CONTROLADA',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(
                                    0xFF00501E,
                                  ), // Texto verde escuro
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Card 3: Fungicida estrobilurina (CONTROLADA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.science_outlined,
                              color: Color(0xFF00501E),
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Fungicida\nestrobilurina',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Contra mancha-alvo',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '12/10',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD6E5D8),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'CONTROLADA',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // Seção: Pragas e doenças encontradas
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cabeçalho da Seção ("Pragas e doenças encontradas" + "3 registros")
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: const [
                      Text(
                        'Pragas e doenças encontradas',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      Text(
                        '3 registros',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF5A7363),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Card 1: Ferrugem asiática (DOENÇA · ATIVA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(
                          0xFFF3D5C8,
                        ), // Borda pêssego sutil por estar ativa
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Flexible(
                                    child: Text(
                                      'Ferrugem asiática',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF00501E),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFD6E5D8),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'DOENÇA',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF00501E),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Desde 20/10 · intensidade alta',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF6C8B6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'ATIVA',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF9E3012),
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Card 2: Lagarta-da-soja (PRAGA · CONTROLADA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Flexible(
                                    child: Text(
                                      'Lagarta-da-soja',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF00501E),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(
                                        0xFFF6D2B0,
                                      ), // Fundo laranja claro para PRAGA
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'PRAGA',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF9E4700),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                '18/10 a 26/10 · intensidade média',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'CONTROLADA',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Card 3: Mancha-alvo (DOENÇA · CONTROLADA)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFFE1EBE3),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Flexible(
                                    child: Text(
                                      'Mancha-alvo',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF00501E),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFD6E5D8),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'DOENÇA',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF00501E),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                '10/10 a 24/10 · intensidade baixa',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF5A7363),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD6E5D8),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'CONTROLADA',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),

      // BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE
      bottomNavigationBar: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.topCenter,
          children: [
            Container(
              height: 75,
              decoration: BoxDecoration(
                color: const Color(0xFFF4F7F4),
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: const Color(0xFFE2EBE3), width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildItemNav(
                    icon: Icons.home_outlined,
                    label: 'INÍCIO',
                    indice: 0,
                    ativo: _indiceAtualNav == 0,
                    onTap: () => navegarPrincipal(context, 0, -1),
                  ),
                  _buildItemNav(
                    icon: Icons.map_outlined,
                    label: 'TALHÕES',
                    indice: 1,
                    ativo: _indiceAtualNav == 1,
                    onTap: () => navegarPrincipal(context, 1, -1),
                  ),
                  const SizedBox(width: 50),
                  _buildItemNav(
                    icon: Icons.language_outlined,
                    label: 'COMUNIDADE',
                    indice: 3,
                    ativo: _indiceAtualNav == 3,
                    onTap: () => navegarPrincipal(context, 3, -1),
                  ),
                  _buildItemNav(
                    icon: Icons.person_outline_rounded,
                    label: 'PERFIL',
                    indice: 4,
                    ativo: _indiceAtualNav == 4,
                    onTap: () => navegarPrincipal(context, 4, -1),
                  ),
                ],
              ),
            ),
            Positioned(
              top: -22,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () => navegarPrincipal(context, 2, -1),
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00501E),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00501E)
                                .withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(Icons.add, color: Colors.white, size: 32),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'REGISTRAR',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GraficoEvolucaoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Margens internas para acomodar textos do eixo Y (esquerda), topo e datas (baixo)
    const double leftMargin = 48.0;
    const double rightMargin = 12.0;
    const double topMargin = 26.0;
    const double bottomMargin = 28.0;

    final double chartWidth = size.width - leftMargin - rightMargin;
    final double chartHeight = size.height - topMargin - bottomMargin;

    // Coordenadas Y para os 3 níveis: Alta (topo), Média (meio), Baixa (base)
    final double yAlta = topMargin;
    final double yMedia = topMargin + (chartHeight / 2);
    final double yBaixa = topMargin + chartHeight;

    // 1. Desenhar linhas horizontais de grade e rótulos do Eixo Y
    final paintGrid = Paint()
      ..color = const Color(0xFFE5ECE6)
      ..strokeWidth = 1.2;

    final niveis = [
      {'label': 'Alta', 'y': yAlta},
      {'label': 'Média', 'y': yMedia},
      {'label': 'Baixa', 'y': yBaixa},
    ];

    for (var nivel in niveis) {
      final double y = nivel['y'] as double;
      // Linha cinza horizontal
      canvas.drawLine(
        Offset(leftMargin, y),
        Offset(size.width - rightMargin, y),
        paintGrid,
      );

      // Texto do eixo Y (Alta, Média, Baixa)
      final textPainter = TextPainter(
        text: TextSpan(
          text: nivel['label'] as String,
          style: const TextStyle(
            color: Color(0xFF5A7363),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();

      textPainter.paint(
        canvas,
        Offset(
          leftMargin - textPainter.width - 10,
          y - (textPainter.height / 2),
        ),
      );
    }

    // Posições X das 4 semanas (espaçadas proporcionalmente)
    final double stepX = chartWidth / 3.3;
    final List<double> pontosX = [
      leftMargin + 12,
      leftMargin + 12 + stepX,
      leftMargin + 12 + (stepX * 2),
      leftMargin + 12 + (stepX * 3),
    ];

    // Valores correspondentes de cada semana (Baixa -> Média -> Alta -> Alta)
    final List<double> pontosY = [
      yBaixa, // 20/10 -> Baixa
      yMedia, // 27/10 -> Média
      yAlta, // 03/11 -> Alta
      yAlta, // 10/11 -> Alta
    ];

    final List<String> datas = ['20/10', '27/10', '03/11', '10/11'];

    // 2. Desenhar a linha vertical tracejada ("Fungicida · 04/11")
    // Fica logo após o 3º ponto (03/11)
    final double xFungicida = pontosX[2] + (stepX * 0.22);
    final paintDashed = Paint()
      ..color = const Color(0xFF9E3012)
      ..strokeWidth = 1.6;

    double currentY = topMargin - 10;
    const double dashHeight = 4;
    const double dashSpace = 4;
    while (currentY < yBaixa + 8) {
      canvas.drawLine(
        Offset(xFungicida, currentY),
        Offset(xFungicida, currentY + dashHeight),
        paintDashed,
      );
      currentY += dashHeight + dashSpace;
    }

    // Texto "Fungicida · 04/11" no topo do tracejado
    final fungicidaText = TextPainter(
      text: const TextSpan(
        text: 'Fungicida · 04/11',
        style: TextStyle(
          color: Color(0xFF9E3012),
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    fungicidaText.paint(
      canvas,
      Offset(xFungicida - (fungicidaText.width / 2), 0),
    );

    // 3. Desenhar a linha verde conectando os pontos
    final paintLinhaVerde = Paint()
      ..color = const Color(0xFF00501E)
      ..strokeWidth = 2.4
      ..style = PaintingStyle.stroke;

    final path = Path()..moveTo(pontosX[0], pontosY[0]);
    for (int i = 1; i < pontosX.length; i++) {
      path.lineTo(pontosX[i], pontosY[i]);
    }
    canvas.drawPath(path, paintLinhaVerde);

    // 4. Desenhar os pontos circulares verdes com borda branca e as datas embaixo
    final paintPontoBorda = Paint()..color = Colors.white;
    final paintPontoMiolo = Paint()..color = const Color(0xFF00501E);

    for (int i = 0; i < pontosX.length; i++) {
      final center = Offset(pontosX[i], pontosY[i]);
      canvas.drawCircle(center, 6.5, paintPontoBorda); // Borda branca externa
      canvas.drawCircle(center, 4.5, paintPontoMiolo); // Círculo verde interno

      // Texto da data no eixo X (20/10, 27/10, 03/11, 10/11)
      final dataPainter = TextPainter(
        text: TextSpan(
          text: datas[i],
          style: const TextStyle(
            color: Color(0xFF5A7363),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();

      dataPainter.paint(
        canvas,
        Offset(pontosX[i] - (dataPainter.width / 2), yBaixa + 12),
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

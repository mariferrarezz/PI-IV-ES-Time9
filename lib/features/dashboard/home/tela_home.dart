import 'package:flutter/material.dart';
import 'package:sentinela/features/catalogo/tela_catalogo.dart';

class TelaHome extends StatefulWidget {
  const TelaHome({super.key});

  @override
  State<TelaHome> createState() => _TelaHomeState();
}

class _TelaHomeState extends State<TelaHome> {
  // Índice selecionado para a barra de navegação inferior
  int _currentIndex = 0;

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
              // 1. CABEÇALHO (LOGO E NOTIFICAÇÃO)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Image.asset(
                    'assets/images/logoSentinela.png',
                    height: 45,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return const Text(
                        '🌱 Sentinela',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      );
                    },
                  ),
                  IconButton(
                    onPressed: () {
                      // Ação de notificações
                    },
                    icon: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        const Icon(
                          Icons.notifications_none_rounded,
                          color: Color(0xFF00501E),
                          size: 28,
                        ),
                        Positioned(
                          right: 2,
                          top: 2,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF00501E),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 2. SAUDAÇÃO
              const Text(
                'Bom dia, produtor!',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Acompanhe a saúde da sua plantação.',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Color(0xFF88968D),
                ),
              ),
              const SizedBox(height: 20),

              // 3. CARD DE RESUMO DA PROPRIEDADE
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF7F9F7),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE5EBE6)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Linha Superior do Card: Título e Dropdown da Fazenda
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Resumo da propriedade',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFD3E4D5)),
                          ),
                          child: Row(
                            children: const [
                              Icon(
                                Icons.home_outlined,
                                size: 14,
                                color: Color(0xFF00501E),
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Fazenda Boa Vista',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF00501E),
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(
                                Icons.keyboard_arrow_down,
                                size: 16,
                                color: Color(0xFF00501E),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Cards internos (Talhões e Alertas ativos)
                    Row(
                      children: [
                        // Talhões
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE2EBE3),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.eco_outlined,
                                    color: Color(0xFF00501E),
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'Talhões',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Color(0xFF4C6652),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      '08',
                                      style: TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF00501E),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Alertas ativos
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E6E0),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.warning_amber_rounded,
                                    color: Color(0xFFD96B27),
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'Alertas ativos',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Color(0xFF8C6658),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      '03',
                                      style: TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFD96B27),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 4. SEÇÃO: CONHEÇA E PREVINA
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Conheça e previna',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Pragas e doenças para identificar no campo',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF88968D),
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TelaCatalogo(),
                        ),
                      );
                    },
                    child: Row(
                      children: const [
                        Text(
                          'Ver todos',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          size: 16,
                          color: Color(0xFF00501E),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // 5. CARDS DE PRAGAS E DOENÇAS
              _buildPragaCard(
                titulo: 'Ferrugem asiática da soja',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao: 'Manchas e amarelecimento das folhas',
                acao: 'Sintomas e tratamento',
              ),
              const SizedBox(height: 12),
              _buildPragaCard(
                titulo: 'Lagarta-do-cartucho',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao: 'Folhas raspadas e perfuradas',
                acao: 'Identificação e controle',
              ),
              const SizedBox(height: 12),
              _buildPragaCard(
                titulo: 'Oídio',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao: 'Pó branco sobre a superfície foliar',
                acao: 'Sintomas e tratamento',
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),

      // 6. BARRA DE NAVEGAÇÃO INFERIOR COM O BOTÃO REGISTRAR INTEGRADO
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFF4F7F4),
          border: Border(top: BorderSide(color: Color(0xFFE5EBE6), width: 1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(0, Icons.home_rounded, 'INÍCIO'),
            _buildNavItem(1, Icons.map_outlined, 'TALHÕES'),

            // Botão central flutuante verde de Registrar com texto embaixo
            GestureDetector(
              onTap: () {
                // Ação ao clicar no botão de registrar
              },
              child: Transform.translate(
                offset: const Offset(
                  0,
                  -12,
                ), // Joga o botão ligeiramente para cima como na imagem
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: const BoxDecoration(
                        color: Color(0xFF00501E),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 2),
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
            ),

            _buildNavItem(3, Icons.public_outlined, 'COMUNIDADE'),
            _buildNavItem(4, Icons.person_outline_rounded, 'PERFIL'),
          ],
        ),
      ),
    );
  }

  // Widget auxiliar para construir os cards de pragas
  Widget _buildPragaCard({
    required String titulo,
    required String tipo,
    required Color tipoCor,
    required Color tipoTextColor,
    required String descricao,
    required String acao,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5EBE6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 75,
            height: 75,
            decoration: BoxDecoration(
              color: const Color(0xFFD3E4D5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.image_outlined, color: Color(0xFF00501E)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      titulo,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: tipoCor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    tipo,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: tipoTextColor,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  descricao,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF88968D),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      acao,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(
                      Icons.chevron_right,
                      size: 14,
                      color: Color(0xFF00501E),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Widget auxiliar para os itens da barra de navegação
  Widget _buildNavItem(int index, IconData icon, String label) {
    bool isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected
                ? const Color(0xFF00501E)
                : const Color(0xFF88968D),
            size: 22,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected
                  ? const Color(0xFF00501E)
                  : const Color(0xFF88968D),
            ),
          ),
          if (index == 0 && isSelected) ...[
            const SizedBox(height: 2),
            Container(
              width: 16,
              height: 2,
              decoration: BoxDecoration(
                color: const Color(0xFF00501E),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

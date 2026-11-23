import 'package:flutter/material.dart';

class CatalogoMurchaBacteriana extends StatefulWidget {
  const CatalogoMurchaBacteriana({super.key});

  @override
  State<CatalogoMurchaBacteriana> createState() => _CatalogoMurchaBacterianaState();
}

class _CatalogoMurchaBacterianaState extends State<CatalogoMurchaBacteriana> {
  String _abaSelecionada = 'Identificar';

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
              // Cabeçalho
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF00501E), size: 26),
                  ),
                  Image.asset(
                    'assets/images/logoSentinela.png',
                    height: 25,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTracer) => const Text(
                      '🌱 Sentinela',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF00501E)),
                    ),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF00501E), size: 28),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Imagem em destaque
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: double.infinity,
                  height: 220,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(
                        'assets/images/doencas/murcha_bacteriana.png',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: const Color(0xFFD3E4D5),
                          child: const Icon(Icons.image_outlined, color: Color(0xFF00501E), size: 48),
                        ),
                      ),
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2EBE3),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'DOENÇA',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF00501E)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 15),

              // Títulos
              const Text(
                'Murcha-bacteriana',
                style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold, color: Color(0xFF00501E)),
              ),
              const SizedBox(height: 4),
              const Text(
                'Ralstonia solanacearum',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF88968D)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Doença vascular bacteriana que provoca murcha e persiste no solo.',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF88968D)),
              ),
              const SizedBox(height: 16),

              // Chips
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: const Color(0xFFD3E4D5), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.eco_outlined, size: 18, color: Color(0xFF00501E)),
                        SizedBox(width: 6),
                        Text(
                          'Tomate',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF00501E)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: const Color(0xFFD3E4D5), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.eco_outlined, size: 18, color: Color(0xFF00501E)),
                        SizedBox(width: 6),
                        Text(
                          'Batata',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF00501E)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: const Color(0xFFD3E4D5), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.eco_outlined, size: 18, color: Color(0xFF00501E)),
                        SizedBox(width: 6),
                        Text(
                          'Calor',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF00501E)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              const Text(
                'Níveis de ocorrência',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF00501E)),
              ),
              const SizedBox(height: 12),

              // Cards de Nível
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F3EC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFC2D9C7)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Row(
                            children: [
                              Icon(Icons.circle, size: 10, color: Color(0xFF1B7339)),
                              SizedBox(width: 4),
                              Text('Baixo', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1B7339))),
                            ],
                          ),
                          SizedBox(height: 6),
                          Text('Sinais localizados (murcha nas horas quentes): registre o foco.', style: TextStyle(fontSize: 10, color: Color(0xFF335C3E), height: 1.2)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF7E0),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFF2E2B1)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Row(
                            children: [
                              Icon(Icons.circle, size: 10, color: Color(0xFFD48806)),
                              SizedBox(width: 4),
                              Text('Médio', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF8C5700))),
                            ],
                          ),
                          SizedBox(height: 6),
                          Text('Sinais em expansão (escurecimento vascular): intensifique a amostragem.', style: TextStyle(fontSize: 10, color: Color(0xFF6B5115), height: 1.2)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDECEA),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFF5C6C2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Row(
                            children: [
                              Icon(Icons.circle, size: 10, color: Color(0xFFD32F2F)),
                              SizedBox(width: 4),
                              Text('Alto', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFC62828))),
                            ],
                          ),
                          SizedBox(height: 6),
                          Text('Danos extensos (morte de plantas): procure assistência agronômica com prioridade.', style: TextStyle(fontSize: 10, color: Color(0xFF611A1A), height: 1.2)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Abas
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildBotaoAba('Identificar'),
                    const SizedBox(width: 8),
                    _buildBotaoAba('Causa'),
                    const SizedBox(width: 8),
                    _buildBotaoAba('Onde ocorre'),
                    const SizedBox(width: 8),
                    _buildBotaoAba('Prevenir'),
                    const SizedBox(width: 8),
                    _buildBotaoAba('Tratar'),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              _buildConteudoAba(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBotaoAba(String nomeAba) {
    bool selecionado = _abaSelecionada == nomeAba;
    return GestureDetector(
      onTap: () => setState(() => _abaSelecionada = nomeAba),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selecionado ? const Color(0xFF00501E) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF00501E), width: 1),
        ),
        child: Text(
          nomeAba,
          style: TextStyle(
            color: selecionado ? Colors.white : const Color(0xFF00501E),
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildConteudoAba() {
    switch (_abaSelecionada) {
      case 'Identificar':
        return _blocoConteudo(
          titulo: 'Como identificar',
          conteudo: '• Murcha nas horas quentes\n\n• Escurecimento vascular\n\n• Morte de plantas em reboleiras',
        );
      case 'Causa':
        return _blocoConteudo(
          titulo: 'O que causa na cultura',
          conteudo: '• Morte de plantas\n\n• Perda de produção\n\n• Contaminação de áreas',
        );
      case 'Onde ocorre':
        return _blocoConteudo(
          titulo: 'Onde e quando ocorre',
          conteudo: 'CULTURAS AFETADAS:\nTomate; Batata.\n\nONDE OLHAR:\nExamine plantas murchas, colo e vasos da base do caule.\n\nDICA DE CAMPO:\nO teste de exsudação auxilia a suspeita, mas não substitui diagnóstico.',
        );
      case 'Prevenir':
        return _blocoConteudo(
          titulo: 'Como prevenir',
          conteudo: '• Usar material propagativo sadio\n\n• Garantir drenagem\n\n• Evitar água contaminada',
        );
      case 'Tratar':
        return _blocoConteudo(
          titulo: 'Como tratar',
          conteudo: 'Não há tratamento simples que cure plantas infectadas; priorize contenção.\n\n⚠️ Consulte um agrônomo antes de aplicar. Agrotóxicos exigem receituário agronômico e uso de EPI.',
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _blocoConteudo({required String titulo, required String conteudo}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7F4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD3E4D5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titulo,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF00501E)),
          ),
          const SizedBox(height: 12),
          Text(
            conteudo,
            style: const TextStyle(fontSize: 13, height: 1.4, color: Color(0xFF335C3E)),
          ),
        ],
      ),
    );
  }
}

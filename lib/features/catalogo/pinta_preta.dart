import 'package:flutter/material.dart';

class CatalogoPintaPreta extends StatefulWidget {
  const CatalogoPintaPreta({super.key});

  @override
  State<CatalogoPintaPreta> createState() => _CatalogoPintaPretaState();
}

class _CatalogoPintaPretaState extends State<CatalogoPintaPreta> {
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
                        'assets/images/pinta_preta.png',
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
                'Pinta-preta',
                style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold, color: Color(0xFF00501E)),
              ),
              const SizedBox(height: 4),
              const Text(
                'Alternaria spp. (A. solani, A. grandis)',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF88968D)),
              ),
              const SizedBox(height: 8),
              const Text(
                'Doença foliar com lesões escuras de anéis concêntricos nas folhas inferiores.',
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
                          'Temperaturas quentes',
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
                          Text('Sinais localizados (manchas pardas concêntricas): registre o foco.', style: TextStyle(fontSize: 10, color: Color(0xFF335C3E), height: 1.2)),
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
                          Text('Sinais em expansão (halo amarelado): intensifique a amostragem.', style: TextStyle(fontSize: 10, color: Color(0xFF6B5115), height: 1.2)),
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
                          Text('Danos extensos (desfolha): procure assistência agronômica com prioridade.', style: TextStyle(fontSize: 10, color: Color(0xFF611A1A), height: 1.2)),
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
          conteudo: '• Manchas pardas concêntricas\n\n• Halo amarelado\n\n• Secamento das folhas inferiores',
        );
      case 'Causa':
        return _blocoConteudo(
          titulo: 'O que causa na cultura',
          conteudo: '• Desfolha\n\n• Exposição de frutos ao sol\n\n• Danos de qualidade e rendimento',
        );
      case 'Onde ocorre':
        return _blocoConteudo(
          titulo: 'Onde e quando ocorre',
          conteudo: 'CULTURAS AFETADAS:\nTomate; Batata.\n\nONDE OLHAR:\nObserve folhas inferiores, caules e frutos ou tubérculos.\n\nDICA DE CAMPO:\nO padrão de alvo não é exclusivo; diferencie de mancha-alvo por avaliação técnica.',
        );
      case 'Prevenir':
        return _blocoConteudo(
          titulo: 'Como prevenir',
          conteudo: '• Usar material de plantio sadio\n\n• Rotacionar com não solanáceas\n\n• Manter nutrição equilibrada',
        );
      case 'Tratar':
        return _blocoConteudo(
          titulo: 'Como tratar',
          conteudo: 'Integre medidas culturais e proteção fungicida conforme risco e cultura.\n\n⚠️ Consulte um agrônomo antes de aplicar. Agrotóxicos exigem receituário agronômico e uso de EPI.',
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

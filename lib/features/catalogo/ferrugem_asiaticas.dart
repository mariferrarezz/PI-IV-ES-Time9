import 'package:flutter/material.dart';

class CatalogoFerrugemAsiaticas extends StatefulWidget {
  const CatalogoFerrugemAsiaticas({super.key});

  @override
  State<CatalogoFerrugemAsiaticas> createState() =>
      _CatalogoFerrugemAsiaticaState();
}

class _CatalogoFerrugemAsiaticaState extends State<CatalogoFerrugemAsiaticas> {
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
              // Cabeçalho (Botão voltar, logo e notificações)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF00501E),
                      size: 26,
                    ),
                  ),
                  Image.asset(
                    'assets/images/logoSentinela.png',
                    height: 25,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTracer) {
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
                    onPressed: () {},
                    icon: const Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(
                          Icons.notifications_none_rounded,
                          color: Color(0xFF00501E),
                          size: 28,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Imagem da praga/doença em destaque ocupando a largura correta
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: double.infinity,
                  height: 220,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Imagem de fundo
                      Image.asset(
                        'assets/images/doencas/Ferrugem_asiatica_soja.png',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: const Color(0xFFD3E4D5),
                            child: const Icon(
                              Icons.image_outlined,
                              color: Color(0xFF00501E),
                              size: 48,
                            ),
                          );
                        },
                      ),

                      // Etiqueta flutuante
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2EBE3),
                            borderRadius: BorderRadius.circular(6),
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
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 15),

              // Títulos e informações textuais
              const Text(
                'Ferrugem asiática da soja',
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Phakopsora pachyrhizi',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF88968D),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Doença causada por fungo — atinge folhas',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF88968D),
                ),
              ),
              const SizedBox(height: 20),

              // Chips de Informações (Culturas e Clima)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: const Color(0xFFD3E4D5),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.eco_outlined,
                          size: 18,
                          color: Color(0xFF00501E),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Soja',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: const Color(0xFFD3E4D5),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.eco_outlined,
                          size: 18,
                          color: Color(0xFF00501E),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Feijão',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: const Color(0xFFD3E4D5),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.water_drop_outlined,
                          size: 18,
                          color: Color(0xFF00501E),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Alta umidade',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: const Color(0xFFD3E4D5),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.thermostat_outlined,
                          size: 18,
                          color: Color(0xFF00501E),
                        ),
                        SizedBox(width: 6),
                        Text(
                          '15 a 28 °C',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              const Text(
                'Níveis de ocorrência',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 10),

              // Cards de níveis (lado a lado estruturados corretamente)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Card Baixo
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F3EC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFFC2D9C7),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Row(
                            children: [
                              Icon(
                                Icons.circle,
                                size: 10,
                                color: Color(0xFF1B7339),
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Baixo',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1B7339),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Poucas folhas de baixo com pontos. Monitore a cada 3 a 5 dias.',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFF335C3E),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Card Médio
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF7E0),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFFF2E2B1),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Row(
                            children: [
                              Icon(
                                Icons.circle,
                                size: 10,
                                color: Color(0xFFD48806),
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Médio',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF8C5700),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Várias plantas afetadas. Intensifique o monitoramento.',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFF6B5115),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Card Alto
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDECEA),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFFF5C6C2),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Row(
                            children: [
                              Icon(
                                Icons.circle,
                                size: 10,
                                color: Color(0xFFD32F2F),
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Alto',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFC62828),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Folhas do topo e queda de folhas. Procure um agrônomo.',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFF611A1A),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

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
                    const SizedBox(width: 8),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Conteudo dinamico que muda quando o usuário clica na aba
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
      onTap: () {
        setState(() {
          _abaSelecionada = nomeAba;
        });
      },
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

  // Metodo que decide qual caixa de texto aparecera:
  Widget _buildConteudoAba() {
    switch (_abaSelecionada) {
      case 'Identificar':
        return _blocoConteudo(
          titulo: 'Como identificar',
          conteudo:
              '• Pequenos pontos escuros na face de baixo das folhas, que crescem e viram pústulas marrom-claras a avermelhadas.\n\n'
              '• As pústulas têm um furinho no centro, de onde sai um pó fino (os esporos).\n\n'
              '• As folhas amarelam, secam e caem antes da hora.\n\n'
              '• Costuma começar nas folhas de baixo e subir pela planta.',
        );
      case 'Causa':
        return _blocoConteudo(
          titulo: 'O que causa na cultura',
          conteudo:
              '• Queda precoce das folhas: a planta perde a área que produz energia antes de encher os grãos.\n\n'
              '• Grãos menores e mais leves, com menos grãos por vagem.\n\n'
              '• Em ataques severos sem controle, a perda de produtividade pode passar de 50%.',
        );

      case 'Onde ocorre':
        return _blocoConteudo(
          titulo: 'Onde e quando ocorre',
          conteudo:
              'CULTURAS AFETADAS:\nSoja (principal); Também pode atacar feijão, kudzu e outras leguminosas.\n\n'
              'CLIMA FAVORÁVEL:\n• Folhas molhadas por muitas horas: chuva, orvalho e neblina.\n'
              '• Temperaturas amenas, entre 15 e 28 °C (mais crítico de 20 a 25 °C).\n'
              '• Alta umidade e molhamento foliar prolongado.',
        );
      case 'Prevenir':
        return _blocoConteudo(
          titulo: 'Como prevenir',
          conteudo:
              '• Respeite o vazio sanitário: período do ano sem soja viva no campo.\n\n'
              '• Semeie dentro da época recomendada para a sua região e evite plantio tardio.\n\n'
              '• Elimine a soja que nasça sozinha (tiguera) nas bordas e em áreas vizinhas.',
        );
      case 'Tratar':
        return _blocoConteudo(
          titulo: 'Como tratar',
          conteudo:
              'O controle mais usado é com fungicidas, de preferência de forma preventiva ou nos primeiros sintomas.\n\n'
              '• Triazóis (Ex.: ciproconazol, protioconazol)\n'
              '• Estrobilurinas (Ex.: azoxistrobina, piraclostrobina)\n\n'
              'Consulte um agrônomo antes de aplicar defensivos.',
        );
      default:
        return const SizedBox.shrink();
    }
  }

  // Caixa padrão estilizada que engloba o texto de cada aba selecionada
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
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00501E),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            conteudo,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: Color(0xFF335C3E),
            ),
          ),
        ],
      ),
    );
  }
}

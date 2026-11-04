import 'package:flutter/material.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';

class TelaCatalogo extends StatefulWidget {
  const TelaCatalogo({super.key});

  @override
  State<TelaCatalogo> createState() => _TelaCatalogoState();
}

class _TelaCatalogoState extends State<TelaCatalogo> {
  // Função que abre o menu flutuante de filtros por cima da tela
  void _abrirFiltros(BuildContext context) {
    String tipoSelecionado = 'Todos';
    Set<String> culturasSelecionadas = {};
    Set<String> climasSelecionados = {};
    Set<String> partesSelecionadas = {};

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setStateModal) {
            return Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Barrinha cinza no topo do modal
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Cabeçalho do Modal
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Filtrar catálogo',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(
                            Icons.close,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Seção 1: Tipo (Seleção Única)
                    const Text(
                      'Tipo',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['Todos', 'Doença', 'Praga'].map((tipo) {
                        bool selecionado = tipoSelecionado == tipo;
                        return GestureDetector(
                          onTap: () {
                            setStateModal(() {
                              tipoSelecionado = tipo;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: selecionado
                                  ? const Color(0xFF00501E)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: const Color(0xFFD3E4D5),
                              ),
                            ),
                            child: Text(
                              tipo,
                              style: TextStyle(
                                color: selecionado
                                    ? Colors.white
                                    : const Color(0xFF00501E),
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Seção 2: Cultura (Múltipla Escolha)
                    const Text(
                      'Cultura',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children:
                          [
                            'Soja',
                            'Milho',
                            'Feijão',
                            'Tomate',
                            'Algodão',
                            'Café',
                            'Trigo',
                          ].map((cultura) {
                            bool selecionado = culturasSelecionadas.contains(
                              cultura,
                            );
                            return GestureDetector(
                              onTap: () {
                                setStateModal(() {
                                  if (selecionado) {
                                    culturasSelecionadas.remove(cultura);
                                  } else {
                                    culturasSelecionadas.add(cultura);
                                  }
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: selecionado
                                      ? const Color(0xFF00501E)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFFD3E4D5),
                                  ),
                                ),
                                child: Text(
                                  cultura,
                                  style: TextStyle(
                                    color: selecionado
                                        ? Colors.white
                                        : const Color(0xFF00501E),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Seção 3: Clima Favorável (Múltipla Escolha)
                    const Text(
                      'Clima favorável',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children:
                          [
                            'Chuvoso e úmido',
                            'Quente e seco',
                            'Ameno (15 a 25 °C)',
                            'Frio',
                          ].map((clima) {
                            bool selecionado = climasSelecionados.contains(
                              clima,
                            );
                            return GestureDetector(
                              onTap: () {
                                setStateModal(() {
                                  if (selecionado) {
                                    climasSelecionados.remove(clima);
                                  } else {
                                    climasSelecionados.add(clima);
                                  }
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: selecionado
                                      ? const Color(0xFF00501E)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFFD3E4D5),
                                  ),
                                ),
                                child: Text(
                                  clima,
                                  style: TextStyle(
                                    color: selecionado
                                        ? Colors.white
                                        : const Color(0xFF00501E),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Seção 4: Parte Afetada (Múltipla Escolha)
                    const Text(
                      'Parte da planta afetada',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['Folha', 'Caule', 'Raiz', 'Fruto ou vagem']
                          .map((parte) {
                            bool selecionado = partesSelecionadas.contains(
                              parte,
                            );
                            return GestureDetector(
                              onTap: () {
                                setStateModal(() {
                                  if (selecionado) {
                                    partesSelecionadas.remove(parte);
                                  } else {
                                    partesSelecionadas.add(parte);
                                  }
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: selecionado
                                      ? const Color(0xFF00501E)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFFD3E4D5),
                                  ),
                                ),
                                child: Text(
                                  parte,
                                  style: TextStyle(
                                    color: selecionado
                                        ? Colors.white
                                        : const Color(0xFF00501E),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            );
                          })
                          .toList(),
                    ),
                    const SizedBox(height: 24),

                    // Botões Inferiores
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setStateModal(() {
                                tipoSelecionado = 'Todos';
                                culturasSelecionadas.clear();
                                climasSelecionados.clear();
                                partesSelecionadas.clear();
                              });
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: Color(0xFF00501E)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                            child: const Text(
                              'Limpar',
                              style: TextStyle(
                                color: Color(0xFF00501E),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00501E),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                            child: const Text(
                              'Aplicar filtros',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            );
          },
        );
      },
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
              // Cabeçalho
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const TelaHome()),
                      );
                    },
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF00501E),
                      size: 26,
                    ),
                  ),
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
                    onPressed: () {},
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
              const SizedBox(height: 16),

              // Título
              const Text(
                'Catálogo',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Pragas e doenças para identificar, prevenir e tratar.',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Color(0xFF88968D),
                ),
              ),
              const SizedBox(height: 16),

              // Busca + Filtro
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFFE5EBE6),
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
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: 'Buscar por praga, doença ou cultura...',
                          hintStyle: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF88968D),
                          ),
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            color: Color(0xFF00501E),
                            size: 22,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFE5EBE6),
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
                    child: InkWell(
                      onTap: () => _abrirFiltros(context),
                      borderRadius: BorderRadius.circular(16),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: const [
                            Icon(
                              Icons.tune_rounded,
                              color: Color(0xFF00501E),
                              size: 20,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Filtros',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // --- LISTAGEM COMPLETA DE PRAGAS E DOENÇAS ---

              // Itens originais já finalizados
              _buildCatalogoCard(
                titulo: 'Ferrugem asiática da soja',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao: 'Manchas e amarelecimento das folhas',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/Ferrugem_asiatica_soja.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Lagarta-do-cartucho',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao: 'Folhas raspadas e perfuradas',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/lagarta_cartucho.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Oídio',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao: 'Pó branco sobre a superfície foliar',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/oidio.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mosca-branca',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Inseto sugador que causa amarelecimento e queda das folhas.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/pragas/mosca_branca.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mancha-alvo',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Apresentam um centro escuro, anéis concêntricos e halo amarelado.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/mancha_alvo.png',
              ),
              const SizedBox(height: 12),

              // 20 Pragas Adicionais
              _buildCatalogoCard(
                titulo: 'Percevejo-marrom',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Ataca grãos e vagens em formação, reduzindo rendimento e qualidade.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/percevejo_marrom.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Lagarta-da-soja',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Desfolhadora voraz que consome a área foliar da soja.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/lagarta_soja.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Helicoverpa',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Danifica folhas, estruturas reprodutivas, maçãs e espigas.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/helicoverpa.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Broca-do-café',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Perfura os frutos de café provocando queda e perda de peso.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/broca_cafe.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Bicho-mineiro',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Cria minas nas folhas levando à desfolha precoce do cafezal.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/bicho_mineiro.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Broca-da-cana',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Abre galerias nos colmos de cana facilitando tombamento e podridões.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/broca_cana.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Pulgão',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Suga seiva de hortaliças e diversas culturas, transmitindo vírus.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/pulgao.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Ácaro-rajado',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Provoca teias e bronzeamento/necrose em folhas de tomate, morango e feijão.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/acaro_rajado.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Tripes',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Raspam tecidos foliares em tomate, cebola e feijão, transmitindo tospovírus.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/tripes.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Traça-do-tomateiro',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Abre galerias transparentes em folhas e perfura frutos do tomateiro.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/traca_tomateiro.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Vaquinha',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Besouro defoliador que perfura folhas de feijoeiro e hortaliças.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/vaquinha.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Lagarta-rosca',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Corta plântulas jovens de milho e hortaliças rentes ao solo.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/lagarta_rosca.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Formigas-cortadeiras',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Corta vegetação intensamente para cultivo do fungo simbionte.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/formiga_cortadeira.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mosca-das-frutas',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Deposita ovos in frutos, provocando apodrecimento e inviabilização.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/mosca_frutas.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Cochonilha',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Sugador de seiva que favorece o aparecimento de fumagina em café e citros.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/cochonilha.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Traça-das-crucíferas',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Danifica folhas de couve, repolho e brócolis abrindo furos característicos.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/traca_crucifera.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mosca-minadora',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Larvas constroem serpentinas nas folhas de tomate, melão e pepino.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/mosca_minadora.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Nematoide-das-galhas',
                tipo: 'PRAGA',
                tipoCor: const Color(0xFFF3E6E0),
                tipoTextColor: const Color(0xFFD96B27),
                descricao:
                    'Ataca raízes de cenoura e tomate formando galhas que impedem a absorção de nutrientes.',
                acao: 'Identificação e controle',
                imagemPath: 'assets/images/pragas/nematoide_galhas.png',
              ),
              const SizedBox(height: 12),

              // 20 Doenças Adicionais
              _buildCatalogoCard(
                titulo: 'Antracnose',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Lesões deprimidas e escuras em folhas, vagens e frutos de soja, feijão e fruteiras.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/antracnose.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mofo-branco',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Micélio branco cotonoso sobre hastes e vagens em soja, feijão e hortaliças.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/mofo_branco.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Requeima',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Murcha acelerada e necrose rápida em folhagens de tomate e batata.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/requeima.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Pinta-preta',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Manchas foliares escuras com anéis concêntricos em batata e tomate.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/pinta_preta.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Ferrugem-do-cafeeiro',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Pustulas alaranjadas na face inferior das folhas provocando queda de folhagem no café.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/ferrugem_cafeeiro.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Cercosporiose do café',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Manchas castanhas com centro claro ("olho-de-pombo") nas folhas e frutos de café.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/cercosporiose_cafe.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mancha-branca do milho',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Lesões esbranquiçadas e circulares espalhadas pelas folhas do milho.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/mancha_branca_milho.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Míldio',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Eflorescência acinzentada/branca no verso das folhas em uva, cebola e cucurbitáceas.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/mildio.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Murcha-bacteriana',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Colapso e murchamento repentino dos tecidos vasculares em tomate e batata.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/murcha_bacteriana.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mosaico-comum do feijoeiro',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Deformação e bolhas com murchamento foliar verde-claro/escuro no feijão.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/mosaico_comum_feijoeiro.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mancha-angular do feijoeiro',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Lesões castanhas delimitadas pelas nervuras das folhas de feijão.',
                acao: 'Sintomas e tratamento',
                imagemPath:
                    'assets/images/doencas/mancha_angular_feijoeiro.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Murcha-de-fusário',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Amarelecimento univalve e secamento de ramos em tomate, feijão e banana.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/murcha_fusario.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Sigatoka-negra',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Estrias avermelhadas/escuras que causam a morte foliar na bananeira.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/sigatoka_negra.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Greening / HLB',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Amarelecimento assimétrico das folhas e deformação de frutos de citros.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/greening.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Podridão-negra das crucíferas',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Lesões amarelas em forma de "V" nas bordas das folhas em couve e repolho.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/podridao_negra.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Mancha-bacteriana',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Pequenas pontuações encharcadas com halo amarelado em tomate e pimentão.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/mancha_bacteriana.png',
              ),
              const SizedBox(height: 12),
              _buildCatalogoCard(
                titulo: 'Alternariose / queima-das-folhas',
                tipo: 'DOENÇA',
                tipoCor: const Color(0xFFD3E4D5),
                tipoTextColor: const Color(0xFF00501E),
                descricao:
                    'Queima das extremidades foliares em cenoura reduzindo produtividade.',
                acao: 'Sintomas e tratamento',
                imagemPath: 'assets/images/doencas/alternariose.png',
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Método auxiliar para criar cada card de praga/doença com sombra na parte inferior
  Widget _buildCatalogoCard({
    required String titulo,
    required String tipo,
    required Color tipoCor,
    required Color tipoTextColor,
    required String descricao,
    required String acao,
    required String imagemPath,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5EBE6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 80,
              height: 90,
              color: const Color(0xFFD3E4D5),
              child: Image.asset(
                imagemPath,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(
                    Icons.image_outlined,
                    color: Color(0xFF00501E),
                    size: 32,
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00501E),
                  ),
                ),
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: tipoCor,
                      borderRadius: BorderRadius.circular(6),
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
                ),
                const SizedBox(height: 6),
                Text(
                  descricao,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF88968D),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      acao,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.chevron_right,
                      size: 16,
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
}

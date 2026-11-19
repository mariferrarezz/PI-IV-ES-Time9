import 'package:flutter/material.dart';

class TelaTalhoes extends StatefulWidget {
  final bool abrirModalPropriedades;

  const TelaTalhoes({super.key, this.abrirModalPropriedades = false});

  @override
  State<TelaTalhoes> createState() => _TelaTalhoesState();
}

class _TelaTalhoesState extends State<TelaTalhoes> {
  // Variáveis de estado
  String _propriedadeSelecionada = 'Fazenda Boa Vista';
  int _indiceAtualNav = 1;
  String _filtroSelecionado = 'Todos';

  @override
  void initState() {
    super.initState();
    // Abre o modal de propriedades automaticamente se vier da TelaPerfil
    if (widget.abrirModalPropriedades) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _abrirModalPropriedades(context);
        }
      });
    }
  }

  // Lista contendo todos os talhões da fazenda
  final List _listaTalhoes = [
    {
      'nome': 'Talhão 03',
      'cultura': 'Soja · 12,5 ha',
      'status': 'ALTA URGÊNCIA',
      'tipoFiltro': 'Com alerta',
      'statusBg': const Color(0xFFF3C5B5),
      'statusText': const Color(0xFFB33A1D),
      'circuloBg': const Color(0xFFFDECEA),
      'ocorrencia': 'Ferrugem asiática · há 2 dias',
    },
    {
      'nome': 'Talhão 07',
      'cultura': 'Milho · 8,0 ha',
      'status': 'ATENÇÃO',
      'tipoFiltro': 'Com alerta',
      'statusBg': const Color(0xFFFEF7E0),
      'statusText': const Color(0xFF8C5700),
      'circuloBg': const Color(0xFFFEF9E7),
      'ocorrencia': 'Lagarta-do-cartucho · há 4 dias',
    },
    {
      'nome': 'Talhão 02',
      'cultura': 'Feijão · 5,2 ha',
      'status': 'ATENÇÃO',
      'tipoFiltro': 'Com alerta',
      'statusBg': const Color(0xFFFEF7E0),
      'statusText': const Color(0xFF8C5700),
      'circuloBg': const Color(0xFFFEF9E7),
      'ocorrencia': 'Oídio · há 6 dias',
    },
    {
      'nome': 'Talhão 01',
      'cultura': 'Milho · 10,0 ha',
      'status': 'EM DIA',
      'tipoFiltro': 'Em dia',
      'statusBg': const Color(0xFFD3E4D5),
      'statusText': const Color(0xFF00501E),
      'circuloBg': const Color(0xFFE8F3EC),
      'ocorrencia': 'Nenhuma ocorrência ativa',
    },
    {
      'nome': 'Talhão 04',
      'cultura': 'Soja · 15,0 ha',
      'status': 'EM DIA',
      'tipoFiltro': 'Em dia',
      'statusBg': const Color(0xFFD3E4D5),
      'statusText': const Color(0xFF00501E),
      'circuloBg': const Color(0xFFE8F3EC),
      'ocorrencia': 'Nenhuma ocorrência ativa',
    },
  ];

  // Função para filtrar a lista dinamicamente com base na seleção
  List get _talhoesFiltrados {
    if (_filtroSelecionado == 'Todos') {
      return _listaTalhoes;
    } else {
      return _listaTalhoes
          .where((t) => t['tipoFiltro'] == _filtroSelecionado)
          .toList();
    }
  }

  // Função que abre o modal flutuante de propriedades
  void _abrirModalPropriedades(BuildContext context) {
    String propriedadeTemp = _propriedadeSelecionada;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Suas propriedades',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Escolha qual você quer acompanhar.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFF88968D),
                              ),
                            ),
                          ],
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
                    const SizedBox(height: 20),
                    _buildItemPropriedade(
                      nome: 'Fazenda Boa Vista',
                      detalhes: '8 talhões · 3 alertas ativos',
                      badgeTexto: '3 ALERTAS',
                      badgeCor: const Color(0xFFF3C5B5),
                      badgeTextColor: const Color(0xFFB33A1D),
                      selecionado: propriedadeTemp == 'Fazenda Boa Vista',
                      onTap: () {
                        setModalState(() {
                          propriedadeTemp = 'Fazenda Boa Vista';
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildItemPropriedade(
                      nome: 'Sítio Santa Luzia',
                      detalhes: '4 talhões · sem alertas',
                      badgeTexto: 'EM DIA',
                      badgeCor: const Color(0xFFD3E4D5),
                      badgeTextColor: const Color(0xFF00501E),
                      selecionado: propriedadeTemp == 'Sítio Santa Luzia',
                      onTap: () {
                        setModalState(() {
                          propriedadeTemp = 'Sítio Santa Luzia';
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildItemPropriedade(
                      nome: 'Fazenda Três Irmãos',
                      detalhes: '6 talhões · 1 alerta ativo',
                      badgeTexto: '1 ALERTA',
                      badgeCor: const Color(0xFFF3C5B5),
                      badgeTextColor: const Color(0xFFB33A1D),
                      selecionado: propriedadeTemp == 'Fazenda Três Irmãos',
                      onTap: () {
                        setModalState(() {
                          propriedadeTemp = 'Fazenda Três Irmãos';
                        });
                      },
                    ),
                    const SizedBox(height: 20),
                    OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(
                          color: Color(0xFF00501E),
                          width: 1,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add, color: Color(0xFF00501E), size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Adicionar propriedade',
                            style: TextStyle(
                              color: Color(0xFF00501E),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _propriedadeSelecionada = propriedadeTemp;
                          });
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00501E),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: const Text(
                          'Confirmar',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ),
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

  Widget _buildItemPropriedade({
    required String nome,
    required String detalhes,
    required String badgeTexto,
    required Color badgeCor,
    required Color badgeTextColor,
    required bool selecionado,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selecionado
                ? const Color(0xFF00501E)
                : const Color(0xFFE5EBE6),
            width: selecionado ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF00501E), width: 2),
              ),
              child: selecionado
                  ? Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF00501E),
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    nome,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    detalhes,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF88968D),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: badgeCor,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                badgeTexto,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: badgeTextColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Botão de filtro estilo WhatsApp
  Widget _buildBotaoFiltro(String rotulo, String contador) {
    bool selecionado = _filtroSelecionado == rotulo;
    return GestureDetector(
      onTap: () {
        setState(() {
          _filtroSelecionado = rotulo;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selecionado ? const Color(0xFFD3E4D5) : Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: selecionado
                ? const Color(0xFF00501E)
                : const Color(0xFFD3E4D5),
            width: 1,
          ),
        ),
        child: Text(
          '$rotulo · $contador',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: rotulo == 'Com alerta' && !selecionado
                ? const Color(0xFFB33A1D)
                : const Color(0xFF00501E),
          ),
        ),
      ),
    );
  }

  Widget _buildCardTalhao({
    required String nomeTalhao,
    required String culturaHectares,
    required String statusTexto,
    required Color statusBgColor,
    required Color statusTextColor,
    required Color circuloBgColor,
    required String alertaOcorrencia,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2EBE3), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: circuloBgColor,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.eco_outlined,
                      color: Color(0xFF00501E),
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            nomeTalhao,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: statusBgColor,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              statusTexto,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: statusTextColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        culturaHectares,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF335C3E),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        alertaOcorrencia,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                          color: statusTexto == 'EM DIA'
                              ? const Color(0xFF88968D)
                              : const Color(0xFFB33A1D),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF00501E),
                  size: 22,
                ),
              ],
            ),
          ),
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
              // CABEÇALHO
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Image.asset(
                    'assets/images/logoSentinela.png',
                    height: 40,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTracer) => const Text(
                      '🌱 Sentinela',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
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
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Talhões',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Acompanhe cada área da sua plantação.',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF88968D),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // BOTÃO DA FAZENDA + BOTÃO NOVO TALHÃO
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFFD3E4D5),
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
                        onTap: () => _abrirModalPropriedades(context),
                        borderRadius: BorderRadius.circular(24),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.home_outlined,
                                color: Color(0xFF00501E),
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _propriedadeSelecionada,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00501E),
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: Color(0xFF00501E),
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00501E),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text(
                      'Novo talhão',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // BOTÕES DE FILTRO ESTILO WHATSAPP
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildBotaoFiltro('Todos', '5'),
                    const SizedBox(width: 8),
                    _buildBotaoFiltro('Com alerta', '3'),
                    const SizedBox(width: 8),
                    _buildBotaoFiltro('Em dia', '2'),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // EXIBIÇÃO DINÂMICA DOS CARDS FILTRADOS
              ..._talhoesFiltrados.map((talhao) {
                return _buildCardTalhao(
                  nomeTalhao: talhao['nome'],
                  culturaHectares: talhao['cultura'],
                  statusTexto: talhao['status'],
                  statusBgColor: talhao['statusBg'],
                  statusTextColor: talhao['statusText'],
                  circuloBgColor: talhao['circuloBg'],
                  alertaOcorrencia: talhao['ocorrencia'],
                  onTap: () {
                    // Adicione aqui a navegação para a tela de detalhes do talhão
                  },
                );
              }),

              const SizedBox(height: 20),
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
                    onTap: () => setState(() => _indiceAtualNav = 0),
                  ),
                  _buildItemNav(
                    icon: Icons.map_outlined,
                    label: 'TALHÕES',
                    indice: 1,
                    ativo: _indiceAtualNav == 1,
                    onTap: () => setState(() => _indiceAtualNav = 1),
                  ),
                  const SizedBox(width: 50),
                  _buildItemNav(
                    icon: Icons.language_outlined,
                    label: 'COMUNIDADE',
                    indice: 3,
                    ativo: _indiceAtualNav == 3,
                    onTap: () => setState(() => _indiceAtualNav = 3),
                  ),
                  _buildItemNav(
                    icon: Icons.person_outline_rounded,
                    label: 'PERFIL',
                    indice: 4,
                    ativo: _indiceAtualNav == 4,
                    onTap: () => setState(() => _indiceAtualNav = 4),
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
                    onTap: () {},
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
}

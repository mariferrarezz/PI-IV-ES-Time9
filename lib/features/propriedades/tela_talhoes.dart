import 'package:flutter/material.dart';
import 'tela_novoTalhao.dart';
import 'tela_questionario1.dart';
import 'tela_nova_propriedade.dart';
import 'tela_plantacoes.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:firebase_auth/firebase_auth.dart';

class TelaTalhoes extends StatefulWidget {
  final bool abrirModalPropriedades;

  const TelaTalhoes({super.key, this.abrirModalPropriedades = false});

  @override
  State<TelaTalhoes> createState() => _TelaTalhoesState();
}

class _TelaTalhoesState extends State<TelaTalhoes> {
  static final Map<String, String> _propriedadePorUsuario = {};
  final _api = ApiSentinela();
  List<dynamic> _propriedades = [], _talhoes = [];
  final Map<String, String> _resumos = {};
  final Set<String> _errosResumo = {};
  String? _propriedadeId, _erro;
  bool _carregando = true;
  int _versao = 0;
  final int _indiceAtualNav = 1;
  String get _propriedadeSelecionada {
    for (final propriedade in _propriedades) {
      if (propriedade['_id'].toString() == _propriedadeId) return propriedade['nome'].toString();
    }
    return 'Selecione uma propriedade';
  }

  @override
  void initState() { super.initState(); _carregarPropriedades(); }

  Future<void> _carregarPropriedades() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      await _api.request('GET', '/auth/me');
      final propriedades = await _api.request('GET', '/propriedades') as List<dynamic>;
      if (!mounted) return;
      setState(() { _propriedades = propriedades; _propriedadeId = null; _talhoes = []; _carregando = false; });
      final uid = FirebaseAuth.instance.currentUser?.uid;
      final anterior = uid == null ? null : _propriedadePorUsuario[uid];
      if (anterior != null && propriedades.any((p) => p['_id'].toString() == anterior)) await _selecionar(anterior);
      if (widget.abrirModalPropriedades) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _abrirModalPropriedades(context);
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }

  Future<void> _selecionar(String id) async {
    final versao = ++_versao;
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) _propriedadePorUsuario[uid] = id;
    setState(() { _propriedadeId = id; _talhoes = []; _resumos.clear(); _errosResumo.clear(); _erro = null; _carregando = true; });
    try {
      final talhoes = await _api.request('GET', '/propriedades/$id/talhoes') as List<dynamic>;
      if (mounted && versao == _versao) setState(() { _talhoes = talhoes; _carregando = false; });
      if (mounted && versao == _versao) await Future.wait(talhoes.map((t) => _carregarResumo(t['_id'].toString(), versao)));
    } on ApiException catch (e) {
      if (mounted && versao == _versao) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }

  Future<void> _carregarResumo(String talhaoId, int versao) async {
    if (mounted && versao == _versao) setState(() { _resumos.remove(talhaoId); _errosResumo.remove(talhaoId); });
    try {
      final plantacoes = await _api.request('GET', '/talhoes/$talhaoId/plantacoes') as List<dynamic>;
      final listas = await Future.wait(plantacoes.map((p) async => await _api.request('GET', "/plantacoes/${p['_id']}/ocorrencias") as List<dynamic>));
      final ocorrencias = listas.expand((x) => x).toList();
      ocorrencias.sort((a, b) {
        final ordem = (b['dataObservacao'] ?? '').toString().compareTo((a['dataObservacao'] ?? '').toString());
        return ordem != 0 ? ordem : (b['_id'] ?? '').toString().compareTo((a['_id'] ?? '').toString());
      });
      final abertas = ocorrencias.where((o) => o['status'] == 'aberta' || o['status'] == 'em_acompanhamento').length;
      final texto = ocorrencias.isEmpty ? 'Nenhuma ocorrência' : '$abertas abertas ou em acompanhamento · Última intensidade: ${ocorrencias.first['intensidade']}';
      if (mounted && versao == _versao) setState(() => _resumos[talhaoId] = texto);
    } catch (_) {
      if (mounted && versao == _versao) setState(() => _errosResumo.add(talhaoId));
    }
  }

  Future<void> _novo() async {
    final id = _propriedadeId;
    if (id == null) return;
    final criado = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => TelaNovoTalhao(propriedadeId: id, propriedadeNome: _propriedadeSelecionada)));
    if (criado == true && mounted) await _selecionar(id);
  }

  Future<void> _novaPropriedade() async {
    final id = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => const TelaNovaPropriedade()));
    if (id == null || !mounted) return;
    setState(() { _carregando = true; _erro = null; });
    try {
      final propriedades = await _api.request('GET', '/propriedades') as List<dynamic>;
      if (!mounted) return;
      setState(() => _propriedades = propriedades);
      await _selecionar(id);
    } on ApiException catch (e) {
      if (mounted) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }


  // Função que abre o modal flutuante de propriedades
  void _abrirModalPropriedades(BuildContext context) {
    String? propriedadeTemp = _propriedadeId;

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
                    if (_propriedades.isEmpty)
                      const Text('Nenhuma propriedade cadastrada para esta conta.'),
                    ..._propriedades.map((propriedade) {
                      final id = propriedade['_id'].toString();
                      final ativa = propriedade['ativa'] == true;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _buildItemPropriedade(
                          nome: propriedade['nome'].toString(),
                          detalhes: "${propriedade['municipio']} · ${propriedade['estado']}",
                          badgeTexto: ativa ? 'ATIVA' : 'INATIVA',
                          badgeCor: const Color(0xFFD3E4D5),
                          badgeTextColor: const Color(0xFF00501E),
                          selecionado: propriedadeTemp == id,
                          onTap: () => setModalState(() => propriedadeTemp = id),
                        ),
                      );
                    }),
                    const SizedBox(height: 20),
                    OutlinedButton(
                      onPressed: () { Navigator.pop(context); _novaPropriedade(); },
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
                    TextButton(
                      onPressed: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const TelaQuestionario1())); },
                      child: const Text('Questionário inicial'),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: propriedadeTemp == null ? null : () {
                          final id = propriedadeTemp!;
                          Navigator.pop(context);
                          _selecionar(id);
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
                    onPressed: _propriedadeId == null || _carregando ? null : _novo,
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

              // Os filtros de alerta dependem de dados que a API ainda não fornece.
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(children: [
                  Chip(
                    label: Text('Todos · ${_talhoes.length}'),
                    backgroundColor: const Color(0xFFD3E4D5),
                    side: const BorderSide(color: Color(0xFF00501E)),
                  ),
                  const SizedBox(width: 8),
                  const Tooltip(
                    message: 'Filtro indisponível até a integração de alertas',
                    child: Chip(label: Text('Com alerta'), labelStyle: TextStyle(color: Colors.grey)),
                  ),
                  const SizedBox(width: 8),
                  const Tooltip(
                    message: 'Filtro indisponível até a integração de alertas',
                    child: Chip(label: Text('Em dia'), labelStyle: TextStyle(color: Colors.grey)),
                  ),
                ]),
              ),
              const SizedBox(height: 16),
              if (_carregando)
                const Center(child: CircularProgressIndicator())
              else if (_erro != null) ...[
                Text(_erro!, style: const TextStyle(color: Colors.red)),
                TextButton(
                  onPressed: _propriedadeId == null ? _carregarPropriedades : () => _selecionar(_propriedadeId!),
                  child: const Text('Tentar novamente'),
                ),
              ] else if (_propriedades.isEmpty)
                const Text('Nenhuma propriedade cadastrada para esta conta.')
              else if (_propriedadeId == null)
                const Text('Selecione uma propriedade para ver seus talhões.')
              else if (_talhoes.isEmpty)
                const Text('Nenhum talhão cadastrado.')
              else
                ..._talhoes.map((talhao) => _buildCardTalhao(
                  nomeTalhao: talhao['nome'].toString(),
                  culturaHectares: "${talhao['areaHa']} ha",
                  statusTexto: talhao['ativo'] == true ? 'ATIVO' : 'INATIVO',
                  statusBgColor: const Color(0xFFD3E4D5),
                  statusTextColor: const Color(0xFF00501E),
                  circuloBgColor: const Color(0xFFE8F3EC),
                  alertaOcorrencia: _errosResumo.contains(talhao['_id'].toString()) ? 'Erro ao consultar ocorrências. Toque para tentar novamente.' : (_resumos[talhao['_id'].toString()] ?? 'Carregando ocorrências...'),
                  onTap: () async {
                    final id = talhao['_id'].toString();
                    if (_errosResumo.contains(id)) { await _carregarResumo(id, _versao); return; }
                    await Navigator.push(context, MaterialPageRoute(builder: (_) => TelaPlantacoes(talhaoId: id, nomeTalhao: talhao['nome'].toString())));
                    if (mounted) await _carregarResumo(id, _versao);
                  },
                )),
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
                    onTap: () => navegarPrincipal(context, 0, _indiceAtualNav == -1 ? 2 : _indiceAtualNav),
                  ),
                  _buildItemNav(
                    icon: Icons.map_outlined,
                    label: 'TALHÕES',
                    indice: 1,
                    ativo: _indiceAtualNav == 1,
                    onTap: () => navegarPrincipal(context, 1, _indiceAtualNav == -1 ? 2 : _indiceAtualNav),
                  ),
                  const SizedBox(width: 50),
                  _buildItemNav(
                    icon: Icons.language_outlined,
                    label: 'COMUNIDADE',
                    indice: 3,
                    ativo: _indiceAtualNav == 3,
                    onTap: () => navegarPrincipal(context, 3, _indiceAtualNav == -1 ? 2 : _indiceAtualNav),
                  ),
                  _buildItemNav(
                    icon: Icons.person_outline_rounded,
                    label: 'PERFIL',
                    indice: 4,
                    ativo: _indiceAtualNav == 4,
                    onTap: () => navegarPrincipal(context, 4, _indiceAtualNav == -1 ? 2 : _indiceAtualNav),
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
                    onTap: () => navegarPrincipal(context, 2, _indiceAtualNav),
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

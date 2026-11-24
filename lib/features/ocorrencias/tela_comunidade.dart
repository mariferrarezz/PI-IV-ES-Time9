import 'package:flutter/material.dart';
import 'dart:math';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/features/catalogo/ferrugem_asiatica_da_soja.dart';
import 'package:sentinela/features/catalogo/percevejo_marrom.dart';
import 'package:sentinela/features/catalogo/lagarta_do_cartucho.dart';
import 'package:sentinela/features/catalogo/oidio.dart';
import 'package:sentinela/features/catalogo/mancha_branca_do_milho.dart';
import 'package:sentinela/features/catalogo/tela_catalogo.dart';
//import 'tela_catalogo.dart';

class TelaComunidade extends StatefulWidget {
  const TelaComunidade({super.key});

  @override
  State<TelaComunidade> createState() => _TelaComunidadeState();
}

class _TelaComunidadeState extends State<TelaComunidade> {
  final TextEditingController _buscaController = TextEditingController();

  // Estados dos filtros e navegação
  String _tipoFiltro = 'Todos'; // 'Todos', 'Pragas', 'Doenças'
  String _culturaFiltro = 'Todas'; // 'Todas', 'Soja', 'Milho', 'Feijão'
  final int _indiceAtualNav = 3; // 3 = COMUNIDADE ativo

  final _api = ApiSentinela();
  List<Map<String, dynamic>> _relatosRecentes = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() { super.initState(); _carregarRelatos(); }

  Future<void> _carregarRelatos() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final dados = await _api.request('GET', '/comunidade/experiencias') as List<dynamic>;
      if (!mounted) return;
      setState(() {
        _relatosRecentes = dados.map((e) {
          final regiao = e['regiao'] is Map ? e['regiao'] as Map : const {};
          final tipo = {'praga': 'PRAGA', 'doenca': 'DOENÇA', 'deficiencia': 'DEFICIÊNCIA', 'nao_identificado': 'NÃO IDENTIFICADO'}[e['tipoProblema']] ?? '';
          return <String, dynamic>{'id': e['_id'].toString(), 'nome': e['titulo'], 'tipo': tipo, 'problemaNome': e['problemaNome'], 'publicadoEm': e['publicadoEm'],
            'cultura': e['culturaNome'], 'area': 'Área não informada', 'areaCurta': 'Não informada',
            'local': [regiao['municipio'], regiao['estado']].whereType<String>().join(', '),
            'intensidade': 'Não informada', 'tempo': e['publicadoEm']?.toString().substring(0, 10) ?? '',
            'sintomas': [e['relato']]};
        }).toList();
      });
    } on ApiException catch (e) { if (mounted) setState(() => _erro = e.mensagem); }
    finally { if (mounted) setState(() => _carregando = false); }
  }

  Future<void> _denunciar(String experienciaId) async {
    final descricao = TextEditingController();
    final random = Random.secure();
    String novaChave() => List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
    var chave = novaChave();
    String? motivo, erro;
    bool enviando = false, incerto = false;
    await showDialog<void>(context: context, barrierDismissible: false, builder: (dialogContext) => StatefulBuilder(builder: (contexto, atualizar) => AlertDialog(
      title: const Text('Denunciar experiência'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButtonFormField<String>(initialValue: motivo, decoration: const InputDecoration(labelText: 'Motivo'), items: const [
          DropdownMenuItem(value: 'dados_pessoais', child: Text('Dados pessoais')),
          DropdownMenuItem(value: 'conteudo_inadequado', child: Text('Conteúdo inadequado')),
          DropdownMenuItem(value: 'informacao_perigosa', child: Text('Informação perigosa')),
          DropdownMenuItem(value: 'outro', child: Text('Outro')),
        ], onChanged: enviando || incerto ? null : (v) => atualizar(() => motivo = v)),
        TextField(controller: descricao, enabled: !enviando && !incerto, maxLines: 3, decoration: const InputDecoration(labelText: 'Descrição (opcional)')),
        if (erro != null) SelectableText(erro!, style: const TextStyle(color: Colors.red)),
      ]),
      actions: [
        TextButton(onPressed: enviando ? null : () => Navigator.pop(dialogContext), child: const Text('Cancelar')),
        ElevatedButton(onPressed: enviando ? null : () async {
          if (motivo == null) { atualizar(() => erro = 'Selecione um motivo.'); return; }
          atualizar(() { enviando = true; erro = null; });
          try {
            await _api.request('POST', '/comunidade/experiencias/$experienciaId/denuncias', chaveIdempotencia: chave, body: {
              'motivo': motivo, if (descricao.text.trim().isNotEmpty) 'descricao': descricao.text.trim(),
            });
            if (!dialogContext.mounted) return;
            Navigator.pop(dialogContext);
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Denúncia enviada para análise.')));
          } on ApiException catch (e) {
            if (dialogContext.mounted) atualizar(() { erro = e.mensagem; incerto = incerto || e.codigo == 'RESULTADO_DESCONHECIDO'; if (!incerto) chave = novaChave(); });
          } finally { if (dialogContext.mounted) atualizar(() => enviando = false); }
        }, child: Text(enviando ? 'Enviando...' : 'Enviar denúncia')),
      ],
    )));
    descricao.dispose();
  }
  @override
  void dispose() {
    _buscaController.dispose();
    super.dispose();
  }

  List get _relatosFiltrados {
    final String termo = _buscaController.text.trim().toLowerCase();

    return _relatosRecentes.where((item) {
      final String nome = (item['nome'] ?? '').toString().toLowerCase();
      final String tipo = (item['tipo'] ?? '').toString();
      final String cultura = (item['cultura'] ?? '').toString();

      final bool matchBusca =
          termo.isEmpty ||
          nome.contains(termo) ||
          cultura.toLowerCase().contains(termo);

      final bool matchTipo =
          _tipoFiltro == 'Todos' ||
          (_tipoFiltro == 'Pragas' && tipo == 'PRAGA') ||
          (_tipoFiltro == 'Doenças' && tipo == 'DOENÇA');

      final bool matchCultura =
          _culturaFiltro == 'Todas' || cultura == _culturaFiltro;

      return matchBusca && matchTipo && matchCultura;
    }).toList();
  }

  // Redireciona diretamente para a ficha específica no catálogo
  void _abrirFichaCatalogo(BuildContext context, String nomeOcorrencia) {
    Widget destino;

    switch (nomeOcorrencia) {
      case 'Ferrugem asiática da soja':
        destino = const CatalogoFerrugemAsiaticaDaSoja();
        break;
      case 'Percevejo-marrom':
        destino = const CatalogoPercevejoMarrom();
        break;
      case 'Lagarta-do-cartucho':
        destino = const CatalogoLagartaDoCartucho();
        break;
      case 'Oídio':
        destino = const CatalogoOidio();
        break;
      case 'Mancha-branca do milho':
        destino = const CatalogoManchaBrancaDoMilho();
        break;
      default:
        destino = const TelaCatalogo();
        break;
    }

    Navigator.push(context, MaterialPageRoute(builder: (context) => destino));
  }

  // Modal inferior que sobe ao clicar em um relato da comunidade
  Future<void> _abrirDetalhesRelato(Map relato) async {
    try {
      final atual = await _api.request('GET', '/comunidade/experiencias/${relato['id']}') as Map;
      if (!mounted) return;
      relato = {...relato, 'nome': atual['titulo'], 'cultura': atual['culturaNome'], 'sintomas': [atual['relato']]};
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.mensagem)));
      return;
    }
    final String nome = (relato['nome'] ?? '').toString();
    final String tipo = (relato['tipo'] ?? 'PRAGA').toString();
    final String cultura = (relato['cultura'] ?? '').toString();
    final String areaCurta = (relato['areaCurta'] ?? '').toString();
    final String intensidade = (relato['intensidade'] ?? 'Baixa').toString();
    final String tempo = (relato['tempo'] ?? '').toString();
    final String local = (relato['local'] ?? '').toString();
    final List sintomas = (relato['sintomas'] ?? []) as List;
    final bool isPraga = tipo == 'PRAGA';

    Color corIntensidade = const Color(0xFF00501E);
    if (intensidade == 'Média') {
      corIntensidade = const Color(0xFFB37400);
    } else if (intensidade == 'Alta') {
      corIntensidade = const Color(0xFFC93B2B);
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return Container(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tracinho superior de arrastar
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD5DFD7),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Título + Botão Fechar (X)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nome,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isPraga
                                ? const Color(0xFFF3E7D3)
                                : const Color(0xFFE3ECF7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            tipo,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isPraga
                                  ? const Color(0xFF8C5A1E)
                                  : const Color(0xFF28558A),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(modalContext),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(
                      Icons.close_rounded,
                      color: Color(0xFF00501E),
                      size: 24,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Grade 2x2: CULTURA | ÁREA AFETADA / INTENSIDADE | REGISTRADO
              Row(
                children: [
                  Expanded(
                    child: _buildCardInfoModal(
                      titulo: 'CULTURA',
                      valor: cultura,
                      corValor: const Color(0xFF00501E),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildCardInfoModal(
                      titulo: 'ÁREA AFETADA',
                      valor: areaCurta,
                      corValor: const Color(0xFF00501E),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildCardInfoModal(
                      titulo: 'INTENSIDADE',
                      valor: intensidade,
                      corValor: corIntensidade,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildCardInfoModal(
                      titulo: 'REGISTRADO',
                      valor: tempo,
                      corValor: const Color(0xFF00501E),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Localização
              Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 16,
                    color: Color(0xFF5A7363),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      local,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF3E5947),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // O QUE O PRODUTOR VIU
              const Text(
                'O QUE O PRODUTOR VIU',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.4,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: sintomas.map((item) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0ECE2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      item.toString(),
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Botão "Ver ficha no catálogo"
              TextButton(onPressed: () { Navigator.pop(modalContext); _denunciar(relato['id'].toString()); }, child: const Text('Denunciar experiência')),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(modalContext);
                    _abrirFichaCatalogo(context, nome);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF134E1E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                  child: const Text(
                    'Ver ficha no catálogo',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCardInfoModal({
    required String titulo,
    required String valor,
    required Color corValor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F6F3),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titulo,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.3,
              color: Color(0xFF5A7363),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            valor,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: corValor,
            ),
          ),
        ],
      ),
    );
  }

  // Barra de progresso horizontal do card "Mais relatadas"
  Widget _buildBarraMaisRelatada({
    required String titulo,
    required String contagem,
    required double progresso,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              titulo,
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2D24),
              ),
            ),
            Text(
              contagem,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
                color: Color(0xFF00501E),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progresso,
            minHeight: 6,
            backgroundColor: const Color(0xFFDFE8E1),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF134E1E)),
          ),
        ),
      ],
    );
  }

  // Indicador visual de sinal (3 barrinhas verticais) + texto da intensidade
  Widget _buildIndicadorIntensidade(String intensidade, String tempo) {
    int nivel = 1;
    Color corAtiva = const Color(0xFF134E1E);
    String textoIntensidade = 'Intensidade baixa';

    if (intensidade == 'Média') {
      nivel = 2;
      corAtiva = const Color(0xFFB37400);
      textoIntensidade = 'Intensidade média';
    } else if (intensidade == 'Alta') {
      nivel = 3;
      corAtiva = const Color(0xFFC93B2B);
      textoIntensidade = 'Intensidade alta';
    }

    const Color corInativa = Color(0xFFD5DFD7);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              width: 3.5,
              height: 7,
              decoration: BoxDecoration(
                color: nivel >= 1 ? corAtiva : corInativa,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 2.5),
            Container(
              width: 3.5,
              height: 11,
              decoration: BoxDecoration(
                color: nivel >= 2 ? corAtiva : corInativa,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 2.5),
            Container(
              width: 3.5,
              height: 15,
              decoration: BoxDecoration(
                color: nivel >= 3 ? corAtiva : corInativa,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        Text(
          textoIntensidade,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
            color: corAtiva,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          tempo,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Color(0xFF7D8E83),
          ),
        ),
      ],
    );
  }

  Widget _buildItemRelato(Map relato, bool mostrarDivisor) {
    final String nome = (relato['nome'] ?? '').toString();
    final String tipo = (relato['tipo'] ?? 'PRAGA').toString();
    final String cultura = (relato['cultura'] ?? '').toString();
    final String area = (relato['area'] ?? '').toString();
    final String local = (relato['local'] ?? '').toString();
    final String intensidade = (relato['intensidade'] ?? 'Baixa').toString();
    final String tempo = (relato['tempo'] ?? '').toString();
    final bool isPraga = tipo == 'PRAGA';

    return InkWell(
      onTap: () => _abrirDetalhesRelato(relato),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Text(
                            nome,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2D24),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isPraga
                                  ? const Color(0xFFF3E7D3)
                                  : const Color(0xFFE3ECF7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              tipo,
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                                color: isPraga
                                    ? const Color(0xFF8C5A1E)
                                    : const Color(0xFF28558A),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        '$cultura · $area',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF3E5947),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: Color(0xFF6B8574),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              local,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF6B8574),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _buildIndicadorIntensidade(intensidade, tempo),
              ],
            ),
          ),
          if (mostrarDivisor)
            const Divider(height: 1, thickness: 1, color: Color(0xFFEEF3EF)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List listaExibida = _relatosFiltrados;
    final contagens = <String, int>{};
    final limite = DateTime.now().toUtc().subtract(const Duration(days: 7));
    for (final relato in _relatosRecentes) {
      final nome = relato['problemaNome'];
      final data = DateTime.tryParse((relato['publicadoEm'] ?? '').toString());
      if (nome is String && nome.isNotEmpty && data != null && !data.isBefore(limite)) contagens[nome] = (contagens[nome] ?? 0) + 1;
    }
    final ranking = contagens.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. LOGO SENTINELA + BOTÃO COMPARTILHAR
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Icon(
                        Icons.spa_rounded,
                        color: Color(0xFF00501E),
                        size: 26,
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Sentinela',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B4C35),
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Para compartilhar, abra uma ocorrência em Talhões e toque em "Compartilhar na Comunidade".')));
                    },
                    icon: const Icon(Icons.upload_rounded, size: 18),
                    label: const Text(
                      'Compartilhar',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF134E1E),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 11,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              if (_carregando) const Center(child: CircularProgressIndicator()),
              if (_erro != null) ...[
                SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
                TextButton(onPressed: _carregarRelatos, child: const Text('Tentar novamente')),
              ],

              // 2. TÍTULO E SUBTÍTULO
              const Text(
                'Comunidade',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Veja o que outros produtores estão encontrando.',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 16),

              // 3. CAMPO DE BUSCA
              TextField(
                controller: _buscaController,
                onChanged: (_) => setState(() {}),
                style: const TextStyle(
                  fontSize: 14.5,
                  color: Color(0xFF1F2D24),
                ),
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Buscar praga, doença ou cultura',
                  hintStyle: const TextStyle(
                    fontSize: 14.5,
                    color: Color(0xFF7D8E83),
                  ),
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: Color(0xFF5A7363),
                    size: 22,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(26),
                    borderSide: const BorderSide(
                      color: Color(0xFFDCE5DE),
                      width: 1.2,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(26),
                    borderSide: const BorderSide(
                      color: Color(0xFF00501E),
                      width: 1.5,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // 4. SEGMENTED CONTROL: TODOS | PRAGAS | DOENÇAS
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F2),
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Row(
                  children: ['Todos', 'Pragas', 'Doenças'].map((aba) {
                    final bool selecionada = _tipoFiltro == aba;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tipoFiltro = aba),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: selecionada
                                ? Colors.white
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: selecionada
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.04,
                                      ),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              aba,
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: selecionada
                                    ? FontWeight.bold
                                    : FontWeight.w600,
                                color: selecionada
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF5A7363),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 12),

              // 5. CHIPS DE CULTURA E DISTÂNCIA
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ...['Todas', ..._relatosRecentes.map((e) => e['cultura']).whereType<String>().where((e) => e.isNotEmpty).toSet()].map((cultura) {
                      final bool selecionada = _culturaFiltro == cultura;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _culturaFiltro = cultura),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: selecionada
                                  ? const Color(0xFFD3E4D5)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selecionada
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFFDCE5DE),
                                width: selecionada ? 1.4 : 1.1,
                              ),
                            ),
                            child: Text(
                              cultura,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: selecionada
                                    ? FontWeight.bold
                                    : FontWeight.w600,
                                color: selecionada
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFFDCE5DE),
                          width: 1.1,
                        ),
                      ),
                      child: Row(
                        children: const [
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: Color(0xFF5A7363),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Todas as regiões',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF3E5947),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // 6. CARD "MAIS RELATADAS · ÚLTIMOS 7 DIAS"
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F6F3),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          'Mais relatadas',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        Text(
                          'últimos 7 dias',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF6B8574),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    if (ranking.isEmpty) const Text('Nenhum problema identificado no período.'),
                    for (final item in ranking.take(3)) ...[
                      _buildBarraMaisRelatada(titulo: item.key, contagem: '${item.value} relatos', progresso: item.value / ranking.first.value),
                      const SizedBox(height: 12),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // 7. CABEÇALHO "RELATOS RECENTES · 5 OCORRÊNCIAS"
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Relatos recentes',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                  Text(
                    '${listaExibida.length} ocorrências',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF6B8574),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),

              // 8. LISTA DOS 5 RELATOS RECENTES
              if (listaExibida.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'Nenhuma ocorrência encontrada para esse filtro.',
                      style: TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF6B8574),
                      ),
                    ),
                  ),
                )
              else
                Column(
                  children: List.generate(listaExibida.length, (index) {
                    final Map relato = listaExibida[index] as Map;
                    final bool isUltimo = index == listaExibida.length - 1;
                    return _buildItemRelato(relato, !isUltimo);
                  }),
                ),
            ],
          ),
        ),
      ),

      // 9. BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE COM SUBLINHADO VERDE
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

  // Widget auxiliar para montar cada aba da barra de navegação com o sublinhado verde
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

import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:math';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/data_sao_paulo.dart';
import 'tela_ocorrenciaRegistrada.dart';

import 'package:sentinela/features/propriedades/tela_talhoes.dart';

class TelaRegistrarOcorrencia extends StatefulWidget {
  const TelaRegistrarOcorrencia({super.key});

  @override
  State<TelaRegistrarOcorrencia> createState() =>
      _TelaRegistrarOcorrenciaState();
}

class _TelaRegistrarOcorrenciaState extends State<TelaRegistrarOcorrencia> {
  // Controladores dos campos de texto
  final TextEditingController _buscaPragaController = TextEditingController();
  final TextEditingController _areaAfetadaController = TextEditingController();
  final TextEditingController _observacoesController = TextEditingController();

  // Estados básicos de seleção da interface
  String? _fazendaSelecionada;
  bool _isTalhaoCadastrado = true;
  String? _talhaoSelecionado;
  String _intensidadeSelecionada = 'Baixa';
  DateTime _dataOcorrencia = DataSaoPaulo.paraData(DateTime.now().toUtc());
  bool _dataEscolhida = false, _carregando = true, _salvando = false;
  bool _resultadoDesconhecido = false;
  bool _verificandoPendente = true;
  bool _preparandoEnvio = false;
  Map<String, dynamic>? _pendente;
  String? _pendenteChaveLocal;
  final _api = ApiSentinela();
  List<dynamic> _plantacoes = [];
  String? _plantacaoId, _problemaId, _tipo, _erro;
  int _versao = 0;

  @override
  void initState() { super.initState(); _carregarFazendas(); _carregarPendente(); }

  String? get _chaveLocal {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return uid == null ? null : 'ocorrencia_pendente_$uid';
  }

  Future<void> _carregarPendente() async {
    final chave = _chaveLocal;
    try {
      if (chave == null) return;
      final texto = (await SharedPreferences.getInstance()).getString(chave);
      if (texto == null || !mounted) return;
      final dados = jsonDecode(texto);
      if (dados is! Map<String, dynamic> || dados['chave'] is! String || dados['caminho'] is! String || dados['corpo'] is! Map || dados['resumo'] is! Map) throw const FormatException();
      setState(() { _pendente = dados; _pendenteChaveLocal = chave; _resultadoDesconhecido = true; _erro = 'Há um envio pendente. Recupere o resultado antes de registrar outra ocorrência.'; });
    } catch (_) {
      if (mounted) setState(() { _resultadoDesconhecido = true; _erro = 'Não foi possível ler o envio pendente. Não faça um novo cadastro até verificar os registros.'; });
    } finally { if (mounted) setState(() => _verificandoPendente = false); }
  }

  Future<void> _carregarFazendas() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final itens = await _api.request('GET', '/propriedades') as List<dynamic>;
      if (mounted) setState(() { _fazendas.clear(); _fazendas.addAll(itens); _carregando = false; });
    } on ApiException catch (e) { if (mounted) setState(() { _erro = e.mensagem; _carregando = false; }); }
  }

  Future<void> _selecionarFazenda(String? valor) async {
    final versao = ++_versao;
    setState(() { _fazendaSelecionada = valor; _talhaoSelecionado = null; _plantacaoId = null; _problemaId = null; _talhoesCadastrados.clear(); _plantacoes = []; _catalogoPragas.clear(); _erro = null; _carregando = true; });
    if (valor == null) { setState(() => _carregando = false); return; }
    try {
      final itens = await _api.request('GET', '/propriedades/$valor/talhoes') as List<dynamic>;
      if (mounted && versao == _versao) setState(() { _talhoesCadastrados.addAll(itens); _carregando = false; });
    } on ApiException catch (e) { if (mounted && versao == _versao) setState(() { _erro = e.mensagem; _carregando = false; }); }
  }

  Future<void> _selecionarTalhao(String? valor) async {
    final versao = ++_versao;
    setState(() { _talhaoSelecionado = valor; _plantacaoId = null; _problemaId = null; _plantacoes = []; _catalogoPragas.clear(); _erro = null; _carregando = true; });
    if (valor == null) { setState(() => _carregando = false); return; }
    try {
      final itens = await _api.request('GET', '/talhoes/$valor/plantacoes') as List<dynamic>;
      if (mounted && versao == _versao) setState(() { _plantacoes = itens.where((p) => p['status'] == 'ativa').toList(); _carregando = false; });
    } on ApiException catch (e) { if (mounted && versao == _versao) setState(() { _erro = e.mensagem; _carregando = false; }); }
  }

  Future<void> _selecionarPlantacao(String? valor) async {
    final versao = ++_versao;
    setState(() { _plantacaoId = valor; _problemaId = null; _catalogoPragas.clear(); _erro = null; _carregando = true; });
    if (valor == null) { setState(() => _carregando = false); return; }
    final plantacao = _plantacoes.firstWhere((p) => p['_id'].toString() == valor);
    try {
      final itens = await _api.request('GET', '/culturas/${plantacao['culturaId']}/problemas') as List<dynamic>;
      if (mounted && versao == _versao) setState(() { _catalogoPragas.addAll(itens); _carregando = false; });
    } on ApiException catch (e) { if (mounted && versao == _versao) setState(() { _erro = e.mensagem; _carregando = false; }); }
  }

  Future<void> _registrar() async {
    if (_salvando || _preparandoEnvio || _carregando || _resultadoDesconhecido || _verificandoPendente) return;
    if (!_isTalhaoCadastrado || _plantacaoId == null || _tipo == null) { setState(() => _erro = 'Selecione um talhão cadastrado, uma plantação e o tipo de ocorrência.'); return; }
    final textoArea = _areaAfetadaController.text.trim().replaceAll(',', '.');
    final area = textoArea.isEmpty ? null : double.tryParse(textoArea);
    if (textoArea.isNotEmpty && (area == null || !area.isFinite)) { setState(() => _erro = 'Informe a área como número.'); return; }
    late final DateTime data;
    try { data = _dataEscolhida ? DataSaoPaulo.paraUtc(_dataOcorrencia) : DateTime.now().toUtc(); }
    on FormatException catch (e) { setState(() => _erro = e.message); return; }
    final sintomas = [..._sintomasSelecionados.map((e) => e.toString()), if (_observacoesController.text.trim().isNotEmpty) _observacoesController.text.trim()].join('; ');
    final talhao = _talhoesCadastrados.firstWhere((t) => t['_id'].toString() == _talhaoSelecionado);
    final plantacao = _plantacoes.firstWhere((p) => p['_id'].toString() == _plantacaoId);
    final problema = _catalogoPragas.where((p) => p['id'].toString() == _problemaId).toList();
    final random = Random.secure();
    final pendente = <String, dynamic>{
      'chave': List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join(),
      'caminho': '/plantacoes/$_plantacaoId/ocorrencias',
      'corpo': {
        'tipo': _tipo, if (_problemaId != null) 'problemaAgricolaId': _problemaId,
        'dataObservacao': data.toIso8601String(), 'sintomas': sintomas,
        'intensidade': {'Baixa': 'baixa', 'Média': 'media', 'Alta': 'alta'}[_intensidadeSelecionada],
        if (area != null) 'areaAfetadaHa': area,
      },
      'resumo': {'talhaoId': _talhaoSelecionado, 'talhao': '${talhao['nome']}', 'cultura': '${plantacao['culturaNome'] ?? 'Não informada'}',
        'area': '${talhao['areaHa']} ha', 'problema': problema.isEmpty ? 'Não identificado' : '${problema.first['nome']}'},
    };
    final chaveLocal = _chaveLocal;
    if (chaveLocal == null) { setState(() => _erro = 'Entre novamente para continuar.'); return; }
    setState(() => _preparandoEnvio = true);
    try {
      if (!await (await SharedPreferences.getInstance()).setString(chaveLocal, jsonEncode(pendente))) throw StateError('Falha ao guardar envio');
    } catch (_) { if (mounted) setState(() { _preparandoEnvio = false; _erro = 'Não foi possível guardar o envio com segurança.'; }); return; }
    if (!mounted) return;
    setState(() => _preparandoEnvio = false);
    _pendente = pendente;
    _pendenteChaveLocal = chaveLocal;
    await _enviarPendente(chaveLocal);
  }

  Future<void> _enviarPendente(String chaveLocal) async {
    final pendente = _pendente;
    if (pendente == null || _salvando) return;
    if (_chaveLocal != chaveLocal) { setState(() => _erro = 'Entre novamente na conta que iniciou o envio.'); return; }
    final tentativaDeRecuperacao = _resultadoDesconhecido;
    setState(() { _salvando = true; _erro = null; });
    try {
      final resposta = await _api.request('POST', pendente['caminho'] as String, body: Map<String, dynamic>.from(pendente['corpo'] as Map), chaveIdempotencia: pendente['chave'] as String);
      if (!mounted) return;
      if (resposta is! Map || resposta['_id'] == null || resposta['dataObservacao'] is! String || resposta['intensidade'] is! String || resposta['tipo'] is! String) {
        setState(() { _resultadoDesconhecido = true; _erro = 'Resposta incompleta. Confira os registros antes de tentar novamente.'; });
        return;
      }
      final resumo = pendente['resumo'] as Map;
      final dataResposta = DateTime.tryParse(resposta['dataObservacao'] as String);
      final dataLocal = dataResposta == null ? null : DataSaoPaulo.paraData(dataResposta.toUtc());
      final dataTexto = dataLocal == null ? resposta['dataObservacao'] as String : '${dataLocal.day.toString().padLeft(2, '0')}/${dataLocal.month.toString().padLeft(2, '0')}/${dataLocal.year}';
      await (await SharedPreferences.getInstance()).remove(chaveLocal);
      if (!mounted) return;
      setState(() { _pendente = null; _resultadoDesconhecido = false; _sintomasSelecionados.clear(); _areaAfetadaController.clear(); _observacoesController.clear(); _problemaId = null; });
      await Navigator.push(context, MaterialPageRoute(builder: (_) => TelaOcorrenciaRegistrada(
        talhaoId: resumo['talhaoId'] as String?, nomeTalhao: '${resumo['talhao']}', cultura: '${resumo['cultura']}',
        areaTotalTalhao: '${resumo['area']}', nomeOcorrencia: '${resumo['problema']}',
        tipoOcorrencia: '${resposta['tipo']}', intensidade: '${resposta['intensidade']}',
        areaAfetada: resposta['areaAfetadaHa'] == null ? 'Não informada' : '${resposta['areaAfetadaHa']} ha', dataOcorrencia: dataTexto,
      )));
    } on ApiException catch (e) {
      if (!tentativaDeRecuperacao && e.codigo != 'RESULTADO_DESCONHECIDO') { await (await SharedPreferences.getInstance()).remove(chaveLocal); _pendente = null; }
      if (mounted) setState(() { _erro = e.mensagem; _resultadoDesconhecido = _pendente != null; });
    } catch (_) {
      if (mounted) setState(() { _resultadoDesconhecido = true; _erro = 'Não foi possível confirmar o resultado. Recupere o envio pendente.'; });
    }
    finally { if (mounted) setState(() => _salvando = false); }
  }

  // Controle da barra de navegação inferior (-1 = botão central REGISTRAR ativo)
  int _indiceAtualNav = -1;

  // Listas vazias aguardando integração com o banco de dados
  final List _fazendas = [];
  final List _talhoesCadastrados = [];
  final List _catalogoPragas = [];

  // Sintomas fixos da interface
  final List _sintomasDisponiveis = [
    'Manchas nas folhas',
    'Folhas amareladas',
    'Folhas roídas',
    'Queda de folhas',
    'Murchamento',
    'Insetos visíveis',
  ];
  final Set _sintomasSelecionados = {};

  @override
  void dispose() {
    _buscaPragaController.dispose();
    _areaAfetadaController.dispose();
    _observacoesController.dispose();
    super.dispose();
  }

  String get _dataFormatada {
    final data = _dataEscolhida ? _dataOcorrencia : DataSaoPaulo.paraData(DateTime.now().toUtc());
    final dia = data.day.toString().padLeft(2, '0');
    final mes = data.month.toString().padLeft(2, '0');
    final ano = data.year.toString();
    return '$dia/$mes/$ano';
  }

  Future<void> _selecionarData() async {
    final DateTime? escolhida = await showDatePicker(
      context: context,
      initialDate: _dataOcorrencia,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF00501E),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1F2D24),
            ),
          ),
          child: child!,
        );
      },
    );

    if (escolhida != null) {
      setState(() { _dataOcorrencia = escolhida; _dataEscolhida = true; });
    }
  }

  Widget _buildLabelObrigatorio(String texto) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: '$texto ',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00501E),
            ),
          ),
          const TextSpan(
            text: '*',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFFC93B2B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabelOpcional(String texto) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: '$texto ',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00501E),
            ),
          ),
          const TextSpan(
            text: '(opcional)',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF5A7363),
            ),
          ),
        ],
      ),
    );
  }

  // Botões de intensidade com cores dinâmicas: Verde (Baixa), Amarelo (Média) e Vermelho (Alta)
  Widget _buildBotaoIntensidade(String titulo, String subtitulo) {
    final bool selecionada = _intensidadeSelecionada == titulo;

    Color corFundo = Colors.white;
    Color corBorda = const Color(0xFFDCE5DE);
    Color corTextoPrincipal = const Color(0xFF284231);
    Color corTextoSubtitulo = const Color(0xFF6B8574);

    if (selecionada) {
      if (titulo == 'Baixa') {
        corFundo = const Color(0xFFD3E4D5);
        corBorda = const Color(0xFF00501E);
        corTextoPrincipal = const Color(0xFF00501E);
        corTextoSubtitulo = const Color(0xFF00501E);
      } else if (titulo == 'Média') {
        corFundo = const Color(0xFFFCF3D9);
        corBorda = const Color(0xFFD99B26);
        corTextoPrincipal = const Color(0xFF7A4900);
        corTextoSubtitulo = const Color(0xFF8F5900);
      } else if (titulo == 'Alta') {
        corFundo = const Color(0xFFFBE9E3);
        corBorda = const Color(0xFFC93B2B);
        corTextoPrincipal = const Color(0xFF8C2A0E);
        corTextoSubtitulo = const Color(0xFFA33414);
      }
    }

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _intensidadeSelecionada = titulo),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
          decoration: BoxDecoration(
            color: corFundo,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: corBorda, width: selecionada ? 1.8 : 1.2),
          ),
          child: Column(
            children: [
              Text(
                titulo,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: corTextoPrincipal,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitulo,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: corTextoSubtitulo,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPassoItem(String numero, String texto) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: const BoxDecoration(
            color: Color(0xFF134E1E),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              numero,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            texto,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w500,
              color: Color(0xFF284231),
            ),
          ),
        ),
      ],
    );
  }

  // Card exibido quando "Talhão novo" está selecionado
  Widget _buildCardTalhaoNovo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F6F3),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Color(0xFFD8E7DA),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.map_outlined,
                  color: Color(0xFF00501E),
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Text(
                  'Esse talhão ainda não está cadastrado',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00501E),
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Para registrar a ocorrência, primeiro cadastre o talhão com nome, cultura e área. Depois é só voltar aqui.',
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w500,
              color: Color(0xFF425C4B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          _buildPassoItem('1', 'Cadastre o talhão na tela Talhões'),
          const SizedBox(height: 10),
          _buildPassoItem('2', 'Volte e registre a ocorrência nele'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TelaTalhoes(),
                  ),
                );
              },
              icon: const Icon(Icons.add_rounded, size: 22),
              label: const Text(
                'Cadastrar talhão',
                style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF134E1E),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. TOPO / LOGO SENTINELA
              Center(
                child: Column(
                  children: const [
                    Icon(Icons.spa_rounded, color: Color(0xFF00501E), size: 28),
                    SizedBox(height: 2),
                    Text(
                      'Sentinela',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              const Text(
                'Registrar ocorrência',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Conte o que você encontrou na plantação.',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 16),

              // 2. SELETOR DE FAZENDA + AVISO DE OBRIGATÓRIOS
              Row(
                children: [
                  Expanded(
                    flex: 5,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: const Color(0xFFDCE5DE),
                          width: 1.2,
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _fazendaSelecionada,
                          isExpanded: true,
                          hint: Row(
                            children: const [
                              Icon(
                                Icons.home_work_outlined,
                                size: 16,
                                color: Color(0xFF5A7363),
                              ),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Fazenda Boa Vista',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF88968D),
                                    height: 1.15,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          icon: const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            color: Color(0xFF5A7363),
                            size: 20,
                          ),
                          items: _fazendas.map((fazenda) {
                            final String nomeFazenda = fazenda['nome'].toString();
                            return DropdownMenuItem<String>(
                              value: fazenda['_id'].toString(),
                              child: Text(nomeFazenda),
                            );
                          }).toList(),
                          onChanged: _carregando ? null : _selecionarFazenda,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 4,
                    child: RichText(
                      text: const TextSpan(
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF5A7363),
                          height: 1.25,
                        ),
                        children: [
                          TextSpan(text: 'Campos com '),
                          TextSpan(
                            text: '*',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFC93B2B),
                            ),
                          ),
                          TextSpan(text: ' são obrigatórios'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              // 3. ONDE FOI?
              const Text(
                'Onde foi?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isTalhaoCadastrado = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        decoration: BoxDecoration(
                          color: _isTalhaoCadastrado
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _isTalhaoCadastrado
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _isTalhaoCadastrado ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Talhão cadastrado',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _isTalhaoCadastrado
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isTalhaoCadastrado = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        decoration: BoxDecoration(
                          color: !_isTalhaoCadastrado
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: !_isTalhaoCadastrado
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: !_isTalhaoCadastrado ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Talhão novo',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: !_isTalhaoCadastrado
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Conteúdo condicional: Talhão novo vs Formulário completo
              if (!_isTalhaoCadastrado)
                _buildCardTalhaoNovo()
              else ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFDCE5DE),
                      width: 1.2,
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _talhaoSelecionado,
                      isExpanded: true,
                      hint: Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: const BoxDecoration(
                              color: Color(0xFFE7F1E9),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.eco_outlined,
                              color: Color(0xFF00501E),
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Selecione um talhão',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF88968D),
                            ),
                          ),
                        ],
                      ),
                      icon: const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: Color(0xFF00501E),
                      ),
                      items: _talhoesCadastrados.map((talhao) {
                        final String nomeTalhao = (talhao['nome'] ?? '')
                            .toString();
                        return DropdownMenuItem<String>(
                          value: talhao['_id'].toString(),
                          child: Text(nomeTalhao),
                        );
                      }).toList(),
                      onChanged: _carregando ? null : _selecionarTalhao,
                    ),
                  ),
                ),
                const SizedBox(height: 22),

                if (_carregando) const Center(child: CircularProgressIndicator()),
                if (_erro != null) ...[
                  SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
                  if (_pendente != null) TextButton(onPressed: _salvando ? null : () { final chave = _pendenteChaveLocal; if (chave != null) _enviarPendente(chave); }, child: const Text('Recuperar envio pendente')),
                  if (_fazendas.isEmpty && !_carregando) TextButton(onPressed: _carregarFazendas, child: const Text('Tentar novamente')),
                  const SizedBox(height: 12),
                ],
                DropdownButtonFormField<String>(
                  initialValue: _plantacaoId,
                  decoration: const InputDecoration(labelText: 'Plantação ativa *'),
                  items: _plantacoes.map((p) => DropdownMenuItem<String>(value: p['_id'].toString(), child: Text('Plantação ${p['safra'] ?? 'ativa'}'))).toList(),
                  onChanged: _carregando ? null : _selecionarPlantacao,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _tipo,
                  decoration: const InputDecoration(labelText: 'Tipo de ocorrência *'),
                  items: const [
                    DropdownMenuItem(value: 'praga', child: Text('Praga')),
                    DropdownMenuItem(value: 'doenca', child: Text('Doença')),
                    DropdownMenuItem(value: 'deficiencia', child: Text('Deficiência')),
                    DropdownMenuItem(value: 'nao_identificado', child: Text('Não identificado')),
                  ],
                  onChanged: (valor) => setState(() { _tipo = valor; _problemaId = null; }),
                ),
                const SizedBox(height: 22),

                // 4. O QUE VOCÊ VIU? (OPCIONAL)
                _buildLabelOpcional('O que você viu?'),
                const SizedBox(height: 4),
                const Text(
                  'Marque o que notou. Isso ajuda a achar a praga ou doença abaixo.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF5A7363),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 10,
                  children: _sintomasDisponiveis.map((item) {
                    final String sintoma = item.toString();
                    final bool selecionado = _sintomasSelecionados.contains(
                      sintoma,
                    );
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          if (selecionado) {
                            _sintomasSelecionados.remove(sintoma);
                          } else {
                            _sintomasSelecionados.add(sintoma);
                          }
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: selecionado
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: selecionado
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: selecionado ? 1.6 : 1.2,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (selecionado) ...[
                              const Icon(
                                Icons.check_rounded,
                                size: 16,
                                color: Color(0xFF00501E),
                              ),
                              const SizedBox(width: 6),
                            ],
                            Text(
                              sintoma,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: selecionado
                                    ? FontWeight.bold
                                    : FontWeight.w600,
                                color: selecionado
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // 5. QUAL PRAGA OU DOENÇA? *
                _buildLabelObrigatorio('Qual praga ou doença?'),
                const SizedBox(height: 4),
                const Text(
                  'Escreva o nome ou escolha do catálogo. Use "Ficha" para ver como identificar.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF5A7363),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _buscaPragaController,
                  onChanged: (_) => setState(() => _problemaId = null),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: 'Ex.: Percevejo-marrom',
                    hintStyle: const TextStyle(
                      fontSize: 15,
                      color: Color(0xFF88968D),
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: Color(0xFF5A7363),
                      size: 22,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 15,
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide: const BorderSide(
                        color: Color(0xFFDCE5DE),
                        width: 1.2,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide: const BorderSide(
                        color: Color(0xFF00501E),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                const Text(
                  'CATÁLOGO COMPATÍVEL COM A CULTURA',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.4,
                    color: Color(0xFF5A7363),
                  ),
                ),
                const SizedBox(height: 10),

                // Container reservado para a lista do catálogo (banco de dados)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 20,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F7F4),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFDCE5DE),
                      width: 1.2,
                    ),
                  ),
                  child: Text(
                    _catalogoPragas.isEmpty
                        ? 'Nenhum problema disponível para esta cultura.'
                        : '${_catalogoPragas.length} itens carregados',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF5A7363),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _problemaId,
                  decoration: const InputDecoration(labelText: 'Problema do catálogo (opcional)'),
                  items: _catalogoPragas.where((p) => p['tipo'] == _tipo && p['nome'].toString().toLowerCase().contains(_buscaPragaController.text.toLowerCase())).map((p) => DropdownMenuItem<String>(value: p['id'].toString(), child: Text(p['nome'].toString(), overflow: TextOverflow.ellipsis))).toList(),
                  onChanged: _carregando || _tipo == null || _tipo == 'nao_identificado' ? null : (valor) => setState(() => _problemaId = valor),
                ),
                const SizedBox(height: 22),

                // 6. QUAL A INTENSIDADE? * (Verde, Amarelo e Vermelho)
                _buildLabelObrigatorio('Qual a intensidade?'),
                const SizedBox(height: 4),
                const Text(
                  'Olhe a área toda e escolha a mais próxima.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF5A7363),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildBotaoIntensidade('Baixa', 'Poucas plantas'),
                    const SizedBox(width: 10),
                    _buildBotaoIntensidade('Média', 'Vários pontos'),
                    const SizedBox(width: 10),
                    _buildBotaoIntensidade('Alta', 'Muito espalhada'),
                  ],
                ),
                const SizedBox(height: 22),

                // 7. DATA * + ÁREA AFETADA *
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabelObrigatorio('Data'),
                          const SizedBox(height: 8),
                          GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: _selecionarData,
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 15,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: const Color(0xFFDCE5DE),
                                  width: 1.2,
                                ),
                              ),
                              child: Text(
                                _dataFormatada,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF333333),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabelObrigatorio('Área afetada'),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _areaAfetadaController,
                                  keyboardType:
                                      const TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
                                  decoration: InputDecoration(
                                    isDense: true,
                                    hintText: '1,5',
                                    hintStyle: const TextStyle(
                                      fontSize: 15,
                                      color: Color(0xFF88968D),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 15,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(
                                        color: Color(0xFFDCE5DE),
                                        width: 1.2,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(
                                        color: Color(0xFF00501E),
                                        width: 1.5,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'ha',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),

                // 8. OBSERVAÇÕES (OPCIONAL)
                _buildLabelOpcional('Observações'),
                const SizedBox(height: 8),
                TextField(
                  controller: _observacoesController,
                  maxLines: 3,
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    hintText: 'Algo que você notou na plantação',
                    hintStyle: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6B8574),
                    ),
                    contentPadding: const EdgeInsets.all(16),
                    filled: true,
                    fillColor: Colors.white,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide: const BorderSide(
                        color: Color(0xFFDCE5DE),
                        width: 1.2,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide: const BorderSide(
                        color: Color(0xFF00501E),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // 9. SUGESTÃO DO SENTINELA (ESTRUTURA VISUAL)
                const Text(
                  'ACOMPANHAMENTO',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: Color(0xFF5A7363),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFCF3D9),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFEAD396),
                      width: 1.2,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF6DF9E),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'ATENÇÃO',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF7A4900),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'A seleção de um problema não confirma o diagnóstico.',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          height: 1.35,
                          color: Color(0xFF7A4900),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                const Center(
                  child: Text(
                    'O registro será enviado após a confirmação.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF5A7363),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // 10. BOTÃO REGISTRAR OCORRÊNCIA
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _carregando || _salvando || _preparandoEnvio || _resultadoDesconhecido || _verificandoPendente ? null : _registrar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF134E1E),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: Text(
                      _salvando ? 'Registrando...' : 'Registrar ocorrência',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),

      // 11. BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE COM SUBLINHADO VERDE
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
                    color: Colors.black.withOpacity(0.05),
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
                    onTap: () {
                      setState(() => _indiceAtualNav = -1);
                    },
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00501E),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00501E).withOpacity(0.3),
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

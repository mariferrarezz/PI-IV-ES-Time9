import 'package:flutter/material.dart';
import 'dart:math';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/data_sao_paulo.dart';

class TelaRegistroEvolucao extends StatefulWidget {
  const TelaRegistroEvolucao({super.key, this.propriedadeInicial, this.talhaoInicial, this.plantacaoInicial, this.ocorrenciaInicial});
  final String? propriedadeInicial, talhaoInicial, plantacaoInicial, ocorrenciaInicial;

  @override
  State<TelaRegistroEvolucao> createState() => _TelaRegistroEvolucaoState();
}

class _TelaRegistroEvolucaoState extends State<TelaRegistroEvolucao> {
  final _api = ApiSentinela();
  List<dynamic> _propriedades = [], _talhoes = [], _plantacoes = [], _ocorrencias = [], _tratamentos = [];
  String? _propriedadeId, _talhaoId, _plantacaoId, _ocorrenciaId, _erro, _tratamentoId, _tipoMedida;
  bool _carregando = false, _salvando = false, _dataEscolhida = false, _dataTratamentoEscolhida = false, _tratamentoSalvo = false, _avaliacaoSalva = false;
  bool _resultadoIncerto = false;
  final Map<String, (String, String, Map<String, dynamic>)> _enviosPendentes = {};
  final _aleatorio = Random.secure();

  Future<dynamic> _enviar(String etapa, String caminho, Map<String, dynamic> body) async {
    final existente = _enviosPendentes[etapa];
    if (existente != null && existente.$1 != caminho) {
      throw const ApiException('Retorne aos registros anteriores e confirme o envio pendente.');
    }
    final envio = existente ?? (caminho, List.generate(16, (_) => _aleatorio.nextInt(256).toRadixString(16).padLeft(2, '0')).join(), body);
    _enviosPendentes[etapa] = envio;
    try {
      final resultado = await _api.request('POST', envio.$1, body: envio.$3, chaveIdempotencia: envio.$2);
      _enviosPendentes.remove(etapa);
      _resultadoIncerto = _enviosPendentes.isNotEmpty;
      return resultado;
    } on ApiException catch (e) {
      if (existente == null && e.codigo != 'RESULTADO_DESCONHECIDO') _enviosPendentes.remove(etapa);
      rethrow;
    }
  }
  final _descricaoTratamento = TextEditingController();
  final _observacoesAvaliacao = TextEditingController();
  int _versao = 0;

  @override
  void initState() {
    super.initState();
    _iniciar();
  }

  Future<void> _iniciar() async {
    await _carregarPropriedades();
    if (!mounted || widget.propriedadeInicial == null || widget.talhaoInicial == null || widget.plantacaoInicial == null || widget.ocorrenciaInicial == null) return;
    await _selecionar(0, widget.propriedadeInicial);
    if (!mounted) return;
    await _selecionar(1, widget.talhaoInicial);
    if (!mounted) return;
    await _selecionar(2, widget.plantacaoInicial);
    if (!mounted) return;
    await _selecionarOcorrencia(widget.ocorrenciaInicial);
  }

  Future<void> _carregarPropriedades() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final itens = await _api.request('GET', '/propriedades') as List<dynamic>;
      if (mounted) setState(() => _propriedades = itens);
    } on ApiException catch (e) { if (mounted) setState(() => _erro = e.mensagem); }
    finally { if (mounted) setState(() => _carregando = false); }
  }

  Future<void> _selecionar(int nivel, String? valor) async {
    final versao = ++_versao;
    setState(() {
      _erro = null;
      if (nivel == 0) { _propriedadeId = valor; _talhaoId = null; _talhoes = []; }
      if (nivel <= 1) { if (nivel == 1) _talhaoId = valor; _plantacaoId = null; _plantacoes = []; }
      if (nivel <= 2) { if (nivel == 2) _plantacaoId = valor; _ocorrenciaId = null; _ocorrencias = []; _tratamentoId = null; _tratamentos = []; _tratamentoSalvo = false; _avaliacaoSalva = false; }
      _carregando = valor != null;
    });
    if (valor == null) return;
    final caminho = switch (nivel) { 0 => '/propriedades/$valor/talhoes', 1 => '/talhoes/$valor/plantacoes', _ => '/plantacoes/$valor/ocorrencias' };
    try {
      final itens = await _api.request('GET', caminho) as List<dynamic>;
      if (!mounted || versao != _versao) return;
      setState(() {
        if (nivel == 0) _talhoes = itens;
        if (nivel == 1) _plantacoes = itens.where((e) => e['status'] == 'ativa').toList();
        if (nivel == 2) _ocorrencias = itens;
      });
    } on ApiException catch (e) { if (mounted && versao == _versao) setState(() => _erro = e.mensagem); }
    finally { if (mounted && versao == _versao) setState(() => _carregando = false); }
  }

  Future<void> _selecionarOcorrencia(String? valor) async {
    final versao = ++_versao;
    setState(() { _ocorrenciaId = valor; _tratamentos = []; _tratamentoId = null; _tratamentoSalvo = false; _avaliacaoSalva = false; _erro = null; _carregando = valor != null; });
    if (valor == null) return;
    try {
      final itens = await _api.request('GET', '/plantacoes/$_plantacaoId/ocorrencias/$valor/tratamentos') as List<dynamic>;
      if (mounted && versao == _versao) setState(() => _tratamentos = itens);
    } on ApiException catch (e) { if (mounted && versao == _versao) setState(() => _erro = e.mensagem); }
    finally { if (mounted && versao == _versao) setState(() => _carregando = false); }
  }

  Future<void> _salvarTratamento() async {
    if (_salvando || _tratamentoSalvo) return;
    if (_plantacaoId == null || _ocorrenciaId == null || _tipoMedida == null) { setState(() => _erro = 'Selecione plantação, ocorrência e tipo de medida.'); return; }
    late final DateTime data;
    try { data = _dataTratamentoEscolhida ? DataSaoPaulo.paraUtc(_dataTratamento) : DateTime.now().toUtc(); }
    on FormatException catch (e) { setState(() => _erro = e.message); return; }
    setState(() { _salvando = true; _erro = null; });
    try {
      final registro = await _enviar('tratamento', '/plantacoes/$_plantacaoId/ocorrencias/$_ocorrenciaId/tratamentos', {
        'tipoMedida': _tipoMedida, 'descricao': _descricaoTratamento.text.trim(), 'dataAplicacao': data.toIso8601String(),
        if (_produtoController.text.trim().isNotEmpty) 'produtoUtilizado': _produtoController.text.trim(),
        if (_quemAplicouController.text.trim().isNotEmpty) 'responsavelAplicacao': _quemAplicouController.text.trim(),
      });
      if (!mounted) return;
      setState(() { _tratamentos = [registro, ..._tratamentos]; _tratamentoId = registro['_id'].toString(); _tratamentoSalvo = true; _avaliacaoSalva = false; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tratamento salvo. A avaliação ainda não foi enviada.')));
    } on ApiException catch (e) { if (mounted) setState(() { _erro = e.mensagem; if (e.codigo == 'RESULTADO_DESCONHECIDO') _resultadoIncerto = true; }); }
    finally { if (mounted) setState(() => _salvando = false); }
  }

  Future<void> _salvarAvaliacao() async {
    if (_salvando || _avaliacaoSalva) return;
    if (_tratamentoId == null || _ocorrenciaId == null || _plantacaoId == null) { setState(() => _erro = 'Selecione um tratamento salvo.'); return; }
    late final DateTime data;
    try { data = _dataEscolhida ? DataSaoPaulo.paraUtc(_dataSelecionada) : DateTime.now().toUtc(); }
    on FormatException catch (e) { setState(() => _erro = e.message); return; }
    setState(() { _salvando = true; _erro = null; });
    try {
      await _enviar('avaliacao', '/plantacoes/$_plantacaoId/ocorrencias/$_ocorrenciaId/tratamentos/$_tratamentoId/avaliacoes', {
        'dataAvaliacao': data.toIso8601String(), 'resultado': {'Observando': 'inconclusivo', 'Melhorou': 'melhora_observada', 'Piorou': 'piora_observada', 'Sem mudança': 'sem_mudanca'}[_resultadoTratamento], 'observacoes': _observacoesAvaliacao.text.trim(),
      });
      if (!mounted) return;
      setState(() => _avaliacaoSalva = true);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Avaliação salva.')));
    } on ApiException catch (e) { if (mounted) setState(() { _erro = e.mensagem; if (e.codigo == 'RESULTADO_DESCONHECIDO') _resultadoIncerto = true; }); }
    finally { if (mounted) setState(() => _salvando = false); }
  }

  Widget _seletor(String rotulo, List<dynamic> itens, String? selecionado, ValueChanged<String?>? onChanged, String Function(dynamic) nome) {
    return Padding(padding: const EdgeInsets.only(bottom: 12), child: DropdownButtonFormField<String>(
      key: ValueKey('$rotulo:$selecionado:${itens.map((e) => e['_id']).join(',')}'),
      initialValue: selecionado, decoration: InputDecoration(labelText: rotulo, border: const OutlineInputBorder()),
      items: itens.map((e) => DropdownMenuItem<String>(value: e['_id'].toString(), child: Text(nome(e), overflow: TextOverflow.ellipsis))).toList(),
      onChanged: _carregando || _salvando || _resultadoIncerto ? null : onChanged,
    ));
  }

  Future<void> _salvarMonitoramento() async {
    if (_salvando || _carregando) return;
    if (_plantacaoId == null || _ocorrenciaId == null) { setState(() => _erro = 'Selecione uma plantação e uma ocorrência.'); return; }
    if (_situacaoSelecionada == 'Controlada') { setState(() => _erro = 'Selecione melhorou, igual ou piorou para a evolução; controlada não é uma evolução prevista.'); return; }
    final areaTexto = _areaAfetadaController.text.trim().replaceAll(',', '.');
    final area = areaTexto.isEmpty ? null : double.tryParse(areaTexto);
    if (areaTexto.isNotEmpty && (area == null || !area.isFinite)) { setState(() => _erro = 'Informe a área como número.'); return; }
    late final DateTime data;
    try { data = _dataEscolhida ? DataSaoPaulo.paraUtc(_dataSelecionada) : DateTime.now().toUtc(); }
    on FormatException catch (e) { setState(() => _erro = e.message); return; }
    setState(() { _salvando = true; _erro = null; });
    try {
      await _enviar('monitoramento', '/plantacoes/$_plantacaoId/monitoramentos', {
        'ocorrenciaId': _ocorrenciaId, 'dataObservacao': data.toIso8601String(),
        'problemaObservado': true, 'observacoes': [if (_observacoesController.text.trim().isNotEmpty) _observacoesController.text.trim(), if (_respondeuAgronomo) 'Chamou agrônomo: ${_chamouAgronomo ? 'sim' : 'não'}'].join('\n'),
        'intensidade': {'Baixa': 'baixa', 'Média': 'media', 'Alta': 'alta'}[_intensidadeSelecionada],
        'evolucao': {'Melhorou': 'melhorou', 'Igual': 'estavel', 'Piorou': 'piorou'}[_situacaoSelecionada],
        if (area != null) 'areaAfetadaHa': area,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Monitoramento salvo. Tratamento e avaliação não foram enviados.')));
      setState(() { _observacoesController.clear(); _areaAfetadaController.clear(); });
    } on ApiException catch (e) { if (mounted) setState(() { _erro = e.mensagem; if (e.codigo == 'RESULTADO_DESCONHECIDO') _resultadoIncerto = true; }); }
    finally { if (mounted) setState(() => _salvando = false); }
  }
  String _intensidadeSelecionada = 'Alta';
  String _situacaoSelecionada = 'Igual';

  String _resultadoTratamento = 'Observando';
  bool _fezTratamento = true;
  bool _chamouAgronomo = false;
  bool _respondeuAgronomo = false;

  DateTime _dataTratamento = DataSaoPaulo.paraData(DateTime.now().toUtc());
  DateTime _dataSelecionada = DataSaoPaulo.paraData(DateTime.now().toUtc());

  final TextEditingController _produtoController = TextEditingController();
  final TextEditingController _quemAplicouController = TextEditingController();
  final TextEditingController _areaAfetadaController = TextEditingController();
  final TextEditingController _observacoesController = TextEditingController();

  @override
  void dispose() {
    _descricaoTratamento.dispose();
    _observacoesAvaliacao.dispose();
    _areaAfetadaController.dispose();
    _produtoController.dispose();
    _quemAplicouController.dispose();
    _observacoesController.dispose();
    super.dispose();
  }

  // Formata a data para DD/MM/AAAA
  String get _dataFormatada {
    final data = _dataEscolhida ? _dataSelecionada : DataSaoPaulo.paraData(DateTime.now().toUtc());
    final dia = data.day.toString().padLeft(2, '0');
    final mes = data.month.toString().padLeft(2, '0');
    final ano = data.year.toString();
    return '$dia/$mes/$ano';
  }

  String get _dataTratamentoFormatada {
    final data = _dataTratamentoEscolhida ? _dataTratamento : DataSaoPaulo.paraData(DateTime.now().toUtc());
    final dia = data.day.toString().padLeft(2, '0');
    final mes = data.month.toString().padLeft(2, '0');
    final ano = data.year.toString();
    return '$dia/$mes/$ano';
  }

  Future<void> _selecionarDataTratamento() async {
    final DateTime? dataEscolhidaTratamento = await showDatePicker(
      context: context,
      initialDate: _dataTratamento,
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
    if (dataEscolhidaTratamento != null) {
      setState(() {
        _dataTratamento = dataEscolhidaTratamento;
        _dataTratamentoEscolhida = true;
      });
    }
  }

  // Abre o calendário ao tocar no campo
  Future<void> _selecionarData() async {
    final DateTime? dataEscolhida = await showDatePicker(
      context: context,
      initialDate: _dataSelecionada,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF00501E), // Verde escuro padrão
              onPrimary: Colors.white,
              onSurface: Color(0xFF1F2D24),
            ),
          ),
          child: child!,
        );
      },
    );

    if (dataEscolhida != null) {
      setState(() {
        _dataSelecionada = dataEscolhida;
        _dataEscolhida = true;
      });
    }
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
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF00501E),
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                        const Text(
                          'Registrar evolução',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        SizedBox(height: 4),

                        const Text(
                          'Selecione os registros para acompanhar',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF5A7363),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              if (widget.ocorrenciaInicial == null) ...[
              _seletor('Propriedade', _propriedades, _propriedadeId, (v) => _selecionar(0, v), (e) => (e['nome'] ?? 'Propriedade').toString()),
              _seletor('Talhão', _talhoes, _talhaoId, (v) => _selecionar(1, v), (e) => (e['nome'] ?? 'Talhão').toString()),
              _seletor('Plantação ativa', _plantacoes, _plantacaoId, (v) => _selecionar(2, v), (e) => 'Plantação ${e['safra'] ?? 'ativa'}'),
              _seletor('Ocorrência', _ocorrencias, _ocorrenciaId, _selecionarOcorrencia, (e) => '${e['tipo']} · ${e['sintomas']}'),
              ] else const Text('Registro vinculado à ocorrência selecionada.'),
              if (_carregando) const Center(child: CircularProgressIndicator()),
              if (_erro != null) SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
              if (_propriedades.isEmpty && !_carregando) TextButton(onPressed: _carregarPropriedades, child: const Text('Tentar carregar propriedades')),
              const SizedBox(height: 16),

              // Campo: Data da observação
              const Text(
                'Data da observação',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _selecionarData,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(
                        0xFFDCE5DE,
                      ), // Borda verde-acinzentada sutil
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
              const SizedBox(height: 20),
              // Campo: Como está a intensidade agora?
              const Text(
                'Como está a intensidade agora?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Obrigatório. É o ponto que entra no gráfico.',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 12),

              // Três cartões de seleção (Baixa, Média, Alta)
              Row(
                children: [
                  // OPÇÃO 1: BAIXA (Paleta Verde quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _intensidadeSelecionada = 'Baixa'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _intensidadeSelecionada == 'Baixa'
                              ? const Color(0xFFD3E4D5) // Fundo verde claro
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _intensidadeSelecionada == 'Baixa'
                                ? const Color(0xFF00501E) // Borda verde escura
                                : const Color(0xFFDCE5DE),
                            width: _intensidadeSelecionada == 'Baixa'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Baixa',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _intensidadeSelecionada == 'Baixa'
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Poucas plantas',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: _intensidadeSelecionada == 'Baixa'
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF5A7363),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // OPÇÃO 2: MÉDIA (Paleta Amarela quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _intensidadeSelecionada = 'Média'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _intensidadeSelecionada == 'Média'
                              ? const Color(0xFFFEF7E0) // Fundo amarelo claro
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _intensidadeSelecionada == 'Média'
                                ? const Color(
                                    0xFF8C5700,
                                  ) // Borda marrom-dourada
                                : const Color(0xFFDCE5DE),
                            width: _intensidadeSelecionada == 'Média'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Média',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _intensidadeSelecionada == 'Média'
                                    ? const Color(0xFF8C5700)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Vários pontos',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: _intensidadeSelecionada == 'Média'
                                    ? const Color(0xFF8C5700)
                                    : const Color(0xFF5A7363),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // OPÇÃO 3: ALTA (Paleta Vermelha/Salmão quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _intensidadeSelecionada = 'Alta'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _intensidadeSelecionada == 'Alta'
                              ? const Color(0xFFF6C8B6) // Fundo salmão claro
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _intensidadeSelecionada == 'Alta'
                                ? const Color(
                                    0xFF9E3012,
                                  ) // Borda marrom-avermelhada
                                : const Color(0xFFDCE5DE),
                            width: _intensidadeSelecionada == 'Alta'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Alta',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _intensidadeSelecionada == 'Alta'
                                    ? const Color(0xFF9E3012)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Muito espalhada',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: _intensidadeSelecionada == 'Alta'
                                    ? const Color(0xFF9E3012)
                                    : const Color(0xFF5A7363),
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

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Área afetada',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                  const SizedBox(width: 5),
                  const Text(
                    '(opcional)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _areaAfetadaController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF333333),
                      ),
                      decoration: InputDecoration(
                        hintText: '4,0',
                        hintStyle: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF88968D),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
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
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'ha',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 13),
              const Text(
                'E a situação em relação à ultima vez?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 12),

              // Primeira linha: Piorou e Igual
              Row(
                children: [
                  // OPÇÃO 1: PIOROU (Paleta Vermelha/Salmão quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Piorou'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Piorou'
                              ? const Color(0xFFF6C8B6)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Piorou'
                                ? const Color(0xFF9E3012)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Piorou' ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Piorou',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Piorou'
                                  ? const Color(0xFF9E3012)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // OPÇÃO 2: IGUAL (Paleta Amarela/Dourada quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Igual'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Igual'
                              ? const Color(0xFFFAE6B1)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Igual'
                                ? const Color(0xFF8C5700)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Igual' ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Igual',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Igual'
                                  ? const Color(0xFF8C5700)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Segunda linha: Melhorou e Controlada
              Row(
                children: [
                  // OPÇÃO 3: MELHOROU (Paleta Verde quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Melhorou'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Melhorou'
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Melhorou'
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Melhorou'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Melhorou',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Melhorou'
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // OPÇÃO 4: CONTROLADA (Paleta Verde quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Controlada'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Controlada'
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Controlada'
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Controlada'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Controlada',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Controlada'
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
              const SizedBox(height: 20),
              // Campo: Fez algum tratamento? (Sim / Não)
              const Text(
                'Fez algum tratamento?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  // Botão SIM
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _fezTratamento = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _fezTratamento
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _fezTratamento
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _fezTratamento ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Sim',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _fezTratamento
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Botão NÃO
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _fezTratamento = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: !_fezTratamento
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: !_fezTratamento
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: !_fezTratamento ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Não',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: !_fezTratamento
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
              const SizedBox(height: 16),

              // PAINEL CONDICIONAL: Aparece somente se _fezTratamento == true ('Sim')
              if (_fezTratamento) ...[
                DropdownButtonFormField<String>(
                  initialValue: _tipoMedida,
                  decoration: const InputDecoration(labelText: 'Tipo de medida', border: OutlineInputBorder()),
                  items: const [DropdownMenuItem(value: 'manual', child: Text('Manual')), DropdownMenuItem(value: 'cultural', child: Text('Cultural')), DropdownMenuItem(value: 'biologica', child: Text('Biológica')), DropdownMenuItem(value: 'quimica', child: Text('Química')), DropdownMenuItem(value: 'outra', child: Text('Outra'))],
                  onChanged: _tratamentoSalvo || _salvando ? null : (v) => setState(() => _tipoMedida = v),
                ),
                const SizedBox(height: 12),
                TextField(controller: _descricaoTratamento, maxLines: 2, decoration: const InputDecoration(labelText: 'Descrição da medida', border: OutlineInputBorder())),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F7F4), // Fundo verde bem suave
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: const Color(0xFFE1EBE3),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Produto ou método usado
                      const Text(
                        'Produto ou método usado',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _produtoController,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF333333),
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          hintText: 'Fungicida triazol + estrobilurina',
                          hintStyle: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF88968D),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 14,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0xFFDCE5DE),
                              width: 1.2,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0xFF00501E),
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Linha: Data + Quem aplicou
                      Row(
                        children: [
                          // Coluna Data
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Data',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00501E),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                GestureDetector(
                                  behavior: HitTestBehavior.opaque,
                                  onTap: _selecionarDataTratamento,
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 14,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: const Color(0xFFDCE5DE),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Text(
                                      _dataTratamentoFormatada,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF333333),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),

                          // Coluna Quem aplicou
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Quem aplicou',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00501E),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _quemAplicouController,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF333333),
                                  ),
                                  decoration: InputDecoration(
                                    isDense: true,
                                    hintText: 'Eu mesmo',
                                    hintStyle: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF88968D),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 14,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(
                                        color: Color(0xFFDCE5DE),
                                        width: 1.2,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(
                                        color: Color(0xFF00501E),
                                        width: 1.5,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Resultado até agora
                      const Text(
                        'Resultado até agora',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          // Opção 1: Observando (Amarelo quando selecionado)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                () => _resultadoTratamento = 'Observando',
                              ),
                              child: Container(
                                height: 50,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _resultadoTratamento == 'Observando'
                                      ? const Color(0xFFFAE6B1)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: _resultadoTratamento == 'Observando'
                                        ? const Color(0xFF8C5700)
                                        : const Color(0xFFDCE5DE),
                                    width: _resultadoTratamento == 'Observando'
                                        ? 1.8
                                        : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    'Observando',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color:
                                          _resultadoTratamento == 'Observando'
                                          ? const Color(0xFF8C5700)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Opção 2: Melhorou (Verde quando selecionado)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                () => _resultadoTratamento = 'Melhorou',
                              ),
                              child: Container(
                                height: 50,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _resultadoTratamento == 'Melhorou'
                                      ? const Color(0xFFD3E4D5)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: _resultadoTratamento == 'Melhorou'
                                        ? const Color(0xFF00501E)
                                        : const Color(0xFFDCE5DE),
                                    width: _resultadoTratamento == 'Melhorou'
                                        ? 1.8
                                        : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    'Melhorou',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _resultadoTratamento == 'Melhorou'
                                          ? const Color(0xFF00501E)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Opção 3: Piorou (Vermelho/Salmão quando selecionado)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                () => _resultadoTratamento = 'Piorou',
                              ),
                              child: Container(
                                height: 50,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _resultadoTratamento == 'Piorou'
                                      ? const Color(0xFFF6C8B6)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color:
                                        _resultadoTratamento == 'Piorou'
                                        ? const Color(0xFF9E3012)
                                        : const Color(0xFFDCE5DE),
                                    width:
                                        _resultadoTratamento == 'Piorou'
                                        ? 1.8
                                        : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    'Piorou',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      height: 1.15,
                                      fontWeight: FontWeight.bold,
                                      color:
                                          _resultadoTratamento ==
                                              'Piorou'
                                          ? const Color(0xFF9E3012)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              if (_fezTratamento) ...[
                ElevatedButton(onPressed: _salvando || _tratamentoSalvo || (_resultadoIncerto && !_enviosPendentes.containsKey('tratamento')) ? null : _salvarTratamento, child: Text(_tratamentoSalvo ? 'Tratamento salvo' : 'Salvar tratamento')),
                if (_tratamentoSalvo) TextButton(onPressed: _salvando ? null : () => setState(() { _tratamentoSalvo = false; _tipoMedida = null; _descricaoTratamento.clear(); _produtoController.clear(); _quemAplicouController.clear(); }), child: const Text('Preparar outro tratamento')),
                _seletor('Tratamento para avaliação', _tratamentos, _tratamentoId, (v) => setState(() { _tratamentoId = v; _avaliacaoSalva = false; }), (e) => '${e['tipoMedida']} · ${e['descricao']}'),
                ChoiceChip(label: const Text('Sem mudança'), selected: _resultadoTratamento == 'Sem mudança', onSelected: _salvando ? null : (_) => setState(() => _resultadoTratamento = 'Sem mudança')),
                TextField(controller: _observacoesAvaliacao, maxLines: 2, decoration: const InputDecoration(labelText: 'Observações da avaliação', border: OutlineInputBorder())),
                const SizedBox(height: 8),
                const Text('A avaliação usa a data de observação selecionada acima.'),
                ElevatedButton(onPressed: _salvando || _avaliacaoSalva || (_resultadoIncerto && !_enviosPendentes.containsKey('avaliacao')) ? null : _salvarAvaliacao, child: Text(_avaliacaoSalva ? 'Avaliação salva' : 'Salvar avaliação')),
                if (_avaliacaoSalva) TextButton(onPressed: _salvando ? null : () => setState(() { _avaliacaoSalva = false; _observacoesAvaliacao.clear(); }), child: const Text('Preparar outra avaliação')),
                if (_erro != null) SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 20),
              ],
              // Campo: Chamou um agrônomo? (Sim / Não)
              const Text(
                'Chamou um agrônomo?',
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
                      onTap: () => setState(() { _chamouAgronomo = true; _respondeuAgronomo = true; }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _chamouAgronomo
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _chamouAgronomo
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _chamouAgronomo ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Sim',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _chamouAgronomo
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
                      onTap: () => setState(() { _chamouAgronomo = false; _respondeuAgronomo = true; }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: !_chamouAgronomo
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: !_chamouAgronomo
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: !_chamouAgronomo ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Não',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: !_chamouAgronomo
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
              const SizedBox(height: 20),

              // Observações do monitoramento.
              RichText(
                text: const TextSpan(
                  children: [
                    TextSpan(
                      text: 'Observações ',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    TextSpan(
                      text: '(obrigatório para monitoramento)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              TextField(
                controller: _observacoesController,
                maxLines: 3, // Altura de 3 linhas igual à imagem
                textInputAction: TextInputAction.done,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF333333),
                ),
                decoration: InputDecoration(
                  hintText: 'Algo que você notou na plantação',
                  hintStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
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
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 14, 24, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE6EDE7), width: 1)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_erro != null) SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
              if (_resultadoIncerto) const Text('A tentativa da etapa pendente reenviará os dados originais com a mesma chave, sem duplicar o registro.'),
              const Text(
                'Cada botão salva sua própria etapa. A resposta sobre o agrônomo acompanha as observações do monitoramento.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _salvando || _carregando || (_resultadoIncerto && !_enviosPendentes.containsKey('monitoramento')) ? null : _salvarMonitoramento,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(
                      0xFF134E1E,
                    ), // Verde escuro do botão
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Text(
                    _salvando ? 'Salvando...' : 'Salvar monitoramento',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

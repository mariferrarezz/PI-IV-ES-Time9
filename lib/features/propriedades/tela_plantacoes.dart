import 'package:flutter/material.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/data_sao_paulo.dart';

class TelaPlantacoes extends StatefulWidget {
  const TelaPlantacoes({super.key, required this.talhaoId, required this.nomeTalhao, this.consultar});
  final String talhaoId, nomeTalhao;
  final Future<dynamic> Function(String metodo, String caminho, {Map<String, dynamic>? body})? consultar;
  @override
  State<TelaPlantacoes> createState() => _TelaPlantacoesState();
}

class _TelaPlantacoesState extends State<TelaPlantacoes> {
  final _api = ApiSentinela();
  final _variedade = TextEditingController(), _safra = TextEditingController(), _area = TextEditingController(), _observacoes = TextEditingController();
  List<dynamic> _culturas = [], _plantacoes = [];
  String? _culturaId, _erro;
  DateTime? _data;
  bool _carregando = true, _salvando = false;
  bool _dadosCarregados = false;
  bool get _temPlantacaoAtiva => _plantacoes.any((p) => p['status'] == 'ativa');

  Future<dynamic> _request(String metodo, String caminho, {Map<String, dynamic>? body}) =>
      widget.consultar?.call(metodo, caminho, body: body) ?? _api.request(metodo, caminho, body: body);

  String _nomeCultura(dynamic id) {
    for (final cultura in _culturas) {
      if (cultura['id'].toString() == id.toString()) return cultura['nome'].toString();
    }
    return 'Cultura indisponível no catálogo';
  }

  @override
  void initState() { super.initState(); _carregar(); }
  @override
  void dispose() { _variedade.dispose(); _safra.dispose(); _area.dispose(); _observacoes.dispose(); super.dispose(); }

  Future<void> _carregar() async {
    setState(() { _carregando = true; _dadosCarregados = false; _erro = null; });
    try {
      final culturas = await _request('GET', '/culturas') as List<dynamic>;
      final plantacoes = await _request('GET', '/talhoes/${widget.talhaoId}/plantacoes') as List<dynamic>;
      if (mounted) setState(() { _culturas = culturas; _plantacoes = plantacoes; _dadosCarregados = true; _carregando = false; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }

  Future<void> _escolherData() async {
    final escolhida = await showDatePicker(context: context, initialDate: _data ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
    if (escolhida != null && mounted) setState(() => _data = escolhida);
  }

  Future<void> _encerrar(dynamic plantacao) async {
    if (_salvando || _carregando || !_dadosCarregados) return;
    final confirmado = await showDialog<bool>(context: context, builder: (context) => AlertDialog(
      title: const Text('Encerrar plantação?'),
      content: const Text('O histórico será preservado. Novos lançamentos nesta plantação não serão permitidos.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Encerrar plantação')),
      ],
    ));
    if (confirmado != true || !mounted) return;
    setState(() { _salvando = true; _erro = null; });
    try {
      await _request('POST', '/talhoes/${widget.talhaoId}/plantacoes/${plantacao['_id']}/encerrar', body: {});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plantação encerrada.')));
      await _carregar();
    } on ApiException catch (e) {
      if (!mounted) return;
      // A resposta pode ter se perdido depois da gravação; só a consulta resolve a dúvida.
      await _carregar();
      if (mounted) setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  Future<void> _salvar() async {
    if (_salvando) return;
    if (_culturaId == null) { setState(() => _erro = 'Selecione uma cultura.'); return; }
    final textoArea = _area.text.trim().replaceAll(',', '.');
    final area = textoArea.isEmpty ? null : double.tryParse(textoArea);
    if (textoArea.isNotEmpty && (area == null || !area.isFinite)) { setState(() => _erro = 'Informe a área como número.'); return; }
    String? dataPlantio;
    try { if (_data != null) dataPlantio = DataSaoPaulo.paraUtc(_data!).toIso8601String(); }
    on FormatException catch (e) { setState(() => _erro = e.message); return; }
    setState(() { _salvando = true; _erro = null; });
    try {
      await _request('POST', '/talhoes/${widget.talhaoId}/plantacoes', body: {
        'culturaId': _culturaId, 'status': 'ativa',
        if (dataPlantio != null) 'dataPlantio': dataPlantio,
        if (area != null) 'areaPlantadaHa': area,
        if (_variedade.text.trim().isNotEmpty) 'variedade': _variedade.text.trim(),
        if (_safra.text.trim().isNotEmpty) 'safra': _safra.text.trim(),
        if (_observacoes.text.trim().isNotEmpty) 'observacoes': _observacoes.text.trim(),
      });
      if (!mounted) return;
      _variedade.clear(); _safra.clear(); _area.clear(); _observacoes.clear();
      setState(() { _culturaId = null; _data = null; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plantação cadastrada.')));
      await _carregar();
    } on ApiException catch (e) {
      if (mounted && e.codigo == 'PLANTACAO_ATIVA') {
        await _carregar();
      } else if (mounted) {
        setState(() => _erro = e.mensagem);
      }
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.white,
    appBar: AppBar(title: Text(widget.nomeTalhao), foregroundColor: const Color(0xFF00501E)),
    body: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Plantações', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF00501E))),
      if (_carregando) const Center(child: CircularProgressIndicator()),
      if (_erro != null) ...[SelectableText(_erro!, style: const TextStyle(color: Colors.red)), if (_carregando == false && !_dadosCarregados) TextButton(onPressed: _carregar, child: const Text('Tentar novamente'))],
      ..._plantacoes.map((p) {
        final instante = p['dataPlantio'] == null ? null : DateTime.tryParse(p['dataPlantio'].toString());
        final data = instante == null ? null : DataSaoPaulo.paraData(instante);
        final nome = p['culturaNome'] is String ? p['culturaNome'] as String : _nomeCultura(p['culturaId']);
        return Card(child: ListTile(title: Text(nome), subtitle: Text('Plantação ${p['status']}\n${data == null ? 'Data de plantio não informada' : 'Plantio: ${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}'}'),
          trailing: p['status'] == 'ativa' && p['_id'] != null ? TextButton(onPressed: _salvando || _carregando || !_dadosCarregados ? null : () => _encerrar(p), child: const Text('Encerrar plantação')) : null));
      }),
      const SizedBox(height: 20),
      if (_dadosCarregados && _temPlantacaoAtiva)
        const Text('Este talhão já possui uma plantação ativa. Encerre a plantação atual antes de cadastrar outra.')
      else if (_dadosCarregados && !_carregando) ...[
      const Text('Nova plantação ativa', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF00501E))),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(initialValue: _culturaId, decoration: const InputDecoration(labelText: 'Cultura *'), items: _culturas.map((c) => DropdownMenuItem<String>(value: c['id'].toString(), child: Text(c['nome'].toString()))).toList(), onChanged: _carregando || _salvando ? null : (valor) => setState(() => _culturaId = valor)),
      _campo(_variedade, 'Variedade (opcional)'),
      _campo(_safra, 'Safra (opcional)'),
      _campo(_area, 'Área plantada em hectares (opcional)', tipo: const TextInputType.numberWithOptions(decimal: true, signed: true)),
      ListTile(contentPadding: EdgeInsets.zero, title: Text(_data == null ? 'Data de plantio (opcional)' : 'Plantio: ${_data!.day.toString().padLeft(2, '0')}/${_data!.month.toString().padLeft(2, '0')}/${_data!.year}'), trailing: const Icon(Icons.calendar_today), onTap: _salvando ? null : _escolherData),
      if (_data != null) TextButton(onPressed: _salvando ? null : () => setState(() => _data = null), child: const Text('Remover data')),
      _campo(_observacoes, 'Observações (opcional)'),
      const SizedBox(height: 20),
      SizedBox(width: double.infinity, height: 52, child: ElevatedButton(onPressed: _carregando || _salvando ? null : _salvar, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF134E1E), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28))), child: Text(_salvando ? 'Salvando...' : 'Cadastrar plantação ativa'))),
      ],
    ]))),
  );

  Widget _campo(TextEditingController controller, String titulo, {TextInputType? tipo}) => Padding(padding: const EdgeInsets.only(top: 14), child: TextField(controller: controller, keyboardType: tipo, decoration: InputDecoration(labelText: titulo, border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)))));
}

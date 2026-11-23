import 'package:flutter/material.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/data_sao_paulo.dart';

class TelaPlantacoes extends StatefulWidget {
  const TelaPlantacoes({super.key, required this.talhaoId, required this.nomeTalhao});
  final String talhaoId, nomeTalhao;
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

  @override
  void initState() { super.initState(); _carregar(); }
  @override
  void dispose() { _variedade.dispose(); _safra.dispose(); _area.dispose(); _observacoes.dispose(); super.dispose(); }

  Future<void> _carregar() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final culturas = await _api.request('GET', '/culturas') as List<dynamic>;
      final plantacoes = await _api.request('GET', '/talhoes/${widget.talhaoId}/plantacoes') as List<dynamic>;
      if (mounted) setState(() { _culturas = culturas; _plantacoes = plantacoes; _carregando = false; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }

  Future<void> _escolherData() async {
    final escolhida = await showDatePicker(context: context, initialDate: _data ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
    if (escolhida != null && mounted) setState(() => _data = escolhida);
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
      await _api.request('POST', '/talhoes/${widget.talhaoId}/plantacoes', body: {
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
      if (mounted) setState(() => _erro = e.mensagem);
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
      if (_erro != null) ...[SelectableText(_erro!, style: const TextStyle(color: Colors.red)), if (_carregando == false && _culturas.isEmpty) TextButton(onPressed: _carregar, child: const Text('Tentar novamente'))],
      ..._plantacoes.map((p) {
        final data = p['dataPlantio'] == null ? null : DataSaoPaulo.paraData(DateTime.parse(p['dataPlantio'].toString()));
        return Card(child: ListTile(title: Text('Plantação ${p['status']}'), subtitle: Text(data == null ? 'Data de plantio não informada' : 'Plantio: ${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}')));
      }),
      const SizedBox(height: 20),
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
    ]))),
  );

  Widget _campo(TextEditingController controller, String titulo, {TextInputType? tipo}) => Padding(padding: const EdgeInsets.only(top: 14), child: TextField(controller: controller, keyboardType: tipo, decoration: InputDecoration(labelText: titulo, border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)))));
}

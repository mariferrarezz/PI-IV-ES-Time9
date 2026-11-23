import 'package:flutter/material.dart';
import 'package:sentinela/services/api_sentinela.dart';

class TelaNovaPropriedade extends StatefulWidget {
  const TelaNovaPropriedade({super.key});
  @override
  State<TelaNovaPropriedade> createState() => _TelaNovaPropriedadeState();
}

class _TelaNovaPropriedadeState extends State<TelaNovaPropriedade> {
  final _nome = TextEditingController(), _municipio = TextEditingController(), _uf = TextEditingController();
  final _area = TextEditingController(), _observacoes = TextEditingController();
  final _api = ApiSentinela();
  bool _enviando = false;
  String? _erro;

  @override
  void dispose() {
    _nome.dispose(); _municipio.dispose(); _uf.dispose(); _area.dispose(); _observacoes.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    if (_enviando) return;
    final areaTexto = _area.text.trim().replaceAll(',', '.');
    final area = areaTexto.isEmpty ? null : double.tryParse(areaTexto);
    if (areaTexto.isNotEmpty && (area == null || !area.isFinite)) {
      setState(() => _erro = 'Informe a área como número.');
      return;
    }
    setState(() { _enviando = true; _erro = null; });
    try {
      final criada = await _api.request('POST', '/propriedades', body: {
        'nome': _nome.text, 'municipio': _municipio.text, 'estado': _uf.text.trim().toUpperCase(),
        if (area != null) 'areaTotalHa': area,
        if (_observacoes.text.trim().isNotEmpty) 'observacoes': _observacoes.text.trim(),
      }) as Map<String, dynamic>;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Propriedade cadastrada.')));
      Navigator.pop(context, criada['_id'].toString());
    } on ApiException catch (e) {
      if (mounted) setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.white,
    appBar: AppBar(title: const Text('Nova propriedade'), foregroundColor: const Color(0xFF00501E), backgroundColor: Colors.white),
    body: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (_erro != null) ...[SelectableText(_erro!, style: const TextStyle(color: Colors.red)), const SizedBox(height: 16)],
      _campo(_nome, 'Nome *'),
      _campo(_municipio, 'Município *'),
      _campo(_uf, 'Estado (UF) *'),
      _campo(_area, 'Área total em hectares (opcional)', tipo: const TextInputType.numberWithOptions(decimal: true)),
      _campo(_observacoes, 'Observações (opcional)'),
      SizedBox(width: double.infinity, height: 54, child: ElevatedButton(
        onPressed: _enviando ? null : _salvar,
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF134E1E), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28))),
        child: Text(_enviando ? 'Salvando...' : 'Cadastrar propriedade'),
      )),
    ]))),
  );

  Widget _campo(TextEditingController controller, String titulo, {TextInputType? tipo}) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextField(controller: controller, keyboardType: tipo, decoration: InputDecoration(labelText: titulo, border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)))),
  );
}

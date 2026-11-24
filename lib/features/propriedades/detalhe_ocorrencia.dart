import 'package:flutter/material.dart';
import 'package:sentinela/features/ocorrencias/tela_compartilhar_experiencia.dart';
import 'package:sentinela/features/ocorrencias/tela_registroEvolucao.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/data_sao_paulo.dart';
import 'ocorrencias_plantacao.dart';

String dataOcorrencia(dynamic valor) {
  final data = DateTime.tryParse(valor?.toString() ?? '');
  if (data == null) return 'Não informada';
  final local = DataSaoPaulo.paraData(data.toUtc());
  return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year}';
}
String areaOcorrencia(dynamic valor) => valor == null ? 'Não informada' : '${valor.toString().replaceAll('.', ',')} ha';
String tituloOcorrencia(Map o) {
  if (o['problemaAgricolaId'] != null) return (o['problemaNome'] ?? 'Problema indisponível').toString();
  return switch (o['tipo']) { 'praga' => 'Praga não identificada', 'doenca' => 'Doença não identificada', _ => 'Não identificado' };
}

class DetalheOcorrencia extends StatefulWidget {
  const DetalheOcorrencia({super.key, required this.ocorrencia, required this.plantacaoId, required this.talhaoId, required this.propriedadeId, required this.plantacaoAtiva, required this.consultar, this.enviarComunidade});
  final Map ocorrencia;
  final String plantacaoId, talhaoId, propriedadeId;
  final bool plantacaoAtiva;
  final ConsultaOcorrencias consultar;
  /// Usado só pela tela de compartilhar; nos testes pode ser simulado.
  final EnviarApi? enviarComunidade;
  @override
  State<DetalheOcorrencia> createState() => _DetalheOcorrenciaState();
}

class _DetalheOcorrenciaState extends State<DetalheOcorrencia> {
  Map? _dados;
  String? _erro;
  bool _carregando = true;
  @override
  void initState() { super.initState(); _carregar(); }
  Future<void> _carregar() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final dados = await widget.consultar('GET', '/plantacoes/${widget.plantacaoId}/ocorrencias/${widget.ocorrencia['_id']}/historico') as Map;
      if (mounted) setState(() { _dados = dados; _carregando = false; });
    } catch (e) {
      if (mounted) setState(() { _erro = e is ApiException ? e.mensagem : 'Não foi possível consultar o histórico.'; _carregando = false; });
    }
  }
  String _valor(String chave, dynamic valor) {
    if (valor == null) return 'Não informado';
    if (valor is Map) return valor.entries.map((e) => '${e.key}: ${_valor(e.key.toString(), e.value)}').join(' · ');
    if (valor is List) return valor.map((v) => _valor(chave, v)).join('; ');
    if (valor is String && (chave.startsWith('data') || chave.endsWith('Em'))) {
      final data = DateTime.tryParse(valor);
      if (data != null) return dataOcorrencia(valor);
    }
    if (chave.toLowerCase().contains('are') && valor is num) return areaOcorrencia(valor);
    if (valor is num) return valor.toString().replaceAll('.', ',');
    return valor.toString();
  }
  String _rotulo(String chave) => const {
    'tipo': 'Tipo', 'intensidade': 'Intensidade', 'status': 'Status', 'sintomas': 'Sintomas',
    'dataObservacao': 'Data de observação', 'areaAfetadaHa': 'Área afetada',
    'dataAplicacao': 'Data de aplicação', 'dataAvaliacao': 'Data da avaliação',
    'observacoes': 'Observações', 'descricao': 'Descrição', 'tipoMedida': 'Tipo de medida',
    'resultado': 'Resultado', 'criadoEm': 'Criado em', 'atualizadoEm': 'Atualizado em',
    'encerradoEm': 'Encerrado em', 'motivoEncerramento': 'Motivo do encerramento',
  }[chave] ?? chave;
  Widget _campos(Map dados) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: dados.entries
    .where((e) => e.key != '_id' && e.key != 'avaliacoes')
    .map((e) => Padding(padding: const EdgeInsets.only(bottom: 5), child: SelectableText('${_rotulo(e.key.toString())}: ${_valor(e.key.toString(), e.value)}'))).toList());
  @override
  Widget build(BuildContext context) {
    final ocorrencia = _dados?['ocorrencia'] as Map? ?? widget.ocorrencia;
    final podeRegistrar = widget.plantacaoAtiva && ['aberta', 'em_acompanhamento'].contains(ocorrencia['status']);
    return Scaffold(appBar: AppBar(title: Text(tituloOcorrencia(widget.ocorrencia))), body: SafeArea(child: SingleChildScrollView(
      padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (_carregando) const Center(child: CircularProgressIndicator())
        else if (_erro != null) ...[Text(_erro!), TextButton(onPressed: _carregar, child: const Text('Tentar novamente'))]
        else ...[
          Text(tituloOcorrencia(widget.ocorrencia), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF00501E))),
          const SizedBox(height: 12), _campos(ocorrencia),
          const SizedBox(height: 16), const Text('Monitoramentos', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          if ((_dados!['monitoramentos'] as List).isEmpty) const Text('Nenhum monitoramento.'),
          ...(_dados!['monitoramentos'] as List).map((m) => Card(child: Padding(padding: const EdgeInsets.all(12), child: _campos(m as Map)))),
          const SizedBox(height: 16), const Text('Tratamentos e avaliações', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          if ((_dados!['tratamentos'] as List).isEmpty) const Text('Nenhum tratamento.'),
          ...(_dados!['tratamentos'] as List).map((t) => Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _campos(t as Map), const Text('Avaliações', style: TextStyle(fontWeight: FontWeight.bold)),
            if ((t['avaliacoes'] as List).isEmpty) const Text('Nenhuma avaliação.'),
            ...(t['avaliacoes'] as List).map((a) => _campos(a as Map)),
          ])))),
          if (podeRegistrar) ElevatedButton(onPressed: () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => TelaRegistroEvolucao(propriedadeInicial: widget.propriedadeId, talhaoInicial: widget.talhaoId, plantacaoInicial: widget.plantacaoId, ocorrenciaInicial: widget.ocorrencia['_id'].toString())));
            if (mounted) _carregar();
          }, child: const Text('Registrar evolução ou tratamento')),
          const SizedBox(height: 8),
          OutlinedButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TelaCompartilharExperiencia(
            ocorrenciaId: widget.ocorrencia['_id'].toString(), tituloSugerido: tituloOcorrencia(widget.ocorrencia),
            tratamentos: _dados!['tratamentos'] as List, enviar: widget.enviarComunidade))),
            icon: const Icon(Icons.groups_outlined), label: const Text('Compartilhar na Comunidade')),
        ],
      ]),
    )));
  }
}

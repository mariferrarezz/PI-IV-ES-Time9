import 'package:flutter/material.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/data_sao_paulo.dart';
import 'detalhe_ocorrencia.dart';

typedef ConsultaOcorrencias = Future<dynamic> Function(String metodo, String caminho, {Map<String, dynamic>? body});

class OcorrenciasPlantacao extends StatefulWidget {
  const OcorrenciasPlantacao({super.key, required this.plantacaoId, required this.consultar, this.dados, this.talhaoId, this.propriedadeId, this.plantacaoAtiva = false, this.recarregar});
  final String plantacaoId;
  final ConsultaOcorrencias consultar;
  final List<dynamic>? dados;
  final String? talhaoId, propriedadeId;
  final bool plantacaoAtiva;
  final Future<void> Function()? recarregar;
  @override
  State<OcorrenciasPlantacao> createState() => _OcorrenciasPlantacaoState();
}

class _OcorrenciasPlantacaoState extends State<OcorrenciasPlantacao> with RouteAware {
  List<dynamic>? _ocorrencias;
  String? _erro;
  bool _carregando = true;
  int _versao = 0;
  ModalRoute<dynamic>? _rota;
  String _filtro = 'todos';

  @override
  void initState() { super.initState(); if (widget.dados == null) { _carregar(); } else { _ocorrencias = widget.dados; _carregando = false; } }
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final rota = ModalRoute.of(context);
    if (_rota != rota) {
      if (_rota != null) observadorRotasPrincipais.unsubscribe(this);
      _rota = rota;
      if (rota != null) observadorRotasPrincipais.subscribe(this, rota);
    }
  }
  @override
  void didPopNext() { if (widget.dados == null) _carregar(); }
  @override
  void didUpdateWidget(covariant OcorrenciasPlantacao oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.plantacaoId != widget.plantacaoId) _carregar();
    else if (widget.dados != oldWidget.dados && widget.dados != null) { _ocorrencias = widget.dados; _carregando = false; _erro = null; }
  }
  @override
  void dispose() { observadorRotasPrincipais.unsubscribe(this); super.dispose(); }

  Future<void> _carregar() async {
    final versao = ++_versao;
    setState(() { _carregando = true; _erro = null; });
    try {
      final dados = await widget.consultar('GET', '/plantacoes/${widget.plantacaoId}/ocorrencias') as List<dynamic>;
      if (mounted && versao == _versao) setState(() { _ocorrencias = dados; _carregando = false; });
    } catch (e) {
      if (mounted && versao == _versao) setState(() { _erro = e is ApiException ? e.mensagem : 'Não foi possível consultar as ocorrências.'; _carregando = false; });
    }
  }

  String _data(dynamic valor) {
    final instante = DateTime.tryParse(valor?.toString() ?? '');
    if (instante == null) return 'Não informada';
    final data = DataSaoPaulo.paraData(instante);
    return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
  }

  @override
  Widget build(BuildContext context) {
    if (_carregando) return const Padding(padding: EdgeInsets.all(12), child: Center(child: CircularProgressIndicator()));
    if (_erro != null) return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(_erro!, style: const TextStyle(color: Colors.red)),
      TextButton(onPressed: _carregar, child: const Text('Tentar novamente')),
    ]);
    final todos = List<dynamic>.from(_ocorrencias ?? []);
    todos.sort((a, b) { final d = (b['dataObservacao'] ?? '').toString().compareTo((a['dataObservacao'] ?? '').toString()); return d != 0 ? d : (b['_id'] ?? '').toString().compareTo((a['_id'] ?? '').toString()); });
    if (todos.isEmpty) return const Padding(padding: EdgeInsets.all(12), child: Text('Nenhuma ocorrência nesta plantação.'));
    final itens = todos.where((o) => _filtro == 'todos' || o['status'] == _filtro).toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.only(left: 12, top: 8), child: Text('Ocorrências', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00501E)))),
      DropdownButton<String>(value: _filtro, items: const [
        DropdownMenuItem(value: 'todos', child: Text('Todos os status')),
        DropdownMenuItem(value: 'aberta', child: Text('Abertas')),
        DropdownMenuItem(value: 'em_acompanhamento', child: Text('Em acompanhamento')),
        DropdownMenuItem(value: 'encerrada', child: Text('Encerradas')),
      ], onChanged: (v) { if (v != null) setState(() => _filtro = v); }),
      if (itens.isEmpty) const Text('Nenhuma ocorrência com este status.'),
      ...itens.map((o) {
        final nome = tituloOcorrencia(o as Map);
        final status = o['status'] == 'em_acompanhamento' ? 'Em acompanhamento' : o['status'].toString();
        final area = areaOcorrencia(o['areaAfetadaHa']);
        return Card(color: const Color(0xFFF3F7F4), child: ListTile(
          title: Text(nome.toString()),
          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Wrap(spacing: 5, children: [Chip(label: Text('${o['tipo']}')), Chip(label: Text('${o['intensidade']}')), Chip(label: Text(status))]),
            Text('Área afetada: $area · Data: ${_data(o['dataObservacao'])}'),
            if (o['sintomas'] != null && o['sintomas'].toString().trim().isNotEmpty) Text(o['sintomas'].toString(), maxLines: 2, overflow: TextOverflow.ellipsis),
          ]),
          onTap: widget.talhaoId == null || widget.propriedadeId == null ? null : () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => DetalheOcorrencia(ocorrencia: o, plantacaoId: widget.plantacaoId, talhaoId: widget.talhaoId!, propriedadeId: widget.propriedadeId!, plantacaoAtiva: widget.plantacaoAtiva, consultar: widget.consultar)));
            if (mounted && widget.recarregar != null) await widget.recarregar!();
          },
        ));
      }),
    ]);
  }
}

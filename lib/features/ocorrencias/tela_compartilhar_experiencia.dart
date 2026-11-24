import 'dart:math';

import 'package:flutter/material.dart';
import 'package:sentinela/services/api_sentinela.dart';

/// Chamada à API com chave de idempotência (permite simular nos testes).
typedef EnviarApi = Future<dynamic> Function(String metodo, String caminho, {Map<String, dynamic>? body, String? chaveIdempotencia});

String novaChaveIdempotencia([Random? random]) {
  final r = random ?? Random.secure();
  return List.generate(16, (_) => r.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
}

const _verde = Color(0xFF00501E);
const _cinza = Color(0xFF5A7363);

/// Compartilha uma ocorrência na Comunidade. O back-end copia cultura, problema,
/// status e região; aqui o produtor escreve título e relato e escolhe se mostra
/// um tratamento (e o resultado da avaliação dele).
class TelaCompartilharExperiencia extends StatefulWidget {
  const TelaCompartilharExperiencia({super.key, required this.ocorrenciaId, required this.tituloSugerido, required this.tratamentos, this.enviar});
  final String ocorrenciaId;
  final String tituloSugerido;
  /// Tratamentos do histórico, cada um com a lista `avaliacoes`.
  final List tratamentos;
  final EnviarApi? enviar;
  @override
  State<TelaCompartilharExperiencia> createState() => _TelaCompartilharExperienciaState();
}

class _TelaCompartilharExperienciaState extends State<TelaCompartilharExperiencia> {
  late final TextEditingController _titulo = TextEditingController(text: widget.tituloSugerido);
  final _relato = TextEditingController();
  String? _tratamentoId;
  bool _incluirResultado = true;
  bool _enviando = false;
  String? _erro;
  String _chave = novaChaveIdempotencia();

  EnviarApi get _api => widget.enviar ?? ApiSentinela().request;

  @override
  void dispose() { _titulo.dispose(); _relato.dispose(); super.dispose(); }

  Map? get _tratamentoEscolhido => _tratamentoId == null ? null
    : widget.tratamentos.cast<Map>().where((t) => t['_id'].toString() == _tratamentoId).firstOrNull;

  /// Avaliação mais recente do tratamento escolhido (o histórico vem do mais novo para o mais antigo).
  Map? get _ultimaAvaliacao {
    final avaliacoes = (_tratamentoEscolhido?['avaliacoes'] as List?) ?? const [];
    return avaliacoes.isEmpty ? null : avaliacoes.first as Map;
  }

  String _descricaoTratamento(Map t) {
    const tipos = {'manual': 'Manual', 'cultural': 'Cultural', 'biologica': 'Biológico', 'quimica': 'Químico', 'outra': 'Outro'};
    final descricao = (t['descricao'] ?? '').toString();
    return '${tipos[t['tipoMedida']] ?? 'Tratamento'} · ${descricao.length > 40 ? '${descricao.substring(0, 40)}…' : descricao}';
  }

  Future<bool> _pedirNomePublico() async {
    final nome = TextEditingController();
    String? erro;
    var salvando = false;
    final salvo = await showDialog<bool>(context: context, barrierDismissible: false, builder: (dialogContext) => StatefulBuilder(builder: (dialogContext, atualizar) => AlertDialog(
      title: const Text('Escolha um nome público'),
      content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('É o nome que aparece nos seus relatos. Seu nome completo nunca aparece. Dá para trocar depois em Dados da conta.'),
        const SizedBox(height: 12),
        TextField(controller: nome, enabled: !salvando, maxLength: 80, decoration: const InputDecoration(labelText: 'Nome público')),
        if (erro != null) Text(erro!, style: const TextStyle(color: Colors.red)),
      ]),
      actions: [
        TextButton(onPressed: salvando ? null : () => Navigator.pop(dialogContext, false), child: const Text('Cancelar')),
        ElevatedButton(onPressed: salvando ? null : () async {
          final texto = nome.text.trim();
          if (texto.length < 2) { atualizar(() => erro = 'Use pelo menos 2 caracteres.'); return; }
          atualizar(() { salvando = true; erro = null; });
          try {
            await _api('PATCH', '/auth/perfil', body: {'nomePublico': texto});
            if (dialogContext.mounted) Navigator.pop(dialogContext, true);
          } on ApiException catch (e) {
            atualizar(() { salvando = false; erro = e.mensagem; });
          }
        }, child: Text(salvando ? 'Salvando...' : 'Salvar')),
      ],
    )));
    return salvo == true;
  }

  Future<void> _publicar() async {
    if (_titulo.text.trim().isEmpty || _relato.text.trim().isEmpty) {
      setState(() => _erro = 'Preencha o título e o relato.');
      return;
    }
    setState(() { _enviando = true; _erro = null; });
    final avaliacao = _incluirResultado ? _ultimaAvaliacao : null;
    final corpo = {
      'ocorrenciaId': widget.ocorrenciaId, 'titulo': _titulo.text.trim(), 'relato': _relato.text.trim(),
      if (_tratamentoId != null) 'tratamentoId': _tratamentoId,
      if (avaliacao != null) 'avaliacaoId': avaliacao['_id'].toString(),
    };
    try {
      await _api('POST', '/comunidade/experiencias', body: corpo, chaveIdempotencia: _chave);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Relato publicado na Comunidade.'), backgroundColor: _verde));
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.codigo == 'NOME_PUBLICO_NECESSARIO') {
        setState(() => _enviando = false);
        if (await _pedirNomePublico() && mounted) await _publicar();
        return;
      }
      setState(() {
        _enviando = false;
        _erro = e.mensagem;
        // Com resultado incerto, mantém a chave para não publicar duas vezes ao repetir.
        if (e.codigo != 'RESULTADO_DESCONHECIDO') _chave = novaChaveIdempotencia();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final avaliacao = _ultimaAvaliacao;
    const resultados = {'melhora_observada': 'Melhorou', 'sem_mudanca': 'Sem mudança', 'piora_observada': 'Piorou', 'inconclusivo': 'Inconclusivo'};
    return Scaffold(
      appBar: AppBar(title: const Text('Compartilhar na Comunidade')),
      body: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Outros produtores vão ver a cultura, o problema, a situação da ocorrência e o seu município.', style: TextStyle(color: _cinza)),
        const SizedBox(height: 16),
        TextField(controller: _titulo, enabled: !_enviando, maxLength: 150, decoration: const InputDecoration(labelText: 'Título', border: OutlineInputBorder())),
        const SizedBox(height: 8),
        TextField(controller: _relato, enabled: !_enviando, maxLength: 5000, minLines: 4, maxLines: 8,
          decoration: const InputDecoration(labelText: 'Relato', hintText: 'Conte o que você viu e o que funcionou.', border: OutlineInputBorder())),
        if (widget.tratamentos.isNotEmpty) ...[
          const SizedBox(height: 8),
          DropdownButtonFormField<String?>(
            initialValue: _tratamentoId,
            decoration: const InputDecoration(labelText: 'Mostrar um tratamento (opcional)', border: OutlineInputBorder()),
            items: [
              const DropdownMenuItem<String?>(value: null, child: Text('Não mostrar tratamento')),
              ...widget.tratamentos.cast<Map>().map((t) => DropdownMenuItem<String?>(value: t['_id'].toString(), child: Text(_descricaoTratamento(t), overflow: TextOverflow.ellipsis))),
            ],
            onChanged: _enviando ? null : (v) => setState(() => _tratamentoId = v),
          ),
          if (avaliacao != null) CheckboxListTile(
            contentPadding: EdgeInsets.zero, value: _incluirResultado,
            onChanged: _enviando ? null : (v) => setState(() => _incluirResultado = v ?? false),
            title: Text('Incluir o resultado: ${resultados[avaliacao['resultado']] ?? 'Não informado'}'),
          ),
        ],
        const SizedBox(height: 12),
        Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: const Color(0xFFF3F6F3), borderRadius: BorderRadius.circular(14)),
          child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(Icons.lock_outline_rounded, size: 20, color: Color(0xFF4C6652)), SizedBox(width: 10),
            Expanded(child: Text('Nunca aparecem: seu nome completo, a fazenda, o talhão e as observações escritas.', style: TextStyle(color: Color(0xFF3E5748)))),
          ])),
        if (_erro != null) Padding(padding: const EdgeInsets.only(top: 12), child: SelectableText(_erro!, style: const TextStyle(color: Colors.red))),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _enviando ? null : _publicar,
          style: ElevatedButton.styleFrom(backgroundColor: _verde, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
          child: Text(_enviando ? 'Publicando...' : 'Publicar'),
        )),
      ]))),
    );
  }
}

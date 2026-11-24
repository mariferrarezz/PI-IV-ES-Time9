import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/ocorrencias/tela_compartilhar_experiencia.dart';
import 'package:sentinela/services/api_sentinela.dart';

class _Chamada {
  _Chamada(this.metodo, this.caminho, this.body, this.chave);
  final String metodo, caminho;
  final Map<String, dynamic>? body;
  final String? chave;
}

Widget _app(Widget tela) => MaterialApp(home: Builder(builder: (context) => Scaffold(body: Center(child: ElevatedButton(
  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => tela)), child: const Text('abrir'))))));

final _tratamentos = [
  {'_id': 't1', 'tipoMedida': 'biologica', 'descricao': 'Aplicação de Bt', 'avaliacoes': [
    {'_id': 'a2', 'resultado': 'melhora_observada'}, {'_id': 'a1', 'resultado': 'sem_mudanca'}]},
];

void main() {
  testWidgets('publica com título, relato, tratamento e o resultado mais recente', (tester) async {
    final chamadas = <_Chamada>[];
    await tester.pumpWidget(_app(TelaCompartilharExperiencia(ocorrenciaId: 'o1', tituloSugerido: 'Lagarta-do-cartucho', tratamentos: _tratamentos,
      enviar: (metodo, caminho, {body, chaveIdempotencia}) async { chamadas.add(_Chamada(metodo, caminho, body, chaveIdempotencia)); return {'_id': 'e1', 'status': 'aprovada'}; })));
    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();
    expect(find.text('Lagarta-do-cartucho'), findsOneWidget);
    await tester.enterText(find.widgetWithText(TextField, 'Relato'), 'Controlei em duas semanas.');
    await tester.tap(find.text('Não mostrar tratamento'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Biológico').last);
    await tester.pumpAndSettle();
    expect(find.text('Incluir o resultado: Melhorou'), findsOneWidget);
    await tester.ensureVisible(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();
    expect(chamadas, hasLength(1));
    expect(chamadas.single.metodo, 'POST');
    expect(chamadas.single.caminho, '/comunidade/experiencias');
    expect(chamadas.single.body, {'ocorrenciaId': 'o1', 'titulo': 'Lagarta-do-cartucho', 'relato': 'Controlei em duas semanas.', 'tratamentoId': 't1', 'avaliacaoId': 'a2'});
    expect(chamadas.single.chave, matches(RegExp(r'^[a-f0-9]{32}$')));
    expect(find.text('abrir'), findsOneWidget);
    expect(find.text('Relato publicado na Comunidade.'), findsOneWidget);
  });

  testWidgets('não envia sem relato', (tester) async {
    var chamadas = 0;
    await tester.pumpWidget(_app(TelaCompartilharExperiencia(ocorrenciaId: 'o1', tituloSugerido: 'Ferrugem', tratamentos: const [],
      enviar: (metodo, caminho, {body, chaveIdempotencia}) async { chamadas++; return {}; })));
    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();
    expect(find.text('Não mostrar tratamento'), findsNothing);
    await tester.ensureVisible(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();
    expect(find.text('Preencha o título e o relato.'), findsOneWidget);
    expect(chamadas, 0);
  });

  testWidgets('sem nome público, pede o nome, salva e publica de novo', (tester) async {
    final chamadas = <_Chamada>[];
    var temNome = false;
    await tester.pumpWidget(_app(TelaCompartilharExperiencia(ocorrenciaId: 'o1', tituloSugerido: 'Ferrugem', tratamentos: const [],
      enviar: (metodo, caminho, {body, chaveIdempotencia}) async {
        chamadas.add(_Chamada(metodo, caminho, body, chaveIdempotencia));
        if (caminho == '/auth/perfil') { temNome = true; return {}; }
        if (!temNome) throw const ApiException('Defina um nome público', codigo: 'NOME_PUBLICO_NECESSARIO');
        return {'_id': 'e1', 'status': 'aprovada'};
      })));
    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Relato'), 'Relato de teste.');
    await tester.ensureVisible(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();
    expect(find.text('Escolha um nome público'), findsOneWidget);
    await tester.enterText(find.widgetWithText(TextField, 'Nome público'), 'Seu Zé');
    await tester.tap(find.text('Salvar'));
    await tester.pumpAndSettle();
    expect(chamadas.map((c) => '${c.metodo} ${c.caminho}'), ['POST /comunidade/experiencias', 'PATCH /auth/perfil', 'POST /comunidade/experiencias']);
    expect(chamadas[1].body, {'nomePublico': 'Seu Zé'});
    expect(find.text('Relato publicado na Comunidade.'), findsOneWidget);
  });

  testWidgets('mostra o erro do back-end e troca a chave; com resultado incerto mantém a chave', (tester) async {
    final chaves = <String?>[];
    var resposta = const ApiException('Esta ocorrência já foi compartilhada na Comunidade', codigo: 'EXPERIENCIA_JA_PUBLICADA');
    await tester.pumpWidget(_app(TelaCompartilharExperiencia(ocorrenciaId: 'o1', tituloSugerido: 'Ferrugem', tratamentos: const [],
      enviar: (metodo, caminho, {body, chaveIdempotencia}) async { chaves.add(chaveIdempotencia); throw resposta; })));
    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Relato'), 'Relato.');
    await tester.ensureVisible(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();
    expect(find.text('Esta ocorrência já foi compartilhada na Comunidade'), findsOneWidget);
    resposta = const ApiException('A API não respondeu.', codigo: 'RESULTADO_DESCONHECIDO');
    await tester.ensureVisible(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Publicar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();
    expect(chaves[0], isNot(chaves[1]));
    expect(chaves[1], chaves[2]);
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/propriedades/tela_plantacoes.dart';
import 'package:sentinela/services/api_sentinela.dart';

Map<String, dynamic> detalhe(List<Map<String, dynamic>> plantacoes) => {
  'talhao': {'nome': 'Talhão Norte', 'areaHa': 10, 'ativo': true},
  'propriedade': {'_id': 'propriedade', 'nome': 'Fazenda'},
  'plantacoes': plantacoes.map((p) => {...p, 'ocorrencias': <dynamic>[]}).toList(),
};

void main() {
  testWidgets('confirma encerramento e recarrega histórico antes de liberar cadastro', (tester) async {
    var ativa = true;
    var posts = 0;
    await tester.pumpWidget(MaterialApp(home: TelaPlantacoes(
      talhaoId: 'norte', nomeTalhao: 'Talhão Norte',
      consultar: (metodo, caminho, {body}) async {
        if (metodo == 'POST') { posts++; expect(caminho, '/talhoes/norte/plantacoes/p1/encerrar'); ativa = false; return {}; }
        if (caminho == '/culturas') return [{'id': 'c1', 'nome': 'Brócolis'}];
        return detalhe([{'_id':'p1', 'culturaId':'c1', 'status':ativa ? 'ativa' : 'encerrada'}]);
      },
    )));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Encerrar plantação'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancelar'));
    await tester.pumpAndSettle();
    expect(posts, 0);
    await tester.tap(find.text('Encerrar plantação'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Encerrar plantação').last);
    await tester.pumpAndSettle();
    expect(posts, 1);
    expect(find.textContaining('Plantação encerrada'), findsWidgets);
    expect(find.text('Nova plantação ativa'), findsOneWidget);
  });

  testWidgets('erro de encerramento recarrega sem anunciar sucesso', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaPlantacoes(
      talhaoId: 'norte', nomeTalhao: 'Talhão Norte',
      consultar: (metodo, caminho, {body}) async {
        if (metodo == 'POST') throw const ApiException('Não foi possível encerrar');
        return caminho == '/culturas' ? [{'id':'c1','nome':'Brócolis'}] : detalhe([{'_id':'p1','culturaId':'c1','status':'ativa'}]);
      },
    )));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Encerrar plantação'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Encerrar plantação').last);
    await tester.pumpAndSettle();
    expect(find.text('Não foi possível encerrar'), findsOneWidget);
    expect(find.text('Plantação encerrada.'), findsNothing);
    expect(find.text('Nova plantação ativa'), findsNothing);
  });

  testWidgets('exibe cultura e data reais e bloqueia formulário quando ativa', (tester) async {
    final caminhos = <String>[];
    await tester.pumpWidget(MaterialApp(home: TelaPlantacoes(
      talhaoId: 'norte', nomeTalhao: 'Talhão Norte',
      consultar: (metodo, caminho, {body}) async {
        caminhos.add('$metodo $caminho');
        if (caminho == '/culturas') return [{'id': 'c1', 'nome': 'Brócolis'}];
        return detalhe([{'culturaId': 'c1', 'status': 'ativa', 'dataPlantio': '2025-04-10T03:00:00.000Z'}]);
      },
    )));
    await tester.pumpAndSettle();
    expect(caminhos, ['GET /culturas', 'GET /talhoes/norte/detalhe']);
    expect(find.text('Brócolis'), findsOneWidget);
    expect(find.textContaining('Plantio: 10/04/2025'), findsOneWidget);
    expect(find.textContaining('já possui uma plantação ativa'), findsOneWidget);
    expect(find.text('Cadastrar plantação ativa'), findsNothing);
  });

  testWidgets('sem ativa mantém formulário e mostra ausência de data', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaPlantacoes(
      talhaoId: 'norte', nomeTalhao: 'Talhão Norte',
      consultar: (metodo, caminho, {body}) async => caminho == '/culturas'
          ? [{'id': 'c1', 'nome': 'Brócolis'}]
          : detalhe([{'culturaId': 'c1', 'status': 'encerrada'}]),
    )));
    await tester.pumpAndSettle();
    expect(find.textContaining('Data de plantio não informada'), findsOneWidget);
    expect(find.text('Nova plantação ativa'), findsOneWidget);
  });

  testWidgets('falha de consulta não oferece cadastro sem conhecer o estado', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaPlantacoes(
      talhaoId: 'norte', nomeTalhao: 'Talhão Norte',
      consultar: (metodo, caminho, {body}) async => throw const ApiException('API indisponível'),
    )));
    await tester.pumpAndSettle();
    expect(find.text('API indisponível'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);
    expect(find.text('Nova plantação ativa'), findsNothing);
  });

  testWidgets('nome de cultura inativa é exibido a partir da plantação', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaPlantacoes(
      talhaoId: 'norte', nomeTalhao: 'Talhão Norte',
      consultar: (metodo, caminho, {body}) async => caminho == '/culturas'
          ? []
          : detalhe([{'culturaId': 'inativa', 'culturaNome': 'Cultura histórica', 'status': 'encerrada'}]),
    )));
    await tester.pumpAndSettle();
    expect(find.text('Cultura histórica'), findsOneWidget);
  });
}

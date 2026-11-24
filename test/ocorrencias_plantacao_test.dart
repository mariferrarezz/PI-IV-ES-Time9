import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/propriedades/ocorrencias_plantacao.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/services/api_sentinela.dart';

void main() {
  testWidgets('filtra status e abre histórico da ocorrência selecionada', (tester) async {
    final caminhos = <String>[];
    final itens = [
      {'_id':'2', 'tipo':'praga', 'intensidade':'media', 'status':'aberta', 'sintomas':'Folhas manchadas', 'areaAfetadaHa':1.5, 'dataObservacao':'2026-11-23T03:00:00Z'},
      {'_id':'1', 'tipo':'doenca', 'intensidade':'baixa', 'status':'encerrada', 'dataObservacao':'2026-11-22T03:00:00Z'},
    ];
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: SingleChildScrollView(child: OcorrenciasPlantacao(
      plantacaoId:'p', talhaoId:'t', propriedadeId:'f', plantacaoAtiva:true, dados:itens,
      consultar:(metodo,caminho,{body}) async {
        caminhos.add(caminho);
        return {'ocorrencia': itens.first, 'monitoramentos': [], 'tratamentos': []};
      },
    )))));
    await tester.pumpAndSettle();
    expect(find.text('Praga não identificada'), findsOneWidget);
    expect(find.textContaining('1,5 ha'), findsOneWidget);
    expect(find.text('Folhas manchadas'), findsOneWidget);
    await tester.tap(find.text('Todos os status'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Encerradas').last);
    await tester.pumpAndSettle();
    expect(find.text('Praga não identificada'), findsNothing);
    expect(find.text('Doença não identificada'), findsOneWidget);
    await tester.tap(find.text('Encerradas'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Todos os status').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Praga não identificada'));
    await tester.pumpAndSettle();
    expect(caminhos, ['/plantacoes/p/ocorrencias/2/historico']);
    expect(find.text('Nenhum monitoramento.'), findsOneWidget);
    expect(find.text('Nenhum tratamento.'), findsOneWidget);
    expect(find.text('Registrar evolução ou tratamento'), findsOneWidget);
  });

  testWidgets('mostra ocorrência de plantação encerrada com seus dados', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: OcorrenciasPlantacao(
      plantacaoId: 'encerrada', consultar: (metodo, caminho, {body}) async {
        expect(caminho, '/plantacoes/encerrada/ocorrencias');
        return [{'problemaAgricolaId': 'p', 'problemaNome': 'Ferrugem', 'tipo': 'doenca', 'intensidade': 'media', 'areaAfetadaHa': 2, 'dataObservacao': '2026-11-23T03:00:00Z', 'status': 'em_acompanhamento'}];
      },
    ))));
    await tester.pumpAndSettle();
    expect(find.text('Ferrugem'), findsOneWidget);
    expect(find.textContaining('Área afetada: 2 ha · Data: 23/11/2026'), findsOneWidget);
    expect(find.text('Em acompanhamento'), findsOneWidget);
  });

  testWidgets('erro oferece nova tentativa e não apresenta vazio', (tester) async {
    var chamadas = 0;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: OcorrenciasPlantacao(
      plantacaoId: 'p', consultar: (metodo, caminho, {body}) async {
        if (++chamadas == 1) throw const ApiException('Falha na consulta');
        return [];
      },
    ))));
    await tester.pumpAndSettle();
    expect(find.text('Falha na consulta'), findsOneWidget);
    expect(find.text('Nenhuma ocorrência nesta plantação.'), findsNothing);
    await tester.tap(find.text('Tentar novamente'));
    await tester.pumpAndSettle();
    expect(find.text('Nenhuma ocorrência nesta plantação.'), findsOneWidget);
  });

  testWidgets('retorno de outra rota consulta novamente', (tester) async {
    var chamadas = 0;
    final nav = GlobalKey<NavigatorState>();
    await tester.pumpWidget(MaterialApp(navigatorKey: nav, navigatorObservers: [observadorRotasPrincipais],
      home: Scaffold(body: OcorrenciasPlantacao(plantacaoId: 'p', consultar: (metodo, caminho, {body}) async {
        chamadas++;
        return chamadas == 1 ? [] : [{'tipo': 'praga', 'intensidade': 'baixa', 'status': 'aberta', 'dataObservacao': '2026-11-23T03:00:00Z'}];
      }))));
    await tester.pumpAndSettle();
    nav.currentState!.push(MaterialPageRoute<void>(builder: (_) => const Scaffold(body: Text('Registrar'))));
    await tester.pumpAndSettle();
    nav.currentState!.pop();
    await tester.pumpAndSettle();
    expect(chamadas, 2);
    expect(find.text('Praga não identificada'), findsOneWidget);
  });
}

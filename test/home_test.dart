import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/features/ocorrencias/tela_ocorrenciaRegistrada.dart';

void main() {
  testWidgets('confirmação retorna à home e consulta novo resumo', (tester) async {
    var chamadas = 0;
    final navegador = GlobalKey<NavigatorState>();
    await tester.pumpWidget(MaterialApp(navigatorKey: navegador, navigatorObservers: [observadorRotasPrincipais],
      home: TelaHome(carregarResumo: () async => {'nome': 'Maria', 'propriedade': {'id': '1', 'nome': 'Fazenda', 'municipio': 'Cidade', 'estado': 'SP'}, 'talhoes': 1, 'alertasAtivos': chamadas++})));
    await tester.pumpAndSettle();
    navegador.currentState!.push(MaterialPageRoute<void>(builder: (_) => const Scaffold(body: Text('Registrar'))));
    await tester.pumpAndSettle();
    navegador.currentState!.push(MaterialPageRoute<void>(builder: (_) => const TelaOcorrenciaRegistrada()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Voltar para o início'));
    await tester.tap(find.text('Voltar para o início'));
    await tester.pumpAndSettle();
    expect(chamadas, 2);
    expect(find.text('01'), findsWidgets);
  });

  testWidgets('retorno pela navegação principal consulta novo resumo', (tester) async {
    var chamadas = 0;
    final navegador = GlobalKey<NavigatorState>();
    await tester.pumpWidget(MaterialApp(navigatorKey: navegador, navigatorObservers: [observadorRotasPrincipais],
      home: TelaHome(carregarResumo: () async => {'nome': 'Maria', 'propriedade': null, 'talhoes': 0, 'alertasAtivos': chamadas++})));
    await tester.pumpAndSettle();
    navegador.currentState!.push(MaterialPageRoute<void>(builder: (context) => Scaffold(body: TextButton(onPressed: () => navegarPrincipal(context, 0, 2), child: const Text('Início')))));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Início'));
    await tester.pumpAndSettle();
    expect(chamadas, 2);
  });
  testWidgets('home consulta o resumo novamente ao retornar de outra tela', (tester) async {
    var chamadas = 0;
    final navegador = GlobalKey<NavigatorState>();
    await tester.pumpWidget(MaterialApp(
      navigatorKey: navegador,
      navigatorObservers: [observadorRotasPrincipais],
      home: TelaHome(carregarResumo: () async => {
        'nome': 'Maria',
        'propriedade': {'id': 'propriedade-1', 'nome': 'Fazenda Boa Vista', 'municipio': 'Cidade', 'estado': 'SP'},
        'talhoes': chamadas++ == 0 ? 0 : 1,
        'alertasAtivos': 0,
      }),
    ));
    await tester.pumpAndSettle();
    expect(chamadas, 1);
    expect(find.text('01'), findsNothing);
    navegador.currentState!.push(MaterialPageRoute<void>(builder: (_) => const Scaffold(body: Text('Talhões'))));
    await tester.pumpAndSettle();
    navegador.currentState!.pop();
    await tester.pumpAndSettle();
    expect(chamadas, 2);
    expect(find.text('Fazenda Boa Vista'), findsOneWidget);
    expect(find.text('01'), findsOneWidget);
  });

  testWidgets('home mostra nome, propriedade, talhões e alertas do resumo', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaHome(carregarResumo: () async => {
      'nome': 'Maria',
      'propriedade': {'id': '1', 'nome': 'Sítio Esperança', 'municipio': 'Limeira', 'estado': 'SP'},
      'talhoes': 3,
      'alertasAtivos': 12,
    })));
    await tester.pumpAndSettle();
    expect(find.textContaining(', Maria!'), findsOneWidget);
    expect(find.text('Sítio Esperança'), findsOneWidget);
    expect(find.text('03'), findsOneWidget);
    expect(find.text('12'), findsOneWidget);
    expect(find.text('Cadastre sua primeira propriedade'), findsNothing);
  });

  testWidgets('sem propriedade, home convida a cadastrar a primeira', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaHome(carregarResumo: () async => {
      'nome': 'Maria', 'propriedade': null, 'talhoes': 0, 'alertasAtivos': 0,
    })));
    await tester.pumpAndSettle();
    expect(find.text('Cadastre sua primeira propriedade'), findsOneWidget);
    expect(find.text('Cadastrar propriedade'), findsOneWidget);
    expect(find.text('Resumo da propriedade'), findsNothing);
  });

  testWidgets('falha no resumo mostra erro e permite tentar novamente', (tester) async {
    var tentativas = 0;
    await tester.pumpWidget(MaterialApp(home: TelaHome(carregarResumo: () async {
      if (++tentativas == 1) throw const ApiException('API indisponível');
      return {'nome': 'Maria', 'propriedade': null, 'talhoes': 0, 'alertasAtivos': 0};
    })));
    await tester.pumpAndSettle();
    expect(find.text('API indisponível'), findsOneWidget);
    expect(find.textContaining(', produtor!'), findsOneWidget);
    await tester.tap(find.text('Tentar novamente'));
    await tester.pumpAndSettle();
    expect(tentativas, 2);
    expect(find.text('Cadastre sua primeira propriedade'), findsOneWidget);
  });
}

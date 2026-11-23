import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/services/api_sentinela.dart';

void main() {
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

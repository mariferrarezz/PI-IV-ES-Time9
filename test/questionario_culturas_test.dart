import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/destino_autenticado.dart';
import 'package:sentinela/features/propriedades/questionario_dados.dart';
import 'package:sentinela/features/propriedades/tela_questionario4.dart';

void main() {
  final culturas = List.generate(5, (i) => {'id': '$i', 'nome': 'Cultura $i'});
  for (var escolha = 0; escolha < 4; escolha++) {
    testWidgets('seleção respeita quantidade $escolha', (tester) async {
      final dados = QuestionarioDados()..quantidade = escolha;
      await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaQuestionario4(dados: dados, carregarCulturas: () async => culturas)));
      await tester.pumpAndSettle();
      final alvo = escolha == 3 ? 4 : escolha + 1;
      ElevatedButton botao() => tester.widget<ElevatedButton>(find.widgetWithText(ElevatedButton, 'CONTINUAR'));
      expect(botao().onPressed, isNull);
      for (var i = 0; i < alvo; i++) {
        await tester.ensureVisible(find.text('Cultura $i'));
        await tester.tap(find.text('Cultura $i'));
        await tester.pump();
      }
      expect(dados.totalCulturas, alvo);
      expect(botao().onPressed, isNotNull);
      final proxima = tester.widget<CheckboxListTile>(find.ancestor(of: find.text('Cultura $alvo'), matching: find.byType(CheckboxListTile)));
      expect(proxima.onChanged == null, escolha != 3);
      await tester.ensureVisible(find.text('Cultura 0'));
      await tester.tap(find.text('Cultura 0'));
      await tester.pump();
      expect(botao().onPressed, isNull);
      expect(find.text('Selecione mais 1 cultura para continuar'), findsOneWidget);
    });
  }
  testWidgets('reduzir quantidade preserva seleção e exige desmarcar', (tester) async {
    final dados = QuestionarioDados()..quantidade = 1..culturasIds.addAll(['0', '1', '2']);
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaQuestionario4(dados: dados, carregarCulturas: () async => culturas)));
    await tester.pumpAndSettle();
    expect(find.text('Desmarque 1 cultura para continuar'), findsOneWidget);
    await tester.ensureVisible(find.text('Cultura 2'));
    await tester.tap(find.text('Cultura 2'));
    await tester.pump();
    expect(dados.quantidadeCulturasValida, isTrue);
  });
}

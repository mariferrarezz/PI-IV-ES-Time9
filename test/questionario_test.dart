import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/destino_autenticado.dart';
import 'package:sentinela/features/propriedades/questionario_dados.dart';
import 'package:sentinela/features/propriedades/tela_questionario2.dart';
import 'package:sentinela/features/propriedades/tela_questionario3.dart';

void main() {
  testWidgets('questionário mantém o porte selecionado ao avançar e voltar', (tester) async {
    final dados = QuestionarioDados();
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaQuestionario2(dados: dados)));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Média'));
    await tester.tap(find.text('Média'));
    final continuar = find.text('CONTINUAR');
    await tester.ensureVisible(continuar);
    await tester.tap(continuar);
    await tester.pumpAndSettle();
    expect(find.byType(TelaQuestionario3), findsOneWidget);
    expect(dados.porte, 1);
    Navigator.of(tester.element(find.byType(TelaQuestionario3))).pop();
    await tester.pumpAndSettle();
    expect(find.byType(TelaQuestionario2), findsOneWidget);
    expect(dados.porte, 1);
  });
}

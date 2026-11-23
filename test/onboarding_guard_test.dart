import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/destino_autenticado.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/features/propriedades/tela_questionario1.dart';
import 'package:sentinela/services/api_sentinela.dart';

void main() {
  test('o estado só é aceito quando fornecido pelo perfil', () {
    expect(questionarioConcluido({'questionario': {'concluidoEm': '2026-01-01T00:00:00.000Z'}}), true);
    expect(questionarioConcluido({'questionario': null}), false);
    expect(questionarioConcluido({'questionario': {}}), false);
    expect(() => questionarioConcluido({'questionario': {'concluidoEm': 'inválida'}}), throwsA(isA<ApiException>()));
  });
  testWidgets('etapa direta concluída abre Home e remove pilha', (tester) async {
    await tester.pumpWidget(MaterialApp(home: GuardiaoQuestionario(consultar: () async => {'questionario': {'concluidoEm': '2026-01-01T00:00:00.000Z'}}, child: const Text('Etapa'))));
    await tester.pumpAndSettle();
    expect(find.byType(TelaHome), findsOneWidget);
    expect(find.text('Etapa'), findsNothing);
  });
  testWidgets('falha de consulta permite tentar novamente sem presumir estado', (tester) async {
    var tentativas = 0;
    await tester.pumpWidget(MaterialApp(home: GuardiaoQuestionario(consultar: () async {
      if (++tentativas == 1) throw const ApiException('falha');
      return {'questionario': null};
    }, child: const Text('Etapa'))));
    await tester.pumpAndSettle();
    expect(find.text('Etapa'), findsNothing);
    await tester.tap(find.text('Tentar novamente'));
    await tester.pumpAndSettle();
    expect(find.text('Etapa'), findsOneWidget);
  });
  for (final concluido in [false, true]) {
    testWidgets('restauração consulta perfil ${concluido ? 'concluído' : 'pendente'}', (tester) async {
      var consultas = 0;
      await tester.pumpWidget(MaterialApp(
        builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!),
        home: RestaurarDestinoAutenticado(consultar: () async { consultas++; return {'questionario': concluido ? {'concluidoEm': '2026-01-01T00:00:00.000Z'} : null}; }),
      ));
      await tester.pumpAndSettle();
      expect(consultas, 1);
      expect(find.byType(concluido ? TelaHome : TelaQuestionario1), findsOneWidget);
    });
  }
}

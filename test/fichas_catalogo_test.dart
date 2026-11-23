import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/catalogo/fichas_catalogo.dart';
import 'package:sentinela/features/catalogo/oidio.dart';
import 'package:sentinela/features/catalogo/sigatoka_negra.dart';
import 'package:sentinela/features/catalogo/tela_catalogo.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';

void main() {
  test('todas as 40 pragas e doenças do catálogo têm ficha', () {
    expect(fichasCatalogo.length, 40);
  });

  test('a imagem de cada ficha do catálogo existe em assets', () {
    final fichas = Directory('lib/features/catalogo').listSync().whereType<File>()
        .where((f) => f.path.endsWith('.dart') && !f.path.endsWith('tela_catalogo.dart') && !f.path.endsWith('fichas_catalogo.dart'));
    final faltando = <String>[];
    for (final f in fichas) {
      for (final m in RegExp(r"'(assets/images/[^']+)'").allMatches(f.readAsStringSync())) {
        if (!File(m.group(1)!).existsSync()) faltando.add('${f.path}: ${m.group(1)}');
      }
    }
    expect(faltando, isEmpty);
  });

  testWidgets('cartão da home abre a ficha específica no catálogo', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TelaHome(carregarResumo: () async => {
      'nome': 'Maria', 'propriedade': null, 'talhoes': 0, 'alertasAtivos': 0,
    })));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Oídio'));
    await tester.tap(find.text('Oídio'));
    await tester.pumpAndSettle();
    expect(find.byType(CatalogoOidio), findsOneWidget);
  });

  testWidgets('cartão da lista do catálogo abre a ficha específica', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: TelaCatalogo()));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Sigatoka-negra'), 300, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.text('Sigatoka-negra'));
    await tester.pumpAndSettle();
    expect(find.byType(CatalogoSigatokaNegra), findsOneWidget);
  });
}

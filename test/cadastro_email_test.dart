import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/cadastro_dados.dart';
import 'package:sentinela/features/auth/tela_cadastro_email.dart';
import 'package:sentinela/features/auth/tela_cadastro_cpf.dart';

void main() {
  testWidgets('e-mail inválido mantém a etapa e o valor, correção permite avançar', (tester) async {
    final dados = CadastroDados();
    await tester.pumpWidget(MaterialApp(home: TelaCadastroEmail(dados: dados)));
    for (final email in ['julia123', 'julia@', 'gmail.com', 'julia@gmail', 'julia@gmail.', ' julia@gmail.com', 'julia @gmail.com', 'julia@gmail.com ', 'julia..silva@gmail.com']) {
      await tester.enterText(find.byType(TextField), email);
      await tester.ensureVisible(find.text('CONTINUAR'));
      await tester.tap(find.text('CONTINUAR'));
      await tester.pump();
      expect(find.byType(TelaCadastroEmail), findsOneWidget);
      expect(find.text('Informe um e-mail válido.'), findsOneWidget);
      expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, email);
    }
    await tester.enterText(find.byType(TextField), 'julia@gmail.com');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(find.byType(TelaCadastroCpf), findsOneWidget);
    expect(dados.email, 'julia@gmail.com');
  });

  for (final email in ['julia@outlook.com', 'julia.silva@fazenda.com.br', 'contato+app@minha-fazenda.org']) {
    testWidgets('aceita $email', (tester) async {
      final dados = CadastroDados();
      await tester.pumpWidget(MaterialApp(home: TelaCadastroEmail(dados: dados)));
      await tester.enterText(find.byType(TextField), email);
      await tester.ensureVisible(find.text('CONTINUAR'));
      await tester.tap(find.text('CONTINUAR'));
      await tester.pumpAndSettle();
      expect(find.byType(TelaCadastroCpf), findsOneWidget);
      expect(dados.email, email);
    });
  }
}

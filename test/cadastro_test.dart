import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/cadastro_dados.dart';
import 'package:sentinela/features/auth/tela_cadastro_confirmar_senha.dart';
import 'package:sentinela/features/auth/tela_cadastro_senha.dart';
import 'package:sentinela/features/auth/cadastro_recuperacao.dart';
import 'package:sentinela/features/auth/regras_senha.dart';

void main() {
  testWidgets('senha inválida exibe critérios e Sentinela123! avança', (tester) async {
    final dados = CadastroDados();
    await tester.pumpWidget(MaterialApp(home: TelaCadastroSenha(dados: dados)));
    await tester.enterText(find.byType(TextField), 'abcdefgh');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pump();
    expect(find.byType(TelaCadastroSenha), findsOneWidget);
    expect(find.textContaining('Falta:'), findsOneWidget);
    final erro = find.textContaining('Falta:').evaluate().single.widget as Text;
    expect(erro.data, contains('letra maiúscula'));
    expect(erro.data, contains('número'));
    expect(erro.data, contains('caractere especial'));
    expect(find.byIcon(Icons.check_circle), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'Sentinela123!');
    await tester.pump();
    expect(find.byIcon(Icons.check_circle), findsNWidgets(4));
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(find.byType(TelaCadastroConfirmarSenha), findsOneWidget);
    expect(dados.senha, 'Sentinela123!');
  });

  test('bloqueia credencial Firebase se senha inválida chega à etapa final', () async {
    final dados = CadastroDados()..email = 'teste@example.test'..senha = 'abcdefgh';
    var chamadas = 0;
    await expectLater(prepararCredencialCadastro(dados: dados, usuarioAtual: null,
      criar: (_, _) async { chamadas++; return 'uid'; },
      entrar: (_, _) async { chamadas++; return 'uid'; },
      atualizarSenha: (_) async { chamadas++; },
    ), throwsA(isA<SenhaInvalida>()));
    expect(chamadas, 0);
    expect(criteriosFaltantesSenha('Sentinela123!'), isEmpty);
    expect(criteriosFaltantesSenha('Sentinela123 '), contains('Pelo menos 1 caractere especial'));
  });

  test('envia ao Firebase a senha válida exatamente como foi digitada', () async {
    final dados = CadastroDados()..email = 'teste@example.test'..senha = ' Sentinela123! ';
    String? senhaEnviada;
    await prepararCredencialCadastro(dados: dados, usuarioAtual: null,
      criar: (_, senha) async { senhaEnviada = senha; return 'uid'; },
      entrar: (_, _) async => throw StateError('não deve autenticar'),
      atualizarSenha: (_) async => throw StateError('não deve atualizar'),
    );
    expect(senhaEnviada, ' Sentinela123! ');
  });

  testWidgets('confirmação divergente mantém usuário na etapa de senha', (tester) async {
    final dados = CadastroDados()..senha = 'Senha123!';
    await tester.pumpWidget(MaterialApp(home: TelaCadastroConfirmarSenha(dados: dados)));
    await tester.enterText(find.byType(TextField), 'OutraSenha123!');
    final continuar = find.text('CONTINUAR');
    await tester.ensureVisible(continuar);
    await tester.tap(continuar);
    await tester.pump();
    expect(find.text('As senhas não coincidem.'), findsOneWidget);
    expect(find.byType(TelaCadastroConfirmarSenha), findsOneWidget);
    expect(dados.senha, 'Senha123!');
  });
}

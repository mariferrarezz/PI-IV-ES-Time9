import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/cadastro_dados.dart';
import 'package:sentinela/features/auth/cadastro_recuperacao.dart';
import 'package:sentinela/features/auth/destino_autenticado.dart';
import 'package:sentinela/features/auth/tela_cadastro_termos.dart';
import 'package:sentinela/features/auth/tela_login.dart';
import 'package:sentinela/features/auth/tela_cadastro_cpf.dart';
import 'package:sentinela/features/auth/tela_cadastro_telefone.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/features/propriedades/questionario_dados.dart';
import 'package:sentinela/features/propriedades/tela_questionario1.dart';
import 'package:sentinela/features/propriedades/tela_questionario6.dart';
import 'package:sentinela/services/api_sentinela.dart';

const pendente = {'questionario': null};
const concluido = {'questionario': {'concluidoEm': '2026-01-01T00:00:00.000Z'}};

void main() {
  test('contrato do perfil não presume conclusão em respostas inválidas', () {
    expect(questionarioConcluido(pendente), false);
    expect(questionarioConcluido(concluido), true);
    expect(() => questionarioConcluido({}), throwsA(isA<ApiException>()));
    expect(questionarioConcluido({'questionario': {}}), false);
    expect(() => questionarioConcluido({'questionario': {'concluidoEm': 'inválida'}}), throwsA(isA<ApiException>()));
  });

  test('retomada consulta o perfil e não o cadastra novamente se já existe', () async {
    var consultas = 0, cadastros = 0;
    final perfil = await recuperarPerfilOuCadastrar(verificarExistente: true,
      consultar: () async { consultas++; return pendente; },
      cadastrar: () async { cadastros++; return pendente; },
    );
    expect(perfil, pendente);
    expect(consultas, 1);
    expect(cadastros, 0);
  });

  test('perfil ausente permite cadastro; falha de consulta não dispara gravação', () async {
    var cadastros = 0;
    final perfil = await recuperarPerfilOuCadastrar(verificarExistente: true,
      consultar: () async => throw const ApiException('Ausente', codigo: 'PERFIL_NAO_ENCONTRADO'),
      cadastrar: () async { cadastros++; return pendente; },
    );
    expect(perfil, pendente);
    expect(cadastros, 1);
    await expectLater(recuperarPerfilOuCadastrar(verificarExistente: true,
      consultar: () async => throw const ApiException('API indisponível'),
      cadastrar: () async { cadastros++; return pendente; },
    ), throwsA(isA<ApiException>()));
    expect(cadastros, 1);
  });

  testWidgets('cadastro confirmado abre questionário e remove telas anteriores', (tester) async {
    final dados = CadastroDados()..senha = 'Sentinela123!';
    var chamadas = 0;
    final confirmacao = Completer<dynamic>();
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaCadastroTermos(dados: dados, concluirCadastro: (_) { chamadas++; return confirmacao.future; })));
    await tester.ensureVisible(find.byType(Checkbox));
    await tester.tap(find.byType(Checkbox));
    await tester.ensureVisible(find.text('FINALIZAR'));
    await tester.tap(find.text('FINALIZAR'));
    await tester.pump();
    expect(find.byType(TelaQuestionario1), findsNothing);
    expect(chamadas, 1);
    confirmacao.complete(pendente);
    await tester.pumpAndSettle();
    expect(find.byType(TelaQuestionario1), findsOneWidget);
    expect(find.byType(TelaCadastroTermos), findsNothing);
    expect(Navigator.of(tester.element(find.byType(TelaQuestionario1))).canPop(), false);
  });

  for (final conflito in [('CPF_JA_CADASTRADO', 'CPF já cadastrado', true), ('TELEFONE_JA_CADASTRADO', 'Telefone já cadastrado', false)]) {
    testWidgets('conflito final ${conflito.$1} volta ao campo e preserva credencial', (tester) async {
      final dados = CadastroDados()
        ..senha = 'Sentinela123!'
        ..senhaCriada = 'Sentinela123!'
        ..uidCriado = 'credencial-existente'
        ..cpf = '11111111111'
        ..telefone = '11987654321';
      await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaCadastroTermos(dados: dados, concluirCadastro: (_) async {
        throw ApiException(conflito.$2, codigo: conflito.$1);
      })));
      await tester.ensureVisible(find.byType(Checkbox));
      await tester.tap(find.byType(Checkbox));
      await tester.ensureVisible(find.text('FINALIZAR'));
      await tester.tap(find.text('FINALIZAR'));
      await tester.pumpAndSettle();
      expect(find.byType(conflito.$3 ? TelaCadastroCpf : TelaCadastroTelefone), findsOneWidget);
      expect(find.text(conflito.$2), findsOneWidget);
      expect(dados.uidCriado, 'credencial-existente');
      expect(tester.widget<TextField>(find.byType(TextField)).controller!.text,
        conflito.$3 ? '111.111.111-11' : '(11) 98765-4321');
    });
  }

  for (final caso in [(pendente, false), (concluido, true)]) {
    testWidgets('login encaminha conforme questionário ${caso.$2 ? 'concluído' : 'pendente'}', (tester) async {
      var autenticacoes = 0, consultas = 0;
      await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaLogin(
        autenticar: (_, _) async { autenticacoes++; },
        carregarPerfil: () async { consultas++; return caso.$1; },
      )));
      await tester.enterText(find.byType(TextField).at(0), 'teste@example.test');
      await tester.enterText(find.byType(TextField).at(1), 'Sentinela123!');
      await tester.ensureVisible(find.text('ENTRAR'));
      await tester.tap(find.text('ENTRAR'));
      await tester.pumpAndSettle();
      expect(autenticacoes, 1);
      expect(consultas, 1);
      expect(find.byType(caso.$2 ? TelaHome : TelaQuestionario1), findsOneWidget);
      expect(find.byType(TelaLogin), findsNothing);
    });
  }

  testWidgets('questionário preserva respostas após erro e abre Home só com confirmação', (tester) async {
    final dados = QuestionarioDados()..porte = 0..quantidade = 0..frequencia = 0..identificacao = 0;
    var chamadas = 0;
    final confirmacao = Completer<dynamic>();
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaQuestionario6(dados: dados, enviar: (_) async {
      chamadas++;
      if (chamadas == 1) throw const ApiException('Validação rejeitada');
      return confirmacao.future;
    })));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(find.text('Validação rejeitada'), findsOneWidget);
    expect(dados.frequencia, 0);
    expect(dados.identificacao, 0);
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pump();
    expect(find.byType(TelaHome), findsNothing);
    confirmacao.complete(concluido);
    await tester.pumpAndSettle();
    expect(find.byType(TelaHome), findsOneWidget);
    expect(find.byType(TelaQuestionario6), findsNothing);
  });

  testWidgets('resposta perdida consulta perfil e reconhece questionário já salvo', (tester) async {
    final dados = QuestionarioDados()..porte = 0..quantidade = 0..frequencia = 0..identificacao = 0;
    var envios = 0, consultas = 0;
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaQuestionario6(dados: dados,
      enviar: (_) async { envios++; throw const ApiException('Resposta perdida', codigo: 'RESULTADO_DESCONHECIDO'); },
      carregarPerfil: () async { consultas++; return concluido; },
    )));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(envios, 1);
    expect(consultas, 1);
    expect(find.byType(TelaHome), findsOneWidget);
  });

  testWidgets('resposta perdida com consulta indisponível confirma antes de reenviar', (tester) async {
    final dados = QuestionarioDados()..porte = 0..quantidade = 0..frequencia = 0..identificacao = 0;
    var envios = 0, consultas = 0;
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => pendente, child: child!), home: TelaQuestionario6(dados: dados,
      enviar: (_) async { envios++; throw const ApiException('Resposta perdida', codigo: 'RESULTADO_DESCONHECIDO'); },
      carregarPerfil: () async { if (++consultas == 1) throw const ApiException('API indisponível'); return concluido; },
    )));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(envios, 1);
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(consultas, 2);
    expect(envios, 1);
    expect(find.byType(TelaHome), findsOneWidget);
  });

  testWidgets('falha ao consultar perfil no login preserva campos e não abre Home', (tester) async {
    await tester.pumpWidget(MaterialApp(builder: (context, child) => ConsultaPerfilScope(consultar: () async => {'questionario': null}, child: child!), home: TelaLogin(
      autenticar: (_, _) async {},
      carregarPerfil: () async => throw const ApiException('API indisponível'),
    )));
    await tester.enterText(find.byType(TextField).at(0), 'teste@example.test');
    await tester.enterText(find.byType(TextField).at(1), 'Sentinela123!');
    await tester.ensureVisible(find.text('ENTRAR'));
    await tester.tap(find.text('ENTRAR'));
    await tester.pumpAndSettle();
    expect(find.byType(TelaLogin), findsOneWidget);
    expect(find.byType(TelaHome), findsNothing);
    expect(find.text('API indisponível'), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField).first).controller!.text, 'teste@example.test');
  });

  testWidgets('nova tentativa consulta perfil sem autenticar novamente', (tester) async {
    var autenticacoes = 0, consultas = 0;
    await tester.pumpWidget(MaterialApp(home: TelaLogin(
      autenticar: (_, _) async { autenticacoes++; },
      carregarPerfil: () async {
        if (++consultas == 1) throw const ApiException('API indisponível');
        return concluido;
      },
    )));
    await tester.enterText(find.byType(TextField).at(0), 'teste@example.test');
    await tester.enterText(find.byType(TextField).at(1), 'Sentinela123!');
    await tester.ensureVisible(find.text('ENTRAR'));
    await tester.tap(find.text('ENTRAR'));
    await tester.pumpAndSettle();
    expect(find.text('API indisponível'), findsOneWidget);
    expect(find.byType(TelaHome), findsNothing);
    await tester.ensureVisible(find.text('TENTAR NOVAMENTE'));
    await tester.tap(find.text('TENTAR NOVAMENTE'));
    await tester.pumpAndSettle();
    expect(autenticacoes, 1);
    expect(consultas, 2);
    expect(find.byType(TelaHome), findsOneWidget);
  });
}

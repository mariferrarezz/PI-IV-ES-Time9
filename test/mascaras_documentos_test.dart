import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/cadastro_dados.dart';
import 'package:sentinela/features/auth/tela_cadastro_cpf.dart';
import 'package:sentinela/features/auth/tela_cadastro_telefone.dart';
import 'package:sentinela/services/mascaras_documentos.dart';
import 'package:sentinela/services/api_sentinela.dart';

void main() {
  test('CPF: digitação, colagem, limite e edição no meio', () {
    const mascara = MascaraDocumento.cpf();
    var valor = TextEditingValue.empty;
    for (final d in '12345678901'.split('')) {
      final texto = valor.text + d;
      valor = mascara.formatEditUpdate(valor, TextEditingValue(text: texto, selection: TextSelection.collapsed(offset: texto.length)));
    }
    expect(valor.text, '123.456.789-01');
    final colado = mascara.formatEditUpdate(TextEditingValue.empty, const TextEditingValue(text: 'abc123.456.789-01999', selection: TextSelection.collapsed(offset: 20)));
    expect(colado.text, '123.456.789-01');
    final editado = mascara.formatEditUpdate(valor.copyWith(selection: const TextSelection.collapsed(offset: 4)), const TextEditingValue(text: '123456.789-01', selection: TextSelection.collapsed(offset: 3)));
    expect(editado.text, '124.567.890-1');
    expect(editado.selection.baseOffset, 2);
  });

  test('telefone: limite, colagem formatada e prefixo da API', () {
    const mascara = MascaraDocumento.telefone();
    expect(mascara.formatar('+5511998765432'), '(11) 99876-5432');
    final colado = mascara.formatEditUpdate(TextEditingValue.empty, const TextEditingValue(text: '+55 (11) 99876-5432', selection: TextSelection.collapsed(offset: 19)));
    expect(colado.text, '(11) 99876-5432');
    expect(apenasDigitos(colado.text), '11998765432');
    expect(mascara.formatar('11998765432999'), '(11) 99876-5432');
    final editado = mascara.formatEditUpdate(
      const TextEditingValue(text: '(11) 99876-5432', selection: TextSelection.collapsed(offset: 5)),
      const TextEditingValue(text: '(11)99876-5432', selection: TextSelection.collapsed(offset: 4)),
    );
    expect(apenasDigitos(editado.text), '1998765432');
  });

  testWidgets('CPF incompleto e rejeitado pela API permanecem na etapa; correção avança', (tester) async {
    final dados = CadastroDados();
    final enviados = <String>[];
    await tester.pumpWidget(MaterialApp(home: TelaCadastroCpf(dados: dados, validarCpf: (cpf) async {
      enviados.add(cpf);
      if (cpf == '11111111111') throw const ApiException('CPF já cadastrado', codigo: 'CPF_JA_CADASTRADO');
    })));
    await tester.enterText(find.byType(TextField), '123');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pump();
    expect(find.text('Informe um CPF com 11 dígitos'), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '123');
    await tester.enterText(find.byType(TextField), '11111111111');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(enviados, ['11111111111']);
    expect(find.text('CPF já cadastrado'), findsOneWidget);
    expect(find.byType(TelaCadastroCpf), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '111.111.111-11');
    await tester.enterText(find.byType(TextField), '52998224725');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(dados.cpf, '52998224725');
    expect(find.text('Informe seu telefone celular'), findsOneWidget);
  });

  testWidgets('CPF repetido disponível é enviado sem máscara e permite avançar', (tester) async {
    final dados = CadastroDados();
    String? enviado;
    await tester.pumpWidget(MaterialApp(home: TelaCadastroCpf(dados: dados, validarCpf: (cpf) async { enviado = cpf; })));
    await tester.enterText(find.byType(TextField), '00000000000');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(enviado, '00000000000');
    expect(dados.cpf, '00000000000');
    expect(find.byType(TelaCadastroTelefone), findsOneWidget);
  });

  testWidgets('telefone completo rejeitado pela API permanece na etapa com o valor preenchido', (tester) async {
    final dados = CadastroDados();
    String? enviado;
    await tester.pumpWidget(MaterialApp(home: TelaCadastroTelefone(dados: dados, validarTelefone: (telefone) async {
      enviado = telefone;
      throw const ApiException('O DDD do telefone deve ser um código brasileiro válido.');
    })));
    await tester.enterText(find.byType(TextField), '00999999999');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(enviado, '00999999999');
    expect(find.text('O DDD do telefone deve ser um código brasileiro válido.'), findsOneWidget);
    expect(find.byType(TelaCadastroTelefone), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '(00) 99999-9999');
  });

  testWidgets('telefone duplicado é exibido abaixo do campo e impede avanço', (tester) async {
    final dados = CadastroDados();
    await tester.pumpWidget(MaterialApp(home: TelaCadastroTelefone(dados: dados, validarTelefone: (_) async {
      throw const ApiException('Telefone já cadastrado', codigo: 'TELEFONE_JA_CADASTRADO');
    })));
    await tester.enterText(find.byType(TextField), '11987654321');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(find.text('Telefone já cadastrado'), findsOneWidget);
    expect(find.byType(TelaCadastroTelefone), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '(11) 98765-4321');
  });

  testWidgets('telefone incompleto não avança e preserva o valor', (tester) async {
    final dados = CadastroDados();
    await tester.pumpWidget(MaterialApp(home: TelaCadastroTelefone(dados: dados)));
    await tester.enterText(find.byType(TextField), '119876');
    await tester.ensureVisible(find.text('CONTINUAR'));
    await tester.tap(find.text('CONTINUAR'));
    await tester.pump();
    expect(find.text('Informe os 11 dígitos do celular com DDD.'), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text, '(11) 9876');
  });
}

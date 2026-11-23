import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/cadastro_dados.dart';
import 'package:sentinela/features/auth/cadastro_recuperacao.dart';

void main() {
  test('após rejeição do perfil, nova tentativa não recria credencial', () async {
    final dados = CadastroDados()..email = 'teste@example.test'..senha = 'Senha123!';
    var criacoes = 0, logins = 0;
    Future<String> criar(String email, String senha) async { criacoes++; return 'uid'; }
    Future<String> entrar(String email, String senha) async { logins++; return 'uid'; }
    Future<void> atualizar(String senha) async {}
    await prepararCredencialCadastro(dados: dados, usuarioAtual: null, criar: criar, entrar: entrar, atualizarSenha: atualizar);
    // A chamada de perfil é rejeitada; a próxima tentativa conserva o UID.
    dados.cpf = '52998224725';
    await prepararCredencialCadastro(dados: dados, usuarioAtual: 'uid', criar: criar, entrar: entrar, atualizarSenha: atualizar);
    expect(criacoes, 1);
    expect(logins, 0);
    await prepararCredencialCadastro(dados: dados, usuarioAtual: null, criar: criar, entrar: entrar, atualizarSenha: atualizar);
    expect(criacoes, 1);
    expect(logins, 1);
  });

  test('alterar e-mail depois de criar credencial não cria outra conta', () async {
    final dados = CadastroDados()..email = 'novo@example.test'..senha = 'Senha123!'..uidCriado = 'uid'..emailCriado = 'original@example.test';
    var chamadas = 0;
    await expectLater(prepararCredencialCadastro(dados: dados, usuarioAtual: 'uid',
      criar: (_, _) async { chamadas++; return 'outro'; },
      entrar: (_, _) async { chamadas++; return 'outro'; },
      atualizarSenha: (_) async { chamadas++; },
    ), throwsStateError);
    expect(chamadas, 0);
  });

  test('sessão retomada deve pertencer ao UID já criado', () async {
    final dados = CadastroDados()
      ..email = 'pessoa@example.test'
      ..senha = 'Senha123!'
      ..uidCriado = 'original'
      ..emailCriado = 'pessoa@example.test'
      ..senhaCriada = 'Senha123!';
    var alteracoes = 0;
    await expectLater(prepararCredencialCadastro(dados: dados, usuarioAtual: null,
      criar: (_, _) async => throw StateError('não deve criar'),
      entrar: (_, _) async => 'outro',
      atualizarSenha: (_) async { alteracoes++; },
    ), throwsStateError);
    expect(alteracoes, 0);
    expect(dados.uidCriado, 'original');
  });
}

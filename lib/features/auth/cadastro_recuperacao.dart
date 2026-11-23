import 'cadastro_dados.dart';
import 'regras_senha.dart';
import 'package:sentinela/services/api_sentinela.dart';

/// Em nova tentativa, consulta antes de enviar outro cadastro de perfil.
Future<dynamic> recuperarPerfilOuCadastrar({
  required bool verificarExistente,
  required Future<dynamic> Function() consultar,
  required Future<dynamic> Function() cadastrar,
}) async {
  if (verificarExistente) {
    try {
      return await consultar();
    } on ApiException catch (e) {
      if (e.codigo != 'PERFIL_NAO_ENCONTRADO') rethrow;
    }
  }
  return cadastrar();
}

/// Garante que uma tentativa de perfil reutilize a credencial já criada.
Future<void> prepararCredencialCadastro({
  required CadastroDados dados,
  required String? usuarioAtual,
  required Future<String> Function(String email, String senha) criar,
  required Future<String> Function(String email, String senha) entrar,
  required Future<void> Function(String senha) atualizarSenha,
}) async {
  if (criteriosFaltantesSenha(dados.senha).isNotEmpty) throw const SenhaInvalida();
  final email = dados.email.trim();
  if (dados.uidCriado != null && dados.emailCriado != email) {
    throw StateError('email-cadastro-alterado');
  }
  if (dados.uidCriado == null) {
    dados.uidCriado = await criar(email, dados.senha);
    dados.emailCriado = email;
    dados.senhaCriada = dados.senha;
  } else {
    if (usuarioAtual != dados.uidCriado) {
      final uid = await entrar(email, dados.senhaCriada ?? dados.senha);
      if (uid != dados.uidCriado) throw StateError('usuario-cadastro-divergente');
    }
    if (dados.senhaCriada != dados.senha) {
      await atualizarSenha(dados.senha);
      dados.senhaCriada = dados.senha;
    }
  }
}

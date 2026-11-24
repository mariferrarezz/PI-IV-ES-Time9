import 'dart:async';
import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.mensagem, {this.codigo});
  final String mensagem;
  final String? codigo;
}

class ApiSentinela {
  ApiSentinela({http.Client? client}) : _client = client ?? http.Client();
  final http.Client _client;
  static const base = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000');

  Future<dynamic> request(String metodo, String caminho, {Map<String, dynamic>? body, String? chaveIdempotencia, bool autenticado = true}) async {
    try {
      final request = http.Request(metodo, Uri.parse('$base$caminho'))
        ..headers['Content-Type'] = 'application/json';
      if (autenticado) {
        final usuario = FirebaseAuth.instance.currentUser;
        if (usuario == null) throw const ApiException('Entre novamente para continuar.');
        final token = await usuario.getIdToken();
        if (token == null) throw const ApiException('Sessão inválida. Entre novamente.');
        request.headers['Authorization'] = 'Bearer $token';
      }
      if (chaveIdempotencia != null) request.headers['Idempotency-Key'] = chaveIdempotencia;
      if (body != null) request.body = jsonEncode(body);
      final resposta = await _client.send(request).timeout(const Duration(seconds: 12));
      final texto = await resposta.stream.bytesToString().timeout(const Duration(seconds: 12));
      final dynamic dados = texto.isEmpty ? null : jsonDecode(texto);
      if (resposta.statusCode < 200 || resposta.statusCode >= 300) {
        final erros = dados is Map && dados['detalhes'] is List
            ? (dados['detalhes'] as List).whereType<Map>().map((e) => e['mensagem']).whereType<String>().join('\n')
            : '';
        throw ApiException(erros.isNotEmpty ? erros : (dados is Map && dados['erro'] is String ? dados['erro'] as String : 'Não foi possível concluir a operação.'), codigo: metodo == 'POST' && caminho.endsWith('/ocorrencias') && resposta.statusCode >= 500 ? 'RESULTADO_DESCONHECIDO' : (dados is Map ? dados['codigo'] as String? : null));
      }
      return dados;
    } on ApiException {
      rethrow;
    } on FirebaseAuthException {
      throw const ApiException('Sessão inválida ou expirada. Entre novamente.');
    } on TimeoutException {
      throw const ApiException('A API não respondeu. O resultado pode ser desconhecido; confira os registros antes de repetir.', codigo: 'RESULTADO_DESCONHECIDO');
    } on http.ClientException {
      throw const ApiException('Não foi possível acessar a API. Se houve envio, confira os registros antes de repetir.', codigo: 'RESULTADO_DESCONHECIDO');
    } on FormatException {
      throw const ApiException('A API retornou uma resposta inválida. Se houve envio, confira os registros antes de repetir.', codigo: 'RESULTADO_DESCONHECIDO');
    }
  }
}

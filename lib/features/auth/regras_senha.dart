/// Critérios locais do cadastro, alinhados aos símbolos aceitos pelo Firebase.
Map<String, bool> criteriosSenha(String senha) {
  const especiais = r'''^$*.[]{}()?"!@#%&/\,><':;|_~''';
  return {
    'Pelo menos 8 caracteres': senha.runes.length >= 8,
    'Pelo menos 1 letra maiúscula': RegExp(r'[A-Z]').hasMatch(senha),
    'Pelo menos 1 número': RegExp(r'[0-9]').hasMatch(senha),
    'Pelo menos 1 caractere especial': senha.runes.any((c) => especiais.contains(String.fromCharCode(c))),
  };
}

List<String> criteriosFaltantesSenha(String senha) =>
    criteriosSenha(senha).entries.where((e) => !e.value).map((e) => e.key).toList();

class SenhaInvalida implements Exception {
  const SenhaInvalida();
}

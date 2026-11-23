import 'package:flutter/services.dart';

String apenasDigitos(String texto) => texto.replaceAll(RegExp(r'[^0-9]'), '');

/// Máscara de CPF ou celular brasileiro; limita dígitos, não a pontuação.
class MascaraDocumento extends TextInputFormatter {
  const MascaraDocumento.cpf() : telefone = false;
  const MascaraDocumento.telefone() : telefone = true;
  final bool telefone;

  String formatar(String texto) {
    var digitos = apenasDigitos(texto);
    if (telefone && digitos.length == 13 && digitos.startsWith('55')) digitos = digitos.substring(2);
    final s = digitos.substring(0, digitos.length > 11 ? 11 : digitos.length);
    final out = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (telefone) {
        if (i == 0) out.write('(');
        if (i == 2) out.write(') ');
        if (i == 7) out.write('-');
      } else {
        if (i == 3 || i == 6) out.write('.');
        if (i == 9) out.write('-');
      }
      out.write(s[i]);
    }
    return out.toString();
  }

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = apenasDigitos(newValue.text);
    final oldDigits = apenasDigitos(oldValue.text);
    var before = apenasDigitos(newValue.text.substring(0, newValue.selection.extentOffset.clamp(0, newValue.text.length))).length;
    if (telefone && digits.length == 13 && digits.startsWith('55')) {
      digits = digits.substring(2);
      before = (before - 2).clamp(0, 11);
    }
    // Backspace sobre separador remove o dígito anterior, permitindo edição natural.
    if (newValue.text.length < oldValue.text.length && digits == oldDigits && before > 0 && oldValue.selection.isCollapsed && newValue.selection.isCollapsed) {
      digits = digits.substring(0, before - 1) + digits.substring(before);
      before--;
    }
    if (digits.length > 11) digits = digits.substring(0, 11);
    if (before > digits.length) before = digits.length;
    final text = formatar(digits);
    final prefix = formatar(digits.substring(0, before));
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: prefix.length));
  }
}

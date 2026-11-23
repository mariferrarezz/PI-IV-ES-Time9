import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/services/data_sao_paulo.dart';

void main() {
  test('meia-noite usa regras históricas e preserva o dia na volta', () {
    for (final exemplo in [
      (DateTime(2018, 1, 15), '2018-01-15T02:00:00.000Z'),
      (DateTime(2018, 7, 15), '2018-07-15T03:00:00.000Z'),
      (DateTime(2026, 11, 22), '2026-11-22T03:00:00.000Z'),
    ]) {
      final instante = DataSaoPaulo.paraUtc(exemplo.$1);
      expect(instante.toIso8601String(), exemplo.$2);
      expect(DataSaoPaulo.paraData(instante), exemplo.$1);
    }
  });

  test('data que não teve meia-noite não é convertida silenciosamente', () {
    expect(() => DataSaoPaulo.paraUtc(DateTime(2018, 11, 4)), throwsFormatException);
  });
}

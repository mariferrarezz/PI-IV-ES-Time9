import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

/// Conversão de datas de plantio usando a base IANA, sem depender do fuso do aparelho.
class DataSaoPaulo {
  DataSaoPaulo._();
  static bool _inicializado = false;

  static tz.Location get _local {
    if (!_inicializado) {
      tzdata.initializeTimeZones();
      _inicializado = true;
    }
    return tz.getLocation('America/Sao_Paulo');
  }

  static DateTime paraUtc(DateTime data) {
    final local = tz.TZDateTime(_local, data.year, data.month, data.day);
    bool corresponde(DateTime instante) {
      final convertido = tz.TZDateTime.from(instante, _local);
      return convertido.year == data.year && convertido.month == data.month &&
          convertido.day == data.day && convertido.hour == 0 && convertido.minute == 0;
    }
    if (!corresponde(local)) {
      throw const FormatException('A meia-noite desta data não existe em São Paulo.');
    }
    // Transições históricas podem repetir a meia-noite; não escolher um instante silenciosamente.
    for (var minutos = 1; minutos <= 180; minutos++) {
      final intervalo = Duration(minutes: minutos);
      if (corresponde(local.toUtc().subtract(intervalo)) || corresponde(local.toUtc().add(intervalo))) {
        throw const FormatException('A meia-noite desta data é ambígua em São Paulo.');
      }
    }
    return local.toUtc();
  }

  static DateTime paraData(DateTime instante) {
    final local = tz.TZDateTime.from(instante, _local);
    return DateTime(local.year, local.month, local.day);
  }
}

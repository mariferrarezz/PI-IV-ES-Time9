({int min, int? max}) limiteCulturas(int? quantidade) {
  if (quantidade == null || quantidade < 0 || quantidade > 3) return (min: 0, max: 0);
  return quantidade == 3 ? (min: 4, max: null) : (min: quantidade + 1, max: quantidade + 1);
}

class QuestionarioDados {
  int? porte, quantidade, frequencia, identificacao;
  final Set<String> culturasIds = {}, problemas = {};
  String outraCultura = '';
  int get totalCulturas => culturasIds.length + (outraCultura.trim().isEmpty ? 0 : 1);
  bool get quantidadeCulturasValida {
    final limite = limiteCulturas(quantidade);
    return quantidade != null && totalCulturas >= limite.min && (limite.max == null || totalCulturas <= limite.max!);
  }
}

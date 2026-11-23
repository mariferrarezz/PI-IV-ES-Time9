import 'package:flutter/material.dart';
import 'package:sentinela/features/auth/destino_autenticado.dart';
import 'questionario_dados.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'tela_questionario5.dart';



class TelaQuestionario4 extends StatefulWidget {
  const TelaQuestionario4({super.key, required this.dados, this.carregarCulturas});
  final QuestionarioDados dados;
  final Future<List<dynamic>> Function()? carregarCulturas;

  @override
  State<TelaQuestionario4> createState() => _TelaQuestionario4State();
}

class _TelaQuestionario4State extends State<TelaQuestionario4> {
  final _api = ApiSentinela();
  List<dynamic> _culturas = [];
  String? _erro;
  bool _carregando = true;
  @override
  void initState() { super.initState(); _carregar(); }
  Future<void> _carregar() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final culturas = widget.carregarCulturas != null ? await widget.carregarCulturas!() : await _api.request('GET', '/culturas') as List<dynamic>;
      if (mounted) setState(() { _culturas = culturas; _carregando = false; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GuardiaoQuestionario(child: _conteudo(context));
  }

  Widget _conteudo(BuildContext context) {
    final limite = limiteCulturas(widget.dados.quantidade);
    final total = widget.dados.totalCulturas;
    final podeAdicionar = limite.max == null || total < limite.max!;
    final faltam = limite.min - total;
    final sobram = limite.max == null ? 0 : total - limite.max!;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. HEADER: LOGO E TÍTULO SENTINELA
              Center(
                child: Image.asset(
                  'assets/images/logoSentinela.png',
                  height: 180,
                  width: 220,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return const Text(
                      'Sentinela',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16.0),

              // 2. CAIXA CINZA ARREDONDADA PRINCIPAL
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F4F3),
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Quais culturas você planta?',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1B5E20),
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 25),

                    Text(limite.max == null ? 'Selecionadas: $total (mínimo ${limite.min})' : 'Selecionadas: $total de ${limite.min}'),
                    if (faltam > 0) Text('Selecione mais $faltam ${faltam == 1 ? 'cultura' : 'culturas'} para continuar'),
                    if (sobram > 0) Text('Desmarque $sobram ${sobram == 1 ? 'cultura' : 'culturas'} para continuar'),
                    const SizedBox(height: 12),

                    if (_carregando) const CircularProgressIndicator()
                    else if (_erro != null) ...[
                      Text(_erro!, style: const TextStyle(color: Colors.red)),
                      TextButton(onPressed: _carregar, child: const Text('Tentar novamente')),
                    ] else ...[
                      ..._culturas.map((cultura) {
                        final id = cultura['id'].toString();
                        final selecionada = widget.dados.culturasIds.contains(id);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Container(
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(30), border: Border.all(color: selecionada ? const Color(0xFF1B5E20) : Colors.transparent, width: 1.5)),
                            child: Material(
                              color: Colors.transparent,
                              child: CheckboxListTile(
                              value: selecionada, title: Text(cultura['nome'].toString()),
                              activeColor: const Color(0xFF1B5E20),
                              onChanged: selecionada || podeAdicionar ? (valor) => setState(() { if (valor == true) { widget.dados.culturasIds.add(id); } else { widget.dados.culturasIds.remove(id); } }) : null,
                              ),
                            ),
                          ),
                        );
                      }),
                      TextFormField(
                        initialValue: widget.dados.outraCultura,
                        enabled: podeAdicionar || widget.dados.outraCultura.trim().isNotEmpty,
                        onChanged: (valor) => setState(() => widget.dados.outraCultura = valor),
                        decoration: InputDecoration(labelText: 'Outra cultura (opcional)', filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(30))),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // 3. BOTÃO CONTINUAR
              SizedBox(
                width: double.infinity,
                height: 52.0,
                child: ElevatedButton(
                  onPressed: _carregando || _erro != null || !widget.dados.quantidadeCulturasValida ? null : () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => TelaQuestionario5(dados: widget.dados)));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF135323),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30.0),
                    ),
                  ),
                  child: const Text(
                    'CONTINUAR',
                    style: TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

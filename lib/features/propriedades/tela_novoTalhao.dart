import 'package:flutter/material.dart';

import 'tela_talhoes.dart';

class TelaNovoTalhao extends StatefulWidget {
  const TelaNovoTalhao({super.key});

  @override
  State<TelaNovoTalhao> createState() => _TelaNovoTalhaoState();
}

class _TelaNovoTalhaoState extends State<TelaNovoTalhao> {
  final TextEditingController _nomeTalhaoController = TextEditingController();
  final TextEditingController _areaTalhaoController = TextEditingController();
  final TextEditingController _observacoesController = TextEditingController();
  final TextEditingController _outraCulturaController = TextEditingController();

  String _culturaSelecionada = 'Soja'; // 'Soja', 'Milho', 'Feijão', 'Outra'
  String? _faseSelecionada = 'Crescimento'; // Opcional: pode ser null
  DateTime _dataPlantio = DateTime(2026, 10, 10);

  @override
  void dispose() {
    _nomeTalhaoController.dispose();
    _areaTalhaoController.dispose();
    _observacoesController.dispose();
    _outraCulturaController.dispose();
    super.dispose();
  }

  String get _dataPlantioFormatada {
    final dia = _dataPlantio.day.toString().padLeft(2, '0');
    final mes = _dataPlantio.month.toString().padLeft(2, '0');
    final ano = _dataPlantio.year.toString();
    return '$dia/$mes/$ano';
  }

  Future<void> _selecionarDataPlantio() async {
    final DateTime? dataEscolhida = await showDatePicker(
      context: context,
      initialDate: _dataPlantio,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF00501E),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1F2D24),
            ),
          ),
          child: child!,
        );
      },
    );

    if (dataEscolhida != null && dataEscolhida != _dataPlantio) {
      setState(() {
        _dataPlantio = dataEscolhida;
      });
    }
  }

  void _cadastrarTalhao() {
    final bool outraVazia =
        _culturaSelecionada == 'Outra' &&
        _outraCulturaController.text.trim().isEmpty;

    if (_nomeTalhaoController.text.trim().isEmpty ||
        _areaTalhaoController.text.trim().isEmpty ||
        outraVazia) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Preencha os campos obrigatórios marcados com *'),
          backgroundColor: Color(0xFF9E3012),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final String culturaFinal = _culturaSelecionada == 'Outra'
        ? _outraCulturaController.text.trim()
        : _culturaSelecionada;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Talhão cadastrado com sucesso!'),
        backgroundColor: Color(0xFF00501E),
        behavior: SnackBarBehavior.floating,
      ),
    );

    if (Navigator.canPop(context)) {
      Navigator.pop(context, {
        'nome': _nomeTalhaoController.text.trim(),
        'cultura': culturaFinal,
        'area': _areaTalhaoController.text.trim(),
        'dataPlantio': _dataPlantioFormatada,
        'fase': _faseSelecionada,
        'observacoes': _observacoesController.text.trim(),
      });
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) =>
              const TelaTalhoes(), // <-- Ajuste o nome da classe
        ),
      );
    }
  }

  // Rótulo com asterisco vermelho (*) para campos obrigatórios
  Widget _buildLabelObrigatorio(String texto) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: '$texto ',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00501E),
            ),
          ),
          const TextSpan(
            text: '*',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFFC93B2B),
            ),
          ),
        ],
      ),
    );
  }

  // Rótulo com "(opcional)" para campos não obrigatórios
  Widget _buildLabelOpcional(String texto) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: '$texto ',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00501E),
            ),
          ),
          const TextSpan(
            text: '(opcional)',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF5A7363),
            ),
          ),
        ],
      ),
    );
  }

  // Botão da grade 2x2 para "Em que fase está?"
  Widget _buildBotaoFase(String fase) {
    final bool selecionado = _faseSelecionada == fase;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _faseSelecionada = selecionado ? null : fase;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: selecionado ? const Color(0xFFD3E4D5) : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selecionado
                  ? const Color(0xFF00501E)
                  : const Color(0xFFDCE5DE),
              width: selecionado ? 1.8 : 1.2,
            ),
          ),
          child: Center(
            child: Text(
              fase,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: selecionado
                    ? const Color(0xFF00501E)
                    : const Color(0xFF3E5947),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<String> culturas = ['Soja', 'Milho', 'Feijão', 'Outra'];

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // 1. CABEÇALHO FIXO NO TOPO
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 14),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: Color(0xFFE6EDE7), width: 1),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Color(0xFF00501E),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Novo talhão',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        RichText(
                          text: const TextSpan(
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF5A7363),
                              height: 1.25,
                            ),
                            children: [
                              TextSpan(text: 'Fazenda Boa Vista · Campos com '),
                              TextSpan(
                                text: '*',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFC93B2B),
                                ),
                              ),
                              TextSpan(text: ' são obrigatórios'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 2. CORPO ROLÁVEL DO FORMULÁRIO
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Campo: Nome do talhão *
                    _buildLabelObrigatorio('Nome do talhão'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nomeTalhaoController,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF333333),
                      ),
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: 'Talhão 09',
                        hintStyle: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF88968D),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(
                            color: Color(0xFFDCE5DE),
                            width: 1.2,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(
                            color: Color(0xFF00501E),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Use o nome que você já usa na plantação.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Campo: Qual cultura está plantada? *
                    _buildLabelObrigatorio('Qual cultura está plantada?'),
                    const SizedBox(height: 10),
                    Row(
                      children: List.generate(culturas.length, (index) {
                        final cultura = culturas[index];
                        final bool selecionada = _culturaSelecionada == cultura;
                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              right: index < culturas.length - 1 ? 8 : 0,
                            ),
                            child: GestureDetector(
                              onTap: () =>
                                  setState(() => _culturaSelecionada = cultura),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: selecionada
                                      ? const Color(0xFFD3E4D5)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: selecionada
                                        ? const Color(0xFF00501E)
                                        : const Color(0xFFDCE5DE),
                                    width: selecionada ? 1.8 : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    cultura,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: selecionada
                                          ? const Color(0xFF00501E)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),

                    // Campo condicional para 'Outra' cultura
                    if (_culturaSelecionada == 'Outra') ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: _outraCulturaController,
                        textCapitalization: TextCapitalization.sentences,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF333333),
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          hintText: 'Qual cultura? Ex: Café',
                          hintStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF88968D),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF3F7F4),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(18),
                            borderSide: const BorderSide(
                              color: Color(0xFFDCE5DE),
                              width: 1.2,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(18),
                            borderSide: const BorderSide(
                              color: Color(0xFF00501E),
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 22),

                    // Campo: Área do talhão *
                    _buildLabelObrigatorio('Área do talhão'),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _areaTalhaoController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF333333),
                            ),
                            decoration: InputDecoration(
                              isDense: true,
                              hintText: '7,5',
                              hintStyle: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF88968D),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                              filled: true,
                              fillColor: Colors.white,
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(18),
                                borderSide: const BorderSide(
                                  color: Color(0xFFDCE5DE),
                                  width: 1.2,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(18),
                                borderSide: const BorderSide(
                                  color: Color(0xFF00501E),
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'ha',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Em hectares (ha). 1 ha equivale a 10.000 m².',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Campo: Data do plantio *
                    _buildLabelObrigatorio('Data do plantio'),
                    const SizedBox(height: 8),
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _selecionarDataPlantio,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: const Color(0xFFDCE5DE),
                            width: 1.2,
                          ),
                        ),
                        child: Text(
                          _dataPlantioFormatada,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF333333),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Dia, mês e ano.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Campo: Em que fase está? (opcional)
                    _buildLabelOpcional('Em que fase está?'),
                    const SizedBox(height: 4),
                    const Text(
                      'Ajuda a saber quais pragas e doenças são mais prováveis.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildBotaoFase('Plantio'),
                        const SizedBox(width: 12),
                        _buildBotaoFase('Crescimento'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildBotaoFase('Floração'),
                        const SizedBox(width: 12),
                        _buildBotaoFase('Colheita'),
                      ],
                    ),
                    const SizedBox(height: 22),

                    // Campo: Observações (opcional)
                    _buildLabelOpcional('Observações'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _observacoesController,
                      maxLines: 3,
                      textInputAction: TextInputAction.done,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF333333),
                      ),
                      decoration: InputDecoration(
                        hintText: 'Ex.: perto do rio, solo mais argiloso',
                        hintStyle: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF6B8574),
                        ),
                        contentPadding: const EdgeInsets.all(16),
                        filled: true,
                        fillColor: Colors.white,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(
                            color: Color(0xFFDCE5DE),
                            width: 1.2,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(
                            color: Color(0xFF00501E),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // 3. RODAPÉ FIXO COM BOTÃO CADASTRAR TALHÃO
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 14, 24, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE6EDE7), width: 1)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Depois de cadastrar, você já pode registrar ocorrências neste talhão.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _cadastrarTalhao,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF134E1E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    'Cadastrar talhão',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

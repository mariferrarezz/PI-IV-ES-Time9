import 'package:flutter/material.dart';

class TelaRegistroEvolucao extends StatefulWidget {
  const TelaRegistroEvolucao({super.key});

  @override
  State<TelaRegistroEvolucao> createState() => _TelaRegistroEvolucaoState();
}

class _TelaRegistroEvolucaoState extends State<TelaRegistroEvolucao> {
  String _intensidadeSelecionada = 'Alta';
  String _situacaoSelecionada = 'Igual';

  String _resultadoTratamento = 'Observando';
  bool _fezTratamento = true;
  bool _chamouAgronomo = false;

  DateTime _dataTratamento = DateTime(2026, 11, 4);
  DateTime _dataSelecionada = DateTime(2026, 11, 12);

  final TextEditingController _produtoController = TextEditingController();
  final TextEditingController _quemAplicouController = TextEditingController();
  final TextEditingController _areaAfetadaController = TextEditingController();
  final TextEditingController _observacoesController = TextEditingController();

  @override
  void dispose() {
    _areaAfetadaController.dispose();
    _produtoController.dispose();
    _quemAplicouController.dispose();
    _observacoesController.dispose();
    super.dispose();
  }

  // Formata a data para DD/MM/AAAA
  String get _dataFormatada {
    final dia = _dataSelecionada.day.toString().padLeft(2, '0');
    final mes = _dataSelecionada.month.toString().padLeft(2, '0');
    final ano = _dataSelecionada.year.toString();
    return '$dia/$mes/$ano';
  }

  String get _dataTratamentoFormatada {
    final dia = _dataTratamento.day.toString().padLeft(2, '0');
    final mes = _dataTratamento.month.toString().padLeft(2, '0');
    final ano = _dataTratamento.year.toString();
    return '$dia/$mes/$ano';
  }

  Future<void> _selecionarDataTratamento() async {
    final DateTime? dataEscolhidaTratamento = await showDatePicker(
      context: context,
      initialDate: _dataTratamento,
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
    if (dataEscolhidaTratamento != null &&
        dataEscolhidaTratamento != _dataTratamento) {
      setState(() {
        _dataTratamento = dataEscolhidaTratamento;
      });
    }
  }

  // Abre o calendário ao tocar no campo
  Future<void> _selecionarData() async {
    final DateTime? dataEscolhida = await showDatePicker(
      context: context,
      initialDate: _dataSelecionada,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF00501E), // Verde escuro padrão
              onPrimary: Colors.white,
              onSurface: Color(0xFF1F2D24),
            ),
          ),
          child: child!,
        );
      },
    );

    if (dataEscolhida != null && dataEscolhida != _dataSelecionada) {
      setState(() {
        _dataSelecionada = dataEscolhida;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF00501E),
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Registrar evolução',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                        SizedBox(height: 4),

                        Text(
                          'Talhão 03 · Ferrugem asiática da soja',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF5A7363),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Campo: Data da observação
              const Text(
                'Data da observação',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _selecionarData,
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
                      color: const Color(
                        0xFFDCE5DE,
                      ), // Borda verde-acinzentada sutil
                      width: 1.2,
                    ),
                  ),
                  child: Text(
                    _dataFormatada,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF333333),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Campo: Como está a intensidade agora?
              const Text(
                'Como está a intensidade agora?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Obrigatório. É o ponto que entra no gráfico.',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 12),

              // Três cartões de seleção (Baixa, Média, Alta)
              Row(
                children: [
                  // OPÇÃO 1: BAIXA (Paleta Verde quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _intensidadeSelecionada = 'Baixa'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _intensidadeSelecionada == 'Baixa'
                              ? const Color(0xFFD3E4D5) // Fundo verde claro
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _intensidadeSelecionada == 'Baixa'
                                ? const Color(0xFF00501E) // Borda verde escura
                                : const Color(0xFFDCE5DE),
                            width: _intensidadeSelecionada == 'Baixa'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Baixa',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _intensidadeSelecionada == 'Baixa'
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Poucas plantas',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: _intensidadeSelecionada == 'Baixa'
                                    ? const Color(0xFF00501E)
                                    : const Color(0xFF5A7363),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // OPÇÃO 2: MÉDIA (Paleta Amarela quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _intensidadeSelecionada = 'Média'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _intensidadeSelecionada == 'Média'
                              ? const Color(0xFFFEF7E0) // Fundo amarelo claro
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _intensidadeSelecionada == 'Média'
                                ? const Color(
                                    0xFF8C5700,
                                  ) // Borda marrom-dourada
                                : const Color(0xFFDCE5DE),
                            width: _intensidadeSelecionada == 'Média'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Média',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _intensidadeSelecionada == 'Média'
                                    ? const Color(0xFF8C5700)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Vários pontos',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: _intensidadeSelecionada == 'Média'
                                    ? const Color(0xFF8C5700)
                                    : const Color(0xFF5A7363),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // OPÇÃO 3: ALTA (Paleta Vermelha/Salmão quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _intensidadeSelecionada = 'Alta'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _intensidadeSelecionada == 'Alta'
                              ? const Color(0xFFF6C8B6) // Fundo salmão claro
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _intensidadeSelecionada == 'Alta'
                                ? const Color(
                                    0xFF9E3012,
                                  ) // Borda marrom-avermelhada
                                : const Color(0xFFDCE5DE),
                            width: _intensidadeSelecionada == 'Alta'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Alta',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _intensidadeSelecionada == 'Alta'
                                    ? const Color(0xFF9E3012)
                                    : const Color(0xFF3E5947),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Muito espalhada',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: _intensidadeSelecionada == 'Alta'
                                    ? const Color(0xFF9E3012)
                                    : const Color(0xFF5A7363),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Área afetada',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                  const SizedBox(width: 5),
                  const Text(
                    '(opcional)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _areaAfetadaController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF333333),
                      ),
                      decoration: InputDecoration(
                        hintText: '4,0',
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
              const SizedBox(height: 13),
              const Text(
                'E a situação em relação à ultima vez?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 12),

              // Primeira linha: Piorou e Igual
              Row(
                children: [
                  // OPÇÃO 1: PIOROU (Paleta Vermelha/Salmão quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Piorou'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Piorou'
                              ? const Color(0xFFF6C8B6)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Piorou'
                                ? const Color(0xFF9E3012)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Piorou' ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Piorou',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Piorou'
                                  ? const Color(0xFF9E3012)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // OPÇÃO 2: IGUAL (Paleta Amarela/Dourada quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Igual'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Igual'
                              ? const Color(0xFFFAE6B1)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Igual'
                                ? const Color(0xFF8C5700)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Igual' ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Igual',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Igual'
                                  ? const Color(0xFF8C5700)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Segunda linha: Melhorou e Controlada
              Row(
                children: [
                  // OPÇÃO 3: MELHOROU (Paleta Verde quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Melhorou'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Melhorou'
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Melhorou'
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Melhorou'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Melhorou',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Melhorou'
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // OPÇÃO 4: CONTROLADA (Paleta Verde quando selecionada)
                  Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _situacaoSelecionada = 'Controlada'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _situacaoSelecionada == 'Controlada'
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _situacaoSelecionada == 'Controlada'
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _situacaoSelecionada == 'Controlada'
                                ? 1.8
                                : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Controlada',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _situacaoSelecionada == 'Controlada'
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Campo: Fez algum tratamento? (Sim / Não)
              const Text(
                'Fez algum tratamento?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  // Botão SIM
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _fezTratamento = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _fezTratamento
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _fezTratamento
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _fezTratamento ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Sim',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _fezTratamento
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Botão NÃO
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _fezTratamento = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: !_fezTratamento
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: !_fezTratamento
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: !_fezTratamento ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Não',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: !_fezTratamento
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // PAINEL CONDICIONAL: Aparece somente se _fezTratamento == true ('Sim')
              if (_fezTratamento) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F7F4), // Fundo verde bem suave
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: const Color(0xFFE1EBE3),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Produto ou método usado
                      const Text(
                        'Produto ou método usado',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _produtoController,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF333333),
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          hintText: 'Fungicida triazol + estrobilurina',
                          hintStyle: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF88968D),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 14,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0xFFDCE5DE),
                              width: 1.2,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: Color(0xFF00501E),
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Linha: Data + Quem aplicou
                      Row(
                        children: [
                          // Coluna Data
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Data',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00501E),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                GestureDetector(
                                  behavior: HitTestBehavior.opaque,
                                  onTap: _selecionarDataTratamento,
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 14,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: const Color(0xFFDCE5DE),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Text(
                                      _dataTratamentoFormatada,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF333333),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),

                          // Coluna Quem aplicou
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Quem aplicou',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00501E),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _quemAplicouController,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF333333),
                                  ),
                                  decoration: InputDecoration(
                                    isDense: true,
                                    hintText: 'Eu mesmo',
                                    hintStyle: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF88968D),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 14,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      borderSide: const BorderSide(
                                        color: Color(0xFFDCE5DE),
                                        width: 1.2,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(14),
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
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Resultado até agora
                      const Text(
                        'Resultado até agora',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          // Opção 1: Observando (Amarelo quando selecionado)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                () => _resultadoTratamento = 'Observando',
                              ),
                              child: Container(
                                height: 50,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _resultadoTratamento == 'Observando'
                                      ? const Color(0xFFFAE6B1)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: _resultadoTratamento == 'Observando'
                                        ? const Color(0xFF8C5700)
                                        : const Color(0xFFDCE5DE),
                                    width: _resultadoTratamento == 'Observando'
                                        ? 1.8
                                        : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    'Observando',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color:
                                          _resultadoTratamento == 'Observando'
                                          ? const Color(0xFF8C5700)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Opção 2: Funcionou (Verde quando selecionado)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                () => _resultadoTratamento = 'Funcionou',
                              ),
                              child: Container(
                                height: 50,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _resultadoTratamento == 'Funcionou'
                                      ? const Color(0xFFD3E4D5)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: _resultadoTratamento == 'Funcionou'
                                        ? const Color(0xFF00501E)
                                        : const Color(0xFFDCE5DE),
                                    width: _resultadoTratamento == 'Funcionou'
                                        ? 1.8
                                        : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    'Funcionou',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _resultadoTratamento == 'Funcionou'
                                          ? const Color(0xFF00501E)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Opção 3: Não funcionou (Vermelho/Salmão quando selecionado)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(
                                () => _resultadoTratamento = 'Não funcionou',
                              ),
                              child: Container(
                                height: 50,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _resultadoTratamento == 'Não funcionou'
                                      ? const Color(0xFFF6C8B6)
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color:
                                        _resultadoTratamento == 'Não funcionou'
                                        ? const Color(0xFF9E3012)
                                        : const Color(0xFFDCE5DE),
                                    width:
                                        _resultadoTratamento == 'Não funcionou'
                                        ? 1.8
                                        : 1.2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    'Não\nfuncionou',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      height: 1.15,
                                      fontWeight: FontWeight.bold,
                                      color:
                                          _resultadoTratamento ==
                                              'Não funcionou'
                                          ? const Color(0xFF9E3012)
                                          : const Color(0xFF3E5947),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Campo: Chamou um agrônomo? (Sim / Não)
              const Text(
                'Chamou um agrônomo?',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _chamouAgronomo = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _chamouAgronomo
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _chamouAgronomo
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: _chamouAgronomo ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Sim',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: _chamouAgronomo
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _chamouAgronomo = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: !_chamouAgronomo
                              ? const Color(0xFFD3E4D5)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: !_chamouAgronomo
                                ? const Color(0xFF00501E)
                                : const Color(0xFFDCE5DE),
                            width: !_chamouAgronomo ? 1.8 : 1.2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Não',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: !_chamouAgronomo
                                  ? const Color(0xFF00501E)
                                  : const Color(0xFF3E5947),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Campo: Observações (opcional)
              RichText(
                text: const TextSpan(
                  children: [
                    TextSpan(
                      text: 'Observações ',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    TextSpan(
                      text: '(opcional)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              TextField(
                controller: _observacoesController,
                maxLines: 3, // Altura de 3 linhas igual à imagem
                textInputAction: TextInputAction.done,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF333333),
                ),
                decoration: InputDecoration(
                  hintText: 'Algo que você notou na plantação',
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
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
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
                'Ao salvar, o nível de atenção do Talhão 03 é recalculado.',
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
                  onPressed: () {
                    // Feedback visual e retorno para a tela do talhão
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Evolução registrada com sucesso!'),
                        backgroundColor: Color(0xFF00501E),
                      ),
                    );
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(
                      0xFF134E1E,
                    ), // Verde escuro do botão
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    'Salvar evolução',
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

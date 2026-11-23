import 'package:flutter/material.dart';
import 'package:sentinela/services/api_sentinela.dart';


class TelaNovoTalhao extends StatefulWidget {
  const TelaNovoTalhao({super.key, required this.propriedadeId, required this.propriedadeNome});

  final String propriedadeId;
  final String propriedadeNome;

  @override
  State<TelaNovoTalhao> createState() => _TelaNovoTalhaoState();
}

class _TelaNovoTalhaoState extends State<TelaNovoTalhao> {
  final TextEditingController _nomeTalhaoController = TextEditingController();
  final TextEditingController _areaTalhaoController = TextEditingController();
  final TextEditingController _observacoesController = TextEditingController();
  final _api = ApiSentinela();
  bool _enviando = false;
  String? _erro;

  @override
  void dispose() {
    _nomeTalhaoController.dispose();
    _areaTalhaoController.dispose();
    _observacoesController.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    if (_enviando) return;
    final textoArea = _areaTalhaoController.text.trim().replaceAll(',', '.');
    final area = textoArea.isEmpty ? null : double.tryParse(textoArea);
    if (textoArea.isNotEmpty && (area == null || !area.isFinite)) {
      setState(() => _erro = 'Informe a área como número.');
      return;
    }
    setState(() { _enviando = true; _erro = null; });
    try {
      await _api.request('POST', '/propriedades/${widget.propriedadeId}/talhoes', body: {
        'nome': _nomeTalhaoController.text,
        if (area != null) 'areaHa': area,
        if (_observacoesController.text.trim().isNotEmpty) 'observacoes': _observacoesController.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Talhão cadastrado.')));
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _enviando = false);
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

  @override
  Widget build(BuildContext context) {
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
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF5A7363),
                              height: 1.25,
                            ),
                            children: [
                              TextSpan(text: '${widget.propriedadeNome} · Campos com '),
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
                    if (_erro != null) ...[
                      SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                    ],
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

                    const Text('Cultura, data de plantio e fase pertencem ao cadastro de plantação, ainda não disponível.'),
                    const SizedBox(height: 20),

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
                'Confira os dados antes de cadastrar o talhão.',
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
                  onPressed: _enviando ? null : _salvar,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF134E1E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Text(
                    _enviando ? 'Salvando...' : 'Cadastrar talhão',
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

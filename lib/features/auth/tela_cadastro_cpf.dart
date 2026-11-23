import 'package:flutter/material.dart';
import 'package:sentinela/services/mascaras_documentos.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'cadastro_dados.dart';
import 'tela_cadastro_telefone.dart';

class TelaCadastroCpf extends StatefulWidget {
  const TelaCadastroCpf({super.key, required this.dados, this.validarCpf, this.erroInicial});
  final CadastroDados dados;
  final Future<void> Function(String)? validarCpf;
  final String? erroInicial;

  @override
  State<TelaCadastroCpf> createState() => _TelaCadastroCpfState();
}

class _TelaCadastroCpfState extends State<TelaCadastroCpf> {
  @override
  void initState() { super.initState(); _cpfController.text = const MascaraDocumento.cpf().formatar(widget.dados.cpf); _erroCpf = widget.erroInicial; }
  final TextEditingController _cpfController = TextEditingController();
  String? _erroCpf;
  bool _validando = false;

  Future<void> _continuar() async {
    if (_validando) return;
    final cpf = apenasDigitos(_cpfController.text);
    if (cpf.length != 11) { setState(() => _erroCpf = 'Informe um CPF com 11 dígitos'); return; }
    setState(() { _validando = true; _erroCpf = null; });
    try {
      if (widget.validarCpf != null) { await widget.validarCpf!(cpf); }
      else { await ApiSentinela().request('POST', '/validacao-cadastro/cpf', body: {'valor': cpf}, autenticado: false); }
      if (!mounted) return;
      widget.dados.cpf = cpf;
      Navigator.push(context, MaterialPageRoute(builder: (_) => TelaCadastroTelefone(dados: widget.dados)));
    } on ApiException catch (e) { if (mounted) setState(() => _erroCpf = e.mensagem); }
    finally { if (mounted) setState(() => _validando = false); }
  }

  int _passoAtual = 3;
  final int _totalPassos = 8;

  // Função para avançar o passo ao clicar no botão
  void avancarPasso() {
    setState(() {
      if (_passoAtual < _totalPassos) {
        _passoAtual++;
      }
    });
  }

  @override
  void dispose() {
    _cpfController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                ),
              ),
              const SizedBox(height: 16.0),

              // 2. TEXTOS DO CABEÇALHO E BARRA DE PROGRESSO
              const Text(
                'CADASTRO',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(255, 151, 150, 150),
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Criar conta',
                style: TextStyle(
                  fontSize: 28.0,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1B5E20),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Inicie a gestão inteligente de pragas na sua lavoura em poucos minutos',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color.fromARGB(255, 151, 150, 150),
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 20),

              // BARRA DE PROGRESSO
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _passoAtual / _totalPassos,
                  minHeight: 5,
                  backgroundColor: const Color(0xFFD3E4D5),
                  color: const Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 6),

              // TEXTO 1/8 ALINHADO EMBAIXO À DIREITA DA BARRA
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  '$_passoAtual/$_totalPassos',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF00501E),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // 3. CAIXA CINZA ARREDONDADA
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Ícone de usuário circular com sombra
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00501E),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.badge_outlined,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Informe o seu CPF',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(height: 6),

                    const Text(
                      'O CPF ajuda na indentificação segura da sua conta.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF66806E),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'CPF:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Campo de Texto com ícone à direita (suffixIcon)
                    TextField(
                      controller: _cpfController,
                      enabled: !_validando,
                      keyboardType: TextInputType.number,
                      inputFormatters: [const MascaraDocumento.cpf()],
                      onChanged: (_) { if (_erroCpf != null) setState(() => _erroCpf = null); },
                      decoration: InputDecoration(
                        errorText: _erroCpf,
                        hintText: '999.999.999-99',
                        hintStyle: TextStyle(
                          color: const Color(0xFF66806E).withValues(alpha: 0.5),
                          fontSize: 14,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        suffixIcon: const Icon(
                          Icons.badge_outlined,
                          color: Color(0xFF00501E),
                          size: 22,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20.0,
                          vertical: 14.0,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30.0),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),

                    // ESPAÇAMENTO ADICIONADO ENTRE O CAMPO E O BOTÃO
                    const SizedBox(height: 32),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // BOTÃO DE AVANÇAR / ENTRAR
              SizedBox(
                width: double.infinity,
                height: 52.0,
                child: ElevatedButton(
                  onPressed: _validando ? null : _continuar,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00501E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30.0),
                    ),
                  ),
                  child: Text(
                    _validando ? 'VALIDANDO...' : (_passoAtual == _totalPassos ? 'FINALIZAR' : 'CONTINUAR'),
                    style: const TextStyle(
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

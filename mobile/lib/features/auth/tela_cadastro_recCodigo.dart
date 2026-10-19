import 'package:flutter/material.dart';

class TelaCadastroRecCodigo extends StatefulWidget {
  const TelaCadastroRecCodigo({super.key});

  @override
  State<TelaCadastroRecCodigo> createState() => _TelaCadastroRecCodigoState();
}

class _TelaCadastroRecCodigoState extends State<TelaCadastroRecCodigo> {
  String _canalSelecionado = 'E-mail';

  int _passoAtual = 5;
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
                        Icons.verified_user_outlined,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Como deseja receber códigos',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(height: 6),

                    const Text(
                      'Escolha o conal preferido para o segundo fator de autenticação.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF66806E),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Código no login:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Campo de Texto com ícone à direita (suffixIcon)
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _canalSelecionado = 'E-mail';
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                backgroundColor: _canalSelecionado == 'E-mail'
                                    ? const Color(0xFF1B5E20)
                                    : Colors.white,
                                side: const BorderSide(
                                  color: Color(0xFF1B5E20),
                                ),
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.horizontal(
                                    left: Radius.circular(30),
                                  ),
                                ),
                              ),
                              child: Text(
                                'E-mail',
                                style: TextStyle(
                                  color: _canalSelecionado == 'E-mail'
                                      ? Colors.white
                                      : const Color(0xFF1B5E20),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: SizedBox(
                            height: 52,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _canalSelecionado = 'SMS';
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                backgroundColor: _canalSelecionado == 'SMS'
                                    ? const Color(0xFF1B5E20)
                                    : Colors.white,
                                side: const BorderSide(
                                  color: Color(0xFF1B5E20),
                                ),
                                // Correção: Arredonda apenas os cantos direitos para colar com o outro botão
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.horizontal(
                                    right: Radius.circular(30),
                                  ),
                                ),
                              ),
                              child: Text(
                                'SMS',
                                style: TextStyle(
                                  color: _canalSelecionado == 'SMS'
                                      ? Colors.white
                                      : const Color(0xFF1B5E20),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'No login: código de 6 dígitos será enviado ao seu e-mail ou por sms.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF66806E),
                        height: 1.3,
                      ),
                    ),

                    // ESPAÇAMENTO ADICIONADO ENTRE O CAMPO E O BOTÃO
                    const SizedBox(height: 32),
                    // BOTÃO DE AVANÇAR / ENTRAR
                  ],
                ),
              ),
              const SizedBox(height: 40),
              
              SizedBox(
                width: double.infinity,
                height: 52.0,
                child: ElevatedButton(
                  onPressed: avancarPasso,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00501E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30.0),
                    ),
                  ),
                  child: Text(
                    _passoAtual == _totalPassos ? 'FINALIZAR' : 'CONTINUAR',
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

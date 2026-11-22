import 'package:flutter/material.dart';

class TelaCadastroConfirmarSenha extends StatefulWidget {
  const TelaCadastroConfirmarSenha({super.key});

  @override
  State<TelaCadastroConfirmarSenha> createState() =>
      _TelaCadastroConfirmarSenhaState();
}

class _TelaCadastroConfirmarSenhaState
    extends State<TelaCadastroConfirmarSenha> {
  final TextEditingController _confirmarSenhaController =
      TextEditingController();

  // Variável de estado para controlar se a senha está oculta ou visível
  bool _ocultarSenha = true;

  int _passoAtual = 7;
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
    _confirmarSenhaController.dispose();
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

              // TEXTO 6/8 ALINHADO EMBAIXO À DIREITA DA BARRA
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
                    // Ícone de cadeado circular com sombra
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
                        Icons.lock_outline_rounded,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Crie uma senha segura',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(height: 6),

                    const Text(
                      'A senha precisa atender todos os critérios abaixo.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF66806E),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Senha segura:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Campo de Texto com o botão de olho funcional
                    TextField(
                      controller: _confirmarSenhaController,
                      obscureText: _ocultarSenha,
                      decoration: InputDecoration(
                        hintText: '************',
                        hintStyle: TextStyle(
                          color: const Color(0xFF66806E).withValues(alpha: 0.5),
                          fontSize: 14,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _ocultarSenha
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: const Color(0xFF00501E),
                            size: 22,
                          ),
                          onPressed: () {
                            setState(() {
                              _ocultarSenha = !_ocultarSenha;
                            });
                          },
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
                    const SizedBox(height: 16),

                    const Text(
                      'As senhas conferem !',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color.fromARGB(255, 151, 150, 150),
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // BOTÃO DE AVANÇAR / CONTINUAR
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

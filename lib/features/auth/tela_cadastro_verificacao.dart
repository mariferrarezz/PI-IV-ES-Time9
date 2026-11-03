import 'package:flutter/material.dart';

class TelaVerificacaoCodigo extends StatelessWidget {
  const TelaVerificacaoCodigo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),

              // 1. LOGO / ÍCONE DO TOPO
              const Icon(
                Icons.shield_outlined,
                size: 80,
                color: Color(0xFF00501E),
              ),
              const SizedBox(height: 32),

              // 2. TÍTULO DA TELA
              const Text(
                'Código de verificação',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 12),

              // SUBTÍTULO
              const Text(
                'Digite o código de 6 dígitos enviado para\nseu@email.com.br',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF7A9382),
                  height: 1.3,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 40),

              // 3. CAIXAS DE ENTRADA DOS 6 DÍGITOS
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(
                  6,
                  (index) => SizedBox(
                    width: 46,
                    height: 52,
                    child: TextField(
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                      maxLength: 1,
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: const Color.fromARGB(255, 224, 224, 224),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 48),

              // 4. BOTÃO DE VERIFICAR CÓDIGO
              SizedBox(
                width: double.infinity,
                height: 52.0,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF135323),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30.0),
                    ),
                  ),
                  child: const Text(
                    'Verificar Código',
                    style: TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // 5. RODAPÉ (REENVIAR CÓDIGO)
              Column(
                children: const [
                  Text(
                    'Não recebeu seu código?',
                    style: TextStyle(fontSize: 12, color: Color(0xFF7A9382)),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Clique aqui para enviar novamente.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF00501E),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

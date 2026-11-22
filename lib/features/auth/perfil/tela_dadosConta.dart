import 'package:flutter/material.dart';

class TelaDadosConta extends StatefulWidget {
  const TelaDadosConta({super.key});

  @override
  State<TelaDadosConta> createState() => _TelaDadosContaState();
}

class _TelaDadosContaState extends State<TelaDadosConta> {
  final TextEditingController _nomeController = TextEditingController(
    text: 'Seu Nome',
  );
  final TextEditingController _telefoneController = TextEditingController(
    text: '(15) 99999-0000',
  );

  String get _iniciais {
    final partes = _nomeController.text.trim().split(RegExp(r'\s+'));
    if (partes.isEmpty || partes.first.isEmpty) return 'SN';
    if (partes.length == 1) {
      return partes.first
          .substring(0, partes.first.length >= 2 ? 2 : 1)
          .toUpperCase();
    }
    return (partes.first[0] + partes.last[0]).toUpperCase();
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _telefoneController.dispose();
    super.dispose();
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
              // 1. CABEÇALHO COM SETA DE VOLTAR
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Color(0xFF00501E),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Dados da conta',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                            height: 1.1,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Suas informações no Sentinela',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF5A7363),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Color(0xFFE5ECE7), height: 1),
              const SizedBox(height: 24),

              // 2. AVATAR COM INICIAIS
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 82,
                      height: 82,
                      decoration: const BoxDecoration(
                        color: Color(0xFF134E1E),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _iniciais,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'No lugar da foto, aparecem as iniciais do seu nome.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 3. CAMPO NOME *
              RichText(
                text: const TextSpan(
                  text: 'Nome ',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00501E),
                  ),
                  children: [
                    TextSpan(
                      text: '*',
                      style: TextStyle(color: Color(0xFFB33A1E)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nomeController,
                onChanged: (_) => setState(() {}),
                style: const TextStyle(fontSize: 15, color: Color(0xFF1A2E22)),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFD5E0D8)),
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
              const SizedBox(height: 6),
              const Text(
                'Como você quer ser chamado.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 20),

              // 4. CAMPO E-MAIL (SOMENTE LEITURA)
              const Text(
                'E-mail',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 15,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F3F1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Text(
                  'seu.email@exemplo.com',
                  style: TextStyle(fontSize: 15, color: Color(0xFF5A7363)),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'É com ele que você entra no app. Não dá para trocar por aqui.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 20),

              // 5. CAMPO TELEFONE (OPCIONAL)
              RichText(
                text: const TextSpan(
                  text: 'Telefone ',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00501E),
                  ),
                  children: [
                    TextSpan(
                      text: '(opcional)',
                      style: TextStyle(
                        fontWeight: FontWeight.normal,
                        color: Color(0xFF5A7363),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _telefoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(fontSize: 15, color: Color(0xFF1A2E22)),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFD5E0D8)),
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
              const SizedBox(height: 6),
              const Text(
                'Só para contato do app. Não aparece para outros produtores.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 22),

              // 6. CARD SENHA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F6F3),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE3EBE5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Senha',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Enviamos um link para o seu e-mail, onde você cria uma senha nova.',
                      style: TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF3E5748),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: OutlinedButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Link de redefinição enviado para seu.email@exemplo.com',
                              ),
                              backgroundColor: Color(0xFF00501E),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(
                            color: Color(0xFF00501E),
                            width: 1.2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: const Text(
                          'Enviar link por e-mail',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 7. BOTÃO SALVAR ALTERAÇÕES
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Alteracoes da conta ainda nao sao salvas.')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF134E1E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    'Salvar alterações',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

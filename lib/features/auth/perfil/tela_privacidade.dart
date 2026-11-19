import 'package:flutter/material.dart';

class TelaPrivacidade extends StatefulWidget {
  const TelaPrivacidade({super.key});

  @override
  State<TelaPrivacidade> createState() => _TelaPrivacidadeState();
}

class _TelaPrivacidadeState extends State<TelaPrivacidade> {
  // 0 = Município | 1 = Região mais ampla
  int _regiaoSelecionada = 0;
  bool _incluirSintomas = true;

  final List _relatosCompartilhados = [
    {
      'titulo': 'Ferrugem asiática da soja',
      'subtitulo': 'Talhão 03 · compartilhado há 3 dias',
    },
    {
      'titulo': 'Lagarta-do-cartucho',
      'subtitulo': 'Talhão 07 · compartilhado há 1 semana',
    },
  ];

  void _removerRelato(int index) {
    final tituloRemovido = _relatosCompartilhados[index]['titulo'];
    setState(() {
      _relatosCompartilhados.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Relato "$tituloRemovido" removido da Comunidade.'),
        backgroundColor: const Color(0xFF00501E),
        behavior: SnackBarBehavior.floating,
      ),
    );
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
                          'Privacidade',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                            height: 1.1,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'O que os outros produtores veem',
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
              const SizedBox(height: 22),

              // 2. SEÇÃO: COMO SUA REGIÃO APARECE
              const Text(
                'Como sua região aparece',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Nos relatos que você compartilha na Comunidade.',
                style: TextStyle(fontSize: 13, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 12),

              // Opção 1: Município
              _buildOpcaoRegiao(
                selecionado: _regiaoSelecionada == 0,
                titulo: 'Município',
                subtitulo: 'Aparece como "Itapetininga, SP"',
                onTap: () => setState(() => _regiaoSelecionada = 0),
              ),
              const SizedBox(height: 10),

              // Opção 2: Região mais ampla
              _buildOpcaoRegiao(
                selecionado: _regiaoSelecionada == 1,
                titulo: 'Região mais ampla',
                subtitulo: 'Aparece como "Interior de SP", mais discreto',
                onTap: () => setState(() => _regiaoSelecionada = 1),
              ),
              const SizedBox(height: 10),

              const Text(
                'Vem da sua propriedade principal, a Fazenda Boa Vista. Não usamos sua localização exata.',
                style: TextStyle(
                  fontSize: 12.5,
                  color: Color(0xFF5A7363),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 22),

              // 3. SEÇÃO: O QUE VAI NOS RELATOS
              const Text(
                'O que vai nos relatos',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 10),

              // Card com switch: Incluir sintomas marcados
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFE5ECE7),
                    width: 1.2,
                  ),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Incluir sintomas marcados',
                            style: TextStyle(
                              fontSize: 15.5,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Ajuda outros produtores a reconhecer a praga ou doença.',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF5A7363),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Switch(
                      value: _incluirSintomas,
                      onChanged: (v) => setState(() => _incluirSintomas = v),
                      activeThumbColor: Colors.white,
                      activeTrackColor: const Color(0xFF134E1E),
                      inactiveThumbColor: Colors.white,
                      inactiveTrackColor: const Color(0xFFD5DED7),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Card informativo cinza com cadeado
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F6F3),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE3EBE5)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: EdgeInsets.only(top: 2),
                      child: Icon(
                        Icons.lock_outline_rounded,
                        size: 20,
                        color: Color(0xFF4C6652),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Nunca aparecem para os outros: seu nome, a fazenda, o talhão e as observações escritas.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF3E5748),
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // 4. SEÇÃO: RELATOS QUE VOCÊ COMPARTILHOU
              const Text(
                'Relatos que você compartilhou',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Remova quando não quiser mais mostrar.',
                style: TextStyle(fontSize: 13, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 12),

              if (_relatosCompartilhados.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F9F7),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE5ECE7)),
                  ),
                  child: const Text(
                    'Você não possui relatos compartilhados no momento.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13.5, color: Color(0xFF5A7363)),
                  ),
                )
              else
                ...List.generate(_relatosCompartilhados.length, (index) {
                  final relato = _relatosCompartilhados[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: const Color(0xFFE5ECE7),
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  relato['titulo']!,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00501E),
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  relato['subtitulo']!,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Color(0xFF5A7363),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          OutlinedButton(
                            onPressed: () => _removerRelato(index),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              side: const BorderSide(
                                color: Color(0xFFE6C8BC),
                                width: 1.2,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                            child: const Text(
                              'Remover',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF8C3B19),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOpcaoRegiao({
    required bool selecionado,
    required String titulo,
    required String subtitulo,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selecionado ? const Color(0xFFDDE8DF) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selecionado
                ? const Color(0xFF00501E)
                : const Color(0xFFD5E0D8),
            width: selecionado ? 1.5 : 1.1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: selecionado ? const Color(0xFF134E1E) : Colors.white,
                shape: BoxShape.circle,
                border: Border.all(
                  color: selecionado
                      ? const Color(0xFF134E1E)
                      : const Color(0xFFB5C4B9),
                  width: 1.5,
                ),
              ),
              child: selecionado
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titulo,
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00501E),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitulo,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF3E5748),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

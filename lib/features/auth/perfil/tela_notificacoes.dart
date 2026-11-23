import 'package:flutter/material.dart';

class TelaNotificacoes extends StatefulWidget {
  const TelaNotificacoes({super.key});

  @override
  State<TelaNotificacoes> createState() => _TelaNotificacoesState();
}

class _TelaNotificacoesState extends State<TelaNotificacoes> {
  bool _alertasTalhoes = true;
  bool _alertasRegiao = true;
  bool _lembreteMonitoramento = true;

  String _distanciaSelecionada = 'Até 50 km';
  String _diasSelecionados = '3 dias';

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
                          'Notificações',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF00501E),
                            height: 1.1,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'As mudanças valem na hora',
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
              const SizedBox(height: 24),

              // 2. CARD 1: ALERTAS DOS MEUS TALHÕES
              _buildCardBase(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _buildIconeCircular(Icons.map_outlined),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Alertas dos meus talhões',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                              height: 1.2,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Quando o nível de atenção de um talhão mudar.',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF5A7363),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildSwitch(
                      valor: _alertasTalhoes,
                      onChanged: (v) => setState(() => _alertasTalhoes = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 3. CARD 2: ALERTAS DA REGIÃO + DISTÂNCIA
              _buildCardBase(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        _buildIconeCircular(Icons.public_outlined),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Alertas da região',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Quando alguém perto de você relatar uma praga ou doença da sua cultura.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF5A7363),
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildSwitch(
                          valor: _alertasRegiao,
                          onChanged: (v) => setState(() => _alertasRegiao = v),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'DISTÂNCIA',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                        color: Color(0xFF4C6652),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _buildChipOpcao(
                          texto: 'Até 50 km',
                          selecionado: _distanciaSelecionada == 'Até 50 km',
                          habilitado: _alertasRegiao,
                          onTap: () => setState(
                            () => _distanciaSelecionada = 'Até 50 km',
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildChipOpcao(
                          texto: 'Até 100 km',
                          selecionado: _distanciaSelecionada == 'Até 100 km',
                          habilitado: _alertasRegiao,
                          onTap: () => setState(
                            () => _distanciaSelecionada = 'Até 100 km',
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildChipOpcao(
                          texto: 'Toda a região',
                          selecionado: _distanciaSelecionada == 'Toda a região',
                          habilitado: _alertasRegiao,
                          onTap: () => setState(
                            () => _distanciaSelecionada = 'Toda a região',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. CARD 3: LEMBRETE DE MONITORAMENTO + AVISAR APÓS
              _buildCardBase(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        _buildIconeCircular(Icons.timer_outlined),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Lembrete de monitoramento',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  height: 1.2,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Quando uma ocorrência ativa ficar um tempo sem evolução registrada.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF5A7363),
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildSwitch(
                          valor: _lembreteMonitoramento,
                          onChanged: (v) =>
                              setState(() => _lembreteMonitoramento = v),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'AVISAR APÓS',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                        color: Color(0xFF4C6652),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _buildChipOpcao(
                          texto: '3 dias',
                          selecionado: _diasSelecionados == '3 dias',
                          habilitado: _lembreteMonitoramento,
                          onTap: () =>
                              setState(() => _diasSelecionados = '3 dias'),
                        ),
                        const SizedBox(width: 8),
                        _buildChipOpcao(
                          texto: '7 dias',
                          selecionado: _diasSelecionados == '7 dias',
                          habilitado: _lembreteMonitoramento,
                          onTap: () =>
                              setState(() => _diasSelecionados = '7 dias'),
                        ),
                        const SizedBox(width: 8),
                        _buildChipOpcao(
                          texto: '15 dias',
                          selecionado: _diasSelecionados == '15 dias',
                          habilitado: _lembreteMonitoramento,
                          onTap: () =>
                              setState(() => _diasSelecionados = '15 dias'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 5. TEXTO RODAPÉ
              const Text(
                'Os alertas ativos também aparecem na tela Início.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCardBase({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5ECE7), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.025),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildIconeCircular(IconData icone) {
    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        color: Color(0xFFE2ECE4),
        shape: BoxShape.circle,
      ),
      child: Icon(icone, color: const Color(0xFF00501E), size: 22),
    );
  }

  Widget _buildSwitch({
    required bool valor,
    required ValueChanged<bool> onChanged,
  }) {
    return Switch(
      value: valor,
      onChanged: onChanged,
      activeThumbColor: Colors.white,
      activeTrackColor: const Color(0xFF134E1E),
      inactiveThumbColor: Colors.white,
      inactiveTrackColor: const Color(0xFFD5DED7),
    );
  }

  Widget _buildChipOpcao({
    required String texto,
    required bool selecionado,
    required bool habilitado,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: habilitado ? onTap : null,
      child: Opacity(
        opacity: habilitado ? 1.0 : 0.45,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selecionado ? const Color(0xFFDDE8DF) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selecionado
                  ? const Color(0xFF00501E)
                  : const Color(0xFFD5E0D8),
              width: selecionado ? 1.4 : 1.0,
            ),
          ),
          child: Text(
            texto,
            style: TextStyle(
              fontSize: 13,
              fontWeight: selecionado ? FontWeight.bold : FontWeight.w500,
              color: selecionado
                  ? const Color(0xFF00501E)
                  : const Color(0xFF3E5748),
            ),
          ),
        ),
      ),
    );
  }
}

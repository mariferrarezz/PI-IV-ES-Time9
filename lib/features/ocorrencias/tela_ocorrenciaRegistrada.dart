import 'package:flutter/material.dart';

import 'tela_talhaoEspecifico.dart'; // Ajuste o nome do arquivo da tela específica do talhão

//import 'tela_home.dart'; // Ajuste o nome do arquivo da tela de início (Home)

class TelaOcorrenciaRegistrada extends StatelessWidget {
  final String nomeTalhao;
  final String cultura;
  final String areaTotalTalhao;
  final String nomeOcorrencia;
  final String tipoOcorrencia;
  final String intensidade;
  final String areaAfetada;
  final String dataOcorrencia;

  const TelaOcorrenciaRegistrada({
    super.key,
    this.nomeTalhao = 'Talhão 03',
    this.cultura = 'Soja',
    this.areaTotalTalhao = '12,5 ha',
    this.nomeOcorrencia = 'Percevejo-marrom',
    this.tipoOcorrencia = 'PRAGA',
    this.intensidade = 'Baixa',
    this.areaAfetada = '1,5 ha',
    this.dataOcorrencia = '16/11/2026',
  });

  Widget _buildLinhaResumo({
    required String label,
    required Widget valorWidget,
    bool mostrarDivisor = true,
  }) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(width: 12),
              Flexible(child: valorWidget),
            ],
          ),
        ),
        if (mostrarDivisor)
          const Divider(height: 1, thickness: 1, color: Color(0xFFEEF3EF)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isPraga = tipoOcorrencia.toUpperCase() == 'PRAGA';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 1. LOGO SENTINELA NO TOPO ESQUERDO
              Align(
                alignment: Alignment.centerLeft,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.spa_rounded, color: Color(0xFF00501E), size: 28),
                    SizedBox(height: 2),
                    Text(
                      'Sentinela',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6B4C35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // 2. ÍCONE DE CONFIRMAÇÃO CIRCULAR VERDE
              Container(
                width: 84,
                height: 84,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCE7DD),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: Color(0xFF13501E),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // 3. TÍTULO E SUBTÍTULO
              const Text(
                'Ocorrência registrada',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF13501E),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'O nível de atenção do $nomeTalhao foi atualizado.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF5A7363),
                ),
              ),
              const SizedBox(height: 24),

              // 4. CARD DE RESUMO DOS DADOS REGISTRADOS
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFE5ECE7),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildLinhaResumo(
                      label: 'Talhão',
                      valorWidget: Text(
                        '$nomeTalhao · $cultura · $areaTotalTalhao',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2D24),
                        ),
                      ),
                    ),
                    _buildLinhaResumo(
                      label: 'Ocorrência',
                      valorWidget: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              nomeOcorrencia,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1F2D24),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isPraga
                                  ? const Color(0xFFF3E7D3)
                                  : const Color(0xFFE3ECF7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              tipoOcorrencia.toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isPraga
                                    ? const Color(0xFF8C5A1E)
                                    : const Color(0xFF28558A),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildLinhaResumo(
                      label: 'Intensidade',
                      valorWidget: Text(
                        intensidade,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2D24),
                        ),
                      ),
                    ),
                    _buildLinhaResumo(
                      label: 'Área afetada',
                      valorWidget: Text(
                        areaAfetada,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2D24),
                        ),
                      ),
                    ),
                    _buildLinhaResumo(
                      label: 'Data',
                      mostrarDivisor: false,
                      valorWidget: Text(
                        dataOcorrencia,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2D24),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 5. CARD AMARELO DE RECOMENDAÇÃO (ATENÇÃO)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCF3D6),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFEBD394),
                    width: 1.2,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5DF9E),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'ATENÇÃO',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF7A4900),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Intensifique o monitoramento do talhão. Quando houver mudança, registre a evolução para manter o histórico.',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                        color: Color(0xFF5A3E10),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // 6. BOTÃO PRINCIPAL: VER TALHÃO -> TELA ESPECÍFICA DO TALHÃO
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TelaTalhaoEspecifico(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF13501E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Text(
                    'Ver $nomeTalhao',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // 7. BOTÃO SECUNDÁRIO: REGISTRAR OUTRA OCORRÊNCIA
              SizedBox(
                width: double.infinity,
                height: 54,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF13501E),
                    side: const BorderSide(
                      color: Color(0xFF13501E),
                      width: 1.5,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    'Registrar outra ocorrência',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // 8. LINK INFERIOR: VOLTAR PARA O INÍCIO -> TELA HOME
              TextButton(
                onPressed: () {
                  /*Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TelaHome(),
                    ),
                    (route) => false,
                  );*/
                },
                child: const Text(
                  'Voltar para o início',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF425C4B),
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

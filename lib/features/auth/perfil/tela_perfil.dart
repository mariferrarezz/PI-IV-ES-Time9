import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../tela_bem_vindo.dart';
import 'package:sentinela/navegacao.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/features/propriedades/tela_talhoes.dart'; // Ajuste o caminho se a pasta for diferente

import 'tela_dadosConta.dart';
import 'tela_notificacoes.dart';
import 'tela_privacidade.dart';

class TelaPerfil extends StatefulWidget {
  const TelaPerfil({super.key});

  @override
  State<TelaPerfil> createState() => _TelaPerfilState();
}

class _TelaPerfilState extends State<TelaPerfil> {
  // Índice 4 selecionado por padrão (aba PERFIL)
  final int _indiceAtualNav = 4;

  // Nome e iniciais vêm do back-end (GET /auth/me): nome público, ou o nome completo se não houver.
  String _nomeExibido = '';
  String _iniciais = '';

  @override
  void initState() {
    super.initState();
    _carregarPerfil();
  }

  Future<void> _carregarPerfil() async {
    try {
      final perfil = await ApiSentinela().request('GET', '/auth/me') as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _nomeExibido = (perfil['nomePublico'] as String?) ?? (perfil['nomeCompleto'] as String? ?? '');
        _iniciais = perfil['iniciais'] as String? ?? '';
      });
    } on ApiException catch (_) {
      // Mantém o cartão sem nome; as outras opções do perfil continuam disponíveis.
    }
  }

  // Método auxiliar para navegar entre as telas. Ao voltar, recarrega o nome (pode ter mudado).
  Future<void> _abrirTela(Widget destino) async {
    await Navigator.push(context, MaterialPageRoute(builder: (context) => destino));
    _carregarPerfil();
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
              // 1. LOGO SENTINELA NO TOPO ESQUERDO
              Image.asset(
                'assets/images/logoSentinela.png',
                height: 48,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.grass, size: 28, color: Color(0xFF00501E)),
                      Text(
                        'Sentinela',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6B3E26),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 12),

              // 2. TÍTULO E SUBTÍTULO DA TELA
              const Text(
                'Perfil',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF00501E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Sua conta e suas propriedades.',
                style: TextStyle(fontSize: 14, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 20),

              // 3. CARD DO USUÁRIO (AVATAR SN + NOME + PROPRIEDADE)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: const Color(0xFFE5ECE7),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Avatar circular com as iniciais
                    Container(
                      width: 68,
                      height: 68,
                      decoration: const BoxDecoration(
                        color: Color(0xFF00501E),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _iniciais.isEmpty ? '–' : _iniciais,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Nome e resumo da fazenda
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _nomeExibido,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF00501E),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            FirebaseAuth.instance.currentUser?.email ?? '',
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF5A7363),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. BOTÕES DO MENU DO PERFIL COM AS ROTAS CONECTADAS
              _buildBotaoPerfil(
                icone: Icons.home_outlined,
                titulo: 'Minhas propriedades',
                subtitulo: 'Trocar ou cadastrar propriedade',
                // Redireciona para TelaTalhoes já abrindo o modal "Suas propriedades"
                onTap: () =>
                    _abrirTela(const TelaTalhoes(abrirModalPropriedades: true)),
              ),
              const SizedBox(height: 12),
              _buildBotaoPerfil(
                icone: Icons.badge_outlined,
                titulo: 'Dados da conta',
                subtitulo: 'Nome público, CPF, e-mail e telefone',
                onTap: () => _abrirTela(const TelaDadosConta()),
              ),
              const SizedBox(height: 12),
              _buildBotaoPerfil(
                icone: Icons.notifications_none_rounded,
                titulo: 'Notificações',
                subtitulo: 'Alertas de pragas e doenças',
                onTap: () => _abrirTela(const TelaNotificacoes()),
              ),
              const SizedBox(height: 12),
              _buildBotaoPerfil(
                icone: Icons.lock_outline_rounded,
                titulo: 'Privacidade',
                subtitulo: 'Região e dados dos relatos',
                onTap: () => _abrirTela(const TelaPrivacidade()),
              ),
              const SizedBox(height: 20),

              // 5. BOTÃO SAIR DA CONTA
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await FirebaseAuth.instance.signOut();
                    if (!context.mounted) return;
                    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const TelaBemvindo()), (route) => false);
                  },
                  icon: const Icon(
                    Icons.logout_rounded,
                    color: Color(0xFF8C3B19),
                    size: 20,
                  ),
                  label: const Text(
                    'Sair da conta',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF8C3B19),
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: const BorderSide(
                      color: Color(0xFFE6C8BC),
                      width: 1.2,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),

      // 6. BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.topCenter,
          children: [
            Container(
              height: 68,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F6F3),
                borderRadius: BorderRadius.circular(34),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(0, Icons.home_outlined, 'INÍCIO'),
                  _buildNavItem(1, Icons.map_outlined, 'TALHÕES'),
                  const SizedBox(width: 64),
                  _buildNavItem(3, Icons.public_outlined, 'COMUNIDADE'),
                  _buildNavItem(4, Icons.person_outline_rounded, 'PERFIL'),
                ],
              ),
            ),

            // Botão central flutuante verde (+) com texto REGISTRAR
            Positioned(
              top: -22,
              child: GestureDetector(
                onTap: () => navegarPrincipal(context, 2, _indiceAtualNav),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00501E),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00501E)
                                .withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'REGISTRAR',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget auxiliar para os botões clicáveis do perfil
  Widget _buildBotaoPerfil({
    required IconData icone,
    required String titulo,
    required String subtitulo,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5ECE7), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          splashColor: const Color(0xFF00501E).withValues(alpha: 0.08),
          highlightColor: const Color(0xFF00501E).withValues(alpha: 0.04),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE2ECE4),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icone, color: const Color(0xFF00501E), size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        titulo,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitulo,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF5A7363),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF5A7363),
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Widget auxiliar para os itens da barra inferior
  Widget _buildNavItem(int index, IconData icon, String label) {
    final bool isSelected = _indiceAtualNav == index;
    return GestureDetector(
      onTap: () => navegarPrincipal(context, index, 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: isSelected
                ? const Color(0xFF00501E)
                : const Color(0xFF5A7363),
            size: 22,
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected
                  ? const Color(0xFF00501E)
                  : const Color(0xFF5A7363),
            ),
          ),
          if (isSelected) ...[
            const SizedBox(height: 3),
            Container(
              width: 28,
              height: 2.5,
              decoration: BoxDecoration(
                color: const Color(0xFF00501E),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

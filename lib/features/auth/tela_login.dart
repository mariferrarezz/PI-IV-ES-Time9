import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'destino_autenticado.dart';
import 'tela_cadastro_nome.dart';
import 'tela_recuperar_senha.dart';
import 'cadastro_dados.dart';
import '../../services/api_sentinela.dart';

class TelaLogin extends StatefulWidget {
  const TelaLogin({super.key, this.autenticar, this.carregarPerfil});
  final Future<void> Function(String email, String senha)? autenticar;
  final Future<dynamic> Function()? carregarPerfil;

  @override
  State<TelaLogin> createState() => _TelaLoginState();
}

class _TelaLoginState extends State<TelaLogin> {
  // Controladores simples para os campos
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _senhaController = TextEditingController();

  // Estado visual do campo de senha (ocultar/mostrar)
  bool _ocultarSenha = true;
  bool _entrando = false;
  bool _autenticado = false;

  Future<void> _entrar() async {
    if (_entrando) return;
    setState(() => _entrando = true);
    try {
      if (!_autenticado) {
        if (widget.autenticar != null) {
          await widget.autenticar!(_emailController.text.trim(), _senhaController.text);
        } else {
          await FirebaseAuth.instance.signInWithEmailAndPassword(
            email: _emailController.text.trim(), password: _senhaController.text,
          );
        }
        _autenticado = true;
      }
      final perfil = widget.carregarPerfil != null ? await widget.carregarPerfil!() : await ApiSentinela().request('GET', '/auth/me');
      if (!mounted) return;
      abrirDestinoAutenticado(context, perfil);
    } on ApiException catch (erro) {
      if (!mounted) return;
      if (erro.codigo == 'PERFIL_NAO_ENCONTRADO') {
        final dados = CadastroDados()
          ..email = _emailController.text.trim()
          ..senha = _senhaController.text
          ..emailCriado = _emailController.text.trim()
          ..senhaCriada = _senhaController.text
          ..uidCriado = FirebaseAuth.instance.currentUser?.uid;
        Navigator.push(context, MaterialPageRoute(builder: (_) => TelaCadastroNome(dadosInicial: dados)));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(erro.mensagem)));
      }
    } on FirebaseAuthException catch (erro) {
      if (!mounted) return;
      final mensagem = switch (erro.code) {
        'invalid-email' => 'Informe um e-mail válido.',
        'network-request-failed' => 'Não foi possível acessar o Firebase. Verifique a conexão.',
        'too-many-requests' => 'Muitas tentativas. Tente novamente mais tarde.',
        'user-disabled' => 'Esta conta foi desativada.',
        _ => 'Não foi possível entrar. Confira o e-mail e a senha.',
      };
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(mensagem)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Serviço de autenticação indisponível.')),
      );
    } finally {
      if (mounted) setState(() => _entrando = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _senhaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: 24.0,
              vertical: 16.0,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 1. HEADER: LOGO E TÍTULO SENTINELA
                Column(
                  children: [
                    Image.asset(
                      'assets/images/logoSentinela.png',
                      height: 250, // Ajuste a altura conforme desejar
                      width: 300, // Ajuste a largura conforme desejar
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
                const SizedBox(height: 32.0),

                // 2. CARD PRINCIPAL CINZA ARREDONDADO
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24.0,
                    vertical: 32.0,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F4F3),
                    borderRadius: BorderRadius.circular(32.0),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Título e Subtítulo
                      const Text(
                        'Bem-vindo de volta',
                        style: TextStyle(
                          fontSize: 22.0,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF00501E),
                        ),
                      ),
                      const SizedBox(height: 8.0),
                      const Text(
                        'Acesse sua conta para gerenciar suas plantações.',
                        style: TextStyle(
                          fontSize: 13.0,
                          color: Color(0xFF66806E),
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 24.0),

                      // Campo E-mail
                      const Text(
                        'E-mail:',
                        style: TextStyle(
                          fontSize: 14.0,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1B5E20),
                        ),
                      ),
                      const SizedBox(height: 8.0),
                      TextField(
                        controller: _emailController,
                        onChanged: (_) { if (_autenticado) setState(() => _autenticado = false); },
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          hintText: 'joao@gmail.com',
                          hintStyle: TextStyle(
                            color: const Color(
                              0xFF66806E,
                            ).withValues(alpha: 0.5),
                            fontSize: 14.0,
                          ),
                          filled: true,
                          fillColor: Colors.white,
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
                      const SizedBox(height: 16.0),

                      // Campo Senha
                      const Text(
                        'Senha:',
                        style: TextStyle(
                          fontSize: 14.0,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1B5E20),
                        ),
                      ),
                      const SizedBox(height: 8.0),
                      TextField(
                        controller: _senhaController,
                        onChanged: (_) { if (_autenticado) setState(() => _autenticado = false); },
                        obscureText: _ocultarSenha,
                        decoration: InputDecoration(
                          hintText: '********',
                          hintStyle: TextStyle(
                            color: const Color(
                              0xFF66806E,
                            ).withValues(alpha: 0.5),
                            fontSize: 14.0,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 20.0,
                            vertical: 14.0,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _ocultarSenha
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: const Color(0xFF1B5E20),
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _ocultarSenha = !_ocultarSenha;
                              });
                            },
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(30.0),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),

                      // Link: Esqueci minha senha
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TelaRecuperarSenha())),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Padding(
                            padding: EdgeInsets.only(top: 8.0),
                            child: Text(
                              'Esqueci minha senha',
                              style: TextStyle(
                                fontSize: 11.0,
                                color: Color(0xFF1B5E20),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24.0),

                      // Botão ENTRAR
                      SizedBox(
                        width: double.infinity,
                        height: 52.0,
                        child: ElevatedButton(
                          onPressed: _entrando ? null : _entrar,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00501E),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30.0),
                            ),
                          ),
                          child: Text(
                            _entrando ? 'ENTRANDO...' : (_autenticado ? 'TENTAR NOVAMENTE' : 'ENTRAR'),
                            style: TextStyle(
                              fontSize: 16.0,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.1,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20.0),

                      // Texto do rodapé do Card: Criar conta
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Não possui uma conta? ',
                            style: TextStyle(
                              fontSize: 12.0,
                              color: Color(0xFF66806E),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TelaCadastroNome())),
                            child: const Text(
                              'Criar conta',
                              style: TextStyle(
                                fontSize: 12.0,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00501E),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32.0),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

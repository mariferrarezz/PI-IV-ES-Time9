import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'destino_autenticado.dart';
import 'cadastro_dados.dart';
import 'cadastro_recuperacao.dart';
import 'regras_senha.dart';
import 'tela_cadastro_cpf.dart';
import 'tela_cadastro_telefone.dart';

void main() {
  runApp(const MeuApp());
}

class MeuApp extends StatelessWidget {
  const MeuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: TelaCadastroTermos(dados: CadastroDados()),
    );
  }
}

class TelaCadastroTermos extends StatefulWidget {
  const TelaCadastroTermos({super.key, required this.dados, this.concluirCadastro});
  final CadastroDados dados;
  final Future<dynamic> Function(CadastroDados dados)? concluirCadastro;

  @override
  State<TelaCadastroTermos> createState() => _TelaCadastroTermosState();
}

class _TelaCadastroTermosState extends State<TelaCadastroTermos> {
  final _scrollTermos = ScrollController();
  final int _passoAtual = 8;
  final int _totalPassos = 8;

  // Variável para controlar se o usuário marcou o checkbox dos termos
  bool _termosAceitos = false;
  bool _enviando = false;

  @override
  void dispose() {
    _scrollTermos.dispose();
    super.dispose();
  }

  // Função para avançar o passo ao clicar no botão
  Future<void> avancarPasso() async {
    if (!_termosAceitos) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Você precisa ler e aceitar os termos para continuar.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_enviando) return;
    if (criteriosFaltantesSenha(widget.dados.senha).isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Volte à etapa de senha e atenda aos critérios informados.')));
      return;
    }
    setState(() => _enviando = true);
    try {
      final dados = widget.dados;
      final dynamic perfil;
      if (widget.concluirCadastro != null) {
        perfil = await widget.concluirCadastro!(dados);
      } else {
        final auth = FirebaseAuth.instance;
        final verificarPerfil = dados.uidCriado != null;
        await prepararCredencialCadastro(
          dados: dados,
          usuarioAtual: auth.currentUser?.uid,
          criar: (email, senha) async => (await auth.createUserWithEmailAndPassword(email: email, password: senha)).user!.uid,
          entrar: (email, senha) async => (await auth.signInWithEmailAndPassword(email: email, password: senha)).user!.uid,
          atualizarSenha: (senha) => auth.currentUser!.updatePassword(senha),
        );
        await recuperarPerfilOuCadastrar(
          verificarExistente: verificarPerfil,
          consultar: () => ApiSentinela().request('GET', '/auth/me'),
          cadastrar: () => ApiSentinela().request('POST', '/auth/cadastro', body: {
            'nomeCompleto': dados.nome, 'cpf': dados.cpf, 'telefone': dados.telefone,
            'canalCodigoPreferido': dados.canal, 'aceitouTermos': true,
          }),
        );
        perfil = await ApiSentinela().request('GET', '/auth/me');
      }
      if (!mounted) return;
      questionarioConcluido(perfil);
      dados.senha = '';
      dados.senhaCriada = null;
      abrirDestinoAutenticado(context, perfil);
    } on ApiException catch (e) {
      if (mounted && (e.codigo == 'CPF_JA_CADASTRADO' || e.codigo == 'TELEFONE_JA_CADASTRADO')) {
        Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => e.codigo == 'CPF_JA_CADASTRADO'
          ? TelaCadastroCpf(dados: widget.dados, erroInicial: e.mensagem)
          : TelaCadastroTelefone(dados: widget.dados, erroInicial: e.mensagem)), (_) => false);
        return;
      }
      if (e.codigo == 'PERFIL_JA_EXISTE' && widget.dados.uidCriado == FirebaseAuth.instance.currentUser?.uid) {
        try {
          final perfil = await ApiSentinela().request('GET', '/auth/me');
          if (!mounted) return;
          questionarioConcluido(perfil);
          widget.dados.senha = '';
          widget.dados.senhaCriada = null;
          abrirDestinoAutenticado(context, perfil);
          return;
        } on ApiException {
          // A resposta de conflito não comprova, sozinha, a leitura do perfil.
        }
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(duration: const Duration(seconds: 10), content: Text('${e.mensagem}\nUse Voltar para corrigir os dados e tente novamente.')));
      }
    } on SenhaInvalida {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Volte à etapa de senha e atenda aos critérios informados.')));
    } on StateError {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('A credencial já foi criada. Use o e-mail original para concluir o cadastro.')));
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(switch (e.code) {
        'email-already-in-use' => 'Este e-mail já possui conta no Firebase.',
        'invalid-email' => 'Informe um e-mail válido.',
        'weak-password' => 'A senha não atende aos requisitos do Firebase.',
        'email-cadastro-alterado' => 'A credencial já foi criada com o e-mail anterior. Volte e restaure esse e-mail para concluir o perfil.',
        _ => 'Não foi possível criar a credencial no Firebase. Tente novamente.',
      })));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
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
                  height: 140,
                  width: 200,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return const Text(
                      '🌱 Sentinela',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12.0),

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

              // TEXTO 8/8 ALINHADO EMBAIXO À DIREITA DA BARRA
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

              // 3. CAIXA CINZA EXTERNA ARREDONDADA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F4F3), // Tom cinza ajustado
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Ícone de Escudo circular com sombra
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
                        Icons.shield_outlined,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text(
                      'Termos e privacidade',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00501E),
                      ),
                    ),
                    const SizedBox(height: 6),

                    const Text(
                      'Leia o documento até o final para liberar o aceite.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF66806E),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // CAIXA INTERNA BRANCA COM OS TERMOS DE USO - SENTINELA
                    Container(
                      height: 180,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 236, 236, 236),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFD3E4D5)),
                      ),
                      child: Scrollbar(
                        controller: _scrollTermos,
                        thumbVisibility: true,
                        child: SingleChildScrollView(
                          controller: _scrollTermos,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Termos de uso - Sentinela',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF00501E),
                                  fontSize: 13,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                '1. Aceite dos Termos\n'
                                'Ao criar uma conta ou utilizar as funcionalidades do Sentinela, o usuário declara ter lido, compreendido e aceito integralmente estes Termos de Uso e a Política de Privacidade associada.\n\n'
                                '2. Descrição do Serviço\n'
                                'O Sentinela é uma ferramenta digital projetada para auxiliar no registro, mapeamento, controle e análise de dados sobre a presença de pragas em lavouras e propriedades rurais. O aplicativo atua como um sistema de suporte à decisão.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.black87,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Leitura concluída. Agora você pode aceitar os termos.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF66806E)),
                    ),
                    const SizedBox(height: 12),

                    // CHECKBOX DE ACEITE
                    Row(
                      children: [
                        Checkbox(
                          value: _termosAceitos,
                          activeColor: const Color(0xFF00501E),
                          onChanged: (bool? value) {
                            setState(() {
                              _termosAceitos = value ?? false;
                            });
                          },
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _termosAceitos = !_termosAceitos;
                              });
                            },
                            child: const Text(
                              'Li e aceito os Termos de Uso e a Política de Privacidade.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF1B5E20),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // 4. BOTÃO DE CONTINUAR / FINALIZAR
              SizedBox(
                width: double.infinity,
                height: 52.0,
                child: ElevatedButton(
                  onPressed: _enviando ? null : avancarPasso,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00501E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30.0),
                    ),
                  ),
                  child: Text(
                    _enviando ? 'ENVIANDO...' : (_passoAtual == _totalPassos ? 'FINALIZAR' : 'CONTINUAR'),
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

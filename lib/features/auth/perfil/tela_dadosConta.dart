import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sentinela/services/api_sentinela.dart';
import 'package:sentinela/services/mascaras_documentos.dart';

class TelaDadosConta extends StatefulWidget {
  const TelaDadosConta({super.key});

  @override
  State<TelaDadosConta> createState() => _TelaDadosContaState();
}

class _TelaDadosContaState extends State<TelaDadosConta> {
  final _nomeController = TextEditingController();
  final _telefoneController = TextEditingController();
  final _cpfController = TextEditingController();
  final _api = ApiSentinela();
  bool _carregando = true, _salvando = false, _enviandoLink = false;
  String? _erro;
  String? _erroCpf, _erroTelefone;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final perfil = await _api.request('GET', '/auth/me') as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _nomeController.text = perfil['nomeCompleto'] as String;
        _cpfController.text = const MascaraDocumento.cpf().formatar(perfil['cpf'] as String);
        _telefoneController.text = const MascaraDocumento.telefone().formatar(perfil['telefone'] as String);
        _carregando = false;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() { _erro = e.mensagem; _carregando = false; });
    }
  }

  Future<void> _salvar() async {
    if (_salvando || _carregando) return;
    final cpf = apenasDigitos(_cpfController.text);
    final telefone = apenasDigitos(_telefoneController.text);
    setState(() { _erroCpf = cpf.length == 11 ? null : 'Informe um CPF com 11 dígitos'; _erroTelefone = telefone.length == 11 ? null : 'Informe os 11 dígitos do celular com DDD.'; });
    if (_erroCpf != null || _erroTelefone != null) return;
    setState(() { _salvando = true; _erro = null; });
    try {
      await _api.request('PATCH', '/auth/dados-conta', body: {
        'nomeCompleto': _nomeController.text,
        'cpf': cpf,
        'telefone': telefone,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dados da conta salvos.')));
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          if (e.codigo == 'CPF_JA_CADASTRADO') { _erroCpf = e.mensagem; }
          else if (e.codigo == 'TELEFONE_JA_CADASTRADO') { _erroTelefone = e.mensagem; }
          else { _erro = e.mensagem; }
        });
      }
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  Future<void> _enviarLink() async {
    final email = FirebaseAuth.instance.currentUser?.email;
    if (email == null || _enviandoLink) return;
    setState(() => _enviandoLink = true);
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Solicitação de redefinição enviada ao Firebase.')));
    } on FirebaseAuthException catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Não foi possível solicitar o link. Tente novamente.')));
    } finally {
      if (mounted) setState(() => _enviandoLink = false);
    }
  }

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
    _cpfController.dispose();
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

              if (_carregando) const Center(child: CircularProgressIndicator()),
              if (_erro != null) ...[
                SelectableText(_erro!, style: const TextStyle(color: Colors.red)),
                if (_nomeController.text.isEmpty && !_carregando)
                  TextButton(onPressed: _carregar, child: const Text('Tentar novamente')),
                const SizedBox(height: 12),
              ],
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
                child: Text(
                  FirebaseAuth.instance.currentUser?.email ?? '',
                  style: const TextStyle(fontSize: 15, color: Color(0xFF5A7363)),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'É com ele que você entra no app. Não dá para trocar por aqui.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF5A7363)),
              ),
              const SizedBox(height: 20),

              const Text('CPF *', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF00501E))),
              const SizedBox(height: 8),
              TextField(controller: _cpfController, keyboardType: TextInputType.number,
                inputFormatters: [const MascaraDocumento.cpf()],
                onChanged: (_) { if (_erroCpf != null) setState(() => _erroCpf = null); },
                decoration: InputDecoration(filled: true, fillColor: Colors.white,
                  errorText: _erroCpf,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)))),
              const SizedBox(height: 20),
              // 5. CAMPO TELEFONE
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
                      text: '*',
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
                inputFormatters: [const MascaraDocumento.telefone()],
                onChanged: (_) { if (_erroTelefone != null) setState(() => _erroTelefone = null); },
                style: const TextStyle(fontSize: 15, color: Color(0xFF1A2E22)),
                decoration: InputDecoration(
                  errorText: _erroTelefone,
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
                        onPressed: _enviandoLink ? null : _enviarLink,
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
                  onPressed: _carregando || _salvando || _nomeController.text.isEmpty && _erro != null ? null : _salvar,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF134E1E),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: Text(
                    _salvando ? 'Salvando...' : 'Salvar alterações',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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

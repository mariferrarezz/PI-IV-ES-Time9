import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/features/propriedades/tela_questionario1.dart';
import 'package:sentinela/services/api_sentinela.dart';

/// O contrato de GET /auth/me usa null para questionário não respondido.
bool questionarioConcluido(dynamic perfil) {
  if (perfil is! Map || !perfil.containsKey('questionario')) {
    throw const ApiException('A API retornou um perfil sem o estado do questionário.');
  }
  final questionario = perfil['questionario'];
  if (questionario == null) return false;
  if (questionario is! Map) throw const ApiException('A API retornou um questionário inválido.');
  final conclusao = questionario['concluidoEm'];
  if (conclusao == null) return false;
  if (conclusao is String && DateTime.tryParse(conclusao) != null) return true;
  throw const ApiException('A API retornou uma data de conclusão inválida.');
}

void abrirDestinoAutenticado(BuildContext context, dynamic perfil) {
  final concluido = questionarioConcluido(perfil);
  Navigator.of(context).pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => concluido ? const TelaHome() : const TelaQuestionario1()),
    (_) => false,
  );
}

/// Consulta o perfil antes de apresentar conteúdo que depende do onboarding.
class GuardiaoQuestionario extends StatefulWidget {
  const GuardiaoQuestionario({super.key, required this.child, this.consultar});
  final Widget child;
  final Future<dynamic> Function()? consultar;

  @override
  State<GuardiaoQuestionario> createState() => _GuardiaoQuestionarioState();
}

class ConsultaPerfilScope extends InheritedWidget {
  const ConsultaPerfilScope({super.key, required this.consultar, required super.child});
  final Future<dynamic> Function() consultar;
  @override
  bool updateShouldNotify(ConsultaPerfilScope oldWidget) => consultar != oldWidget.consultar;
}

class _GuardiaoQuestionarioState extends State<GuardiaoQuestionario> {
  bool _carregando = true;
  String? _erro;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_iniciado) { _iniciado = true; _verificar(); }
  }
  bool _iniciado = false;

  Future<void> _verificar() async {
    setState(() { _carregando = true; _erro = null; });
    try {
      final consultar = widget.consultar ?? context.dependOnInheritedWidgetOfExactType<ConsultaPerfilScope>()?.consultar;
      final perfil = await (consultar?.call() ?? ApiSentinela().request('GET', '/auth/me'));
      if (!mounted) return;
      if (questionarioConcluido(perfil)) {
        abrirDestinoAutenticado(context, perfil);
      } else {
        setState(() => _carregando = false);
      }
    } catch (_) {
      if (mounted) setState(() { _carregando = false; _erro = 'Não foi possível consultar o perfil.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_carregando) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_erro != null) {
      return Scaffold(body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(_erro!), TextButton(onPressed: _verificar, child: const Text('Tentar novamente')),
      ])));
    }
    return widget.child;
  }
}

class RestaurarDestinoAutenticado extends StatefulWidget {
  const RestaurarDestinoAutenticado({super.key, this.consultar});
  final Future<dynamic> Function()? consultar;
  @override
  State<RestaurarDestinoAutenticado> createState() => _RestaurarDestinoAutenticadoState();
}

class _RestaurarDestinoAutenticadoState extends State<RestaurarDestinoAutenticado> {
  String? _erro;
  bool _perfilAusente = false;
  @override
  void initState() { super.initState(); _consultar(); }
  Future<void> _consultar() async {
    setState(() { _erro = null; _perfilAusente = false; });
    try {
      final perfil = await (widget.consultar?.call() ?? ApiSentinela().request('GET', '/auth/me'));
      if (mounted) abrirDestinoAutenticado(context, perfil);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() { _perfilAusente = e.codigo == 'PERFIL_NAO_ENCONTRADO'; _erro = _perfilAusente
            ? 'Perfil ainda não cadastrado. Entre novamente para concluir seu cadastro.' : e.mensagem; });
      }
    } catch (_) {
      if (mounted) setState(() => _erro = 'Não foi possível consultar o perfil.');
    }
  }
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: _erro == null
      ? const CircularProgressIndicator()
      : Column(mainAxisSize: MainAxisSize.min, children: [Text(_erro!), TextButton(onPressed: _consultar, child: const Text('Tentar novamente')),
          if (_perfilAusente) TextButton(onPressed: () => FirebaseAuth.instance.signOut(), child: const Text('Voltar ao login'))])));
}

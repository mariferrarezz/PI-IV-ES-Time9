import 'package:flutter/material.dart';
import 'features/dashboard/home/tela_home.dart';
import 'features/propriedades/tela_talhoes.dart';
import 'features/ocorrencias/tela_registrarOcorrencia.dart';
import 'features/ocorrencias/tela_comunidade.dart';
import 'features/auth/perfil/tela_perfil.dart';

final RouteObserver<ModalRoute<dynamic>> observadorRotasPrincipais = RouteObserver<ModalRoute<dynamic>>();

void navegarPrincipal(BuildContext context, int destino, int atual) {
  if (destino == atual) return;
  final navigator = Navigator.of(context);
  if (destino == 0) {
    navigator.popUntil((route) => route.isFirst);
    return;
  }
  final Widget tela = switch (destino) {
    1 => const TelaTalhoes(),
    2 => const TelaRegistrarOcorrencia(),
    3 => const TelaComunidade(),
    4 => const TelaPerfil(),
    _ => const TelaHome(),
  };
  navigator.pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => tela), (route) => route.isFirst,
  );
}

import 'package:flutter/material.dart';

import 'acaro_rajado.dart';
import 'alternariose_queima_das_folhas.dart';
import 'antracnose.dart';
import 'bicho_mineiro.dart';
import 'broca_da_cana.dart';
import 'broca_do_cafe.dart';
import 'cercosporiose_do_cafe.dart';
import 'cochonilha.dart';
import 'ferrugem_asiatica_da_soja.dart';
import 'ferrugem_do_cafeeiro.dart';
import 'formigas_cortadeiras.dart';
import 'greening_hlb.dart';
import 'helicoverpa.dart';
import 'lagarta_da_soja.dart';
import 'lagarta_do_cartucho.dart';
import 'lagarta_rosca.dart';
import 'mancha_alvo.dart';
import 'mancha_angular_do_feijoeiro.dart';
import 'mancha_bacteriana.dart';
import 'mancha_branca_do_milho.dart';
import 'mildio.dart';
import 'mofo_branco.dart';
import 'mosaico_comum_do_feijoeiro.dart';
import 'mosca_branca.dart';
import 'mosca_das_frutas.dart';
import 'mosca_minadora.dart';
import 'murcha_bacteriana.dart';
import 'murcha_de_fusario.dart';
import 'nematoide_das_galhas.dart';
import 'oidio.dart';
import 'percevejo_marrom.dart';
import 'pinta_preta.dart';
import 'podridao_negra_das_cruciferas.dart';
import 'pulgao.dart';
import 'requeima.dart';
import 'sigatoka_negra.dart';
import 'traca_das_cruciferas.dart';
import 'traca_do_tomateiro.dart';
import 'tripes.dart';
import 'vaquinha.dart';

// Liga o título de cada praga ou doença à sua ficha no catálogo.
// Usado pela home ("Conheça e previna") e pela lista do catálogo.
final Map<String, Widget Function()> fichasCatalogo = {
  'Ferrugem asiática da soja': () => const CatalogoFerrugemAsiaticaDaSoja(),
  'Lagarta-do-cartucho': () => const CatalogoLagartaDoCartucho(),
  'Oídio': () => const CatalogoOidio(),
  'Mosca-branca': () => const CatalogoMoscaBranca(),
  'Mancha-alvo': () => const CatalogoManchaAlvo(),
  'Percevejo-marrom': () => const CatalogoPercevejoMarrom(),
  'Lagarta-da-soja': () => const CatalogoLagartaDaSoja(),
  'Helicoverpa': () => const CatalogoHelicoverpa(),
  'Broca-do-café': () => const CatalogoBrocaDoCafe(),
  'Bicho-mineiro': () => const CatalogoBichoMineiro(),
  'Broca-da-cana': () => const CatalogoBrocaDaCana(),
  'Pulgão': () => const CatalogoPulgao(),
  'Ácaro-rajado': () => const CatalogoAcaroRajado(),
  'Tripes': () => const CatalogoTripes(),
  'Traça-do-tomateiro': () => const CatalogoTracaDoTomateiro(),
  'Vaquinha': () => const CatalogoVaquinha(),
  'Lagarta-rosca': () => const CatalogoLagartaRosca(),
  'Formigas-cortadeiras': () => const CatalogoFormigasCortadeiras(),
  'Mosca-das-frutas': () => const CatalogoMoscaDasFrutas(),
  'Cochonilha': () => const CatalogoCochonilha(),
  'Traça-das-crucíferas': () => const CatalogoTracaDasCruciferas(),
  'Mosca-minadora': () => const CatalogoMoscaMinadora(),
  'Nematoide-das-galhas': () => const CatalogoNematoideDasGalhas(),
  'Antracnose': () => const CatalogoAntracnose(),
  'Mofo-branco': () => const CatalogoMofoBranco(),
  'Requeima': () => const CatalogoRequeima(),
  'Pinta-preta': () => const CatalogoPintaPreta(),
  'Ferrugem-do-cafeeiro': () => const CatalogoFerrugemDoCafeeiro(),
  'Cercosporiose do café': () => const CatalogoCercosporioseDoCafe(),
  'Mancha-branca do milho': () => const CatalogoManchaBrancaDoMilho(),
  'Míldio': () => const CatalogoMildio(),
  'Murcha-bacteriana': () => const CatalogoMurchaBacteriana(),
  'Mosaico-comum do feijoeiro': () => const CatalogoMosaicoComumDoFeijoeiro(),
  'Mancha-angular do feijoeiro': () => const CatalogoManchaAngularDoFeijoeiro(),
  'Murcha-de-fusário': () => const CatalogoMurchaDeFusario(),
  'Sigatoka-negra': () => const CatalogoSigatokaNegra(),
  'Greening / HLB': () => const CatalogoGreeningHlb(),
  'Podridão-negra das crucíferas': () => const CatalogoPodridaoNegraDasCruciferas(),
  'Mancha-bacteriana': () => const CatalogoManchaBacteriana(),
  'Alternariose / queima-das-folhas': () => const CatalogoAlternarioseQueimaDasFolhas(),
};

// Abre a ficha do catálogo pelo título. Sem ficha cadastrada, não faz nada.
void abrirFichaCatalogo(BuildContext context, String titulo) {
  final ficha = fichasCatalogo[titulo];
  if (ficha == null) return;
  Navigator.push(context, MaterialPageRoute(builder: (_) => ficha()));
}

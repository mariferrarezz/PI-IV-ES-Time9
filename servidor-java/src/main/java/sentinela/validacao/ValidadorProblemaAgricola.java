package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

public class ValidadorProblemaAgricola {
    public static List<String> validarProblemaAgricola(CamposProblemaAgricola c, Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        if (c == null) { erros.add("Os campos do problema agrícola são obrigatórios."); return erros; }
        texto(erros, c.nomeComum, "nomeComum", 200, true);
        texto(erros, c.nomeCientifico, "nomeCientifico", 200, false);
        if (!Arrays.asList("praga", "doenca", "deficiencia").contains(c.tipo))
            erros.add("tipo deve ser praga, doenca ou deficiencia.");
        texto(erros, c.descricao, "descricao", 5000, true);
        listaTexto(erros, c.culturasAfetadasIds, "culturasAfetadasIds", 1, 100, 0, true, true);
        listaTexto(erros, c.fontesIds, "fontesIds", 1, 100, 0, true, true);
        listaTexto(erros, c.sintomas, "sintomas", 1, 50, 1000, true, false);
        listaTexto(erros, c.medidasPreventivas, "medidasPreventivas", 1, 50, 1000, true, false);
        listaTexto(erros, c.partesAfetadas, "partesAfetadas", 0, 30, 1000, false, false);
        listaTexto(erros, c.condicoesFavoraveis, "condicoesFavoraveis", 0, 50, 1000, false, false);
        listaTexto(erros, c.chips, "chips", 0, 4, 150, false, false);
        listaTexto(erros, c.danos, "danos", 1, 50, 1000, false, false);
        listaTexto(erros, c.boasPraticas, "boasPraticas", 1, 30, 1000, false, false);
        texto(erros, c.informacoesDisseminacao, "informacoesDisseminacao", 5000, false);
        texto(erros, c.orientacaoBuscaAgronomo, "orientacaoBuscaAgronomo", 5000, false);
        texto(erros, c.codigoEditorial, "codigoEditorial", 100, false);
        texto(erros, c.ondeOlhar, "ondeOlhar", 5000, false);
        texto(erros, c.dicaDeCampo, "dicaDeCampo", 5000, false);
        texto(erros, c.perdaEstimada, "perdaEstimada", 5000, false);
        texto(erros, c.epocaPropicia, "epocaPropicia", 5000, false);
        texto(erros, c.abrangenciaCulturas, "abrangenciaCulturas", 1000, false);
        texto(erros, c.tratamentoIntro, "tratamentoIntro", 5000, false);
        if (c.niveisAtencao != null) {
            texto(erros, c.niveisAtencao.baixo, "niveisAtencao.baixo", 1000, true);
            texto(erros, c.niveisAtencao.medio, "niveisAtencao.medio", 1000, true);
            texto(erros, c.niveisAtencao.alto, "niveisAtencao.alto", 1000, true);
        }
        controles(erros, c.formasControle);
        erros.addAll(ValidadorImagens.validar(c.imagens, "O problema agrícola deve ter no máximo 5 imagens."));
        revisao(erros, c, instanteReferencia);
        return erros;
    }

    private static void controles(List<String> erros, List<CamposProblemaAgricola.FormaControle> controles) {
        if (controles == null) { erros.add("formasControle é obrigatório."); return; }
        if (controles.isEmpty() || controles.size() > 30) erros.add("formasControle deve ter de 1 a 30 itens.");
        for (int i = 0; i < controles.size(); i++) {
            CamposProblemaAgricola.FormaControle f = controles.get(i);
            String campo = "formasControle[" + i + "]";
            if (f == null) { erros.add(campo + " é obrigatório."); continue; }
            if (!Arrays.asList("manual", "cultural", "biologica", "quimica", "outra").contains(f.tipo))
                erros.add(campo + ".tipo deve ser manual, cultural, biologica, quimica ou outra.");
            texto(erros, f.descricao, campo + ".descricao", 5000, true);
            texto(erros, f.observacoes, campo + ".observacoes", 5000, false);
            texto(erros, f.classe, campo + ".classe", 200, false);
            listaTexto(erros, f.exemplosControle, campo + ".exemplosControle", 0, 30, 200, false, false);
        }
    }

    private static void revisao(List<String> erros, CamposProblemaAgricola c, Instant ref) {
        if (c.ativo == null) erros.add("ativo é obrigatório.");
        if (ref == null) erros.add("O instante de referência é obrigatório.");
        if (c.revisadoEm != null && ref != null && c.revisadoEm.isAfter(ref)) erros.add("A data de revisão não pode ser futura.");
        if (c.revisaoEditorial == null) {
            if (c.revisadoEm == null) erros.add("revisadoEm é obrigatório no documento sem revisão editorial.");
            return;
        }
        CamposProblemaAgricola.RevisaoEditorial r = c.revisaoEditorial;
        if (!Arrays.asList("pendente", "aprovada").contains(r.status)) erros.add("revisaoEditorial.status deve ser pendente ou aprovada.");
        texto(erros, r.observacoes, "revisaoEditorial.observacoes", 5000, false);
        if ("pendente".equals(r.status) && !Boolean.FALSE.equals(c.ativo)) erros.add("Revisão pendente exige ativo false.");
        if ("aprovada".equals(r.status) && c.revisadoEm == null) erros.add("Revisão aprovada exige revisadoEm.");
        // Flags e aprovação estrutural não comprovam revisão humana ou Agrofit.
    }

    private static void texto(List<String> erros, String valor, String campo, int maximo, boolean obrigatorio) {
        if (valor == null && !obrigatorio) return;
        if (valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*")) erros.add(campo + ": preenchimento obrigatório.");
        else if (valor.codePointCount(0, valor.length()) > maximo) erros.add(campo + ": máximo de " + maximo + " caracteres.");
    }

    private static void listaTexto(List<String> erros, List<String> lista, String campo, int minimo, int maximo,
            int tamanhoTexto, boolean obrigatoria, boolean unica) {
        if (lista == null) { if (obrigatoria) erros.add(campo + " é obrigatório."); return; }
        if (lista.size() < minimo || lista.size() > maximo) erros.add(campo + " deve ter de " + minimo + " a " + maximo + " itens.");
        if (unica && new HashSet<>(lista).size() != lista.size()) erros.add(campo + " não pode conter repetições.");
        // IDs chegam canonicalizados pelo Node, sem limite textual ou consulta inventados.
        if (tamanhoTexto > 0) for (int i = 0; i < lista.size(); i++) texto(erros, lista.get(i), campo + "[" + i + "]", tamanhoTexto, true);
    }
}

package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

public class ValidadorQuestionario {
    public static List<String> validarQuestionario(String versao, String portePropriedade,
            String quantidadeCulturas, List<String> culturasIds, String outraCultura,
            List<String> problemasFrequentes, String frequenciaProblemas,
            String identificaProblemasSozinho, Instant concluidoEm) {
        List<String> erros = new ArrayList<>();
        texto(erros, versao, "A versão", 30);
        if (!Arrays.asList("pequena", "media", "grande").contains(portePropriedade))
            erros.add("O porte da propriedade deve ser pequena, media ou grande.");
        if (!Arrays.asList("1", "2", "3", "4_ou_mais").contains(quantidadeCulturas))
            erros.add("A quantidade de culturas deve ser 1, 2, 3 ou 4_ou_mais.");
        if (culturasIds == null) erros.add("A lista de culturas é obrigatória.");
        else {
            if (culturasIds.size() > 50) erros.add("A lista deve ter no máximo 50 culturas.");
            if (new HashSet<>(culturasIds).size() != culturasIds.size()) erros.add("As culturas não podem se repetir.");
        }
        if (outraCultura != null) texto(erros, outraCultura, "A outra cultura", 150);
        boolean outraValida = !vazio(outraCultura) && outraCultura.codePointCount(0, outraCultura.length()) <= 150;
        if ((culturasIds == null || culturasIds.isEmpty()) && !outraValida)
            erros.add("Selecione ao menos uma cultura ou informe outra cultura válida.");
        if (problemasFrequentes == null) erros.add("A lista de problemas frequentes é obrigatória.");
        else {
            if (problemasFrequentes.size() < 1 || problemasFrequentes.size() > 2)
                erros.add("Informe de 1 a 2 problemas frequentes.");
            if (new HashSet<>(problemasFrequentes).size() != problemasFrequentes.size())
                erros.add("Os problemas frequentes não podem se repetir.");
            if (problemasFrequentes.stream().anyMatch(p -> !Arrays.asList("pragas", "doencas", "nao_identificado").contains(p)))
                erros.add("Os problemas devem ser pragas, doencas ou nao_identificado.");
            if (problemasFrequentes.contains("nao_identificado") && problemasFrequentes.size() != 1)
                erros.add("O problema nao_identificado deve ser selecionado sozinho.");
        }
        if (!Arrays.asList("raramente", "as_vezes", "frequentemente", "sempre").contains(frequenciaProblemas))
            erros.add("A frequência deve ser raramente, as_vezes, frequentemente ou sempre.");
        if (!Arrays.asList("sim", "nao", "as_vezes").contains(identificaProblemasSozinho))
            erros.add("A identificação de problemas sozinho deve ser sim, nao ou as_vezes.");
        if (concluidoEm == null) erros.add("A data de conclusão é obrigatória.");
        // IDs são canonicalizados pelo Node; nenhuma consulta ou transformação aqui.
        return erros;
    }

    private static boolean vazio(String valor) { return valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*"); }
    private static void texto(List<String> erros, String valor, String campo, int limite) {
        if (vazio(valor)) erros.add(campo + ": preenchimento obrigatório.");
        else if (valor.codePointCount(0, valor.length()) > limite)
            erros.add(campo + ": máximo de " + limite + " caracteres.");
    }
}

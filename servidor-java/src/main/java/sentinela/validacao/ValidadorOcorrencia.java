package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ValidadorOcorrencia {
    public static List<String> validarOcorrencia(String tipo, boolean problemaAgricolaPresente,
            Instant dataObservacao, String sintomas, String intensidade, Double areaAfetadaHa,
            String status, Instant encerradoEm, String motivoEncerramento,
            List<ImagemOcorrencia> imagens, Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        if (!Arrays.asList("praga", "doenca", "deficiencia", "nao_identificado").contains(tipo))
            erros.add("O tipo deve ser praga, doenca, deficiencia ou nao_identificado.");
        if (!Arrays.asList("baixa", "media", "alta").contains(intensidade))
            erros.add("A intensidade é obrigatória e deve ser baixa, media ou alta.");
        if (!Arrays.asList("aberta", "em_acompanhamento", "encerrada").contains(status))
            erros.add("O status deve ser aberta, em_acompanhamento ou encerrada.");
        texto(erros, sintomas, "Os sintomas", 5000);
        if (areaAfetadaHa != null && (!Double.isFinite(areaAfetadaHa) || areaAfetadaHa <= 0))
            erros.add("A área afetada deve ser um número finito maior que zero.");
        if (instanteReferencia == null) erros.add("O instante de referência é obrigatório.");
        if (dataObservacao == null) erros.add("A data de observação é obrigatória.");
        else if (instanteReferencia != null && dataObservacao.isAfter(instanteReferencia))
            erros.add("A data de observação não pode ser futura.");
        if ("encerrada".equals(status)) {
            if (encerradoEm == null) erros.add("A data de encerramento é obrigatória.");
            texto(erros, motivoEncerramento, "O motivo de encerramento", 5000);
        } else if (encerradoEm != null || motivoEncerramento != null)
            erros.add("Os campos de encerramento devem estar ausentes quando a ocorrência não está encerrada.");
        // Encerramento futuro não é proibido pelas regras atuais.
        if (encerradoEm != null && dataObservacao != null && encerradoEm.isBefore(dataObservacao))
            erros.add("O encerramento não pode anteceder a observação.");
        if ("nao_identificado".equals(tipo) && problemaAgricolaPresente)
            erros.add("O tipo nao_identificado não pode ter problema agrícola vinculado.");
        erros.addAll(ValidadorImagens.validar(imagens, "A ocorrência deve ter no máximo 5 imagens."));
        return erros;
    }

    private static boolean vazio(String valor) { return valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*"); }
    private static void texto(List<String> erros, String valor, String campo, int limite) {
        if (vazio(valor)) erros.add(campo + ": preenchimento obrigatório.");
        else if (valor.codePointCount(0, valor.length()) > limite)
            erros.add(campo + ": máximo de " + limite + " caracteres.");
    }
}

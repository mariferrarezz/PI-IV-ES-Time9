package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ValidadorMonitoramento {
    public static List<String> validarMonitoramento(boolean ocorrenciaPresente, Instant dataObservacao,
            Boolean problemaObservado, String observacoes, String intensidade, String evolucao,
            Double areaAfetadaHa, Instant proximaInspecaoEm, List<ImagemOcorrencia> imagens,
            Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        // Não atribua false ao campo ausente nem transforme textos.
        if (problemaObservado == null) erros.add("O campo problema observado é obrigatório.");
        if (observacoes == null || observacoes.matches("[\\s\\p{Z}\\uFEFF]*"))
            erros.add("As observações são obrigatórias.");
        else if (observacoes.codePointCount(0, observacoes.length()) > 5000)
            erros.add("As observações devem ter no máximo 5000 caracteres.");
        if (Boolean.TRUE.equals(problemaObservado)) {
            if (!Arrays.asList("baixa", "media", "alta").contains(intensidade))
                erros.add("A intensidade é obrigatória e deve ser baixa, media ou alta.");
        } else if (Boolean.FALSE.equals(problemaObservado)) {
            if (intensidade != null) erros.add("A intensidade deve estar ausente quando não há problema observado.");
            if (areaAfetadaHa != null) erros.add("A área afetada deve estar ausente quando não há problema observado.");
        }
        if (evolucao != null) {
            if (!Arrays.asList("melhorou", "estavel", "piorou", "nao_avaliada").contains(evolucao))
                erros.add("A evolução deve ser melhorou, estavel, piorou ou nao_avaliada.");
            else if (!ocorrenciaPresente && !evolucao.equals("nao_avaliada"))
                erros.add("Sem ocorrência vinculada, a evolução deve estar ausente ou ser nao_avaliada.");
        }
        if (areaAfetadaHa != null && (!Double.isFinite(areaAfetadaHa) || areaAfetadaHa <= 0))
            erros.add("A área afetada deve ser um número finito maior que zero.");
        if (instanteReferencia == null) erros.add("O instante de referência é obrigatório.");
        if (dataObservacao == null) erros.add("A data de observação é obrigatória.");
        else {
            if (instanteReferencia != null && dataObservacao.isAfter(instanteReferencia))
                erros.add("A data de observação não pode ser futura.");
            if (proximaInspecaoEm != null && !proximaInspecaoEm.isAfter(dataObservacao))
                erros.add("A próxima inspeção deve ser posterior à observação.");
        }
        erros.addAll(ValidadorImagens.validar(imagens, "O monitoramento deve ter no máximo 5 imagens."));
        return erros;
    }
}

package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ValidadorAvaliacaoTratamento {
    public static List<String> validarAvaliacaoTratamento(Instant dataAvaliacao, String resultado,
            String observacoes, Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        if (instanteReferencia == null) erros.add("O instante de referência é obrigatório.");
        if (dataAvaliacao == null) erros.add("A data de avaliação é obrigatória.");
        else if (instanteReferencia != null && dataAvaliacao.isAfter(instanteReferencia))
            erros.add("A data de avaliação não pode ser futura.");
        if (!Arrays.asList("melhora_observada", "sem_mudanca", "piora_observada", "inconclusivo").contains(resultado))
            erros.add("O resultado é obrigatório e deve ser melhora_observada, sem_mudanca, piora_observada ou inconclusivo.");
        // Conte pontos de código sem aparar ou normalizar o texto.
        if (observacoes == null || observacoes.matches("[\\s\\p{Z}\\uFEFF]*"))
            erros.add("As observações são obrigatórias.");
        else if (observacoes.codePointCount(0, observacoes.length()) > 5000)
            erros.add("As observações devem ter no máximo 5000 caracteres.");
        return erros;
    }
}

package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ValidadorOcorrenciaTest {
    private static int total;
    private static void conferir(int esperado, List<String> erros) {
        if (erros.size() != esperado) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        Instant agora = Instant.parse("2026-11-15T12:00:00Z");
        conferir(0, ValidadorOcorrencia.validarOcorrencia("praga", false, agora,
                "Sintomas", "alta", null, "aberta", null, null, null, agora));
        conferir(6, ValidadorOcorrencia.validarOcorrencia(null, false, null,
                null, null, null, null, null, null, null, null));
        conferir(0, ValidadorOcorrencia.validarOcorrencia("doenca", true, agora,
                "🌱".repeat(5000), "media", 0.1, "encerrada", agora.plusSeconds(1),
                "Motivo", Arrays.asList(new ImagemOcorrencia("https://example.com/foto", " id ", null, agora)), agora));
        conferir(1, ValidadorOcorrencia.validarOcorrencia("praga", false, agora,
                "Sintomas", "alta", null, "aberta", null, null,
                Arrays.asList(new ImagemOcorrencia("https://example.com/foto", "id", null, null)), agora));
        conferir(1, ValidadorOcorrencia.validarOcorrencia("praga", false, agora,
                "Sintomas", "baixa", null, "aberta", null, null, Arrays.asList((ImagemOcorrencia) null), agora));
        conferir(1, ValidadorOcorrencia.validarOcorrencia("praga", false, agora,
                "Sintomas", "alta", null, "aberta", null, null,
                Arrays.asList(new ImagemOcorrencia("https://example.com/foto", "id", " ", agora)), agora));
        System.out.println("OK: " + total + " verificações diretas de ocorrência.");
    }
}

package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ValidadorTratamentoTest {
    private static int total;
    private static void conferir(int n, List<String> erros) {
        if (erros.size() != n) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        Instant agora = Instant.parse("2026-11-16T12:00:00Z");
        conferir(0, ValidadorTratamento.validarTratamento("quimica", "Descrição", agora, null, null, null, null, null, null, null, agora));
        conferir(4, ValidadorTratamento.validarTratamento(null, null, null, null, null, null, null, null, null, null, null));
        conferir(0, ValidadorTratamento.validarTratamento("outra", "🌱".repeat(5000), agora, 0.1, "🌱".repeat(200), 1.0, "u", "🌱🌱", "🌱".repeat(5000), null, agora));
        conferir(1, ValidadorTratamento.validarTratamento("manual", "Texto", agora, null, null, 1.0, null, null, null, null, agora));
        conferir(1, ValidadorTratamento.validarTratamento("manual", "Texto", agora, null, null, null, "u", null, null, null, agora));
        conferir(8, ValidadorTratamento.validarTratamento("manual", " ", agora.plusSeconds(1), Double.NaN, "", Double.POSITIVE_INFINITY, "", "A", "", null, agora));
        conferir(1, ValidadorTratamento.validarTratamento("manual", "Texto", agora, null, null, null, null, null, null,
                Arrays.asList(new ImagemOcorrencia("https://example.com/a", "id", null, null)), agora));
        conferir(0, ValidadorTratamento.validarTratamento("manual", "Texto", agora, null, null, null, null, null, null,
                Arrays.asList(new ImagemOcorrencia("https://example.com/a", " id ", null, agora.plusSeconds(1))), agora));
        System.out.println("OK: " + total + " verificações diretas de tratamento.");
    }
}

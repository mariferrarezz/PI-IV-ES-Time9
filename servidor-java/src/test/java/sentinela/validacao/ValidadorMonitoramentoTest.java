package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ValidadorMonitoramentoTest {
    private static int total;
    private static void conferir(int esperado, List<String> erros) {
        if (erros.size() != esperado) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        Instant agora = Instant.parse("2026-11-15T12:00:00Z");
        conferir(0, ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", null, null, null, null, null, agora));
        conferir(4, ValidadorMonitoramento.validarMonitoramento(false, null, null, null, null, null, null, null, null, null));
        conferir(1, ValidadorMonitoramento.validarMonitoramento(false, agora, true, "Texto", null, null, null, null, null, agora));
        conferir(2, ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", "alta", null, 1.0, null, null, agora));
        conferir(1, ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", null, "melhorou", null, null, null, agora));
        conferir(0, ValidadorMonitoramento.validarMonitoramento(true, agora, true, "🌱".repeat(5000), "alta", "piorou", 1.0, agora.plusSeconds(1), null, agora));
        conferir(1, ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", null, null, null, agora, null, agora));
        conferir(0, ValidadorMonitoramento.validarMonitoramento(false, agora.minusSeconds(2), false, "Texto", null, null, null, agora.minusSeconds(1), null, agora));
        conferir(1, ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", null, null, null, null,
                Arrays.asList(new ImagemOcorrencia("https://example.com/a", "id", null, null)), agora));
        conferir(0, ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", null, null, null, null,
                Arrays.asList(new ImagemOcorrencia("https://example.com/a", "id", null, agora.plusSeconds(10))), agora));
        List<String> legendaVazia = ValidadorImagens.validar(Arrays.asList(
                new ImagemOcorrencia("https://example.com/a", "id", "", agora)), "Limite");
        if (!legendaVazia.equals(Arrays.asList("A legenda da imagem: preenchimento obrigatório.")))
            throw new AssertionError("Mensagem original da legenda");
        total++;
        List<ImagemOcorrencia> seis = new java.util.ArrayList<>();
        for (int i = 0; i < 6; i++) seis.add(new ImagemOcorrencia("https://example.com/a", "id" + i, null, agora));
        if (!ValidadorMonitoramento.validarMonitoramento(false, agora, false, "Texto", null, null,
                null, null, seis, agora).equals(Arrays.asList("O monitoramento deve ter no máximo 5 imagens.")))
            throw new AssertionError("Mensagem do monitoramento");
        total++;
        if (!ValidadorOcorrencia.validarOcorrencia("praga", false, agora, "Texto", "alta", null,
                "aberta", null, null, seis, agora).equals(Arrays.asList("A ocorrência deve ter no máximo 5 imagens.")))
            throw new AssertionError("Mensagem original de ocorrência");
        total++;
        System.out.println("OK: " + total + " verificações diretas de monitoramento.");
    }
}

package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import sentinela.protocolo.ProcessadorDeValidacao;

public class ValidadorAvaliacaoTratamentoTest {
    private static int total;
    private static final Instant AGORA = Instant.parse("2026-11-16T12:00:00Z");
    private static void conferir(int esperado, Instant data, String resultado, String obs, Instant ref) {
        List<String> erros = ValidadorAvaliacaoTratamento.validarAvaliacaoTratamento(data, resultado, obs, ref);
        if (erros.size() != esperado) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        conferir(4, null, null, null, null);
        conferir(3, null, "", "", AGORA);
        for (String resultado : Arrays.asList("melhora_observada", "sem_mudanca", "piora_observada", "inconclusivo"))
            conferir(0, AGORA, resultado, "á", AGORA);
        conferir(1, AGORA, "INCONCLUSIVO", "Texto", AGORA);
        conferir(0, AGORA.minusSeconds(1), "inconclusivo", "🌱".repeat(5000), AGORA);
        conferir(1, AGORA.plusNanos(1), "inconclusivo", "Texto", AGORA);
        conferir(1, AGORA, "inconclusivo", "🌱".repeat(5001), AGORA);
        conferir(0, AGORA, "inconclusivo", "a\u0301".repeat(2500), AGORA);
        for (String obs : Arrays.asList("", " ", "\t\r\n", "\uFEFF\u00A0\u2003", " ".repeat(5001)))
            conferir(1, AGORA, "inconclusivo", obs, AGORA);
        String linha = "VALIDAR_AVALIACAO_TRATAMENTO\t" + AGORA + "\tinconclusivo\tTexto\\t\\n\\\\\t" + AGORA;
        if (!ProcessadorDeValidacao.processar(linha).equals("OK")) throw new AssertionError("Escapes");
        total++;
        if (!ProcessadorDeValidacao.processar(linha + "\textra").equals("ERRO\tPedido de validação inválido."))
            throw new AssertionError("Contagem");
        total++;
        if (!ProcessadorDeValidacao.processar(linha + "\r").equals("ERRO\tPedido de validação inválido."))
            throw new AssertionError("CR real fora do codec");
        total++;
        System.out.println("OK: " + total + " verificações diretas de avaliação de tratamento.");
    }
}

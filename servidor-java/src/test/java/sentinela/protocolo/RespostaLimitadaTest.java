package sentinela.protocolo;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RespostaLimitadaTest {
    private static final String AVISO = "Existem erros adicionais não exibidos nesta resposta.";
    private static int total;
    private static void conferir(boolean condicao) {
        total++;
        if (!condicao) throw new AssertionError("Verificação " + total);
    }
    private static int bytes(String s) { return s.getBytes(StandardCharsets.UTF_8).length; }
    public static void main(String[] args) {
        conferir(ProcessadorDeValidacao.montarResposta(Collections.emptyList()).equals("OK"));
        for (int tamanho : new int[] {65528, 65529, 65530}) {
            String erro = "a".repeat(tamanho);
            String resposta = ProcessadorDeValidacao.montarResposta(Collections.singletonList(erro));
            conferir(resposta.equals(tamanho <= 65529 ? "ERRO\t" + erro : "ERRO\t" + AVISO));
            conferir(bytes(resposta + "\r\n") <= 65536);
            conferir(bytes(resposta + "\n") <= 65536);
        }
        List<String> erros = Collections.unmodifiableList(Arrays.asList("Á🌱", "Segundo", "x".repeat(65536), "Último"));
        List<String> copia = Arrays.asList(erros.toArray(new String[0]));
        String resposta = ProcessadorDeValidacao.montarResposta(erros);
        conferir(resposta.equals("ERRO\tÁ🌱\tSegundo\t" + AVISO));
        conferir(erros.equals(copia));
        conferir(ProcessadorDeValidacao.montarResposta(Arrays.asList("Á🌱", "Segundo")).equals("ERRO\tÁ🌱\tSegundo"));
        conferir(ProcessadorDeValidacao.montarResposta(Arrays.asList("Á🌱".repeat(11000))).equals("ERRO\t" + AVISO));
        String unicode = "🌱".repeat(16382) + "a";
        conferir(bytes("ERRO\t" + unicode + "\r\n") == 65536);
        conferir(ProcessadorDeValidacao.montarResposta(Collections.singletonList(unicode)).equals("ERRO\t" + unicode));
        conferir(ProcessadorDeValidacao.montarResposta(Arrays.asList("Igual", "Igual", "x".repeat(65536))).equals("ERRO\tIgual\tIgual\t" + AVISO));
        System.out.println("OK: " + total + " verificações de resposta limitada.");
    }
}

package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

public class ValidadorQuestionarioTest {
    private static int total;
    private static void conferir(int n, List<String> erros) {
        if (erros.size() != n) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        Instant data = Instant.parse("2099-01-01T00:00:00Z");
        List<String> culturas = new ArrayList<>(Arrays.asList("000000000000000000000001"));
        List<String> problemas = new ArrayList<>(Arrays.asList("doencas", "pragas"));
        conferir(0, ValidadorQuestionario.validarQuestionario("teste", "pequena", "4_ou_mais", culturas, null, problemas, "raramente", "sim", data));
        if (!culturas.equals(Arrays.asList("000000000000000000000001")) || !problemas.equals(Arrays.asList("doencas", "pragas"))) throw new AssertionError("Valores modificados");
        total++;
        conferir(9, ValidadorQuestionario.validarQuestionario(null, null, null, null, null, null, null, null, null));
        conferir(0, ValidadorQuestionario.validarQuestionario("🌱".repeat(30), "media", "1", Arrays.asList(), "🌱".repeat(150), Arrays.asList("nao_identificado"), "sempre", "nao", data));
        conferir(2, ValidadorQuestionario.validarQuestionario("🌱".repeat(31), "grande", "2", culturas, "🌱".repeat(151), problemas, "as_vezes", "as_vezes", data));
        conferir(2, ValidadorQuestionario.validarQuestionario("teste", "pequena", "1", Arrays.asList(), "", problemas, "raramente", "sim", data));
        conferir(1, ValidadorQuestionario.validarQuestionario("teste", "pequena", "1", culturas, null, Arrays.asList("pragas", "pragas"), "raramente", "sim", data));
        System.out.println("OK: " + total + " verificações diretas de questionário.");
    }
}

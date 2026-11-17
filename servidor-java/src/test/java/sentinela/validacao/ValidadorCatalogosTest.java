package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ValidadorCatalogosTest {
    private static int total;
    private static void conferir(int n, List<String> erros) {
        if (erros.size() != n) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        Instant ref = Instant.parse("2026-11-16T12:00:00Z");
        conferir(2, ValidadorCultura.validarCultura(null, null, null, null, null));
        conferir(0, ValidadorCultura.validarCultura("🌱".repeat(150), "🌱".repeat(200), "🌱".repeat(5000), false, null));
        conferir(3, ValidadorCultura.validarCultura("", "", "", true, null));
        ImagemOcorrencia imagem = new ImagemOcorrencia("https://example.com/a", " id ", "", ref.plusSeconds(1));
        if (!ValidadorCultura.validarCultura("Nome", null, null, true, imagem).equals(ValidadorImagens.validar(Arrays.asList(imagem), "Limite")))
            throw new AssertionError("Regras de imagens alteradas");
        total++;
        conferir(0, ValidadorFonteConhecimento.validarFonteConhecimento("Título", "Autor", "http://example.com", ref, ref, ref));
        conferir(1, ValidadorFonteConhecimento.validarFonteConhecimento("Título", "Autor", "https://example.com", null, null, ref));
        conferir(0, ValidadorFonteConhecimento.validarFonteConhecimento("Título", "Autor", null, null, ref, ref));
        conferir(1, ValidadorFonteConhecimento.validarFonteConhecimento("Título", "Autor", null, ref, ref.minusSeconds(1), ref));
        conferir(2, ValidadorFonteConhecimento.validarFonteConhecimento("Título", "Autor", null, ref.plusSeconds(1), ref.plusSeconds(1), ref));
        conferir(3, ValidadorFonteConhecimento.validarFonteConhecimento(null, null, null, null, null, null));
        System.out.println("OK: " + total + " verificações diretas de catálogos.");
    }
}

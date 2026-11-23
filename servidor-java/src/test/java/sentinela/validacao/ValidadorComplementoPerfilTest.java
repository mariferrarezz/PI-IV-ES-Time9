package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ValidadorComplementoPerfilTest {
    private static int total;
    private static void conferir(int n, List<String> erros) {
        if (erros.size() != n) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        conferir(4, ValidadorPerfil.validarCadastroPerfil(null, null, null, null));
        if (!ValidadorPerfil.validarCadastroPerfil(null, null, "+5519999999999", "email")
                .equals(ValidadorPerfil.validarPerfil(null, null))) throw new AssertionError("Regressão nome/CPF");
        total++;
        conferir(1, ValidadorPerfil.validarCadastroPerfil("Pessoa", "52998224725", "+5500999999999", "sms"));
        conferir(0, ValidadorPerfil.validarOpcionaisPerfil(null, null));
        conferir(1, ValidadorPerfil.validarOpcionaisPerfil("", null));
        conferir(0, ValidadorPerfil.validarOpcionaisPerfil("🌱".repeat(80), null));
        conferir(1, ValidadorPerfil.validarOpcionaisPerfil("🌱".repeat(81), null));
        ImagemOcorrencia foto = new ImagemOcorrencia("https://example.com/a", " id ", "", Instant.parse("2099-01-01T00:00:00Z"));
        if (!ValidadorPerfil.validarOpcionaisPerfil(null, foto).equals(ValidadorImagens.validar(Arrays.asList(foto), "Limite")))
            throw new AssertionError("Mensagens comuns");
        total++;
        if (!foto.publicId.equals(" id ")) throw new AssertionError("publicId modificado");
        total++;
        conferir(1, ValidadorPerfil.validarOpcionaisPerfil(null, new ImagemOcorrencia("https://example.com/a", "id", null, null)));
        System.out.println("OK: " + total + " verificações diretas de complemento do perfil.");
    }
}

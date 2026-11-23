package sentinela.validacao;

import java.util.Arrays;
import java.util.List;

// Execute o main sem bibliotecas de teste externas.
public class ValidadorPerfilTest {
    private static int total;
    private static final String CPF = "52998224725";

    private static void verificar(String nome, String cpf, String... erros) {
        List<String> resultado = ValidadorPerfil.validarPerfil(nome, cpf);
        if (!resultado.equals(Arrays.asList(erros))) throw new AssertionError("Caso " + total);
        total++;
    }

    public static void main(String[] args) {
        String obrigatorio = "O nome completo é obrigatório.";
        String curto = "O nome completo deve ter pelo menos 2 caracteres.";
        String longo = "O nome completo deve ter no máximo 150 caracteres.";
        String invalido = "O CPF deve conter 11 dígitos e ser válido.";
        verificar(null, CPF, obrigatorio);
        verificar("", CPF, obrigatorio);
        verificar(" ", CPF, obrigatorio);
        verificar("\t\n\u00A0\u2003\uFEFF", CPF, obrigatorio);
        verificar(" ".repeat(151), CPF, obrigatorio);
        verificar("A", CPF, curto);
        verificar("Al", CPF);
        verificar("A".repeat(150), CPF);
        verificar("A".repeat(151), CPF, longo);
        verificar("🌱", CPF, curto);
        verificar("🌱🌱", CPF);
        verificar("🌱".repeat(150), CPF);
        verificar("🌱".repeat(151), CPF, longo);
        verificar("a\u0301", CPF);
        verificar("a\u0301".repeat(75), CPF);
        verificar("a\u0301".repeat(75) + "a", CPF, longo);
        verificar(" José 2 D'Ávila ", CPF);
        verificar(" A", CPF); // Não apare silenciosamente o texto recebido.
        verificar("Ana", "11144477735");
        verificar("Ana", "01234567890");
        verificar("Ana", null, "O CPF é obrigatório.");
        verificar("Ana", "", "O CPF é obrigatório.");
        for (char digito = '0'; digito <= '9'; digito++) verificar("Ana", String.valueOf(digito).repeat(11), invalido);
        for (String cpf : new String[] {"5299822472", "529982247255", "52998224724", "52998224715",
                "529.982.247-25", " 52998224725", "52998224725 ", "5299822472a", "５２９９８２２４７２５",
                "٥٢٩٩٨٢٢٤٧٢٥", "5299822472\n", "           "}) verificar("Ana", cpf, invalido);
        verificar(null, "00000000000", obrigatorio, invalido);
        System.out.println("ValidadorPerfil: " + total + " verificações aprovadas.");
    }
}

package sentinela.validacao;

import sentinela.protocolo.CodecDeCampos;
import sentinela.protocolo.ProcessadorDeValidacao;
import java.util.Arrays;
import java.util.List;

// Testes sem dependências: execute o main após compilar em out/testes.
public class ValidadorPropriedadeTest {
    private static int total;
    private static final String N = "O nome da propriedade é obrigatório.";
    private static final String NL = "O nome da propriedade deve ter no máximo 150 caracteres.";
    private static final String M = "O município é obrigatório.";
    private static final String ML = "O município deve ter no máximo 150 caracteres.";
    private static final String E = "O estado é obrigatório.";
    private static final String UF = "O estado deve ser uma UF brasileira válida em maiúsculas.";
    private static final String A = "A área total deve ser um número finito maior que zero.";
    private static final String O = "As observações não podem ficar vazias quando informadas.";
    private static final String OL = "As observações devem ter no máximo 5000 caracteres.";
    private static final String INVALIDO = "ERRO\tPedido de validação inválido.";

    private static void igual(Object esperado, Object atual) {
        if (!esperado.equals(atual)) throw new AssertionError("Resultado inesperado: " + atual);
        total++;
    }

    private static void validar(String nome, String municipio, String estado, Double area, String obs, String... erros) {
        igual(Arrays.asList(erros), ValidadorPropriedade.validarPropriedade(nome, municipio, estado, area, obs));
    }

    private static void protocolo(String esperado, String... campos) {
        igual(esperado, ProcessadorDeValidacao.processar("VALIDAR_PROPRIEDADE\t" +
                String.join("\t", Arrays.stream(campos).map(CodecDeCampos::codificar).toArray(String[]::new))));
    }

    public static void main(String[] args) {
        validar("Fazenda 2 – Norte!", "São Paulo", "SP", null, null);
        validar(null, null, null, null, null, N, M, E);
        validar("", "", "", 0.0, "", N, M, E, A, O);
        validar(" ".repeat(151), "\u00a0".repeat(151), "sp", -1.0, " ".repeat(5001), N, M, UF, A, O);
        validar("🌱".repeat(150), "🌱".repeat(150), "SP", 0.00001, "🌱".repeat(5000));
        validar("🌱".repeat(151), "🌱".repeat(151), "SP", null, "🌱".repeat(5001), NL, ML, OL);
        validar("e\u0301".repeat(75), "e\u0301".repeat(75), "SP", Double.MAX_VALUE, "e\u0301".repeat(2500));
        validar("e\u0301".repeat(75) + "a", "e\u0301".repeat(75) + "a", "SP", null,
                "e\u0301".repeat(2500) + "a", NL, ML, OL);
        validar("A", "B", "SP", null, "X");
        validar("a".repeat(150), "m".repeat(150), "SP", null, "o".repeat(5000));
        validar("a".repeat(151), "m".repeat(151), "SP", null, "o".repeat(5001), NL, ML, OL);
        for (double area : new double[]{0, -1, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY}) {
            validar("Nome", "Cidade", "SP", area, null, A);
        }
        for (String uf : new String[]{"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
                "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"}) {
            validar("Nome", "Cidade", uf, null, null);
        }
        for (String uf : new String[]{"sp", " SP ", "XX", "S", "São Paulo", " "}) {
            validar("Nome", "Cidade", uf, null, null, UF);
        }
        for (String texto : new String[]{"", "\\", "\t", "\r", "\n", "\\t", "\\r", "\\n", "\\\\", "🌱\tÁ\r\n\\n"}) {
            igual(texto, CodecDeCampos.decodificar(CodecDeCampos.codificar(texto)));
        }
        for (String texto : new String[]{"\\", "\\x", "a\\q", "\t", "\n", "\r"}) {
            try { CodecDeCampos.decodificar(texto); throw new AssertionError("Escape aceito"); }
            catch (IllegalArgumentException esperado) { total++; }
        }
        protocolo("OK", "Nome", "Cidade", "SP", "", "0", "");
        protocolo("ERRO\t" + O, "Nome", "Cidade", "SP", "", "1", "");
        protocolo("ERRO\tA área total deve ser numérica.", "Nome", "Cidade", "SP", "abc", "0", "");
        protocolo("ERRO\t" + N + "\t" + M + "\t" + E + "\t" + O + "\tA área total deve ser numérica.",
                "", "", "", "abc", "1", "");
        protocolo("ERRO\t" + A, "Nome", "Cidade", "SP", "NaN", "0", "");
        protocolo("ERRO\t" + A, "Nome", "Cidade", "SP", "Infinity", "0", "");
        protocolo("OK", "N\\n\tA", "C\r\nD", "SP", "1", "1", "Obs\\t\t\r\nFim");
        protocolo(INVALIDO, "Nome", "Cidade", "SP", "1", "0", "texto");
        protocolo(INVALIDO, "Nome", "Cidade", "SP", "1", "2", "");
        for (String pedido : new String[]{"VALIDAR_PROPRIEDADE", "VALIDAR_PROPRIEDADE\tN\tC\tSP\t1\t0",
                "VALIDAR_PROPRIEDADE\tN\tC\tSP\t1\t0\t\t", "VALIDAR_PROPRIEDADE\tN\\x\tC\tSP\t1\t0\t",
                "VALIDAR_PROPRIEDADE\tN\\\tC\tSP\t1\t0\t", "OUTRO\tN\tC\tSP\t1\t0\t"}) {
            igual(INVALIDO, ProcessadorDeValidacao.processar(pedido));
        }
        igual("OK", ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNome\\q\t2"));
        igual("ERRO\tA área do talhão deve ser numérica.", ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNome\tabc"));
        System.out.println("OK: " + total + " verificacoes Java de propriedade, codec e compatibilidade.");
    }
}

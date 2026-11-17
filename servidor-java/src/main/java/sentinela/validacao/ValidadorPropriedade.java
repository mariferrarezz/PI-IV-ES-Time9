package sentinela.validacao;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ValidadorPropriedade {
    private static final Set<String> UFS = new HashSet<>(Arrays.asList(
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
            "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"));

    public static List<String> validarPropriedade(String nome, String municipio, String estado,
                                                 Double areaTotalHa, String observacoes) {
        List<String> erros = new ArrayList<>();
        // O Node prepara os textos; valide sem transformar o valor recebido.
        if (semConteudo(nome)) {
            erros.add("O nome da propriedade é obrigatório.");
        } else if (comprimento(nome) > 150) {
            erros.add("O nome da propriedade deve ter no máximo 150 caracteres.");
        }
        if (semConteudo(municipio)) {
            erros.add("O município é obrigatório.");
        } else if (comprimento(municipio) > 150) {
            erros.add("O município deve ter no máximo 150 caracteres.");
        }
        // Não apare espaços nem converta a UF para maiúsculas.
        if (estado == null || estado.isEmpty()) {
            erros.add("O estado é obrigatório.");
        } else if (!UFS.contains(estado)) {
            erros.add("O estado deve ser uma UF brasileira válida em maiúsculas.");
        }
        if (areaTotalHa != null && (!Double.isFinite(areaTotalHa) || areaTotalHa <= 0)) {
            erros.add("A área total deve ser um número finito maior que zero.");
        }
        // Null representa ausência; texto vazio representa presença inválida.
        if (observacoes != null) {
            if (semConteudo(observacoes)) {
                erros.add("As observações não podem ficar vazias quando informadas.");
            } else if (comprimento(observacoes) > 5000) {
                erros.add("As observações devem ter no máximo 5000 caracteres.");
            }
        }
        return erros;
    }

    private static boolean semConteudo(String texto) {
        return texto == null || texto.matches("[\\s\\p{Z}\\uFEFF]*");
    }

    private static int comprimento(String texto) {
        return texto.codePointCount(0, texto.length());
    }
}

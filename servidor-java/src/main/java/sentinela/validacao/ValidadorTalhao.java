package sentinela.validacao;

import java.util.ArrayList;
import java.util.List;

public class ValidadorTalhao {
    public static List<String> validarTalhao(String nome, Double areaHa) {
        List<String> erros = new ArrayList<>();

        // Reconheça espaços Unicode como no JavaScript, sem alterar o nome.
        if (nome == null || nome.matches("[\\s\\p{Z}\\uFEFF]*")) {
            erros.add("O nome do talhão é obrigatório.");
        } else if (nome.codePointCount(0, nome.length()) > 150) {
            // Conte pontos de código sobre o valor original, incluindo espaços.
            erros.add("O nome do talhão deve ter no máximo 150 caracteres.");
        }

        // Acumule os erros de área independentemente do nome.
        if (areaHa == null) {
            erros.add("A área do talhão é obrigatória.");
        } else if (!Double.isFinite(areaHa) || areaHa <= 0) {
            erros.add("A área do talhão deve ser um número finito maior que zero.");
        }

        return erros;
    }
}

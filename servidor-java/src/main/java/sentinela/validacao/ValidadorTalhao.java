package sentinela.validacao;

import java.util.ArrayList;
import java.util.List;

public class ValidadorTalhao {
    public static List<String> validarTalhao(String nome, Double areaHa) {
        List<String> erros = new ArrayList<>();

        // Verifique o nome sem modificar o valor recebido.
        if (nome == null || nome.trim().isEmpty()) {
            erros.add("O nome do talhão é obrigatório.");
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

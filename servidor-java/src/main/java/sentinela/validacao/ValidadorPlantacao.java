package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ValidadorPlantacao {
    public static List<String> validarPlantacao(String variedade, String safra, Instant dataPlantio,
            Double areaPlantadaHa, String status, Instant dataEncerramento,
            String observacoes, Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        // O Node prepara os textos; preserve os valores recebidos.
        texto(erros, variedade, "A variedade", 200);
        texto(erros, safra, "A safra", 30);
        texto(erros, observacoes, "As observações", 5000);
        if (areaPlantadaHa != null && (!Double.isFinite(areaPlantadaHa) || areaPlantadaHa <= 0))
            erros.add("A área plantada deve ser um número finito maior que zero.");
        if (status == null || status.isEmpty()) erros.add("O status da plantação é obrigatório.");
        else if (!status.equals("ativa") && !status.equals("encerrada"))
            erros.add("O status da plantação deve ser ativa ou encerrada.");
        if ("ativa".equals(status) && dataEncerramento != null)
            erros.add("A plantação ativa não pode ter data de encerramento.");
        if ("encerrada".equals(status) && dataEncerramento == null)
            erros.add("A data de encerramento é obrigatória para plantação encerrada.");
        if (instanteReferencia == null) erros.add("O instante de referência é obrigatório.");
        // Plantio futuro é permitido; somente o encerramento tem limite temporal.
        if (dataEncerramento != null) {
            if (dataPlantio != null && dataEncerramento.isBefore(dataPlantio))
                erros.add("A data de encerramento não pode anteceder a data de plantio.");
            if (instanteReferencia != null && dataEncerramento.isAfter(instanteReferencia))
                erros.add("A data de encerramento não pode ser futura.");
        }
        return erros;
    }

    private static void texto(List<String> erros, String valor, String campo, int limite) {
        if (valor == null) return;
        boolean plural = campo.equals("As observações");
        if (valor.matches("[\\s\\p{Z}\\uFEFF]*"))
            erros.add(campo + (plural ? " não podem ficar vazias quando informadas." : " não pode ficar vazia quando informada."));
        else if (valor.codePointCount(0, valor.length()) > limite)
            erros.add(campo + (plural ? " devem" : " deve") + " ter no máximo " + limite + " caracteres.");
    }
}

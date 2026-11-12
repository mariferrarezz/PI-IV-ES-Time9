package sentinela.protocolo;

import sentinela.validacao.ValidadorTalhao;

import java.util.List;

/**
 * Protocolo UTF-8: VALIDAR_TALHAO seguido de nome e área, separados por TAB.
 * Cada pedido ocupa uma linha. Campos não podem conter TAB, CR ou LF;
 * não há mecanismo de escape para esses caracteres.
 */
public class ProcessadorDeValidacao {
    public static String processar(String pedido) {
        // Rejeite pedidos que não representem uma única linha.
        if (pedido == null || pedido.indexOf('\r') >= 0 || pedido.indexOf('\n') >= 0) {
            return "ERRO\tPedido de validação inválido.";
        }

        // Preserve campos vazios, inclusive a área no final.
        String[] partes = pedido.split("\t", -1);
        if (partes.length != 3 || !"VALIDAR_TALHAO".equals(partes[0])) {
            return "ERRO\tPedido de validação inválido.";
        }

        Double areaHa = null;
        if (!partes[2].isEmpty()) {
            try {
                areaHa = Double.valueOf(partes[2]);
            } catch (NumberFormatException e) {
                // Valide também o nome, sem gerar erro de área ausente.
                List<String> erros = ValidadorTalhao.validarTalhao(partes[1], 1.0);
                erros.add("A área do talhão deve ser numérica.");
                return montarResposta(erros);
            }
        }

        return montarResposta(ValidadorTalhao.validarTalhao(partes[1], areaHa));
    }

    private static String montarResposta(List<String> erros) {
        // Mantenha todos os erros na mesma linha.
        return erros.isEmpty() ? "OK" : "ERRO\t" + String.join("\t", erros);
    }
}

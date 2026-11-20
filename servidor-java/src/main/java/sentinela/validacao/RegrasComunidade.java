package sentinela.validacao;

import java.net.URI;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

// Compartilhe somente contratos realmente comuns à Comunidade.
final class RegrasComunidade {
    static void texto(List<String> erros, String valor, String campo, int minimo, int maximo, boolean obrigatorio) {
        if (valor == null && !obrigatorio) return;
        if (valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*")) erros.add(campo + ": preenchimento obrigatório.");
        else {
            int n = valor.codePointCount(0, valor.length());
            if (n < minimo || n > maximo) erros.add(campo + " deve ter de " + minimo + " a " + maximo + " caracteres.");
        }
    }
    static void enumero(List<String> erros, String valor, String campo, String... opcoes) {
        if (!Arrays.asList(opcoes).contains(valor)) erros.add(campo + ": valor obrigatório inválido.");
    }
    static void data(List<String> erros, Instant valor, String campo) {
        if (valor == null) erros.add(campo + " é obrigatório.");
    }
    static void versao(List<String> erros, Long valor) {
        if (valor == null || valor < 1) erros.add("A versão deve ser um inteiro positivo.");
    }
    static void metodo(List<String> erros, CamposComunidade.Metodo m, boolean obrigatorio) {
        if (m == null) { if (obrigatorio) erros.add("O método é obrigatório."); return; }
        enumero(erros, m.tipoMedida, "tipoMedida", "manual", "cultural", "biologica", "quimica", "outra");
        texto(erros, m.descricao, "Descrição do método", 1, 5000, true);
        texto(erros, m.observacoes, "Observações do método", 1, 5000, false);
    }
    static void decisaoTemporal(List<String> erros, Instant data, Instant criado, Instant ref, String campo) {
        if (data != null && criado != null && data.isBefore(criado)) erros.add(campo + " não pode anteceder a criação.");
        if (data != null && ref != null && data.isAfter(ref)) erros.add(campo + " não pode ser futura.");
    }
    static boolean https(String valor) {
        if (valor == null || valor.codePointCount(0, valor.length()) > 2048 || valor.matches("(?s).*[\\s\\p{Z}].*")) return false;
        try { URI uri = new URI(valor); return "https".equals(uri.getScheme()) && uri.getHost() != null; }
        catch (Exception e) { return false; }
    }
}

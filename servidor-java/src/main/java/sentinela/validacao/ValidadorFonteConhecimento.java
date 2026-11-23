package sentinela.validacao;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ValidadorFonteConhecimento {
    public static List<String> validarFonteConhecimento(String titulo, String instituicaoOuAutor, String url,
            Instant publicadoEm, Instant acessadoEm, Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        texto(erros, titulo, "O título", 300);
        texto(erros, instituicaoOuAutor, "A instituição ou autor", 200);
        if (url != null) {
            if (!urlValida(url)) erros.add("A URL da fonte deve ser HTTP ou HTTPS válida e ter no máximo 2048 caracteres.");
            if (acessadoEm == null) erros.add("A data de acesso é obrigatória quando há URL.");
        }
        if (instanteReferencia == null) erros.add("O instante de referência é obrigatório.");
        else {
            if (publicadoEm != null && publicadoEm.isAfter(instanteReferencia)) erros.add("A data de publicação não pode ser futura.");
            if (acessadoEm != null && acessadoEm.isAfter(instanteReferencia)) erros.add("A data de acesso não pode ser futura.");
        }
        if (publicadoEm != null && acessadoEm != null && acessadoEm.isBefore(publicadoEm))
            erros.add("A data de acesso não pode anteceder a publicação.");
        return erros;
    }
    private static void texto(List<String> erros, String valor, String campo, int limite) {
        if (valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*")) erros.add(campo + ": preenchimento obrigatório.");
        else if (valor.codePointCount(0, valor.length()) > limite) erros.add(campo + ": máximo de " + limite + " caracteres.");
    }
    private static boolean urlValida(String valor) {
        if (valor.codePointCount(0, valor.length()) > 2048) return false;
        try {
            URI uri = new URI(valor);
            // Fontes permitem HTTP, independentemente da regra HTTPS das imagens.
            return ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) && uri.getHost() != null;
        } catch (Exception e) { return false; }
    }
}

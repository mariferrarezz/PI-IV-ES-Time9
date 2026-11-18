package sentinela.validacao;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// Preserve os tipos e as mensagens existentes.
public final class ValidadorImagens {
    private ValidadorImagens() {}
    public static List<String> validar(List<ImagemOcorrencia> imagens, String mensagemLimite) {
        List<String> erros = new ArrayList<>();
        if (imagens != null) {
            if (imagens.size() > 5) erros.add(mensagemLimite);
            Set<String> ids = new HashSet<>();
            for (ImagemOcorrencia imagem : imagens) {
                if (imagem == null) { erros.add("Os metadados da imagem são obrigatórios."); continue; }
                if (!urlValida(imagem.url)) erros.add("A URL da imagem deve ser HTTPS válida e ter no máximo 2048 caracteres.");
                if (vazio(imagem.publicId)) erros.add("O publicId da imagem é obrigatório.");
                else if (!ids.add(imagem.publicId)) erros.add("O publicId não pode se repetir no registro.");
                if (imagem.legenda != null) texto(erros, imagem.legenda, "A legenda da imagem", 300);
                if (imagem.enviadaEm == null) erros.add("A data de envio da imagem é obrigatória.");
            }
        }
        return erros;
    }
    private static boolean vazio(String valor) { return valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*"); }
    private static void texto(List<String> erros, String valor, String campo, int limite) {
        if (vazio(valor)) erros.add(campo + ": preenchimento obrigatório.");
        else if (valor.codePointCount(0, valor.length()) > limite)
            erros.add(campo + ": máximo de " + limite + " caracteres.");
    }
    private static boolean urlValida(String valor) {
        if (valor == null || valor.codePointCount(0, valor.length()) > 2048) return false;
        try {
            URI uri = new URI(valor);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        } catch (Exception e) { return false; }
    }
}

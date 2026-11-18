package sentinela.validacao;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ValidadorCultura {
    public static List<String> validarCultura(String nome, String nomeCientifico, String descricao,
            Boolean ativa, ImagemOcorrencia imagem) {
        List<String> erros = new ArrayList<>();
        texto(erros, nome, "O nome da cultura", 150);
        if (nomeCientifico != null) texto(erros, nomeCientifico, "O nome científico", 200);
        if (descricao != null) texto(erros, descricao, "A descrição", 5000);
        if (ativa == null) erros.add("O campo ativa é obrigatório.");
        // Objeto único; não transforme o publicId ou gere imagem padrão.
        if (imagem != null) erros.addAll(ValidadorImagens.validar(Collections.singletonList(imagem),
                "A cultura deve ter no máximo uma imagem."));
        return erros;
    }
    private static void texto(List<String> erros, String valor, String campo, int limite) {
        if (valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*")) erros.add(campo + ": preenchimento obrigatório.");
        else if (valor.codePointCount(0, valor.length()) > limite) erros.add(campo + ": máximo de " + limite + " caracteres.");
    }
}

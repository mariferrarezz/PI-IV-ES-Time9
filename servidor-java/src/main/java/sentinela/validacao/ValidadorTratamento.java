package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ValidadorTratamento {
    public static List<String> validarTratamento(String tipoMedida, String descricao, Instant dataAplicacao,
            Double areaTratadaHa, String produtoUtilizado, Double quantidadeUtilizada, String unidadeQuantidade,
            String responsavelAplicacao, String observacoes, List<ImagemOcorrencia> imagens,
            Instant instanteReferencia) {
        List<String> erros = new ArrayList<>();
        if (!Arrays.asList("manual", "cultural", "biologica", "quimica", "outra").contains(tipoMedida))
            erros.add("O tipo de medida é obrigatório e deve ser manual, cultural, biologica, quimica ou outra.");
        // Valide textos preparados pelo Node sem transformar os valores.
        texto(erros, descricao, "A descrição", 1, 5000);
        if (produtoUtilizado != null) texto(erros, produtoUtilizado, "O produto utilizado", 1, 200);
        if (unidadeQuantidade != null) texto(erros, unidadeQuantidade, "A unidade da quantidade", 1, 30);
        if (responsavelAplicacao != null) texto(erros, responsavelAplicacao, "O responsável pela aplicação", 2, 150);
        if (observacoes != null) texto(erros, observacoes, "As observações", 1, 5000);
        if (areaTratadaHa != null && (!Double.isFinite(areaTratadaHa) || areaTratadaHa <= 0))
            erros.add("A área tratada deve ser um número finito maior que zero.");
        if (quantidadeUtilizada != null && (!Double.isFinite(quantidadeUtilizada) || quantidadeUtilizada <= 0))
            erros.add("A quantidade utilizada deve ser um número finito maior que zero.");
        if ((quantidadeUtilizada == null) != (unidadeQuantidade == null))
            erros.add("A quantidade utilizada e a unidade devem ser informadas juntas.");
        if (instanteReferencia == null) erros.add("O instante de referência é obrigatório.");
        if (dataAplicacao == null) erros.add("A data de aplicação é obrigatória.");
        else if (instanteReferencia != null && dataAplicacao.isAfter(instanteReferencia))
            erros.add("A data de aplicação não pode ser futura.");
        erros.addAll(ValidadorImagens.validar(imagens, "O tratamento deve ter no máximo 5 imagens."));
        return erros;
    }

    private static void texto(List<String> erros, String valor, String campo, int minimo, int maximo) {
        if (valor == null || valor.matches("[\\s\\p{Z}\\uFEFF]*"))
            erros.add(campo + ": preenchimento obrigatório.");
        else {
            int tamanho = valor.codePointCount(0, valor.length());
            if (tamanho < minimo) erros.add(campo + ": mínimo de " + minimo + " caracteres.");
            else if (tamanho > maximo) erros.add(campo + ": máximo de " + maximo + " caracteres.");
        }
    }
}

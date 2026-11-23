package sentinela.protocolo;

import sentinela.validacao.ValidadorTalhao;
import sentinela.validacao.ValidadorPropriedade;
import sentinela.validacao.ValidadorPlantacao;
import sentinela.validacao.ValidadorOcorrencia;
import sentinela.validacao.ImagemOcorrencia;
import sentinela.validacao.ValidadorMonitoramento;
import sentinela.validacao.ValidadorTratamento;
import sentinela.validacao.ValidadorAvaliacaoTratamento;
import sentinela.validacao.ValidadorQuestionario;
import sentinela.validacao.ValidadorPerfil;
import sentinela.validacao.ValidadorCultura;
import sentinela.validacao.ValidadorFonteConhecimento;
import java.time.Instant;

import java.util.List;

/**
 * Protocolo UTF-8 por linha. Talhões mantêm campos sem escape;
 * os demais comandos usam escapes definidos em CodecDeCampos.
 */
public class ProcessadorDeValidacao {
    public static String processar(String pedido) {
        // Rejeite pedidos que não representem uma única linha.
        if (pedido == null || pedido.indexOf('\r') >= 0 || pedido.indexOf('\n') >= 0) {
            return "ERRO\tPedido de validação inválido.";
        }

        // Preserve campos vazios, inclusive a área no final.
        String[] partes = pedido.split("\t", -1);
        if ("VALIDAR_PROBLEMA_AGRICOLA".equals(partes[0])) return ParserProblemaAgricola.processar(partes);
        if ("VALIDAR_EXPERIENCIA_COMUNIDADE".equals(partes[0]) || "VALIDAR_ADOCAO_TRATAMENTO".equals(partes[0])
                || "VALIDAR_DENUNCIA_COMUNIDADE".equals(partes[0])) return ParserComunidade.processar(partes);
        if ("VALIDAR_CULTURA".equals(partes[0])) return processarCultura(partes);
        if ("VALIDAR_FONTE_CONHECIMENTO".equals(partes[0])) return processarFonteConhecimento(partes);
        if ("VALIDAR_CADASTRO_PERFIL".equals(partes[0])) return processarCadastroPerfil(partes);
        if ("VALIDAR_CPF".equals(partes[0]) || "VALIDAR_TELEFONE".equals(partes[0])) return processarCampoCadastro(partes);
        if ("VALIDAR_OPCIONAIS_PERFIL".equals(partes[0])) return processarOpcionaisPerfil(partes);
        if ("VALIDAR_QUESTIONARIO".equals(partes[0])) return processarQuestionario(partes);
        if ("VALIDAR_AVALIACAO_TRATAMENTO".equals(partes[0])) return processarAvaliacaoTratamento(partes);
        if ("VALIDAR_TRATAMENTO".equals(partes[0])) return processarTratamento(partes);
        if ("VALIDAR_MONITORAMENTO".equals(partes[0])) return processarMonitoramento(partes);
        if ("VALIDAR_OCORRENCIA".equals(partes[0])) return processarOcorrencia(partes);
        if ("VALIDAR_PLANTACAO".equals(partes[0])) return processarPlantacao(partes);
        if ("VALIDAR_PROPRIEDADE".equals(partes[0])) {
            return processarPropriedade(partes);
        }
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

    private static String processarPropriedade(String[] partes) {
        if (partes.length != 7) return "ERRO\tPedido de validação inválido.";
        try {
            // Separe os campos antes de decodificar seus delimitadores internos.
            for (int i = 1; i < partes.length; i++) partes[i] = CodecDeCampos.decodificar(partes[i]);
        } catch (IllegalArgumentException e) {
            return "ERRO\tPedido de validação inválido.";
        }
        if ((!"0".equals(partes[5]) && !"1".equals(partes[5]))
                || ("0".equals(partes[5]) && !partes[6].isEmpty())) {
            return "ERRO\tPedido de validação inválido.";
        }
        String observacoes = "0".equals(partes[5]) ? null : partes[6];
        Double area = null;
        if (!partes[4].isEmpty()) {
            try {
                area = Double.valueOf(partes[4]);
            } catch (NumberFormatException e) {
                List<String> erros = ValidadorPropriedade.validarPropriedade(
                        partes[1], partes[2], partes[3], null, observacoes);
                erros.add("A área total deve ser numérica.");
                return montarResposta(erros);
            }
        }
        return montarResposta(ValidadorPropriedade.validarPropriedade(
                partes[1], partes[2], partes[3], area, observacoes));
    }

    private static String processarPlantacao(String[] p) {
        if (p.length != 12) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            for (int i : new int[] {1, 3, 9}) {
                if ((!p[i].equals("0") && !p[i].equals("1")) || (p[i].equals("0") && !p[i + 1].isEmpty()))
                    return "ERRO\tPedido de validação inválido.";
            }
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
        java.util.List<String> conversao = new java.util.ArrayList<>();
        Instant plantio = data(p[5], "A data de plantio", conversao);
        Instant encerramento = data(p[8], "A data de encerramento", conversao);
        Instant referencia = data(p[11], "O instante de referência", conversao);
        Double area = null;
        try { if (!p[6].isEmpty()) area = Double.valueOf(p[6]); }
        catch (NumberFormatException e) { conversao.add("A área plantada deve ser numérica."); }
        List<String> erros = ValidadorPlantacao.validarPlantacao(
                p[1].equals("0") ? null : p[2], p[3].equals("0") ? null : p[4], plantio,
                area, p[7], encerramento, p[9].equals("0") ? null : p[10], referencia);
        // Uma data malformada não deve gerar também erro de ausência.
        if (!p[8].isEmpty() && encerramento == null)
            erros.remove("A data de encerramento é obrigatória para plantação encerrada.");
        if (!p[11].isEmpty() && referencia == null) erros.remove("O instante de referência é obrigatório.");
        erros.addAll(conversao);
        return montarResposta(erros);
    }

    static Instant data(String texto, String campo, List<String> erros) {
        if (texto.isEmpty()) return null;
        try {
            // O contrato transmite UTC com Z; não converta datas de calendário.
            if (!texto.endsWith("Z") || texto.matches(".*T[0-9]{2}:[0-9]{2}:60.*")) throw new IllegalArgumentException();
            return Instant.parse(texto);
        } catch (RuntimeException e) {
            erros.add(campo + " deve ser um instante ISO válido em UTC.");
            return null;
        }
    }

    private static boolean marcador(String valor) { return "0".equals(valor) || "1".equals(valor); }

    private static String processarOcorrencia(String[] p) {
        if (p.length < 14) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            if (!marcador(p[2]) || !marcador(p[9]) || !marcador(p[12])
                    || (p[9].equals("0") && !p[10].isEmpty()) || !p[13].matches("0|[1-9][0-9]*"))
                return "ERRO\tPedido de validação inválido.";
            int quantidade = Integer.parseInt(p[13]);
            if (quantidade != (p.length - 14) / 5 || (p.length - 14) % 5 != 0
                    || (p[12].equals("0") && quantidade != 0)) return "ERRO\tPedido de validação inválido.";
            for (int i = 14; i < p.length; i += 5)
                if (!marcador(p[i + 2]) || (p[i + 2].equals("0") && !p[i + 3].isEmpty()))
                    return "ERRO\tPedido de validação inválido.";
            List<String> conversao = new java.util.ArrayList<>();
            Instant observacao = data(p[3], "A data de observação", conversao);
            Instant encerramento = data(p[8], "A data de encerramento", conversao);
            Instant referencia = data(p[11], "O instante de referência", conversao);
            Double area = null;
            try { if (!p[6].isEmpty()) area = Double.valueOf(p[6]); }
            catch (NumberFormatException e) { conversao.add("A área afetada deve ser numérica."); }
            List<ImagemOcorrencia> imagens = p[12].equals("0") ? null : new java.util.ArrayList<>();
            for (int i = 14; i < p.length; i += 5) {
                Instant envio = data(p[i + 4], "A data de envio da imagem", conversao);
                imagens.add(new ImagemOcorrencia(p[i], p[i + 1], p[i + 2].equals("0") ? null : p[i + 3], envio));
            }
            // Datas malformadas são rejeitadas antes das regras de domínio.
            if (!conversao.isEmpty()) return montarResposta(conversao);
            return montarResposta(ValidadorOcorrencia.validarOcorrencia(p[1], p[2].equals("1"),
                    observacao, p[4], p[5], area, p[7], encerramento,
                    p[9].equals("0") ? null : p[10], imagens, referencia));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarMonitoramento(String[] p) {
        if (p.length < 14) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            if (!marcador(p[1]) || (!p[3].isEmpty() && !marcador(p[3]))
                    || !marcador(p[5]) || !marcador(p[7]) || !marcador(p[12])
                    || (p[5].equals("0") && !p[6].isEmpty()) || (p[7].equals("0") && !p[8].isEmpty())
                    || !p[13].matches("0|[1-9][0-9]*")) return "ERRO\tPedido de validação inválido.";
            int quantidade = Integer.parseInt(p[13]);
            if ((p.length - 14) % 5 != 0 || quantidade != (p.length - 14) / 5
                    || (p[12].equals("0") && quantidade != 0)) return "ERRO\tPedido de validação inválido.";
            for (int i = 14; i < p.length; i += 5)
                if (!marcador(p[i + 2]) || (p[i + 2].equals("0") && !p[i + 3].isEmpty()))
                    return "ERRO\tPedido de validação inválido.";
            List<String> conversao = new java.util.ArrayList<>();
            Instant observacao = data(p[2], "A data de observação", conversao);
            Instant proxima = data(p[10], "A próxima inspeção", conversao);
            Instant referencia = data(p[11], "O instante de referência", conversao);
            Double area = null;
            try { if (!p[9].isEmpty()) area = Double.valueOf(p[9]); }
            catch (NumberFormatException e) { conversao.add("A área afetada deve ser numérica."); }
            List<ImagemOcorrencia> imagens = p[12].equals("0") ? null : new java.util.ArrayList<>();
            for (int i = 14; i < p.length; i += 5) {
                Instant envio = data(p[i + 4], "A data de envio da imagem", conversao);
                imagens.add(new ImagemOcorrencia(p[i], p[i + 1], p[i + 2].equals("0") ? null : p[i + 3], envio));
            }
            if (!conversao.isEmpty()) return montarResposta(conversao);
            return montarResposta(ValidadorMonitoramento.validarMonitoramento(p[1].equals("1"), observacao,
                    p[3].isEmpty() ? null : p[3].equals("1"), p[4], p[5].equals("0") ? null : p[6],
                    p[7].equals("0") ? null : p[8], area, proxima, imagens, referencia));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarTratamento(String[] p) {
        if (p.length < 17) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            for (int i : new int[] {5, 8, 10, 12})
                if (!marcador(p[i]) || (p[i].equals("0") && !p[i + 1].isEmpty()))
                    return "ERRO\tPedido de validação inválido.";
            if (!marcador(p[15]) || !p[16].matches("0|[1-9][0-9]*"))
                return "ERRO\tPedido de validação inválido.";
            int quantidade = Integer.parseInt(p[16]);
            if ((p.length - 17) % 5 != 0 || quantidade != (p.length - 17) / 5
                    || (p[15].equals("0") && quantidade != 0)) return "ERRO\tPedido de validação inválido.";
            for (int i = 17; i < p.length; i += 5)
                if (!marcador(p[i + 2]) || (p[i + 2].equals("0") && !p[i + 3].isEmpty()))
                    return "ERRO\tPedido de validação inválido.";
            List<String> conversao = new java.util.ArrayList<>();
            Instant aplicacao = data(p[3], "A data de aplicação", conversao);
            Instant referencia = data(p[14], "O instante de referência", conversao);
            Double area = null, quantidadeUtilizada = null;
            try { if (!p[4].isEmpty()) area = Double.valueOf(p[4]); }
            catch (NumberFormatException e) { conversao.add("A área tratada deve ser numérica."); }
            try { if (!p[7].isEmpty()) quantidadeUtilizada = Double.valueOf(p[7]); }
            catch (NumberFormatException e) { conversao.add("A quantidade utilizada deve ser numérica."); }
            List<ImagemOcorrencia> imagens = p[15].equals("0") ? null : new java.util.ArrayList<>();
            for (int i = 17; i < p.length; i += 5) {
                Instant envio = data(p[i + 4], "A data de envio da imagem", conversao);
                imagens.add(new ImagemOcorrencia(p[i], p[i + 1], p[i + 2].equals("0") ? null : p[i + 3], envio));
            }
            if (!conversao.isEmpty()) return montarResposta(conversao);
            return montarResposta(ValidadorTratamento.validarTratamento(p[1], p[2], aplicacao, area,
                    p[5].equals("0") ? null : p[6], quantidadeUtilizada, p[8].equals("0") ? null : p[9],
                    p[10].equals("0") ? null : p[11], p[12].equals("0") ? null : p[13], imagens, referencia));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarAvaliacaoTratamento(String[] p) {
        if (p.length != 5) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
        List<String> conversao = new java.util.ArrayList<>();
        Instant avaliacao = data(p[1], "A data de avaliação", conversao);
        Instant referencia = data(p[4], "O instante de referência", conversao);
        if (!conversao.isEmpty()) return montarResposta(conversao);
        return montarResposta(ValidadorAvaliacaoTratamento.validarAvaliacaoTratamento(
                avaliacao, p[2], p[3], referencia));
    }

    private static String processarQuestionario(String[] p) {
        if (p.length < 13) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            if (!marcador(p[4]) || !marcador(p[6]) || !marcador(p[8])
                    || (p[6].equals("0") && !p[7].isEmpty())
                    || !p[5].matches("0|[1-9][0-9]*") || !p[9].matches("0|[1-9][0-9]*"))
                return "ERRO\tPedido de validação inválido.";
            int culturas = Integer.parseInt(p[5]), problemas = Integer.parseInt(p[9]);
            // Some em long para impedir overflow antes de acessar as partes variáveis.
            if (13L + culturas + problemas != p.length || (p[4].equals("0") && culturas != 0)
                    || (p[8].equals("0") && problemas != 0)) return "ERRO\tPedido de validação inválido.";
            List<String> conversao = new java.util.ArrayList<>();
            Instant conclusao = data(p[12], "A data de conclusão", conversao);
            if (!conversao.isEmpty()) return montarResposta(conversao);
            List<String> ids = p[4].equals("0") ? null : new java.util.ArrayList<>();
            List<String> respostas = p[8].equals("0") ? null : new java.util.ArrayList<>();
            for (int i = 0; i < culturas; i++) ids.add(p[13 + i]);
            for (int i = 0; i < problemas; i++) respostas.add(p[13 + culturas + i]);
            return montarResposta(ValidadorQuestionario.validarQuestionario(p[1], p[2], p[3], ids,
                    p[6].equals("0") ? null : p[7], respostas, p[10], p[11], conclusao));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarCampoCadastro(String[] p) {
        if (p.length != 2) return "ERRO\tPedido de validação inválido.";
        try {
            String valor = CodecDeCampos.decodificar(p[1]);
            return montarResposta("VALIDAR_CPF".equals(p[0]) ? ValidadorPerfil.validarCpf(valor) : ValidadorPerfil.validarTelefone(valor));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarCadastroPerfil(String[] p) {
        if (p.length != 5) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
        return montarResposta(ValidadorPerfil.validarCadastroPerfil(p[1], p[2], p[3], p[4]));
    }

    private static String processarOpcionaisPerfil(String[] p) {
        if (p.length != 9) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            if (!marcador(p[1]) || !marcador(p[3]) || !marcador(p[6])
                    || (p[1].equals("0") && !p[2].isEmpty()) || (p[6].equals("0") && !p[7].isEmpty()))
                return "ERRO\tPedido de validação inválido.";
            if (p[3].equals("0") && (!p[4].isEmpty() || !p[5].isEmpty() || !p[6].equals("0")
                    || !p[7].isEmpty() || !p[8].isEmpty())) return "ERRO\tPedido de validação inválido.";
            ImagemOcorrencia foto = null;
            if (p[3].equals("1")) {
                List<String> conversao = new java.util.ArrayList<>();
                Instant envio = data(p[8], "A data de envio da imagem", conversao);
                if (!conversao.isEmpty()) return montarResposta(conversao);
                foto = new ImagemOcorrencia(p[4], p[5], p[6].equals("0") ? null : p[7], envio);
            }
            return montarResposta(ValidadorPerfil.validarOpcionaisPerfil(p[1].equals("0") ? null : p[2], foto));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarCultura(String[] p) {
        if (p.length != 13) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
            if (!marcador(p[2]) || !marcador(p[4]) || !marcador(p[7]) || !marcador(p[10])
                    || (!p[6].isEmpty() && !marcador(p[6])) || (p[2].equals("0") && !p[3].isEmpty())
                    || (p[4].equals("0") && !p[5].isEmpty()) || (p[10].equals("0") && !p[11].isEmpty()))
                return "ERRO\tPedido de validação inválido.";
            if (p[7].equals("0") && (!p[8].isEmpty() || !p[9].isEmpty() || !p[10].equals("0")
                    || !p[11].isEmpty() || !p[12].isEmpty())) return "ERRO\tPedido de validação inválido.";
            ImagemOcorrencia imagem = null;
            if (p[7].equals("1")) {
                List<String> conversao = new java.util.ArrayList<>();
                Instant envio = data(p[12], "A data de envio da imagem", conversao);
                if (!conversao.isEmpty()) return montarResposta(conversao);
                imagem = new ImagemOcorrencia(p[8], p[9], p[10].equals("0") ? null : p[11], envio);
            }
            return montarResposta(ValidadorCultura.validarCultura(p[1], p[2].equals("0") ? null : p[3],
                    p[4].equals("0") ? null : p[5], p[6].isEmpty() ? null : p[6].equals("1"), imagem));
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
    }

    private static String processarFonteConhecimento(String[] p) {
        if (p.length != 8) return "ERRO\tPedido de validação inválido.";
        try {
            for (int i = 1; i < p.length; i++) p[i] = CodecDeCampos.decodificar(p[i]);
        } catch (IllegalArgumentException e) { return "ERRO\tPedido de validação inválido."; }
        if (!marcador(p[3]) || (p[3].equals("0") && !p[4].isEmpty())) return "ERRO\tPedido de validação inválido.";
        List<String> conversao = new java.util.ArrayList<>();
        Instant publicado = data(p[5], "A data de publicação", conversao);
        Instant acessado = data(p[6], "A data de acesso", conversao);
        Instant referencia = data(p[7], "O instante de referência", conversao);
        if (!conversao.isEmpty()) return montarResposta(conversao);
        return montarResposta(ValidadorFonteConhecimento.validarFonteConhecimento(p[1], p[2],
                p[3].equals("0") ? null : p[4], publicado, acessado, referencia));
    }

    static String montarResposta(List<String> erros) {
        if (erros.isEmpty()) return "OK";
        // Reserve CRLF e conte bytes, sem alterar a lista do validador.
        final int orcamento = 65536 - 2;
        final String aviso = "Existem erros adicionais não exibidos nesta resposta.";
        long tamanho = 4;
        for (String erro : erros) tamanho += 1L + bytesUtf8(erro);
        if (tamanho <= orcamento) return "ERRO\t" + String.join("\t", erros);

        StringBuilder resposta = new StringBuilder("ERRO");
        int usados = 4;
        int reserva = 1 + bytesUtf8(aviso);
        for (String erro : erros) {
            int bytes = bytesUtf8(erro);
            if ((long) usados + 1 + bytes + reserva > orcamento) break;
            resposta.append('\t').append(erro);
            usados += 1 + bytes;
        }
        return resposta.append('\t').append(aviso).toString();
    }

    private static int bytesUtf8(String texto) {
        return texto.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
    }
}

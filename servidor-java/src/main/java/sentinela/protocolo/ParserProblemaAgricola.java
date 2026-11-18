package sentinela.protocolo;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import sentinela.validacao.CamposProblemaAgricola;
import sentinela.validacao.ImagemOcorrencia;
import sentinela.validacao.ValidadorProblemaAgricola;

// Contrato posicional concentrado aqui; não define um modelo de persistência.
final class ParserProblemaAgricola {
    private enum F {
        COMANDO, NOME, TIPO, DESCRICAO, CIENTIFICO_P, CIENTIFICO,
        CULTURAS_P, CULTURAS_N, SINTOMAS_P, SINTOMAS_N, MEDIDAS_P, MEDIDAS_N,
        CONTROLES_P, CONTROLES_N, FONTES_P, FONTES_N, ATIVO, REVISADO, REFERENCIA,
        PARTES_P, PARTES_N, CONDICOES_P, CONDICOES_N, DISSEMINACAO_P, DISSEMINACAO,
        ORIENTACAO_P, ORIENTACAO, IMAGENS_P, IMAGENS_N, CODIGO_P, CODIGO,
        CHIPS_P, CHIPS_N, NIVEIS_P, BAIXO, MEDIO, ALTO, ONDE_P, ONDE,
        DICA_P, DICA, DANOS_P, DANOS_N, PERDA_P, PERDA, EPOCA_P, EPOCA,
        ABRANGENCIA_P, ABRANGENCIA, INTRO_P, INTRO, BOAS_P, BOAS_N,
        REVISAO_P, STATUS, OBS_REVISAO_P, OBS_REVISAO, AGROFIT, FOTO_PENDENTE
    }
    private static final int FIXAS = F.values().length;
    private final String[] partes;
    private final List<String> conversao = new ArrayList<>();

    private ParserProblemaAgricola(String[] partes) { this.partes = partes; }

    static String processar(String[] partes) {
        if (partes.length < FIXAS) return invalido();
        try {
            for (int i = 1; i < partes.length; i++) partes[i] = CodecDeCampos.decodificar(partes[i]);
            ParserProblemaAgricola parser = new ParserProblemaAgricola(partes);
            Estrutura estrutura = parser.conferirEstrutura();
            CamposProblemaAgricola campos = parser.camposFixos();
            parser.blocos(campos, estrutura);
            Instant referencia = parser.data(F.REFERENCIA, "O instante de referência");
            if (!parser.conversao.isEmpty()) return ProcessadorDeValidacao.montarResposta(parser.conversao);
            return ProcessadorDeValidacao.montarResposta(ValidadorProblemaAgricola.validarProblemaAgricola(campos, referencia));
        } catch (IllegalArgumentException e) { return invalido(); }
    }

    private static String invalido() { return "ERRO\tPedido de validação inválido."; }
    private String get(F campo) { return partes[campo.ordinal()]; }
    private static boolean marcador(String valor) {
        if (!valor.equals("0") && !valor.equals("1")) throw new IllegalArgumentException();
        return valor.equals("1");
    }
    private static Boolean booleano(String valor) { return valor.isEmpty() ? null : marcador(valor); }
    private static int contagem(String valor) {
        if (!valor.matches("0|[1-9][0-9]*")) throw new IllegalArgumentException();
        return Integer.parseInt(valor);
    }
    private static String opcional(String presenca, String valor) {
        if (marcador(presenca)) return valor;
        if (!valor.isEmpty()) throw new IllegalArgumentException();
        return null;
    }
    private String texto(F presenca, F valor) { return opcional(get(presenca), get(valor)); }
    private Instant data(F campo, String nome) { return ProcessadorDeValidacao.data(get(campo), nome, conversao); }

    private static final class Lista {
        final boolean presente;
        final int tamanho;
        Lista(String presenca, String tamanho) {
            this.presente = marcador(presenca);
            this.tamanho = contagem(tamanho);
            if (!presente && this.tamanho != 0) throw new IllegalArgumentException();
        }
    }
    private Lista lista(F presenca, F tamanho) { return new Lista(get(presenca), get(tamanho)); }
    private final class Estrutura {
        final Lista culturas = lista(F.CULTURAS_P, F.CULTURAS_N);
        final Lista sintomas = lista(F.SINTOMAS_P, F.SINTOMAS_N);
        final Lista medidas = lista(F.MEDIDAS_P, F.MEDIDAS_N);
        final Lista controles = lista(F.CONTROLES_P, F.CONTROLES_N);
        final Lista fontes = lista(F.FONTES_P, F.FONTES_N);
        final Lista partes = lista(F.PARTES_P, F.PARTES_N);
        final Lista condicoes = lista(F.CONDICOES_P, F.CONDICOES_N);
        final Lista imagens = lista(F.IMAGENS_P, F.IMAGENS_N);
        final Lista chips = lista(F.CHIPS_P, F.CHIPS_N);
        final Lista danos = lista(F.DANOS_P, F.DANOS_N);
        final Lista boas = lista(F.BOAS_P, F.BOAS_N);
        long minimo() {
            return (long) FIXAS + culturas.tamanho + sintomas.tamanho + medidas.tamanho
                    + 8L * controles.tamanho + fontes.tamanho + partes.tamanho + condicoes.tamanho
                    + 5L * imagens.tamanho + chips.tamanho + danos.tamanho + boas.tamanho;
        }
    }

    private final class Cursor {
        int posicao = FIXAS;
        void exigir(long quantidade) {
            if (quantidade < 0 || quantidade > partes.length - posicao) throw new IllegalArgumentException();
        }
        void saltar(long quantidade) { exigir(quantidade); posicao += (int) quantidade; }
        String ler() { exigir(1); return partes[posicao++]; }
        void fim() { if (posicao != partes.length) throw new IllegalArgumentException(); }
        List<String> textos(Lista lista) {
            exigir(lista.tamanho);
            if (!lista.presente) return null;
            List<String> resultado = new ArrayList<>();
            for (int i = 0; i < lista.tamanho; i++) resultado.add(ler());
            return resultado;
        }
    }

    private Estrutura conferirEstrutura() {
        Estrutura e = new Estrutura();
        if (e.minimo() > partes.length) throw new IllegalArgumentException();
        // Pré-percurso sem alocar listas: valide todos os grupos e exemplos aninhados.
        Cursor c = new Cursor();
        c.saltar((long) e.culturas.tamanho + e.sintomas.tamanho + e.medidas.tamanho);
        for (int i = 0; i < e.controles.tamanho; i++) {
            c.exigir(8);
            c.saltar(2);
            opcional(c.ler(), c.ler());
            opcional(c.ler(), c.ler());
            Lista exemplos = new Lista(c.ler(), c.ler());
            c.saltar(exemplos.tamanho);
        }
        c.saltar((long) e.fontes.tamanho + e.partes.tamanho + e.condicoes.tamanho);
        for (int i = 0; i < e.imagens.tamanho; i++) {
            c.exigir(5);
            c.saltar(2);
            opcional(c.ler(), c.ler());
            c.saltar(1);
        }
        c.saltar((long) e.chips.tamanho + e.danos.tamanho + e.boas.tamanho);
        c.fim();
        return e;
    }

    private CamposProblemaAgricola camposFixos() {
        CamposProblemaAgricola c = new CamposProblemaAgricola();
        c.nomeComum = get(F.NOME); c.tipo = get(F.TIPO); c.descricao = get(F.DESCRICAO);
        c.nomeCientifico = texto(F.CIENTIFICO_P, F.CIENTIFICO);
        c.ativo = booleano(get(F.ATIVO)); c.revisadoEm = data(F.REVISADO, "A data de revisão");
        c.informacoesDisseminacao = texto(F.DISSEMINACAO_P, F.DISSEMINACAO);
        c.orientacaoBuscaAgronomo = texto(F.ORIENTACAO_P, F.ORIENTACAO);
        c.codigoEditorial = texto(F.CODIGO_P, F.CODIGO);
        c.ondeOlhar = texto(F.ONDE_P, F.ONDE); c.dicaDeCampo = texto(F.DICA_P, F.DICA);
        c.perdaEstimada = texto(F.PERDA_P, F.PERDA); c.epocaPropicia = texto(F.EPOCA_P, F.EPOCA);
        c.abrangenciaCulturas = texto(F.ABRANGENCIA_P, F.ABRANGENCIA);
        c.tratamentoIntro = texto(F.INTRO_P, F.INTRO);
        if (marcador(get(F.NIVEIS_P))) {
            c.niveisAtencao = new CamposProblemaAgricola.NiveisAtencao();
            c.niveisAtencao.baixo = get(F.BAIXO); c.niveisAtencao.medio = get(F.MEDIO); c.niveisAtencao.alto = get(F.ALTO);
        } else exigirVazios(F.BAIXO, F.MEDIO, F.ALTO);
        String observacoes = texto(F.OBS_REVISAO_P, F.OBS_REVISAO);
        Boolean agrofit = booleano(get(F.AGROFIT)), foto = booleano(get(F.FOTO_PENDENTE));
        if (marcador(get(F.REVISAO_P))) {
            c.revisaoEditorial = new CamposProblemaAgricola.RevisaoEditorial();
            c.revisaoEditorial.status = get(F.STATUS); c.revisaoEditorial.observacoes = observacoes;
            c.revisaoEditorial.registroAgrofitConferido = agrofit; c.revisaoEditorial.fotoPendente = foto;
        } else {
            exigirVazios(F.STATUS, F.OBS_REVISAO, F.AGROFIT, F.FOTO_PENDENTE);
            if (!get(F.OBS_REVISAO_P).equals("0")) throw new IllegalArgumentException();
        }
        return c;
    }

    private void exigirVazios(F... campos) {
        for (F campo : campos) if (!get(campo).isEmpty()) throw new IllegalArgumentException();
    }

    private void blocos(CamposProblemaAgricola c, Estrutura e) {
        Cursor cursor = new Cursor();
        c.culturasAfetadasIds = cursor.textos(e.culturas);
        c.sintomas = cursor.textos(e.sintomas); c.medidasPreventivas = cursor.textos(e.medidas);
        if (e.controles.presente) c.formasControle = new ArrayList<>();
        for (int i = 0; i < e.controles.tamanho; i++) {
            CamposProblemaAgricola.FormaControle f = new CamposProblemaAgricola.FormaControle();
            f.tipo = cursor.ler(); f.descricao = cursor.ler();
            f.observacoes = opcional(cursor.ler(), cursor.ler()); f.classe = opcional(cursor.ler(), cursor.ler());
            f.exemplosControle = cursor.textos(new Lista(cursor.ler(), cursor.ler()));
            c.formasControle.add(f);
        }
        c.fontesIds = cursor.textos(e.fontes); c.partesAfetadas = cursor.textos(e.partes);
        c.condicoesFavoraveis = cursor.textos(e.condicoes);
        if (e.imagens.presente) c.imagens = new ArrayList<>();
        for (int i = 0; i < e.imagens.tamanho; i++) {
            String url = cursor.ler(), id = cursor.ler(), legenda = opcional(cursor.ler(), cursor.ler());
            Instant envio = ProcessadorDeValidacao.data(cursor.ler(), "A data de envio da imagem", conversao);
            c.imagens.add(new ImagemOcorrencia(url, id, legenda, envio));
        }
        c.chips = cursor.textos(e.chips); c.danos = cursor.textos(e.danos); c.boasPraticas = cursor.textos(e.boas);
        cursor.fim();
    }
}

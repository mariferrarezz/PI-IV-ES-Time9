package sentinela.protocolo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Testes do protocolo de texto: "VALIDAR_TALHAO<TAB>nome<TAB>área", um pedido por linha.
 *
 * Duas partes: (1) o FORMATO do protocolo, que o ProcessadorDeValidacao decide sozinho
 * (comando, separador, número de campos, área numérica); (2) a integração com o
 * ValidadorTalhao real, conferindo as mensagens de erro que ele produz. As regras do talhão
 * em si são testadas isoladamente em ValidadorTalhaoTest.
 */
class ProcessadorDeValidacaoTest {

    private static final String ERRO_PEDIDO = "ERRO\tPedido de validação inválido.";
    private static final String MSG_AREA_NUMERICA = "A área do talhão deve ser numérica.";

    // ---------- pedidos que não respeitam o formato do protocolo ----------

    @Test
    void pedidoNuloEhRejeitado() {
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar(null));
    }

    @Test
    void pedidoVazioEhRejeitado() {
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar(""));
    }

    @Test
    void pedidoComQuebraDeLinhaEhRejeitado() {
        // O protocolo é "um pedido por linha": LF, CR ou CRLF dentro do pedido invalidam.
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t2.5\n"));
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t2.5\r"));
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t2.5\r\n"));
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNo\nrte\t2.5"));
    }

    @Test
    void comandoDesconhecidoEhRejeitado() {
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("OUTRO_COMANDO\tNorte\t2.5"));
    }

    @Test
    void comandoEhSensivelAMaiusculas() {
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("validar_talhao\tNorte\t2.5"));
    }

    @Test
    void separadorPrecisaSerTab() {
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO Norte 2.5"));
    }

    @Test
    void quantidadeDeCamposDiferenteDeTresEhRejeitada() {
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO"));
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte"));
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t2.5\textra"));
        // TAB no final cria um 4º campo vazio: o split usa limite -1 de propósito.
        assertEquals(ERRO_PEDIDO, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t2.5\t"));
    }

    // ---------- área que não é número ----------

    @Test
    void areaNaoNumericaGeraApenasOErroDeArea() {
        // Nome válido + área "abc": só deve aparecer o erro de área numérica
        // (não deve acusar "área ausente", como diz o comentário no código).
        assertEquals("ERRO\t" + MSG_AREA_NUMERICA,
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\tabc"));
    }

    @Test
    void areaComVirgulaDecimalNaoEhNumerica() {
        // O protocolo usa ponto decimal ("2.5"); "2,5" é recusado.
        assertEquals("ERRO\t" + MSG_AREA_NUMERICA,
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\t2,5"));
    }

    @Test
    void areaMistaDeNumeroELetrasNaoEhNumerica() {
        assertEquals("ERRO\t" + MSG_AREA_NUMERICA,
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\t12abc"));
    }

    @Test
    void areaNaoNumericaTambemValidaONome() {
        // O erro de área é somado aos erros do nome (separados por TAB), não substitui.
        assertEquals("ERRO\tO nome do talhão é obrigatório.\t" + MSG_AREA_NUMERICA,
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\t\tabc"));
    }

    // ---------- área ausente / formato da resposta ----------

    @Test
    void areaVaziaEhEncaminhadaAoValidadorComoAusente() {
        // Campo vazio no fim ("...\t") é preservado e vira área nula -> o validador deve reprovar.
        assertEquals("ERRO\tA área do talhão é obrigatória.",
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\t"));
    }

    // ---------- integração com o ValidadorTalhao ----------

    @Test
    void pedidoValidoRetornaOk() {
        assertEquals("OK", ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\t2.5"));
    }

    @Test
    void areaInteiraEEmNotacaoCientificaSaoAceitas() {
        assertEquals("OK", ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\t10"));
        assertEquals("OK", ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tTalhão Norte\t1e2"));
    }

    @Test
    void nomeEmBrancoEhReprovadoPeloValidador() {
        assertEquals("ERRO\tO nome do talhão é obrigatório.",
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\t   \t2.5"));
    }

    @Test
    void areaZeroOuNegativaEhReprovadaPeloValidador() {
        String esperado = "ERRO\tA área do talhão deve ser um número finito maior que zero.";
        assertEquals(esperado, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t0"));
        assertEquals(esperado, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t-3.5"));
    }

    @Test
    void naNEInfinitoSaoReprovados() {
        // Double.valueOf("NaN") e Double.valueOf("Infinity") são aceitos pelo parse,
        // mas o validador precisa barrá-los.
        String esperado = "ERRO\tA área do talhão deve ser um número finito maior que zero.";
        assertEquals(esperado, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\tNaN"));
        assertEquals(esperado, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\tInfinity"));
        assertEquals(esperado, ProcessadorDeValidacao.processar("VALIDAR_TALHAO\tNorte\t-Infinity"));
    }

    @Test
    void nomeEAreaAusentesGeramDoisErrosNaMesmaLinha() {
        assertEquals("ERRO\tO nome do talhão é obrigatório.\tA área do talhão é obrigatória.",
                ProcessadorDeValidacao.processar("VALIDAR_TALHAO\t\t"));
    }

    @Test
    void respostaEhSempreUmaUnicaLinhaNoFormatoOkOuErro() {
        List<String> pedidos = List.of(
                "VALIDAR_TALHAO\tTalhão Norte\t2.5",
                "VALIDAR_TALHAO\t\t2.5",
                "VALIDAR_TALHAO\tTalhão Norte\tabc",
                "VALIDAR_TALHAO\tTalhão Norte\t",
                "VALIDAR_TALHAO\tTalhão Norte\t-1",
                "lixo");

        for (String pedido : pedidos) {
            String resposta = ProcessadorDeValidacao.processar(pedido);

            assertFalse(resposta.contains("\n") || resposta.contains("\r"),
                    "resposta com quebra de linha para: " + pedido);
            assertTrue(resposta.equals("OK") || resposta.startsWith("ERRO\t"),
                    "formato inesperado para: " + pedido + " -> " + resposta);
        }
    }
}

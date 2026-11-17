package sentinela.validacao;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

/** Regras de negócio do talhão: nome obrigatório e área finita maior que zero. */
class ValidadorTalhaoTest {

    private static final String ERRO_NOME = "O nome do talhão é obrigatório.";
    private static final String ERRO_AREA_AUSENTE = "A área do talhão é obrigatória.";
    private static final String ERRO_AREA_INVALIDA = "A área do talhão deve ser um número finito maior que zero.";

    // ---------- caso válido ----------

    @Test
    void nomeEAreaValidosNaoGeramErros() {
        assertTrue(ValidadorTalhao.validarTalhao("Talhão Norte", 2.5).isEmpty());
    }

    @Test
    void nomeComEspacosNasPontasEhValido() {
        assertTrue(ValidadorTalhao.validarTalhao("  Talhão Norte  ", 2.5).isEmpty());
    }

    @Test
    void areaPositivaMuitoPequenaEhValida() {
        assertTrue(ValidadorTalhao.validarTalhao("Canteiro", 0.01).isEmpty());
    }

    // ---------- nome ----------

    @Test
    void nomeNuloEhObrigatorio() {
        assertEquals(List.of(ERRO_NOME), ValidadorTalhao.validarTalhao(null, 2.5));
    }

    @Test
    void nomeVazioEhObrigatorio() {
        assertEquals(List.of(ERRO_NOME), ValidadorTalhao.validarTalhao("", 2.5));
    }

    @Test
    void nomeSoComEspacosOuTabEhObrigatorio() {
        assertEquals(List.of(ERRO_NOME), ValidadorTalhao.validarTalhao("   ", 2.5));
        assertEquals(List.of(ERRO_NOME), ValidadorTalhao.validarTalhao(" \t ", 2.5));
    }

    // ---------- área ----------

    @Test
    void areaNulaEhObrigatoria() {
        assertEquals(List.of(ERRO_AREA_AUSENTE), ValidadorTalhao.validarTalhao("Norte", null));
    }

    @Test
    void areaZeroOuNegativaEhInvalida() {
        assertEquals(List.of(ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("Norte", 0.0));
        assertEquals(List.of(ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("Norte", -0.0));
        assertEquals(List.of(ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("Norte", -1.0));
    }

    @Test
    void areaNaNEInfinitoSaoInvalidas() {
        assertEquals(List.of(ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("Norte", Double.NaN));
        assertEquals(List.of(ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("Norte", Double.POSITIVE_INFINITY));
        assertEquals(List.of(ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("Norte", Double.NEGATIVE_INFINITY));
    }

    // ---------- combinações ----------

    @Test
    void errosDeNomeEAreaSaoAcumuladosNessaOrdem() {
        assertEquals(List.of(ERRO_NOME, ERRO_AREA_AUSENTE), ValidadorTalhao.validarTalhao(null, null));
        assertEquals(List.of(ERRO_NOME, ERRO_AREA_INVALIDA), ValidadorTalhao.validarTalhao("", -5.0));
    }

    // ---------- contratos de que o ProcessadorDeValidacao depende ----------

    @Test
    void listaRetornadaEhModificavel() {
        // O ProcessadorDeValidacao faz erros.add(...) na lista devolvida.
        // Se alguém trocar por List.of(), aquele ponto quebra: este teste avisa antes.
        List<String> erros = ValidadorTalhao.validarTalhao("Norte", 2.5);

        assertDoesNotThrow(() -> erros.add("extra"));
    }

    @Test
    void cadaChamadaDevolveUmaListaNova() {
        List<String> primeira = ValidadorTalhao.validarTalhao("Norte", 2.5);
        List<String> segunda = ValidadorTalhao.validarTalhao("Norte", 2.5);

        assertNotSame(primeira, segunda);
    }
}

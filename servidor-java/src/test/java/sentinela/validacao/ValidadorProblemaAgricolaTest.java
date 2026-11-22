package sentinela.validacao;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import sentinela.protocolo.ProcessadorDeValidacao;

public class ValidadorProblemaAgricolaTest {
    private static int total;
    private static final Instant REF = Instant.parse("2026-11-17T12:00:00Z");
    private static CamposProblemaAgricola minimo() {
        CamposProblemaAgricola c = new CamposProblemaAgricola();
        c.nomeComum = "Problema"; c.tipo = "praga"; c.descricao = "Descrição";
        c.culturasAfetadasIds = Collections.singletonList("000000000000000000000001");
        c.fontesIds = c.culturasAfetadasIds;
        c.sintomas = Collections.unmodifiableList(Arrays.asList("Segundo", "Primeiro"));
        c.medidasPreventivas = Collections.singletonList("Texto");
        CamposProblemaAgricola.FormaControle f = new CamposProblemaAgricola.FormaControle();
        f.tipo = "manual"; f.descricao = "Texto";
        c.formasControle = Collections.singletonList(f); c.ativo = false;
        c.revisaoEditorial = new CamposProblemaAgricola.RevisaoEditorial(); c.revisaoEditorial.status = "pendente";
        return c;
    }
    private static void conferir(boolean valido, CamposProblemaAgricola c) {
        List<String> erros = ValidadorProblemaAgricola.validarProblemaAgricola(c, REF);
        if (erros.isEmpty() != valido) throw new AssertionError("Caso " + total + ": " + erros);
        total++;
    }
    public static void main(String[] args) {
        CamposProblemaAgricola c = minimo(); conferir(true, c);
        List<String> sintomas = c.sintomas;
        c.chips = Arrays.asList("rótulo", "rótulo");
        c.formasControle.get(0).exemplosControle = Arrays.asList("Exemplo", "Exemplo");
        c.revisaoEditorial.registroAgrofitConferido = false; c.revisaoEditorial.fotoPendente = false;
        c.imagens = Collections.unmodifiableList(Arrays.asList(
            new ImagemOcorrencia("https://example.com/a", " 2 ", null, REF.plusSeconds(1)),
            new ImagemOcorrencia("https://example.com/b", " 1 ", null, REF)));
        conferir(true, c);
        if (c.sintomas != sintomas || !c.sintomas.equals(Arrays.asList("Segundo", "Primeiro"))
                || !c.imagens.get(0).publicId.equals(" 2 ") || c.revisaoEditorial.fotoPendente != Boolean.FALSE)
            throw new AssertionError("Entradas modificadas");
        total++;
        c.revisaoEditorial = null; conferir(false, c);
        c.revisadoEm = REF; c.ativo = true; conferir(true, c);
        c.revisadoEm = REF.plusNanos(1); conferir(false, c);
        c = minimo(); c.formasControle = Collections.singletonList(null); conferir(false, c);
        c = minimo(); c.niveisAtencao = new CamposProblemaAgricola.NiveisAtencao(); conferir(false, c);
        c = minimo(); c.nomeComum = "🌱".repeat(200); conferir(true, c);
        c.nomeComum += "🌱"; conferir(false, c);
        List<String> vazia = ValidadorProblemaAgricola.validarProblemaAgricola(new CamposProblemaAgricola(), REF);
        if (vazia.size() != 10) throw new AssertionError("Acúmulo: " + vazia);
        total++;
        if (ValidadorProblemaAgricola.validarProblemaAgricola(minimo(), null).isEmpty()) throw new AssertionError("Referência ausente");
        total++;
        for (String entrada : Arrays.asList("VALIDAR_PROBLEMA_AGRICOLA", "VALIDAR_PROBLEMA_AGRICOLA\t", "VALIDAR_PROBLEMA_AGRICOLA\r")) {
            if (!ProcessadorDeValidacao.processar(entrada).equals("ERRO\tPedido de validação inválido.")) throw new AssertionError("Estrutura");
            total++;
        }
        System.out.println("OK: " + total + " verificações diretas de problema agrícola.");
    }
}

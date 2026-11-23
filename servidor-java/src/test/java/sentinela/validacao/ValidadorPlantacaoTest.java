package sentinela.validacao;

import java.time.Instant;

public class ValidadorPlantacaoTest {
    public static void main(String[] args) {
        Instant agora = Instant.parse("2026-11-15T12:00:00Z");
        if (ValidadorPlantacao.validarPlantacao(null, null, null, null, "ativa", null, null, null).size() != 1)
            throw new AssertionError("Referência obrigatória");
        if (!ValidadorPlantacao.validarPlantacao(null, null, agora, 1.0, "encerrada", agora, null, agora).isEmpty())
            throw new AssertionError("Igualdade das datas");
        if (ValidadorPlantacao.validarPlantacao("", "", agora.plusSeconds(2), 0.0, "encerrada",
                agora.plusSeconds(1), "", agora).size() != 6) throw new AssertionError("Acumulação");
        System.out.println("OK: 3 verificações diretas de plantação.");
    }
}

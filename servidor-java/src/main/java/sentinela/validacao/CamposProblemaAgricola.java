package sentinela.validacao;

import java.time.Instant;
import java.util.List;

// Entradas de validação, sem comportamento de persistência ou defaults.
public class CamposProblemaAgricola {
    public String nomeComum, nomeCientifico, tipo, descricao;
    public List<String> culturasAfetadasIds, sintomas, medidasPreventivas, fontesIds;
    public List<FormaControle> formasControle;
    public Boolean ativo;
    public Instant revisadoEm;
    public List<String> partesAfetadas, condicoesFavoraveis, chips, danos, boasPraticas;
    public String informacoesDisseminacao, orientacaoBuscaAgronomo, codigoEditorial;
    public String ondeOlhar, dicaDeCampo, perdaEstimada, epocaPropicia, abrangenciaCulturas, tratamentoIntro;
    public List<ImagemOcorrencia> imagens;
    public NiveisAtencao niveisAtencao;
    public RevisaoEditorial revisaoEditorial;

    public static class FormaControle {
        public String tipo, descricao, observacoes, classe;
        public List<String> exemplosControle;
    }
    public static class NiveisAtencao {
        public String baixo, medio, alto;
    }
    public static class RevisaoEditorial {
        public String status, observacoes;
        public Boolean registroAgrofitConferido, fotoPendente;
    }
}

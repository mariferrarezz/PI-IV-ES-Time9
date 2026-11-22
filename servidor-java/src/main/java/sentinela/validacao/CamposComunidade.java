package sentinela.validacao;

import java.time.Instant;
import java.util.List;

// Entradas de validação, sem identidade de persistência.
public final class CamposComunidade {
    private CamposComunidade() {}
    public static class Metodo {
        public String tipoMedida, descricao, observacoes;
    }
    public static class Foto {
        public String url, publicId, legenda;
    }
    public static class Resultado {
        public String resultado, observacoes;
        public Instant dataAvaliacao;
    }
    public static class Regiao {
        public String municipio, estado;
    }
    public static class Moderacao {
        public String status, motivo;
        public boolean revisorPresente;
        public Instant revisadoEm;
    }
    public static class Experiencia {
        public String nomePublico, culturaNome, tipoProblema, statusOcorrencia, titulo, relato, problemaNome;
        public boolean problemaAgricolaPresente, tratamentoOrigemPresente, avaliacaoOrigemPresente;
        public Metodo metodo;
        public Resultado resultadoRelatado;
        public Regiao regiao;
        public Long versao;
        public Moderacao moderacao;
        public Instant publicadoEm, criadoEm, atualizadoEm;
        public List<Foto> fotos;
    }
    public static class Planejamento {
        public String descricao, observacoes;
        public Instant dataPrevista;
    }
    public static class Adocao {
        public Long experienciaVersao;
        public Metodo metodoCopiado;
        public Planejamento planejamento;
        public String status;
        public boolean tratamentoPresente;
        public Instant criadoEm, atualizadoEm;
    }
    public static class Denuncia {
        public String motivo, descricao, status, decisao, justificativa;
        public boolean analistaPresente;
        public Instant analisadoEm, criadoEm, atualizadoEm;
    }
}

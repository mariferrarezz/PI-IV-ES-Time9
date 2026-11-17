package sentinela.validacao;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import static sentinela.validacao.RegrasComunidade.*;

public final class ValidadorDenunciaComunidade {
    public static List<String> validarDenunciaComunidade(CamposComunidade.Denuncia c,Instant ref) {
        List<String> e=new ArrayList<>();
        if(c==null){e.add("A denúncia é obrigatória.");return e;}
        enumero(e,c.motivo,"Motivo","dados_pessoais","conteudo_inadequado","informacao_perigosa","outro");
        texto(e,c.descricao,"Descrição da denúncia",1,2000,false);
        enumero(e,c.status,"Status da denúncia","pendente","analisada");
        if(c.decisao!=null)enumero(e,c.decisao,"Decisão","manter_publicacao","ocultar_publicacao");
        texto(e,c.justificativa,"Justificativa",1,2000,false);
        if("pendente".equals(c.status)&&(c.decisao!=null||c.justificativa!=null||c.analistaPresente||c.analisadoEm!=null))e.add("Denúncia pendente exige ausência da análise.");
        if("analisada".equals(c.status)) {
            if(c.decisao==null)e.add("A decisão é obrigatória.");
            if(c.justificativa==null)e.add("A justificativa é obrigatória.");
            if(!c.analistaPresente)e.add("O analista é obrigatório.");
            data(e,c.analisadoEm,"Data de análise");
        }
        data(e,c.criadoEm,"Criação");data(e,c.atualizadoEm,"Atualização");data(e,ref,"Instante de referência");
        decisaoTemporal(e,c.analisadoEm,c.criadoEm,ref,"A análise");
        return e;
    }
}

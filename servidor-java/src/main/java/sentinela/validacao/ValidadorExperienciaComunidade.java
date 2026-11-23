package sentinela.validacao;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import static sentinela.validacao.RegrasComunidade.*;

public final class ValidadorExperienciaComunidade {
    public static List<String> validarExperienciaComunidade(CamposComunidade.Experiencia c, Instant ref) {
        List<String> e = new ArrayList<>();
        if (c == null) { e.add("A experiência é obrigatória."); return e; }
        texto(e,c.nomePublico,"Nome público",2,80,true);
        texto(e,c.culturaNome,"Nome da cultura",1,200,true);
        texto(e,c.problemaNome,"Nome do problema",1,200,c.problemaAgricolaPresente);
        enumero(e,c.tipoProblema,"Tipo de problema","praga","doenca","deficiencia","nao_identificado");
        enumero(e,c.statusOcorrencia,"Status da ocorrência","aberta","em_acompanhamento","encerrada");
        texto(e,c.titulo,"Título",1,150,true); texto(e,c.relato,"Relato",1,5000,true);
        if ("nao_identificado".equals(c.tipoProblema) && c.problemaAgricolaPresente) e.add("Problema não identificado não pode ter referência agrícola.");
        metodo(e,c.metodo,c.tratamentoOrigemPresente);
        if (c.avaliacaoOrigemPresente && (!c.tratamentoOrigemPresente || c.resultadoRelatado == null)) e.add("Avaliação de origem exige tratamento e resultado relatado.");
        if (c.resultadoRelatado != null) {
            if (!c.avaliacaoOrigemPresente) e.add("Resultado relatado exige avaliação de origem.");
            enumero(e,c.resultadoRelatado.resultado,"Resultado","melhora_observada","sem_mudanca","piora_observada","inconclusivo");
            data(e,c.resultadoRelatado.dataAvaliacao,"Data de avaliação");
            if (ref != null && c.resultadoRelatado.dataAvaliacao != null && c.resultadoRelatado.dataAvaliacao.isAfter(ref)) e.add("A data de avaliação não pode ser futura.");
            texto(e,c.resultadoRelatado.observacoes,"Observações do resultado",1,5000,false);
        }
        if (c.regiao != null) {
            if(c.regiao.municipio == null && c.regiao.estado == null) e.add("A região exige município ou estado.");
            texto(e,c.regiao.municipio,"Município",1,150,false);
            if(c.regiao.estado != null) enumero(e,c.regiao.estado,"UF","AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO");
        }
        versao(e,c.versao); data(e,c.criadoEm,"Criação"); data(e,c.atualizadoEm,"Atualização"); data(e,ref,"Instante de referência");
        if(c.publicadoEm != null) {
            if(c.criadoEm != null && c.publicadoEm.isBefore(c.criadoEm)) e.add("A publicação não pode anteceder a criação.");
            if(c.atualizadoEm != null && c.publicadoEm.isAfter(c.atualizadoEm)) e.add("A publicação não pode superar a atualização.");
        }
        moderacao(e,c,ref);
        if(c.fotos != null) {
            if(c.fotos.size()>5) e.add("A experiência deve ter no máximo 5 fotos.");
            Set<String> ids = new HashSet<>();
            for(CamposComunidade.Foto f:c.fotos) {
                if(f==null){e.add("A foto é obrigatória.");continue;}
                if(!https(f.url))e.add("A URL da foto deve ser HTTPS válida e ter no máximo 2048 caracteres.");
                texto(e,f.publicId,"publicId",1,Integer.MAX_VALUE,true);
                if(f.publicId!=null && !ids.add(f.publicId))e.add("O publicId não pode se repetir no registro.");
                texto(e,f.legenda,"Legenda",1,300,false);
            }
        }
        return e;
    }
    private static void moderacao(List<String> e,CamposComunidade.Experiencia c,Instant ref) {
        CamposComunidade.Moderacao m=c.moderacao;
        if(m==null){e.add("A moderação é obrigatória.");return;}
        enumero(e,m.status,"Moderação","pendente","aprovada","rejeitada","oculta","retirada");
        boolean motivoObrigatorio = "rejeitada".equals(m.status) || "oculta".equals(m.status);
        texto(e,m.motivo,"Motivo da moderação",1,2000,motivoObrigatorio);
        if("pendente".equals(m.status) && (m.revisorPresente||m.revisadoEm!=null||m.motivo!=null))e.add("Moderação pendente exige ausência da última decisão.");
        if("aprovada".equals(m.status)||"rejeitada".equals(m.status)||"oculta".equals(m.status)) {
            if(!m.revisorPresente)e.add("O revisor é obrigatório.");
            data(e,m.revisadoEm,"Data de revisão");
        }
        if("retirada".equals(m.status) && (m.revisorPresente!=(m.revisadoEm!=null) || (m.motivo!=null&&!m.revisorPresente)))e.add("A decisão preservada exige revisor e data juntos.");
        if("aprovada".equals(m.status))data(e,c.publicadoEm,"Publicação");
        decisaoTemporal(e,m.revisadoEm,c.criadoEm,ref,"A revisão");
    }
}

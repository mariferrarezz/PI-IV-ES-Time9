package sentinela.protocolo;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import sentinela.validacao.CamposComunidade.*;
import sentinela.validacao.ValidadorExperienciaComunidade;
import sentinela.validacao.ValidadorAdocaoTratamento;
import sentinela.validacao.ValidadorDenunciaComunidade;

final class ParserComunidade {
    private final String[] partes;
    private int posicao=1;
    private final List<String> conversao=new ArrayList<>();
    private ParserComunidade(String[] p) { partes=p; }
    static String processar(String[] p) {
        try {
            int fixas=p[0].equals("VALIDAR_EXPERIENCIA_COMUNIDADE")?40:p[0].equals("VALIDAR_ADOCAO_TRATAMENTO")?16:14;
            if(p.length<fixas || (fixas!=40&&p.length!=fixas))throw new IllegalArgumentException();
            for(int i=1;i<p.length;i++)p[i]=CodecDeCampos.decodificar(p[i]);
            if(fixas==40) {
                boolean fotos=marcador(p[38]);
                int n=contagem(p[39]);
                if((!fotos&&n!=0)||40L+4L*n!=p.length)throw new IllegalArgumentException();
            }
            ParserComunidade c=new ParserComunidade(p);
            List<String> erros=fixas==40?c.experiencia():fixas==16?c.adocao():c.denuncia();
            if(c.posicao!=p.length)throw new IllegalArgumentException();
            return ProcessadorDeValidacao.montarResposta(c.conversao.isEmpty()?erros:c.conversao);
        } catch(IllegalArgumentException e){return "ERRO\tPedido de validação inválido.";}
    }
    private String ler(){if(posicao>=partes.length)throw new IllegalArgumentException();return partes[posicao++];}
    private static boolean marcador(String v){if(!v.equals("0")&&!v.equals("1"))throw new IllegalArgumentException();return v.equals("1");}
    private boolean flag(){return marcador(ler());}
    private static int contagem(String v){if(!v.matches("0|[1-9][0-9]*"))throw new IllegalArgumentException();return Integer.parseInt(v);}
    private String opcional(){boolean p=flag();String v=ler();if(!p&&!v.isEmpty())throw new IllegalArgumentException();return p?v:null;}
    private Instant data(String campo){return ProcessadorDeValidacao.data(ler(),campo,conversao);}
    private Long versao(){String v=ler();if(v.isEmpty())return null;if(!v.matches("-?[0-9]+"))throw new IllegalArgumentException();return Long.valueOf(v);}
    private void ausencia(boolean presente,int inicio,String... esperados){
        if(!presente)for(int i=0;i<esperados.length;i++)if(!partes[inicio+i].equals(esperados[i]))throw new IllegalArgumentException();
    }
    private Metodo metodo(){
        boolean presente=flag();int inicio=posicao;
        Metodo m=new Metodo();m.tipoMedida=ler();m.descricao=ler();m.observacoes=opcional();
        ausencia(presente,inicio,"","","0","");return presente?m:null;
    }
    private List<String> experiencia(){
        Experiencia c=new Experiencia();
        c.nomePublico=ler();c.culturaNome=ler();c.tipoProblema=ler();c.statusOcorrencia=ler();c.titulo=ler();c.relato=ler();
        c.problemaAgricolaPresente=flag();c.problemaNome=opcional();c.tratamentoOrigemPresente=flag();c.avaliacaoOrigemPresente=flag();
        c.metodo=metodo();
        boolean presente=flag();int inicio=posicao;
        Resultado r=new Resultado();r.resultado=ler();r.dataAvaliacao=data("A data de avaliação");r.observacoes=opcional();
        ausencia(presente,inicio,"","","0","");c.resultadoRelatado=presente?r:null;
        presente=flag();inicio=posicao;Regiao regiao=new Regiao();regiao.municipio=opcional();regiao.estado=opcional();
        ausencia(presente,inicio,"0","","0","");c.regiao=presente?regiao:null;
        c.versao=versao();presente=flag();inicio=posicao;Moderacao m=new Moderacao();
        m.status=ler();m.revisorPresente=flag();m.revisadoEm=data("A data de revisão");m.motivo=opcional();
        ausencia(presente,inicio,"","0","","0","");c.moderacao=presente?m:null;
        c.publicadoEm=data("A data de publicação");c.criadoEm=data("A data de criação");c.atualizadoEm=data("A data de atualização");
        Instant ref=data("O instante de referência");
        boolean fotos=flag();int n=contagem(ler());
        if(fotos)c.fotos=new ArrayList<>();
        for(int i=0;i<n;i++){Foto f=new Foto();f.url=ler();f.publicId=ler();f.legenda=opcional();c.fotos.add(f);}
        return ValidadorExperienciaComunidade.validarExperienciaComunidade(c,ref);
    }
    private List<String> adocao(){
        Adocao c=new Adocao();c.experienciaVersao=versao();c.metodoCopiado=metodo();
        boolean presente=flag();int inicio=posicao;Planejamento p=new Planejamento();
        p.descricao=ler();p.dataPrevista=data("A data prevista");p.observacoes=opcional();
        ausencia(presente,inicio,"","","0","");c.planejamento=presente?p:null;
        c.status=ler();c.tratamentoPresente=flag();c.criadoEm=data("A data de criação");c.atualizadoEm=data("A data de atualização");
        return ValidadorAdocaoTratamento.validarAdocaoTratamento(c);
    }
    private List<String> denuncia(){
        Denuncia c=new Denuncia();c.motivo=ler();c.descricao=opcional();c.status=ler();c.decisao=opcional();c.justificativa=opcional();
        c.analistaPresente=flag();c.analisadoEm=data("A data de análise");c.criadoEm=data("A data de criação");c.atualizadoEm=data("A data de atualização");Instant ref=data("O instante de referência");
        return ValidadorDenunciaComunidade.validarDenunciaComunidade(c,ref);
    }
}

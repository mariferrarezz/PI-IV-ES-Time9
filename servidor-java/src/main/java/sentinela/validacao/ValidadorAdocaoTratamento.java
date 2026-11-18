package sentinela.validacao;
import java.util.ArrayList;
import java.util.List;
import static sentinela.validacao.RegrasComunidade.*;

public final class ValidadorAdocaoTratamento {
    public static List<String> validarAdocaoTratamento(CamposComunidade.Adocao c) {
        List<String> e=new ArrayList<>();
        if(c==null){e.add("A adoção é obrigatória.");return e;}
        versao(e,c.experienciaVersao); metodo(e,c.metodoCopiado,true);
        if(c.planejamento==null)e.add("O planejamento é obrigatório.");
        else {texto(e,c.planejamento.descricao,"Descrição do planejamento",1,5000,true);texto(e,c.planejamento.observacoes,"Observações do planejamento",1,5000,false);}
        enumero(e,c.status,"Status da adoção","planejada","realizada","cancelada");
        if("realizada".equals(c.status) != c.tratamentoPresente)e.add("Tratamento deve estar presente somente na adoção realizada.");
        data(e,c.criadoEm,"Criação");data(e,c.atualizadoEm,"Atualização");
        return e;
    }
}

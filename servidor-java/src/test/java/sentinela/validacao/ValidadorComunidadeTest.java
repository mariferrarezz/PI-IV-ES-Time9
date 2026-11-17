package sentinela.validacao;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import sentinela.validacao.CamposComunidade.*;

public class ValidadorComunidadeTest {
    private static int total;
    private static final Instant REF=Instant.parse("2026-11-17T12:00:00Z");
    private static void conferir(boolean ok){total++;if(!ok)throw new AssertionError("Verificação "+total);}
    private static Experiencia experiencia(){
        Experiencia c=new Experiencia();c.nomePublico="Pessoa";c.culturaNome="Milho";c.tipoProblema="praga";c.statusOcorrencia="aberta";
        c.titulo="Título";c.relato="Relato";c.versao=1L;c.criadoEm=REF;c.atualizadoEm=REF;c.moderacao=new Moderacao();c.moderacao.status="pendente";return c;
    }
    public static void main(String[] args){
        Experiencia c=experiencia();conferir(ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c.nomePublico="🌱".repeat(80);conferir(ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c.nomePublico="🌱".repeat(81);conferir(!ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c=experiencia();c.regiao=new Regiao();conferir(!ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c.regiao.estado="SP";conferir(ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        Foto foto=new Foto();foto.url="https://example.com/a";foto.publicId=" original\\id\t ";c.fotos=Collections.singletonList(foto);
        conferir(ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());conferir(foto.publicId.equals(" original\\id\t "));
        c.fotos=Collections.nCopies(2,foto);conferir(!ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c=experiencia();c.moderacao.status="aprovada";c.moderacao.revisorPresente=true;c.moderacao.revisadoEm=REF;c.publicadoEm=REF;
        conferir(ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c.moderacao.revisadoEm=REF.plusNanos(1);conferir(!ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        c.moderacao.status="retirada";c.moderacao.revisorPresente=false;c.moderacao.revisadoEm=null;conferir(ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF).isEmpty());
        for (String status : new String[] {"rejeitada", "oculta"}) {
            c=experiencia();c.moderacao.status=status;c.moderacao.revisorPresente=true;c.moderacao.revisadoEm=REF;
            for (String motivo : new String[] {null, "", "🌱".repeat(2001)}) {
                c.moderacao.motivo=motivo;
                List<String> motivoErros=ValidadorExperienciaComunidade.validarExperienciaComunidade(c,REF);
                conferir(motivoErros.size()==1);
                conferir(motivoErros.get(0).startsWith("Motivo da moderação"));
            }
        }
        List<String> erros=ValidadorExperienciaComunidade.validarExperienciaComunidade(new Experiencia(),null);conferir(erros.size()>8);
        Adocao a=new Adocao();a.experienciaVersao=Long.MAX_VALUE;a.metodoCopiado=new Metodo();a.metodoCopiado.tipoMedida="quimica";a.metodoCopiado.descricao="Método";
        a.planejamento=new Planejamento();a.planejamento.descricao="Planejamento";a.planejamento.dataPrevista=REF.plusSeconds(100);a.status="planejada";a.criadoEm=REF;a.atualizadoEm=REF;
        conferir(ValidadorAdocaoTratamento.validarAdocaoTratamento(a).isEmpty());
        a.status="realizada";conferir(!ValidadorAdocaoTratamento.validarAdocaoTratamento(a).isEmpty());a.tratamentoPresente=true;conferir(ValidadorAdocaoTratamento.validarAdocaoTratamento(a).isEmpty());
        Denuncia d=new Denuncia();d.motivo="outro";d.status="pendente";d.criadoEm=REF;d.atualizadoEm=REF;
        conferir(ValidadorDenunciaComunidade.validarDenunciaComunidade(d,REF).isEmpty());
        d.status="analisada";conferir(ValidadorDenunciaComunidade.validarDenunciaComunidade(d,REF).size()==4);
        d.decisao="manter_publicacao";d.justificativa="Justificativa";d.analistaPresente=true;d.analisadoEm=REF;
        conferir(ValidadorDenunciaComunidade.validarDenunciaComunidade(d,REF).isEmpty());
        d.analisadoEm=REF.minusNanos(1);conferir(!ValidadorDenunciaComunidade.validarDenunciaComunidade(d,REF).isEmpty());
        for(int i=0;i<100;i++){
            String ddd=String.format("%02d",i);
            List<String> r=ValidadorPerfil.validarCadastroPerfil("Pessoa","52998224725","+55"+ddd+"999999999","sms");
            conferir(r.isEmpty()==DddsBrasileiros.valido(ddd));
        }
        System.out.println("OK: "+total+" verificações diretas de Comunidade e DDD.");
    }
}

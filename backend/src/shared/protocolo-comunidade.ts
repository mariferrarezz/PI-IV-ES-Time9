import { codificarCampoProtocolo } from "./codec-validacao";
import { AppError } from "./errors";

export interface MetodoComunidade { tipoMedida?: string; descricao?: string; observacoes?: string }
export interface FotoComunidade { url: string; publicId: string; legenda?: string }
export interface ExperienciaComunidade {
  nomePublico?: string; culturaNome?: string; tipoProblema?: string; statusOcorrencia?: string;
  titulo?: string; relato?: string; problemaNome?: string;
  metodo?: MetodoComunidade;
  resultadoRelatado?: { resultado?: string; dataAvaliacao?: Date; observacoes?: string };
  regiao?: { municipio?: string; estado?: string };
  fotos?: FotoComunidade[];
}
// Metadados resolvidos pelo código chamador; não representam um body HTTP.
export interface MetadadosExperienciaComunidade {
  problemaAgricolaPresente: boolean; tratamentoOrigemPresente: boolean; avaliacaoOrigemPresente: boolean;
  versao?: bigint;
  moderacao?: { status?: string; revisorPresente: boolean; revisadoEm?: Date; motivo?: string };
  publicadoEm?: Date; criadoEm?: Date; atualizadoEm?: Date;
}
export interface AdocaoTratamento { metodoCopiado?: MetodoComunidade; planejamento?: { descricao?: string; dataPrevista?: Date; observacoes?: string } }
export interface MetadadosAdocaoTratamento { experienciaVersao?: bigint; status?: string; tratamentoPresente: boolean; criadoEm?: Date; atualizadoEm?: Date }
export interface DenunciaComunidade { motivo?: string; descricao?: string }
export interface MetadadosDenunciaComunidade { status?: string; decisao?: string; justificativa?: string; analistaPresente: boolean; analisadoEm?: Date; criadoEm?: Date; atualizadoEm?: Date }

function flag(v: boolean): string {
  if(typeof v!=="boolean")throw new AppError(400,"Indicador de presença inválido.","ENTRADA_INVALIDA");
  return v?"1":"0";
}
function data(v?: Date): string {
  if(v===undefined)return "";
  if(!(v instanceof Date)||!Number.isFinite(v.getTime()))throw new AppError(400,"A data deve ser um instante válido.","DATA_INVALIDA");
  return v.toISOString();
}
function referencia(v: Date): string { if(v===undefined)throw new AppError(400,"O instante de referência é obrigatório.","DATA_INVALIDA");return data(v); }
function versao(v?: bigint): string {
  if(v===undefined)return "";
  if(typeof v!=="bigint"||v<-(1n<<63n)||v>(1n<<63n)-1n)throw new AppError(400,"A versão deve ser representável como BSON long.","ENTRADA_INVALIDA");
  return v.toString();
}
const opcional=(v?: string): string[]=>v===undefined?["0",""]:["1",v];
const metodo=(v?: MetodoComunidade): string[]=>[v===undefined?"0":"1",v?.tipoMedida??"",v?.descricao??"",...opcional(v?.observacoes)];
const pedido=(p: string[]): string=>p.map(codificarCampoProtocolo).join("\t")+"\n";

export function montarExperienciaComunidade(c: ExperienciaComunidade,m: MetadadosExperienciaComunidade,ref: Date): string {
  const r=c.resultadoRelatado,g=c.regiao,d=m.moderacao;
  const p=["VALIDAR_EXPERIENCIA_COMUNIDADE",c.nomePublico??"",c.culturaNome??"",c.tipoProblema??"",c.statusOcorrencia??"",c.titulo??"",c.relato??"",
    flag(m.problemaAgricolaPresente),...opcional(c.problemaNome),flag(m.tratamentoOrigemPresente),flag(m.avaliacaoOrigemPresente),...metodo(c.metodo),
    r===undefined?"0":"1",r?.resultado??"",data(r?.dataAvaliacao),...opcional(r?.observacoes),
    g===undefined?"0":"1",...opcional(g?.municipio),...opcional(g?.estado),versao(m.versao),
    d===undefined?"0":"1",d?.status??"",d===undefined?"0":flag(d.revisorPresente),data(d?.revisadoEm),...opcional(d?.motivo),
    data(m.publicadoEm),data(m.criadoEm),data(m.atualizadoEm),referencia(ref),c.fotos===undefined?"0":"1",String(c.fotos?.length??0)];
  for(const f of c.fotos??[])p.push(f.url,f.publicId,...opcional(f.legenda));
  return pedido(p);
}
export function montarAdocaoTratamento(c: AdocaoTratamento,m: MetadadosAdocaoTratamento): string {
  const p=c.planejamento;
  return pedido(["VALIDAR_ADOCAO_TRATAMENTO",versao(m.experienciaVersao),...metodo(c.metodoCopiado),p===undefined?"0":"1",p?.descricao??"",data(p?.dataPrevista),...opcional(p?.observacoes),m.status??"",flag(m.tratamentoPresente),data(m.criadoEm),data(m.atualizadoEm)]);
}
export function montarDenunciaComunidade(c: DenunciaComunidade,m: MetadadosDenunciaComunidade,ref: Date): string {
  return pedido(["VALIDAR_DENUNCIA_COMUNIDADE",c.motivo??"",...opcional(c.descricao),m.status??"",...opcional(m.decisao),...opcional(m.justificativa),flag(m.analistaPresente),data(m.analisadoEm),data(m.criadoEm),data(m.atualizadoEm),referencia(ref)]);
}

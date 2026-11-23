import { AppError } from "./errors";
import { codificarCampoProtocolo } from "./codec-validacao";
import type { MetadadosImagemOcorrencia } from "../services/validacao-java.service";

export interface FormaControleProblema {
  tipo?: string;
  descricao?: string;
  observacoes?: string;
  classe?: string;
  exemplosControle?: string[];
}
export interface NiveisAtencaoProblema { baixo?: string; medio?: string; alto?: string }
export interface RevisaoEditorialProblema {
  status?: string;
  observacoes?: string;
  registroAgrofitConferido?: boolean;
  fotoPendente?: boolean;
}
export interface CamposValidacaoProblemaAgricola {
  nomeComum?: string;
  nomeCientifico?: string;
  tipo?: string;
  descricao?: string;
  culturasAfetadasIds?: string[];
  sintomas?: string[];
  medidasPreventivas?: string[];
  formasControle?: FormaControleProblema[];
  fontesIds?: string[];
  ativo?: boolean;
  revisadoEm?: Date;
  partesAfetadas?: string[];
  condicoesFavoraveis?: string[];
  informacoesDisseminacao?: string;
  orientacaoBuscaAgronomo?: string;
  imagens?: MetadadosImagemOcorrencia[];
  codigoEditorial?: string;
  chips?: string[];
  niveisAtencao?: NiveisAtencaoProblema;
  ondeOlhar?: string;
  dicaDeCampo?: string;
  danos?: string[];
  perdaEstimada?: string;
  epocaPropicia?: string;
  abrangenciaCulturas?: string;
  tratamentoIntro?: string;
  boasPraticas?: string[];
  revisaoEditorial?: RevisaoEditorialProblema;
}

function data(valor: Date | undefined, obrigatoria = false): string {
  if (valor === undefined && !obrigatoria) return "";
  if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
    throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
  return valor.toISOString();
}
function booleano(valor: boolean | undefined): string {
  if (valor === undefined) return "";
  if (typeof valor !== "boolean") throw new AppError(400, "Os indicadores devem ser booleanos.", "ENTRADA_INVALIDA");
  return valor ? "1" : "0";
}
const texto = (valor: string | undefined): string[] => valor === undefined ? ["0", ""] : ["1", valor];
const lista = (valor: unknown[] | undefined): string[] => [valor === undefined ? "0" : "1", String(valor?.length ?? 0)];

// Ordem fixa do contrato de 59 partes; os blocos variáveis vêm somente depois.
export function montarPedidoProblemaAgricola(c: CamposValidacaoProblemaAgricola, instanteReferencia: Date): string {
  const n = c.niveisAtencao, r = c.revisaoEditorial;
  const p = ["VALIDAR_PROBLEMA_AGRICOLA", c.nomeComum ?? "", c.tipo ?? "", c.descricao ?? "",
    ...texto(c.nomeCientifico), ...lista(c.culturasAfetadasIds), ...lista(c.sintomas), ...lista(c.medidasPreventivas),
    ...lista(c.formasControle), ...lista(c.fontesIds), booleano(c.ativo), data(c.revisadoEm), data(instanteReferencia, true),
    ...lista(c.partesAfetadas), ...lista(c.condicoesFavoraveis), ...texto(c.informacoesDisseminacao),
    ...texto(c.orientacaoBuscaAgronomo), ...lista(c.imagens), ...texto(c.codigoEditorial), ...lista(c.chips),
    n === undefined ? "0" : "1", n?.baixo ?? "", n?.medio ?? "", n?.alto ?? "",
    ...texto(c.ondeOlhar), ...texto(c.dicaDeCampo), ...lista(c.danos), ...texto(c.perdaEstimada), ...texto(c.epocaPropicia),
    ...texto(c.abrangenciaCulturas), ...texto(c.tratamentoIntro), ...lista(c.boasPraticas),
    r === undefined ? "0" : "1", r?.status ?? "", ...texto(r?.observacoes),
    booleano(r?.registroAgrofitConferido), booleano(r?.fotoPendente)];
  p.push(...(c.culturasAfetadasIds ?? []), ...(c.sintomas ?? []), ...(c.medidasPreventivas ?? []));
  for (const f of c.formasControle ?? []) {
    p.push(f.tipo ?? "", f.descricao ?? "", ...texto(f.observacoes), ...texto(f.classe), ...lista(f.exemplosControle));
    p.push(...(f.exemplosControle ?? []));
  }
  p.push(...(c.fontesIds ?? []), ...(c.partesAfetadas ?? []), ...(c.condicoesFavoraveis ?? []));
  for (const imagem of c.imagens ?? [])
    p.push(imagem.url, imagem.publicId, ...texto(imagem.legenda), data(imagem.enviadaEm, true));
  p.push(...(c.chips ?? []), ...(c.danos ?? []), ...(c.boasPraticas ?? []));
  return p.map(codificarCampoProtocolo).join("\t") + "\n";
}

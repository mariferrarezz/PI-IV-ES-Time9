import { Socket } from "node:net";
import { configuracaoJava } from "../config/java";
import { AppError } from "../shared/errors";
import { codificarCampoProtocolo } from "../shared/codec-validacao";
import { montarPedidoProblemaAgricola, CamposValidacaoProblemaAgricola } from "../shared/protocolo-problema-agricola";
import { montarExperienciaComunidade, montarAdocaoTratamento, montarDenunciaComunidade,
  ExperienciaComunidade, MetadadosExperienciaComunidade, AdocaoTratamento, MetadadosAdocaoTratamento,
  DenunciaComunidade, MetadadosDenunciaComunidade } from "../shared/protocolo-comunidade";
export type { ExperienciaComunidade, MetadadosExperienciaComunidade, AdocaoTratamento, MetadadosAdocaoTratamento,
  DenunciaComunidade, MetadadosDenunciaComunidade, FotoComunidade, MetodoComunidade } from "../shared/protocolo-comunidade";
export type { CamposValidacaoProblemaAgricola, FormaControleProblema, NiveisAtencaoProblema, RevisaoEditorialProblema } from "../shared/protocolo-problema-agricola";

export interface ResultadoValidacaoTalhao {
  valido: boolean;
  erros: string[];
}

export type ResultadoValidacaoPropriedade = ResultadoValidacaoTalhao;

export class JavaIndisponivelError extends AppError {
  constructor() {
    super(503, "Serviço de validação Java indisponível", "JAVA_INDISPONIVEL");
  }
}

export async function validarTalhaoNoJava(
  nome?: string | null,
  areaHa?: number | string | null,
): Promise<ResultadoValidacaoTalhao> {
  const campos = [nome ?? "", areaHa == null ? "" : String(areaHa)];
  // O protocolo não possui escape para delimitadores dentro dos campos.
  if (campos.some(campo => /[\t\r\n]/.test(campo))) {
    throw new AppError(400, "Os campos não podem conter TAB, CR ou LF.", "CAMPO_INCOMPATIVEL_COM_PROTOCOLO");
  }
  const pedido = `VALIDAR_TALHAO\t${campos.join("\t")}\n`;
  return enviarPedido(pedido);
}

export async function validarPropriedadeNoJava(
  nome?: string | null,
  municipio?: string | null,
  estado?: string | null,
  areaTotalHa?: number | string | null,
  observacoes?: string | null,
): Promise<ResultadoValidacaoPropriedade> {
  const campos = [nome ?? "", municipio ?? "", estado ?? "",
    areaTotalHa == null ? "" : String(areaTotalHa), observacoes == null ? "0" : "1", observacoes ?? ""];
  return enviarPedido(`VALIDAR_PROPRIEDADE\t${campos.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface CamposValidacaoPlantacao {
  variedade?: string;
  safra?: string;
  dataPlantio?: Date;
  areaPlantadaHa?: number | string;
  status?: string;
  dataEncerramento?: Date;
  observacoes?: string;
}
export type ResultadoValidacaoPlantacao = ResultadoValidacaoTalhao;

// Referência fornecida pelo código confiável chamador, fora dos campos de entrada.
export async function validarPlantacaoNoJava(
  campos: CamposValidacaoPlantacao, instanteReferencia: Date,
): Promise<ResultadoValidacaoPlantacao> {
  const data = (valor: Date | undefined, obrigatoria = false): string => {
    if (valor === undefined && !obrigatoria) return "";
    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
      throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
    return valor.toISOString();
  };
  const texto = (valor: string | undefined): string[] => valor === undefined ? ["0", ""] : ["1", valor];
  const partes = [...texto(campos.variedade), ...texto(campos.safra), data(campos.dataPlantio),
    campos.areaPlantadaHa === undefined ? "" : String(campos.areaPlantadaHa), campos.status ?? "",
    data(campos.dataEncerramento), ...texto(campos.observacoes), data(instanteReferencia, true)];
  return enviarPedido(`VALIDAR_PLANTACAO\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface MetadadosImagemOcorrencia {
  url: string;
  publicId: string;
  legenda?: string;
  enviadaEm: Date;
}
export interface CamposValidacaoOcorrencia {
  tipo?: string;
  problemaAgricolaPresente: boolean;
  dataObservacao?: Date;
  sintomas?: string;
  intensidade?: string;
  areaAfetadaHa?: number | string;
  status?: string;
  encerradoEm?: Date;
  motivoEncerramento?: string;
  imagens?: MetadadosImagemOcorrencia[];
}
export type ResultadoValidacaoOcorrencia = ResultadoValidacaoTalhao;

export async function validarOcorrenciaNoJava(
  campos: CamposValidacaoOcorrencia, instanteReferencia: Date,
): Promise<ResultadoValidacaoOcorrencia> {
  const data = (valor: Date | undefined, obrigatoria = false): string => {
    if (valor === undefined && !obrigatoria) return "";
    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
      throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
    return valor.toISOString();
  };
  if (typeof campos.problemaAgricolaPresente !== "boolean")
    throw new AppError(400, "O indicador de problema agrícola deve ser booleano.", "ENTRADA_INVALIDA");
  const texto = (valor: string | undefined): string[] => valor === undefined ? ["0", ""] : ["1", valor];
  const partes = [campos.tipo ?? "", campos.problemaAgricolaPresente ? "1" : "0",
    data(campos.dataObservacao), campos.sintomas ?? "", campos.intensidade ?? "",
    campos.areaAfetadaHa === undefined ? "" : String(campos.areaAfetadaHa), campos.status ?? "",
    data(campos.encerradoEm), ...texto(campos.motivoEncerramento), data(instanteReferencia, true),
    campos.imagens === undefined ? "0" : "1", String(campos.imagens?.length ?? 0)];
  for (const imagem of campos.imagens ?? [])
    partes.push(imagem.url, imagem.publicId, ...texto(imagem.legenda), data(imagem.enviadaEm, true));
  return enviarPedido(`VALIDAR_OCORRENCIA\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface CamposValidacaoMonitoramento {
  ocorrenciaPresente: boolean;
  dataObservacao?: Date;
  problemaObservado?: boolean;
  observacoes?: string;
  intensidade?: string;
  evolucao?: string;
  areaAfetadaHa?: number | string;
  proximaInspecaoEm?: Date;
  imagens?: MetadadosImagemOcorrencia[];
}
export type ResultadoValidacaoMonitoramento = ResultadoValidacaoTalhao;

export async function validarMonitoramentoNoJava(
  campos: CamposValidacaoMonitoramento, instanteReferencia: Date,
): Promise<ResultadoValidacaoMonitoramento> {
  const data = (valor: Date | undefined, obrigatoria = false): string => {
    if (valor === undefined && !obrigatoria) return "";
    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
      throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
    return valor.toISOString();
  };
  if (typeof campos.ocorrenciaPresente !== "boolean" ||
      (campos.problemaObservado !== undefined && typeof campos.problemaObservado !== "boolean"))
    throw new AppError(400, "Os indicadores devem ser booleanos.", "ENTRADA_INVALIDA");
  const texto = (valor: string | undefined): string[] => valor === undefined ? ["0", ""] : ["1", valor];
  const partes = [campos.ocorrenciaPresente ? "1" : "0", data(campos.dataObservacao),
    campos.problemaObservado === undefined ? "" : campos.problemaObservado ? "1" : "0",
    campos.observacoes ?? "", ...texto(campos.intensidade), ...texto(campos.evolucao),
    campos.areaAfetadaHa === undefined ? "" : String(campos.areaAfetadaHa), data(campos.proximaInspecaoEm),
    data(instanteReferencia, true), campos.imagens === undefined ? "0" : "1", String(campos.imagens?.length ?? 0)];
  for (const imagem of campos.imagens ?? [])
    partes.push(imagem.url, imagem.publicId, ...texto(imagem.legenda), data(imagem.enviadaEm, true));
  return enviarPedido(`VALIDAR_MONITORAMENTO\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface CamposValidacaoTratamento {
  tipoMedida?: string;
  descricao?: string;
  dataAplicacao?: Date;
  areaTratadaHa?: number | string;
  produtoUtilizado?: string;
  quantidadeUtilizada?: number | string;
  unidadeQuantidade?: string;
  responsavelAplicacao?: string;
  observacoes?: string;
  imagens?: MetadadosImagemOcorrencia[];
}
export type ResultadoValidacaoTratamento = ResultadoValidacaoTalhao;

export async function validarTratamentoNoJava(
  campos: CamposValidacaoTratamento, instanteReferencia: Date,
): Promise<ResultadoValidacaoTratamento> {
  const data = (valor: Date | undefined, obrigatoria = false): string => {
    if (valor === undefined && !obrigatoria) return "";
    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
      throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
    return valor.toISOString();
  };
  const texto = (valor: string | undefined): string[] => valor === undefined ? ["0", ""] : ["1", valor];
  const partes = [campos.tipoMedida ?? "", campos.descricao ?? "", data(campos.dataAplicacao),
    campos.areaTratadaHa === undefined ? "" : String(campos.areaTratadaHa), ...texto(campos.produtoUtilizado),
    campos.quantidadeUtilizada === undefined ? "" : String(campos.quantidadeUtilizada), ...texto(campos.unidadeQuantidade),
    ...texto(campos.responsavelAplicacao), ...texto(campos.observacoes), data(instanteReferencia, true),
    campos.imagens === undefined ? "0" : "1", String(campos.imagens?.length ?? 0)];
  for (const imagem of campos.imagens ?? [])
    partes.push(imagem.url, imagem.publicId, ...texto(imagem.legenda), data(imagem.enviadaEm, true));
  return enviarPedido(`VALIDAR_TRATAMENTO\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface CamposValidacaoAvaliacaoTratamento {
  dataAvaliacao?: Date;
  resultado?: string;
  observacoes?: string;
}
export type ResultadoValidacaoAvaliacaoTratamento = ResultadoValidacaoTalhao;

export async function validarAvaliacaoTratamentoNoJava(
  campos: CamposValidacaoAvaliacaoTratamento, instanteReferencia: Date,
): Promise<ResultadoValidacaoAvaliacaoTratamento> {
  const data = (valor: Date | undefined, obrigatoria = false): string => {
    if (valor === undefined && !obrigatoria) return "";
    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
      throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
    return valor.toISOString();
  };
  // A referência vem do código confiável chamador, separada dos campos HTTP futuros.
  const partes = [data(campos.dataAvaliacao), campos.resultado ?? "", campos.observacoes ?? "",
    data(instanteReferencia, true)];
  return enviarPedido(`VALIDAR_AVALIACAO_TRATAMENTO\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface RespostasValidacaoQuestionario {
  portePropriedade?: string;
  quantidadeCulturas?: string;
  culturasIds?: string[];
  outraCultura?: string;
  problemasFrequentes?: string[];
  frequenciaProblemas?: string;
  identificaProblemasSozinho?: string;
}
export interface MetadadosValidacaoQuestionario {
  versao: string;
  concluidoEm: Date;
}
export type ResultadoValidacaoQuestionario = ResultadoValidacaoTalhao;

export async function validarQuestionarioNoJava(
  respostas: RespostasValidacaoQuestionario, metadados: MetadadosValidacaoQuestionario,
): Promise<ResultadoValidacaoQuestionario> {
  // Metadados são explícitos: não escolha versão nem gere a conclusão silenciosamente.
  if (!(metadados.concluidoEm instanceof Date) || !Number.isFinite(metadados.concluidoEm.getTime()))
    throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
  const partes = [metadados.versao, respostas.portePropriedade ?? "", respostas.quantidadeCulturas ?? "",
    respostas.culturasIds === undefined ? "0" : "1", String(respostas.culturasIds?.length ?? 0),
    respostas.outraCultura === undefined ? "0" : "1", respostas.outraCultura ?? "",
    respostas.problemasFrequentes === undefined ? "0" : "1", String(respostas.problemasFrequentes?.length ?? 0),
    respostas.frequenciaProblemas ?? "", respostas.identificaProblemasSozinho ?? "", metadados.concluidoEm.toISOString(),
    ...(respostas.culturasIds ?? []), ...(respostas.problemasFrequentes ?? [])];
  return enviarPedido(`VALIDAR_QUESTIONARIO\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface CamposValidacaoCadastroPerfil {
  nomeCompleto?: string;
  cpf?: string;
  telefoneCanonico?: string;
  canalCodigoPreferido?: string;
}
export interface CamposValidacaoOpcionaisPerfil {
  nomePublico?: string;
  fotoPerfil?: MetadadosImagemOcorrencia;
}
export type ResultadoValidacaoPerfil = ResultadoValidacaoTalhao;

export async function validarCadastroPerfilNoJava(campos: CamposValidacaoCadastroPerfil): Promise<ResultadoValidacaoPerfil> {
  const partes = [campos.nomeCompleto ?? "", campos.cpf ?? "", campos.telefoneCanonico ?? "", campos.canalCodigoPreferido ?? ""];
  return enviarPedido(`VALIDAR_CADASTRO_PERFIL\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export async function validarOpcionaisPerfilNoJava(campos: CamposValidacaoOpcionaisPerfil): Promise<ResultadoValidacaoPerfil> {
  const foto = campos.fotoPerfil;
  if (foto && (!(foto.enviadaEm instanceof Date) || !Number.isFinite(foto.enviadaEm.getTime())))
    throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
  const partes = [campos.nomePublico === undefined ? "0" : "1", campos.nomePublico ?? "",
    foto === undefined ? "0" : "1", foto?.url ?? "", foto?.publicId ?? "",
    foto?.legenda === undefined ? "0" : "1", foto?.legenda ?? "", foto?.enviadaEm.toISOString() ?? ""];
  return enviarPedido(`VALIDAR_OPCIONAIS_PERFIL\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export interface CamposValidacaoCultura {
  nome?: string;
  nomeCientifico?: string;
  descricao?: string;
  ativa?: boolean;
  imagem?: MetadadosImagemOcorrencia;
}
export interface CamposValidacaoFonteConhecimento {
  titulo?: string;
  instituicaoOuAutor?: string;
  url?: string;
  publicadoEm?: Date;
  acessadoEm?: Date;
}
export type ResultadoValidacaoCultura = ResultadoValidacaoTalhao;
export type ResultadoValidacaoFonteConhecimento = ResultadoValidacaoTalhao;

export async function validarCulturaNoJava(campos: CamposValidacaoCultura): Promise<ResultadoValidacaoCultura> {
  if (campos.ativa !== undefined && typeof campos.ativa !== "boolean")
    throw new AppError(400, "O campo ativa deve ser booleano.", "ENTRADA_INVALIDA");
  const imagem = campos.imagem;
  if (imagem && (!(imagem.enviadaEm instanceof Date) || !Number.isFinite(imagem.enviadaEm.getTime())))
    throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
  const texto = (valor: string | undefined): string[] => valor === undefined ? ["0", ""] : ["1", valor];
  const partes = [campos.nome ?? "", ...texto(campos.nomeCientifico), ...texto(campos.descricao),
    campos.ativa === undefined ? "" : campos.ativa ? "1" : "0", imagem === undefined ? "0" : "1",
    imagem?.url ?? "", imagem?.publicId ?? "", ...texto(imagem?.legenda), imagem?.enviadaEm.toISOString() ?? ""];
  return enviarPedido(`VALIDAR_CULTURA\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export async function validarFonteConhecimentoNoJava(
  campos: CamposValidacaoFonteConhecimento, instanteReferencia: Date,
): Promise<ResultadoValidacaoFonteConhecimento> {
  const data = (valor: Date | undefined, obrigatoria = false): string => {
    if (valor === undefined && !obrigatoria) return "";
    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime()))
      throw new AppError(400, "A data deve ser um instante válido.", "DATA_INVALIDA");
    return valor.toISOString();
  };
  const partes = [campos.titulo ?? "", campos.instituicaoOuAutor ?? "", campos.url === undefined ? "0" : "1",
    campos.url ?? "", data(campos.publicadoEm), data(campos.acessadoEm), data(instanteReferencia, true)];
  return enviarPedido(`VALIDAR_FONTE_CONHECIMENTO\t${partes.map(codificarCampoProtocolo).join("\t")}\n`);
}

export type ResultadoValidacaoProblemaAgricola = ResultadoValidacaoTalhao;

export async function validarProblemaAgricolaNoJava(
  campos: CamposValidacaoProblemaAgricola, instanteReferencia: Date,
): Promise<ResultadoValidacaoProblemaAgricola> {
  return enviarPedido(montarPedidoProblemaAgricola(campos, instanteReferencia));
}

export async function validarExperienciaComunidadeNoJava(c: ExperienciaComunidade, m: MetadadosExperienciaComunidade, ref: Date): Promise<ResultadoValidacaoTalhao> {
  return enviarPedido(montarExperienciaComunidade(c,m,ref));
}
export async function validarAdocaoTratamentoNoJava(c: AdocaoTratamento, m: MetadadosAdocaoTratamento): Promise<ResultadoValidacaoTalhao> {
  return enviarPedido(montarAdocaoTratamento(c,m));
}
export async function validarDenunciaComunidadeNoJava(c: DenunciaComunidade, m: MetadadosDenunciaComunidade, ref: Date): Promise<ResultadoValidacaoTalhao> {
  return enviarPedido(montarDenunciaComunidade(c,m,ref));
}

async function enviarPedido(pedido: string): Promise<ResultadoValidacaoTalhao> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let concluido = false;
    let resposta = Buffer.alloc(0);
    // Um único prazo cobre conexão e recebimento, sem reiniciar com os dados.
    const timer = setTimeout(() => finalizar(new JavaIndisponivelError()), 3000);

    function finalizar(erro?: JavaIndisponivelError, resultado?: ResultadoValidacaoTalhao) {
      if (concluido) return;
      concluido = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      if (erro) reject(erro);
      else resolve(resultado!);
    }

    socket.on("error", () => finalizar(new JavaIndisponivelError()));
    socket.on("end", () => finalizar(new JavaIndisponivelError()));
    socket.on("close", () => finalizar(new JavaIndisponivelError()));
    socket.on("data", (dados: Buffer) => {
      const quebra = dados.indexOf(10);
      const trecho = quebra < 0 ? dados : dados.subarray(0, quebra + 1);
      // O limite de 64 KiB inclui o terminador da linha.
      if (resposta.length + trecho.length > 64 * 1024) {
        finalizar(new JavaIndisponivelError());
        return;
      }
      resposta = Buffer.concat([resposta, trecho]);
      if (quebra < 0) return;

      try {
        const linha = new TextDecoder("utf-8", { fatal: true })
          .decode(resposta.subarray(0, -1)).replace(/\r$/, "");
        if (linha === "OK") {
          finalizar(undefined, { valido: true, erros: [] });
          return;
        }
        const partes = linha.split("\t");
        if (partes[0] !== "ERRO" || partes.length < 2 ||
            partes.slice(1).some(erro => !erro.trim() || /[\r\n]/.test(erro))) {
          throw new Error("RESPOSTA_INVALIDA");
        }
        finalizar(undefined, { valido: false, erros: partes.slice(1) });
      } catch {
        finalizar(new JavaIndisponivelError());
      }
    });

    try {
      socket.connect(configuracaoJava(), () => socket.write(pedido, "utf8"));
    } catch {
      finalizar(new JavaIndisponivelError());
    }
  });
}

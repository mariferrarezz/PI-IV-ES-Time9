import { mongo } from "mongoose";
import { isDeepStrictEqual } from "node:util";
import { AppError } from "../../shared/errors";
import { AtualizarPropriedadeDto } from "./propriedades.schema";

export const CAMPOS_PROPRIEDADE = ["nome", "municipio", "estado", "areaTotalHa", "observacoes", "ativa"] as const;
type Campo = typeof CAMPOS_PROPRIEDADE[number];
export type ImagemPropriedade = Array<{ campo: Campo; presente: boolean; valor: unknown }>;
export interface ControleAtualizacao { imagem: ImagemPropriedade; atualizadoEm: Date }

export function propriedadeAlterada(): AppError {
  return new AppError(409, "A propriedade foi alterada durante a operação. Recarregue os dados e tente novamente.", "PROPRIEDADE_ALTERADA");
}

function legadoIncompativel(): AppError {
  return new AppError(422, "A propriedade contém campos armazenados incompatíveis com o contrato de validação.", "PROPRIEDADE_LEGADA_INCOMPATIVEL");
}

export function capturarImagem(registro: object): ImagemPropriedade {
  const campos = registro as Record<string, unknown>;
  // Copie valores BSON para não compartilhar objetos mutáveis com a leitura.
  return CAMPOS_PROPRIEDADE.map(campo => ({ campo, presente: Object.hasOwn(campos, campo),
    valor: Object.hasOwn(campos, campo)
      ? mongo.BSON.deserialize(mongo.BSON.serialize({ valor: campos[campo] }), { promoteLongs: false }).valor
      : undefined }));
}

export function mesmaImagem(registro: object, imagem: ImagemPropriedade): boolean {
  return isDeepStrictEqual(capturarImagem(registro), imagem);
}

// Compare frações exatas: decimal BSON e número binário IEEE-754.
function decimalExato(texto: string, numero: number): boolean {
  const partes = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(texto);
  if (!partes || !Number.isFinite(numero)) return false;
  const fracao = partes[3] ?? "";
  let numerador = BigInt(partes[2] + fracao) * (partes[1] === "-" ? -1n : 1n);
  let denominador = 1n;
  const expoente = Number(partes[4] ?? 0) - fracao.length;
  if (expoente >= 0) numerador *= 10n ** BigInt(expoente);
  else denominador = 10n ** BigInt(-expoente);
  const buffer = new ArrayBuffer(8), view = new DataView(buffer);
  view.setFloat64(0, numero);
  const bits = view.getBigUint64(0);
  const e = Number((bits >> 52n) & 2047n);
  let binario = (bits & ((1n << 52n) - 1n)) | (e === 0 ? 0n : 1n << 52n);
  if (bits >> 63n) binario = -binario;
  let divisor = 1n;
  const deslocamento = e === 0 ? -1074 : e - 1023 - 52;
  if (deslocamento >= 0) binario <<= BigInt(deslocamento);
  else divisor <<= BigInt(-deslocamento);
  return numerador * divisor === binario * denominador;
}

export function areaLegadaParaJava(valor: unknown): number {
  if (typeof valor === "number") return valor; // Já é o mesmo double do contrato atual.
  if (valor instanceof mongo.Long || valor instanceof mongo.Decimal128) {
    const numero = Number(valor.toString());
    if (decimalExato(valor.toString(), numero)) return numero;
  }
  throw new AppError(422, "A área total armazenada não pode ser representada com segurança pelo contrato de validação Java.", "AREA_LEGADA_INCOMPATIVEL");
}

export function estadoFinalParaJava(imagem: ImagemPropriedade, enviados: AtualizarPropriedadeDto) {
  const final: Record<string, unknown> = {};
  for (const { campo, presente, valor } of imagem) if (presente) final[campo] = valor;
  for (const campo of CAMPOS_PROPRIEDADE) if (enviados[campo] !== undefined) final[campo] = enviados[campo];
  if (typeof final.nome !== "string" || typeof final.municipio !== "string" ||
      typeof final.estado !== "string" || typeof final.ativa !== "boolean" ||
      (Object.hasOwn(final, "observacoes") && typeof final.observacoes !== "string")) throw legadoIncompativel();
  return {
    nome: final.nome, municipio: final.municipio, estado: final.estado,
    areaTotalHa: Object.hasOwn(final, "areaTotalHa") ? areaLegadaParaJava(final.areaTotalHa) : undefined,
    observacoes: final.observacoes as string | undefined,
  };
}

export function proximaDataAtualizacao(anterior: Date): Date {
  if (!(anterior instanceof Date) || !Number.isFinite(anterior.getTime()) || anterior.getTime() >= 8640000000000000) {
    throw legadoIncompativel();
  }
  return new Date(Math.max(Date.now(), anterior.getTime() + 1));
}

export function condicaoImagem(imagem: ImagemPropriedade) {
  return { $and: imagem.map(({ campo, presente, valor }) => {
    if (!presente) return { $eq: [{ $type: `$${campo}` }, "missing"] };
    const tipo = valor instanceof mongo.Long ? "long" : valor instanceof mongo.Decimal128 ? "decimal" : typeof valor;
    return { $and: [
      // Literal à esquerda impede que o Mongoose converta o BSON pelo schema Number/trim.
      { $eq: [{ $literal: valor }, `$${campo}`] },
      typeof valor === "number" ? { $in: [{ $type: `$${campo}` }, ["int", "double"]] }
        : { $eq: [{ $type: `$${campo}` }, tipo === "boolean" ? "bool" : tipo] },
    ] };
  }) };
}

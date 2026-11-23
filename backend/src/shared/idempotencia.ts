import { createHash } from 'node:crypto';
import mongoose, { ClientSession } from 'mongoose';
import { AppError } from './errors';

function identificadores(uid: string, caminho: string, chave: string, entrada: unknown) {
  if (!/^[a-f0-9]{32}$/i.test(chave)) throw new AppError(400, 'Chave de idempotência inválida', 'CHAVE_INVALIDA');
  const hash = (s: string) => createHash('sha256').update(s).digest('hex');
  return { registroId: hash(`${uid}\n${caminho}\n${chave}`), entradaHash: hash(JSON.stringify(entrada)) };
}

export async function respostaIdempotente<T>(uid: string, caminho: string, chave: string | undefined, entrada: unknown): Promise<T | undefined> {
  if (!chave) return undefined;
  const { registroId, entradaHash } = identificadores(uid, caminho, chave, entrada);
  const anterior = await mongoose.connection.collection('operacoes_idempotentes').findOne({ _id: registroId as never });
  if (!anterior) return undefined;
  if (anterior.entradaHash !== entradaHash) throw new AppError(409, 'Chave já utilizada com outros dados', 'CHAVE_REUTILIZADA');
  return anterior.resposta as T;
}

/** Guarda a resposta na mesma transação do registro, isolada por usuário e rota. */
export async function executarIdempotente<T extends object>(
  session: ClientSession, uid: string, caminho: string, chave: string | undefined,
  entrada: unknown, executar: () => Promise<T>,
): Promise<T> {
  if (!chave) return executar();
  const { registroId, entradaHash } = identificadores(uid, caminho, chave, entrada);
  const colecao = mongoose.connection.collection('operacoes_idempotentes');
  const anterior = await colecao.findOne({ _id: registroId as never }, { session });
  if (anterior) {
    if (anterior.entradaHash !== entradaHash) throw new AppError(409, 'Chave já utilizada com outros dados', 'CHAVE_REUTILIZADA');
    return anterior.resposta as T;
  }
  const resposta = await executar();
  await colecao.insertOne({ _id: registroId as never, entradaHash, resposta, criadoEm: new Date() }, { session });
  return resposta;
}

import { AppError } from '../../shared/errors';
import { AuthRepository } from './auth.repository';

export const dadoEmUso = (campo: 'cpf' | 'telefone') => new AppError(409,
  campo === 'cpf' ? 'CPF já cadastrado' : 'Telefone já cadastrado',
  campo === 'cpf' ? 'CPF_JA_CADASTRADO' : 'TELEFONE_JA_CADASTRADO');

export async function verificarDisponibilidade(repo: AuthRepository, campo: 'cpf' | 'telefone', valor: string, excetoUid?: string) {
  if (await repo.existeOutroComCampo(campo, valor, excetoUid)) throw dadoEmUso(campo);
}

export function traduzirConflitoUnico(erro: unknown): never {
  const e = erro as { code?: number; keyPattern?: Record<string, unknown> };
  if (e?.code === 11000 && e.keyPattern?.cpf) throw dadoEmUso('cpf');
  if (e?.code === 11000 && e.keyPattern?.telefone) throw dadoEmUso('telefone');
  throw erro;
}

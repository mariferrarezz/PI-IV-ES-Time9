import { Types } from 'mongoose';

// Projeto acadêmico sem equipe de moderação (decisão de 23/11): toda experiência
// publicada já nasce aprovada. O banco exige um revisor; este id fixo identifica a
// "moderação automática" e não corresponde a nenhum usuário real.
export const MODERACAO_AUTOMATICA_ID = new Types.ObjectId('000000000000000000000001');

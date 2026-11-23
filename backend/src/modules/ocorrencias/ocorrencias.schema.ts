import { z } from 'zod';

// Somente estrutura e tipos aqui: regras de conteúdo são avaliadas no Java.
export const ocorrenciaEntradaSchema = z.object({
  tipo: z.string().max(100),
  problemaAgricolaId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dataObservacao: z.string().datetime({ offset: true }).transform(v => new Date(v)),
  sintomas: z.string().max(10000).transform(v => v.trim()),
  intensidade: z.string().max(100),
  areaAfetadaHa: z.number().finite().optional(),
}).strict();

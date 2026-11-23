import { z } from 'zod';

const data = z.string().datetime({ offset: true }).transform(valor => new Date(valor));
export const plantacaoEntradaSchema = z.object({
  culturaId: z.string().regex(/^[a-f\d]{24}$/i),
  variedade: z.string().max(1000).transform(v => v.trim()).optional(),
  safra: z.string().max(1000).transform(v => v.trim()).optional(),
  dataPlantio: data.optional(),
  areaPlantadaHa: z.number().finite().optional(),
  status: z.enum(['ativa', 'encerrada']),
  dataEncerramento: data.optional(),
  observacoes: z.string().max(10000).transform(v => v.trim()).optional(),
}).strict();

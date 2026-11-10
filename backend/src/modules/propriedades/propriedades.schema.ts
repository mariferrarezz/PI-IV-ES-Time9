import { z } from "zod";

export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
const texto = (limite: number) => z.string().trim().min(1).refine(valor => [...valor].length <= limite);

export const criarPropriedadeSchema = z.object({
  nome: texto(150),
  municipio: texto(150),
  estado: z.enum(UFS),
  observacoes: texto(5000).optional(),
  areaTotalHa: z.number().finite().positive().optional(),
  ativa: z.boolean().optional(),
}).strict();

export const atualizarPropriedadeSchema = criarPropriedadeSchema.partial()
  .refine(dados => Object.keys(dados).length > 0);

export const propriedadeIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);

export type CriarPropriedadeDto = z.infer<typeof criarPropriedadeSchema>;
export type AtualizarPropriedadeDto = z.infer<typeof atualizarPropriedadeSchema>;

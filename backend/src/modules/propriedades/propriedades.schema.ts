import { z } from "zod";

export const criarPropriedadeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  municipio: z.string().optional(),
  estado: z.string().length(2, "Use a sigla do estado (ex.: SP)").optional(),
  descricao: z.string().optional(),
});

export const atualizarPropriedadeSchema = criarPropriedadeSchema.partial();

export type CriarPropriedadeDto = z.infer<typeof criarPropriedadeSchema>;
export type AtualizarPropriedadeDto = z.infer<typeof atualizarPropriedadeSchema>;

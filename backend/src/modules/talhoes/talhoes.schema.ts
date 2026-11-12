import { z } from "zod";

// Estrutura e limites documentados; obrigatoriedade e positividade ficam no Java.
export const criarTalhaoSchema = z.object({
  nome: z.string().refine(valor => [...valor].length <= 150).optional(),
  areaHa: z.number().optional(),
  observacoes: z.string().trim().min(1).refine(valor => [...valor].length <= 5000).optional(),
  ativo: z.boolean().optional(),
}).strict();

export type CriarTalhaoDto = z.infer<typeof criarTalhaoSchema>;

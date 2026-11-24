import { z } from 'zod';

const idTexto = z.string().regex(/^[a-f\d]{24}$/i);

// Publicação a partir de uma ocorrência do próprio usuário. O restante (cultura,
// problema, status, região, método e resultado) é copiado pelo back-end.
// Observações escritas nunca são copiadas (tela de Privacidade).
export const publicarExperienciaSchema = z.object({
  ocorrenciaId: idTexto,
  titulo: z.string().trim().min(1).max(150),
  relato: z.string().trim().min(1).max(5000),
  tratamentoId: idTexto.optional(),
  avaliacaoId: idTexto.optional(),
}).strict().refine(d => d.avaliacaoId === undefined || d.tratamentoId !== undefined, {
  path: ['avaliacaoId'], message: 'A avaliação exige o tratamento',
});

export type PublicarExperiencia = z.infer<typeof publicarExperienciaSchema>;

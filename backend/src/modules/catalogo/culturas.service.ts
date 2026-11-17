import { CulturasRepository, culturasRepository } from "./culturas.repository";

// Lista usada pela tela do questionário para mostrar as culturas e saber seus ids.
export function criarCulturasService(culturas: CulturasRepository = culturasRepository) {
  return {
    async listar() {
      const lista = await culturas.listarAtivas();
      return lista.map(cultura => ({ id: String(cultura._id), nome: cultura.nome }));
    },
  };
}
export const culturasService = criarCulturasService();
export type CulturasService = ReturnType<typeof criarCulturasService>;

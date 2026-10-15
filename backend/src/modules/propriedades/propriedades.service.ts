import { NotFoundError } from "../../shared/errors";
import { propriedadesRepository } from "./propriedades.repository";
import {
  AtualizarPropriedadeDto,
  CriarPropriedadeDto,
} from "./propriedades.schema";

// Regras de negócio ficam aqui.
export const propriedadesService = {
  criar(ownerUid: string, dados: CriarPropriedadeDto) {
    return propriedadesRepository.criar(ownerUid, dados);
  },

  listar(ownerUid: string) {
    return propriedadesRepository.listarPorUsuario(ownerUid);
  },

  async buscar(id: string, ownerUid: string) {
    const propriedade = await propriedadesRepository.buscarPorId(id, ownerUid);
    if (!propriedade) throw new NotFoundError("Propriedade não encontrada");
    return propriedade;
  },

  async atualizar(id: string, ownerUid: string, dados: AtualizarPropriedadeDto) {
    const propriedade = await propriedadesRepository.atualizar(id, ownerUid, dados);
    if (!propriedade) throw new NotFoundError("Propriedade não encontrada");
    return propriedade;
  },

  async excluir(id: string, ownerUid: string) {
    const propriedade = await propriedadesRepository.excluir(id, ownerUid);
    if (!propriedade) throw new NotFoundError("Propriedade não encontrada");
  },
};

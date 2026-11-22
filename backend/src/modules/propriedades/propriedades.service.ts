import { Types } from "mongoose";
import { AppError, NotFoundError } from "../../shared/errors";
import { PropriedadesRepository, propriedadesRepository } from "./propriedades.repository";
import { UsuariosRepository, usuariosRepository } from "../usuarios/usuarios.repository";
import { atualizarPropriedadeSchema, criarPropriedadeSchema, propriedadeIdSchema } from "./propriedades.schema";

export function criarPropriedadesService(
  propriedades: PropriedadesRepository = propriedadesRepository,
  usuarios: UsuariosRepository = usuariosRepository,
) {
  async function usuarioDoToken(uid: string) {
    const perfil = await usuarios.buscarPorFirebaseUid(uid);
    if (!perfil) throw new AppError(403, "Perfil do usuário não cadastrado", "PERFIL_AUSENTE");
    return perfil._id;
  }
  const identificador = (id: string) => new Types.ObjectId(propriedadeIdSchema.parse(id));
  return {
    async criar(uid: string, entrada: unknown) {
      const dados = criarPropriedadeSchema.parse(entrada);
      return propriedades.criar(await usuarioDoToken(uid), { ...dados, ativa: dados.ativa ?? true });
    },
    async listar(uid: string) {
      return propriedades.listarPorUsuario(await usuarioDoToken(uid));
    },
    async buscar(id: string, uid: string) {
      const propriedadeId = identificador(id), usuarioId = await usuarioDoToken(uid);
      const propriedade = await propriedades.buscarPorId(propriedadeId, usuarioId);
      // Mesmo 404 para inexistente e de outro produtor: não revelar existência alheia.
      if (!propriedade) throw new NotFoundError("Propriedade não encontrada");
      return propriedade;
    },
    async atualizar(id: string, uid: string, entrada: unknown) {
      const propriedadeId = identificador(id), dados = atualizarPropriedadeSchema.parse(entrada);
      const usuarioId = await usuarioDoToken(uid);
      return propriedades.comTransacao(async session => {
        if (!await propriedades.buscarPorId(propriedadeId, usuarioId, session)) throw new NotFoundError("Propriedade não encontrada");
        if (dados.areaTotalHa !== undefined && await propriedades.areaAtivaExcede(propriedadeId, dados.areaTotalHa, session)) {
          throw new AppError(409, "Área total inferior à soma dos talhões ativos", "AREA_INSUFICIENTE");
        }
        const atualizada = await propriedades.atualizar(propriedadeId, usuarioId, dados, session);
        if (!atualizada) throw new NotFoundError("Propriedade não encontrada");
        return atualizada;
      });
    },
    async excluir(id: string, uid: string) {
      const propriedadeId = identificador(id), usuarioId = await usuarioDoToken(uid);
      await propriedades.comTransacao(async session => {
        if (!await propriedades.buscarPorId(propriedadeId, usuarioId, session)) throw new NotFoundError("Propriedade não encontrada");
        // Inclui inativos: arquivamento do talhão não remove o vínculo histórico.
        if (await propriedades.temTalhoes(propriedadeId, session)) {
          throw new AppError(409, "Propriedade possui talhões; utilize o arquivamento", "POSSUI_DEPENDENTES");
        }
        if (!await propriedades.excluir(propriedadeId, usuarioId, session)) throw new NotFoundError("Propriedade não encontrada");
      });
    },
  };
}
export const propriedadesService = criarPropriedadesService();
export type PropriedadesService = ReturnType<typeof criarPropriedadesService>;

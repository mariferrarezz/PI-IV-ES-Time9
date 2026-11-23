import { Types } from "mongoose";
import { AppError, NotFoundError, ValidacaoTalhaoError } from "../../shared/errors";
import { validarTalhaoNoJava } from "../../services/validacao-java.service";
import { PropriedadesRepository, propriedadesRepository } from "../propriedades/propriedades.repository";
import { propriedadeIdSchema } from "../propriedades/propriedades.schema";
import { BuscaPerfilPorUid, authRepository } from "../auth/auth.repository";
import { TalhoesRepository, talhoesRepository } from "./talhoes.repository";
import { criarTalhaoSchema } from "./talhoes.schema";

export function criarTalhoesService(
  talhoes: TalhoesRepository = talhoesRepository,
  propriedades: PropriedadesRepository = propriedadesRepository,
  usuarios: BuscaPerfilPorUid = authRepository,
  validar: typeof validarTalhaoNoJava = validarTalhaoNoJava,
) {
  return {
    async listar(id: string, uid: string) {
      const propriedadeId = new Types.ObjectId(propriedadeIdSchema.parse(id));
      const perfil = await usuarios.buscarPorFirebaseUid(uid);
      if (!perfil) throw new AppError(403, "Perfil do usuário não cadastrado", "PERFIL_AUSENTE");
      if (!await propriedades.buscarPorId(propriedadeId, perfil._id)) {
        throw new NotFoundError("Propriedade não encontrada");
      }
      return talhoes.listarPorPropriedade(propriedadeId);
    },
    async criar(id: string, uid: string, entrada: unknown) {
      const propriedadeId = new Types.ObjectId(propriedadeIdSchema.parse(id));
      const dados = criarTalhaoSchema.parse(entrada);
      const perfil = await usuarios.buscarPorFirebaseUid(uid);
      if (!perfil) throw new AppError(403, "Perfil do usuário não cadastrado", "PERFIL_AUSENTE");

      function conferir(propriedade: Awaited<ReturnType<PropriedadesRepository["buscarPorId"]>>) {
        if (!propriedade) throw new NotFoundError("Propriedade não encontrada");
        if (!propriedade.ativa) throw new AppError(409, "A propriedade deve estar ativa para novos cadastros", "PROPRIEDADE_INATIVA");
      }
      // Autorize antes de enviar os campos ao Java, sem realizar escritas.
      conferir(await propriedades.buscarPorId(propriedadeId, perfil._id));
      const resultado = await validar(dados.nome, dados.areaHa);
      if (!resultado.valido) throw new ValidacaoTalhaoError(resultado.erros);

      return talhoes.comTransacao(async session => {
        // Reconfira o pai após a validação e coordene operações concorrentes.
        conferir(await talhoes.reservarPropriedade(propriedadeId, perfil._id, session));
        if ((dados.ativo ?? true) && !await talhoes.areaDisponivel(propriedadeId, dados.areaHa!, session)) {
          throw new AppError(409, "Área total inferior à soma dos talhões ativos", "AREA_INSUFICIENTE");
        }
        return talhoes.criar(propriedadeId, { ...dados, ativo: dados.ativo ?? true }, session);
      });
    },
  };
}
export const talhoesService = criarTalhoesService();
export type TalhoesService = ReturnType<typeof criarTalhoesService>;

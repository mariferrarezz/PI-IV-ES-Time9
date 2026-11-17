import { Types } from "mongoose";
import { AppError, NotFoundError, ValidacaoPropriedadeError } from "../../shared/errors";
import { validarPropriedadeNoJava } from "../../services/validacao-java.service";
import { PropriedadesRepository, propriedadesRepository } from "./propriedades.repository";
import { UsuariosRepository, usuariosRepository } from "../usuarios/usuarios.repository";
import { atualizarPropriedadeSchema, criarPropriedadeSchema, propriedadeIdSchema } from "./propriedades.schema";
import { CAMPOS_PROPRIEDADE, capturarImagem, mesmaImagem, estadoFinalParaJava,
  proximaDataAtualizacao, propriedadeAlterada } from "./propriedades.atualizacao";

export function criarPropriedadesService(
  propriedades: PropriedadesRepository = propriedadesRepository,
  usuarios: UsuariosRepository = usuariosRepository,
  validar: typeof validarPropriedadeNoJava = validarPropriedadeNoJava,
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
      const usuarioId = await usuarioDoToken(uid);
      // Valide os textos já preparados, antes de qualquer escrita.
      const resultado = await validar(dados.nome, dados.municipio, dados.estado, dados.areaTotalHa, dados.observacoes);
      if (!resultado.valido) throw new ValidacaoPropriedadeError(resultado.erros);
      return propriedades.criar(usuarioId, { ...dados, ativa: dados.ativa ?? true });
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
      // Somente campos realmente enviados; não aplique defaults ou trim ao registro herdado.
      const enviados = Object.fromEntries(CAMPOS_PROPRIEDADE.filter(campo => dados[campo] !== undefined)
        .map(campo => [campo, dados[campo]]));
      if (!Object.keys(enviados).length) throw new AppError(400, "Dados inválidos", "ENTRADA_INVALIDA");
      const original = await propriedades.buscarParaAtualizacao(propriedadeId, usuarioId);
      if (!original) throw new NotFoundError("Propriedade não encontrada");
      const imagem = capturarImagem(original);
      const final = estadoFinalParaJava(imagem, enviados);
      const resultado = await validar(final.nome, final.municipio, final.estado, final.areaTotalHa, final.observacoes);
      if (!resultado.valido) throw new ValidacaoPropriedadeError(resultado.erros);
      // A chamada de rede terminou: repetições transacionais reutilizam a mesma imagem validada.
      return propriedades.comTransacao(async session => {
        const atual = await propriedades.buscarParaAtualizacao(propriedadeId, usuarioId, session);
        if (!atual) throw new NotFoundError("Propriedade não encontrada");
        if (!mesmaImagem(atual, imagem)) throw propriedadeAlterada();
        if (dados.areaTotalHa !== undefined && await propriedades.areaAtivaExcede(propriedadeId, dados.areaTotalHa, session)) {
          throw new AppError(409, "Área total inferior à soma dos talhões ativos", "AREA_INSUFICIENTE");
        }
        const atualizada = await propriedades.atualizar(propriedadeId, usuarioId, enviados, session,
          { imagem, atualizadoEm: proximaDataAtualizacao(atual.atualizadoEm) });
        if (!atualizada) throw propriedadeAlterada();
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

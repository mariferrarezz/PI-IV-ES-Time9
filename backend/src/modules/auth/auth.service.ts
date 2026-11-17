import { AppError } from "../../shared/errors";
import { TERMOS_VERSAO_VIGENTE } from "../../config/termos";
import { AuthRepository, PerfilUsuario, authRepository } from "./auth.repository";
import { cadastroSchema } from "./auth.schema";

const perfilJaExiste = () => new AppError(409, "Perfil já cadastrado", "PERFIL_JA_EXISTE");

// Formato devolvido ao app. O firebaseUid não sai na resposta.
function paraResposta(perfil: PerfilUsuario) {
  return {
    id: String(perfil._id),
    nomeCompleto: perfil.nomeCompleto,
    cpf: perfil.cpf,
    telefone: perfil.telefone,
    termos: perfil.termos,
    criadoEm: perfil.criadoEm,
    atualizadoEm: perfil.atualizadoEm,
  };
}

// Regras do cadastro. O uid sempre vem do token validado, nunca do corpo da requisição.
// CPF e telefone nunca são registrados em logs.
export function criarAuthService(usuarios: AuthRepository = authRepository) {
  return {
    async cadastrar(uid: string, entrada: unknown) {
      const dados = cadastroSchema.parse(entrada);
      if (await usuarios.buscarPorFirebaseUid(uid)) throw perfilJaExiste();
      try {
        const perfil = await usuarios.criar({
          firebaseUid: uid,
          nomeCompleto: dados.nomeCompleto,
          cpf: dados.cpf,
          telefone: dados.telefone,
          termos: { versao: TERMOS_VERSAO_VIGENTE, aceitoEm: new Date() },
        });
        return paraResposta(perfil);
      } catch (erro) {
        // Dois cadastros simultâneos: o índice único de firebaseUid recusa o segundo.
        if ((erro as { code?: number })?.code === 11000) throw perfilJaExiste();
        throw erro;
      }
    },

    async meuPerfil(uid: string) {
      const perfil = await usuarios.buscarPorFirebaseUid(uid);
      if (!perfil) throw new AppError(404, "Perfil não cadastrado", "PERFIL_NAO_ENCONTRADO");
      return paraResposta(perfil);
    },
  };
}
export const authService = criarAuthService();
export type AuthService = ReturnType<typeof criarAuthService>;

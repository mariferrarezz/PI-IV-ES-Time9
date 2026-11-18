import { Types } from "mongoose";
import { AppError, ValidacaoJavaError } from "../../shared/errors";
import { validarQuestionarioNoJava } from "../../services/validacao-java.service";
import { TERMOS_VERSAO_VIGENTE } from "../../config/termos";
import { QUESTIONARIO_VERSAO_VIGENTE } from "../../config/questionario";
import { CulturasRepository, culturasRepository } from "../catalogo/culturas.repository";
import { AuthRepository, PerfilUsuario, authRepository } from "./auth.repository";
import { cadastroSchema, questionarioSchema } from "./auth.schema";

const perfilJaExiste = () => new AppError(409, "Perfil já cadastrado", "PERFIL_JA_EXISTE");
const perfilNaoEncontrado = () => new AppError(404, "Perfil não cadastrado", "PERFIL_NAO_ENCONTRADO");
const questionarioJaRespondido = () =>
  new AppError(409, "Questionário já respondido", "QUESTIONARIO_JA_RESPONDIDO");

// Formato devolvido ao app. O firebaseUid não sai na resposta.
function paraResposta(perfil: PerfilUsuario) {
  return {
    id: String(perfil._id),
    nomeCompleto: perfil.nomeCompleto,
    cpf: perfil.cpf,
    telefone: perfil.telefone,
    termos: perfil.termos,
    // null enquanto não respondido: o app usa isso para decidir se mostra o questionário.
    questionario: perfil.questionario
      ? { ...perfil.questionario, culturasIds: perfil.questionario.culturasIds.map(String) }
      : null,
    criadoEm: perfil.criadoEm,
    atualizadoEm: perfil.atualizadoEm,
  };
}

// Regras do cadastro. O uid sempre vem do token validado, nunca do corpo da requisição.
// CPF e telefone nunca são registrados em logs.
export function criarAuthService(
  usuarios: AuthRepository = authRepository,
  culturas: Pick<CulturasRepository, "contarAtivas"> = culturasRepository,
  java: { validarQuestionario: typeof validarQuestionarioNoJava } = { validarQuestionario: validarQuestionarioNoJava },
) {
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
      if (!perfil) throw perfilNaoEncontrado();
      return paraResposta(perfil);
    },

    // Respondido uma única vez, na criação da conta. versao e concluidoEm são definidos aqui.
    async responderQuestionario(uid: string, entrada: unknown) {
      const dados = questionarioSchema.parse(entrada);
      const perfil = await usuarios.buscarPorFirebaseUid(uid);
      if (!perfil) throw perfilNaoEncontrado();
      if (perfil.questionario) throw questionarioJaRespondido();

      // O Java valida as respostas antes de gravar. Se estiver desligado: 503 JAVA_INDISPONIVEL.
      const concluidoEm = new Date();
      const validacao = await java.validarQuestionario({
        portePropriedade: dados.portePropriedade,
        quantidadeCulturas: dados.quantidadeCulturas,
        culturasIds: dados.culturasIds,
        ...(dados.outraCultura !== undefined ? { outraCultura: dados.outraCultura } : {}),
        problemasFrequentes: dados.problemasFrequentes,
        frequenciaProblemas: dados.frequenciaProblemas,
        identificaProblemasSozinho: dados.identificaProblemasSozinho,
      }, { versao: QUESTIONARIO_VERSAO_VIGENTE, concluidoEm });
      if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);

      const culturasIds = dados.culturasIds.map(id => new Types.ObjectId(id));
      if (await culturas.contarAtivas(culturasIds) !== culturasIds.length) {
        throw new AppError(400, "Cultura inexistente ou indisponível", "CULTURA_INDISPONIVEL");
      }

      const atualizado = await usuarios.salvarQuestionario(uid, {
        versao: QUESTIONARIO_VERSAO_VIGENTE,
        portePropriedade: dados.portePropriedade,
        quantidadeCulturas: dados.quantidadeCulturas,
        culturasIds,
        ...(dados.outraCultura !== undefined ? { outraCultura: dados.outraCultura } : {}),
        problemasFrequentes: dados.problemasFrequentes,
        frequenciaProblemas: dados.frequenciaProblemas,
        identificaProblemasSozinho: dados.identificaProblemasSozinho,
        concluidoEm,
      });
      // Outro envio gravou primeiro (corrida entre a busca e a gravação).
      if (!atualizado) throw questionarioJaRespondido();
      return paraResposta(atualizado);
    },
  };
}
export const authService = criarAuthService();
export type AuthService = ReturnType<typeof criarAuthService>;

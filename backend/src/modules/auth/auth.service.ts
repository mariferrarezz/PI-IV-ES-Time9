import { Types } from "mongoose";
import { AppError, ValidacaoJavaError } from "../../shared/errors";
import { validarCadastroPerfilNoJava, validarOpcionaisPerfilNoJava, validarQuestionarioNoJava } from "../../services/validacao-java.service";
import { TERMOS_VERSAO_VIGENTE } from "../../config/termos";
import { QUESTIONARIO_VERSAO_VIGENTE } from "../../config/questionario";
import { CulturasRepository, culturasRepository } from "../catalogo/culturas.repository";
import { AuthRepository, PerfilUsuario, authRepository } from "./auth.repository";
import { atualizarPerfilSchema, cadastroEntradaSchema, cadastroSchema, questionarioSchema } from "./auth.schema";
import { verificarDisponibilidade, traduzirConflitoUnico } from './disponibilidade';

const perfilJaExiste = () => new AppError(409, "Perfil já cadastrado", "PERFIL_JA_EXISTE");
const perfilNaoEncontrado = () => new AppError(404, "Perfil não cadastrado", "PERFIL_NAO_ENCONTRADO");
const questionarioJaRespondido = () =>
  new AppError(409, "Questionário já respondido", "QUESTIONARIO_JA_RESPONDIDO");

// Iniciais do avatar: primeira letra do primeiro e do último nome, em maiúsculas.
// Palavras sem letra nem número (ex.: "-", emojis) são ignoradas. Ex.: "Seu Zé da Roça" → "SR"; "Maria" → "M".
export function calcularIniciais(nome: string): string | null {
  const letras = nome.split(/\s+/u)
    .map(palavra => palavra.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((letra): letra is string => letra !== undefined);
  if (letras.length === 0) return null;
  const iniciais = letras.length === 1 ? letras[0] : letras[0] + letras[letras.length - 1];
  return iniciais.toLocaleUpperCase("pt-BR");
}

// Formato devolvido ao app. O firebaseUid não sai na resposta.
function paraResposta(perfil: PerfilUsuario) {
  return {
    id: String(perfil._id),
    nomeCompleto: perfil.nomeCompleto,
    nomePublico: perfil.nomePublico ?? null,
    // Calculadas a cada resposta (não ficam no banco): usam o nome público e, sem ele, o nome completo.
    iniciais: calcularIniciais(perfil.nomePublico ?? perfil.nomeCompleto),
    cpf: perfil.cpf,
    telefone: perfil.telefone,
    termos: perfil.termos,
    canalCodigoPreferido: perfil.canalCodigoPreferido ?? null,
    // null enquanto não respondido: o app usa isso para decidir se mostra o questionário.
    questionario: perfil.questionario
      ? { ...perfil.questionario, culturasIds: (perfil.questionario.culturasIds ?? []).map(String) }
      : null,
    criadoEm: perfil.criadoEm,
    atualizadoEm: perfil.atualizadoEm,
  };
}

// Validações feitas no servidor Java antes de gravar. Injetáveis para os testes.
export interface ValidacoesJava {
  validarCadastroPerfil: typeof validarCadastroPerfilNoJava;
  validarQuestionario: typeof validarQuestionarioNoJava;
  validarOpcionaisPerfil: typeof validarOpcionaisPerfilNoJava;
}
const validacoesJava: ValidacoesJava = {
  validarCadastroPerfil: validarCadastroPerfilNoJava,
  validarQuestionario: validarQuestionarioNoJava,
  validarOpcionaisPerfil: validarOpcionaisPerfilNoJava,
};

// Regras do cadastro. O uid sempre vem do token validado, nunca do corpo da requisição.
// CPF e telefone nunca são registrados em logs.
export function criarAuthService(
  usuarios: AuthRepository = authRepository,
  culturas: Pick<CulturasRepository, "contarAtivas"> = culturasRepository,
  java: ValidacoesJava = validacoesJava,
) {
  return {
    async cadastrar(uid: string, entrada: unknown) {
      const dados = cadastroEntradaSchema.parse(entrada);
      if (await usuarios.buscarPorFirebaseUid(uid)) throw perfilJaExiste();
      // O Java valida antes de gravar. Se estiver desligado: 503 JAVA_INDISPONIVEL.
      const validacao = await java.validarCadastroPerfil({
        nomeCompleto: dados.nomeCompleto,
        cpf: dados.cpf,
        telefoneCanonico: dados.telefone,
        canalCodigoPreferido: dados.canalCodigoPreferido,
      });
      if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);
      const dadosValidados = cadastroSchema.parse(dados);
      await verificarDisponibilidade(usuarios, 'cpf', dadosValidados.cpf);
      await verificarDisponibilidade(usuarios, 'telefone', dadosValidados.telefone);
      if (!(await usuarios.indicesUnicosProntos())) throw new AppError(503, 'Cadastro indisponível: índices únicos de CPF e telefone ainda não estão ativos.', 'INDICES_USUARIO_INDISPONIVEIS');
      try {
        const perfil = await usuarios.criar({
          firebaseUid: uid,
          nomeCompleto: dadosValidados.nomeCompleto,
          cpf: dadosValidados.cpf,
          telefone: dadosValidados.telefone,
          canalCodigoPreferido: dadosValidados.canalCodigoPreferido,
          termos: { versao: TERMOS_VERSAO_VIGENTE, aceitoEm: new Date() },
        });
        return paraResposta(perfil);
      } catch (erro) {
        // Dois cadastros simultâneos: o índice único de firebaseUid recusa o segundo.
        if ((erro as { code?: number; keyPattern?: { firebaseUid?: unknown } })?.code === 11000 && (erro as { keyPattern?: { firebaseUid?: unknown } }).keyPattern?.firebaseUid) throw perfilJaExiste();
        traduzirConflitoUnico(erro);
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
      if (perfil.questionario?.concluidoEm) throw questionarioJaRespondido();

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

    // Edição do nome público (pode ser trocado quantas vezes quiser; null apaga).
    async atualizarPerfil(uid: string, entrada: unknown) {
      const dados = atualizarPerfilSchema.parse(entrada);
      if (!(await usuarios.buscarPorFirebaseUid(uid))) throw perfilNaoEncontrado();

      // O Java valida antes de gravar. Se estiver desligado: 503 JAVA_INDISPONIVEL.
      const validacao = await java.validarOpcionaisPerfil(
        dados.nomePublico === null ? {} : { nomePublico: dados.nomePublico },
      );
      if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);

      const atualizado = await usuarios.atualizarNomePublico(uid, dados.nomePublico);
      if (!atualizado) throw perfilNaoEncontrado();
      return paraResposta(atualizado);
    },
  };
}
export const authService = criarAuthService();
export type AuthService = ReturnType<typeof criarAuthService>;

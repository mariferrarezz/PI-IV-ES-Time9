import { Types } from 'mongoose';
import { AppError, NotFoundError, ValidacaoJavaError } from '../../shared/errors';
import { id } from '../ocorrencias/ocorrencias.service';
import { MODERACAO_AUTOMATICA_ID } from '../../config/moderacao';
import { validarExperienciaComunidadeNoJava, ExperienciaComunidade } from '../../services/validacao-java.service';
import { ComunidadeRepository, comunidadeRepository } from './comunidade.repository';
import { publicarExperienciaSchema } from './comunidade.schema';

type ValidarJava = typeof validarExperienciaComunidadeNoJava;
const CAMINHO_PUBLICAR = '/comunidade/experiencias';

// Conteúdo público enviado ao Java, a partir do documento gravado.
function conteudo(d: Record<string, any>): ExperienciaComunidade {
  return {
    nomePublico: d.nomePublico, culturaNome: d.culturaNome, tipoProblema: d.tipoProblema,
    statusOcorrencia: d.statusOcorrencia, titulo: d.titulo, relato: d.relato,
    ...(d.problemaNome === undefined ? {} : { problemaNome: d.problemaNome }),
    ...(d.metodo ? { metodo: { tipoMedida: d.metodo.tipoMedida, descricao: d.metodo.descricao } } : {}),
    ...(d.resultadoRelatado ? { resultadoRelatado: { resultado: d.resultadoRelatado.resultado, dataAvaliacao: d.resultadoRelatado.dataAvaliacao } } : {}),
    ...(d.regiao ? { regiao: { municipio: d.regiao.municipio, estado: d.regiao.estado } } : {}),
  };
}

// O que o autor vê das próprias experiências (sem ids de origem nem revisor).
function resumoDoAutor(d: Record<string, any>) {
  return { _id: d._id, titulo: d.titulo, culturaNome: d.culturaNome, problemaNome: d.problemaNome ?? null,
    tipoProblema: d.tipoProblema, status: d.moderacao?.status, publicadoEm: d.publicadoEm ?? null, criadoEm: d.criadoEm };
}

export function criarComunidadeService(repo: ComunidadeRepository = comunidadeRepository,
  validarJava: ValidarJava = validarExperienciaComunidadeNoJava, relogio: () => Date = () => new Date()) {
  const usuarioObrigatorio = async (uid: string) => {
    const usuario = await repo.buscarUsuario(uid);
    if (!usuario) throw new AppError(404, 'Perfil não cadastrado', 'PERFIL_NAO_ENCONTRADO');
    return usuario;
  };
  return {
    async publicar(uid: string, entrada: unknown, chave?: string) {
      const dados = publicarExperienciaSchema.parse(entrada);
      const usuario = await usuarioObrigatorio(uid);
      const idem = { uid, caminho: CAMINHO_PUBLICAR, chave, entrada };
      const anterior = await repo.respostaAnterior(idem);
      if (anterior) return anterior;
      const nomePublico = usuario.nomePublico?.trim();
      if (!nomePublico) throw new AppError(409, 'Defina um nome público no seu perfil antes de compartilhar', 'NOME_PUBLICO_NECESSARIO');
      const origem = await repo.carregarOrigem(usuario._id, id(dados.ocorrenciaId),
        dados.tratamentoId ? id(dados.tratamentoId) : undefined, dados.avaliacaoId ? id(dados.avaliacaoId) : undefined);
      const agora = relogio();
      const documento = {
        _id: new Types.ObjectId(), autorId: usuario._id, ocorrenciaOrigemId: origem.ocorrencia._id,
        ...(origem.tratamento ? { tratamentoOrigemId: origem.tratamento._id, metodo: { tipoMedida: origem.tratamento.tipoMedida, descricao: origem.tratamento.descricao } } : {}),
        ...(origem.avaliacao ? { avaliacaoOrigemId: origem.avaliacao._id, resultadoRelatado: { resultado: origem.avaliacao.resultado, dataAvaliacao: origem.avaliacao.dataAvaliacao } } : {}),
        nomePublico, culturaId: origem.culturaId, culturaNome: origem.culturaNome,
        ...(origem.ocorrencia.problemaAgricolaId && origem.problemaNome ? { problemaAgricolaId: origem.ocorrencia.problemaAgricolaId, problemaNome: origem.problemaNome } : {}),
        tipoProblema: origem.ocorrencia.tipo, statusOcorrencia: origem.ocorrencia.status,
        titulo: dados.titulo, relato: dados.relato, regiao: origem.regiao, versao: 1,
        moderacao: { status: 'aprovada', revisadoPor: MODERACAO_AUTOMATICA_ID, revisadoEm: agora },
        publicadoEm: agora, criadoEm: agora, atualizadoEm: agora,
      };
      const validacao = await validarJava(conteudo(documento), {
        problemaAgricolaPresente: 'problemaAgricolaId' in documento, tratamentoOrigemPresente: Boolean(origem.tratamento),
        avaliacaoOrigemPresente: Boolean(origem.avaliacao), versao: 1n,
        moderacao: { status: 'aprovada', revisorPresente: true, revisadoEm: agora },
        publicadoEm: agora, criadoEm: agora, atualizadoEm: agora,
      }, agora);
      if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);
      return repo.inserirExperiencia(documento, idem);
    },

    async minhas(uid: string) {
      const usuario = await usuarioObrigatorio(uid);
      return (await repo.listarDoAutor(usuario._id)).map(resumoDoAutor);
    },

    async retirar(uid: string, experienciaTexto: string) {
      const usuario = await usuarioObrigatorio(uid);
      const experienciaId = id(experienciaTexto);
      const atual = await repo.buscarDoAutor(usuario._id, experienciaId);
      if (!atual) throw new NotFoundError('Experiência não encontrada');
      const status = atual.moderacao?.status;
      if (status === 'retirada') return resumoDoAutor(atual);
      // Oculta ou rejeitada só sai pela moderação (modelagem §10.5).
      if (status !== 'aprovada' && status !== 'pendente') throw new AppError(409, 'Esta experiência não pode ser retirada', 'RETIRADA_INDISPONIVEL');
      const agora = new Date(Math.max(relogio().getTime(), atual.atualizadoEm.getTime() + 1));
      const m = atual.moderacao;
      const validacao = await validarJava(conteudo(atual), {
        problemaAgricolaPresente: Boolean(atual.problemaAgricolaId), tratamentoOrigemPresente: Boolean(atual.tratamentoOrigemId),
        avaliacaoOrigemPresente: Boolean(atual.avaliacaoOrigemId), versao: BigInt(atual.versao),
        moderacao: { status: 'retirada', revisorPresente: Boolean(m.revisadoPor), revisadoEm: m.revisadoEm, ...(m.motivo ? { motivo: m.motivo } : {}) },
        publicadoEm: atual.publicadoEm, criadoEm: atual.criadoEm, atualizadoEm: agora,
      }, agora);
      if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);
      if (!(await repo.marcarRetirada(experienciaId, usuario._id, atual.atualizadoEm, agora))) {
        throw new AppError(409, 'A experiência mudou enquanto era retirada; tente de novo', 'EXPERIENCIA_ALTERADA');
      }
      return resumoDoAutor({ ...atual, moderacao: { ...m, status: 'retirada' }, atualizadoEm: agora });
    },
  };
}

export type ComunidadeService = ReturnType<typeof criarComunidadeService>;
export const comunidadeService = criarComunidadeService();

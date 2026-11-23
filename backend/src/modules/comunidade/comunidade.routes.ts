import { Router } from 'express';
import mongoose from 'mongoose';
import { id } from '../ocorrencias/ocorrencias.service';
import { AppError, NotFoundError } from '../../shared/errors';
import { ValidacaoJavaError } from '../../shared/errors';
import { authRepository } from '../auth/auth.repository';
import { validarDenunciaComunidadeNoJava } from '../../services/validacao-java.service';
import { z } from 'zod';
import { executarIdempotente, respostaIdempotente } from '../../shared/idempotencia';

// Sem fotos: sua entrega autenticada e revogável ainda não está implementada.
const projecao = { _id: 1, versao: 1, nomePublico: 1, culturaId: 1, culturaNome: 1,
  problemaAgricolaId: 1, problemaNome: 1, tipoProblema: 1, statusOcorrencia: 1,
  titulo: 1, relato: 1, metodo: 1, resultadoRelatado: 1, regiao: 1, publicadoEm: 1 };

export function criarComunidadeRoutes() {
  const router = Router();
  router.get('/experiencias', async (req, res) => {
    const filtro: Record<string, unknown> = { 'moderacao.status': 'aprovada' };
    for (const campo of ['culturaId', 'problemaAgricolaId']) {
      if (req.query[campo] !== undefined) filtro[campo] = id(String(req.query[campo]));
    }
    if (req.query.tipoProblema !== undefined) {
      const tipo = String(req.query.tipoProblema);
      if (!['praga', 'doenca', 'deficiencia', 'nao_identificado'].includes(tipo)) throw new AppError(400, 'Tipo de problema inválido', 'FILTRO_INVALIDO');
      filtro.tipoProblema = tipo;
    }
    res.json(await mongoose.connection.collection('experiencias_comunidade').find(filtro, { projection: projecao }).sort({ publicadoEm: -1, _id: -1 }).toArray());
  });
  router.get('/experiencias/:experienciaId', async (req, res) => {
    const experiencia = await mongoose.connection.collection('experiencias_comunidade').findOne(
      { _id: id(String(req.params.experienciaId)), 'moderacao.status': 'aprovada' }, { projection: projecao });
    if (!experiencia) throw new NotFoundError('Experiência indisponível');
    res.json(experiencia);
  });
  router.post('/experiencias/:experienciaId/denuncias', async (req, res) => {
    const dados = z.object({ motivo: z.string().max(100), descricao: z.string().trim().max(2000).optional() }).strict().parse(req.body);
    const usuario = await authRepository.buscarPorFirebaseUid(req.user!.uid);
    if (!usuario) throw new AppError(403, 'Perfil do usuário não cadastrado', 'PERFIL_AUSENTE');
    const experienciaId = id(String(req.params.experienciaId));
    const chave = req.get('Idempotency-Key');
    const caminho = `${req.baseUrl}/experiencias/${experienciaId}/denuncias`;
    const anterior = await respostaIdempotente(req.user!.uid, caminho, chave, req.body);
    if (anterior !== undefined) { res.status(201).json(anterior); return; }
    const agora = new Date();
    const validacao = await validarDenunciaComunidadeNoJava(dados, { status: 'pendente', analistaPresente: false, criadoEm: agora, atualizadoEm: agora }, agora);
    if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);
    const resultado = await mongoose.connection.transaction(async session => executarIdempotente(session, req.user!.uid, caminho, chave, req.body, async () => {
      const experiencias = mongoose.connection.collection('experiencias_comunidade');
      const exp = await experiencias.findOne({ _id: experienciaId, 'moderacao.status': 'aprovada' }, { session });
      if (!exp) throw new NotFoundError('Experiência indisponível');
      // A escrita serializa a conferência de disponibilidade com a moderação.
      const reserva = await experiencias.updateOne({ _id: experienciaId, 'moderacao.status': 'aprovada', versao: exp.versao }, { $set: { atualizadoEm: new Date(Math.max(Date.now(), exp.atualizadoEm.getTime() + 1)) } }, { session });
      if (!reserva.matchedCount) throw new NotFoundError('Experiência indisponível');
      const registro = { experienciaId, denuncianteId: usuario._id, ...dados, status: 'pendente', criadoEm: agora, atualizadoEm: agora };
      const inserido = await mongoose.connection.collection('denuncias_comunidade').insertOne(registro, { session });
      return { _id: inserido.insertedId, status: 'pendente' };
    }));
    res.status(201).json(resultado);
  });
  return router;
}

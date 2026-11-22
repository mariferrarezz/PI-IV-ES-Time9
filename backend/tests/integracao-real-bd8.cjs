'use strict';
// Preparado para autorização posterior. Só executa com --autorizar-temporarios.
// Autenticação é real pelo backend/Emulator; driver direto serve apenas ao fixture de talhão.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {MongoClient, ObjectId} = require('mongoose').mongo;
// O plano existe antes da execução: uma interrupção não apaga os casos seguintes.
function criarRegistroCenarios() {
  const nomes = [
    'Readiness real', 'Autenticação obrigatória', 'Token inválido',
    'Listagem e vínculo produtor 0', 'Listagem e vínculo produtor 1', 'Perfil ausente',
    'POST válido pelo backend', 'GET por ID confirma persistência', 'PUT válido',
    'GET novo confirma atualização', 'Isolamento GET', 'Isolamento PUT', 'Isolamento DELETE',
    'ID inválido', 'ID inexistente',
    ...['estado', 'municipio', 'areaTotalHa', 'areaTotalHa', 'usuarioId', 'criadoEm', 'descricao']
      .map(campo => 'PUT inválido/protegido ' + campo),
    'Original preservado após rejeições', 'DELETE bloqueado por dependente temporário',
    'Área menor que talhões ativos', 'DELETE temporário sem dependentes', 'GET após exclusão',
    'Preexistentes preservados produtor 0', 'Preexistentes preservados produtor 1',
  ];
  const testes = nomes.map((teste, indice) => ({id: indice + 1, teste, estado: 'planejado', executado: false}));
  let atual;
  return {
    testes,
    iniciar(nome) {
      atual = testes.find(t => t.teste === nome && t.estado === 'planejado');
      assert(atual, 'CASO_NAO_PLANEJADO');
      atual.executado = true;
    },
    aprovar(detalhes) { Object.assign(atual, detalhes, {estado: 'aprovado', aprovado: true}); },
    omitir(nome, motivo) {
      const caso = testes.find(t => t.teste === nome && t.estado === 'planejado');
      assert(caso, 'CASO_NAO_PLANEJADO');
      Object.assign(caso, {estado: 'omitido', motivo});
    },
    falhar(etapa) {
      // Asserções posteriores ao HTTP também podem reprovar o caso corrente.
      const caso = atual && atual.teste === etapa ? atual :
        {teste: etapa, executado: true};
      if (!testes.includes(caso)) testes.push(caso);
      Object.assign(caso, {estado: 'reprovado', aprovado: false, codigo: 'FALHA_INTEGRACAO_REAL'});
    },
    finalizar() {
      for (const caso of testes) if (caso.estado === 'planejado') {
        Object.assign(caso, {estado: 'interrompido', motivo: 'Fluxo interrompido antes deste caso'});
      }
      const contagens = Object.fromEntries(['aprovado', 'reprovado', 'omitido', 'interrompido']
        .map(estado => [estado, testes.filter(t => t.estado === estado).length]));
      return {...contagens, planejados: nomes.length,
        cenariosNaoExecutados: contagens.omitido + contagens.interrompido};
    },
  };
}
const args = process.argv.slice(2);
if (!args.includes('--autorizar-temporarios') || args.some(a => !['--autorizar-temporarios', '--com-dependentes'].includes(a))) {
  console.log('Preparado, não executado. Uso: npm run test:real -- --autorizar-temporarios [--com-dependentes]');
  process.exit(0);
}
const caminhoEnv = path.resolve(__dirname, '../.env');
const env = {...(fs.existsSync(caminhoEnv) ? require('dotenv').parse(fs.readFileSync(caminhoEnv)) : {}), ...process.env};
const registro = criarRegistroCenarios();
const rodada = randomUUID(), nome = 'TEMP BD8 ' + rodada, testes = registro.testes, criados = new Set();
const preexistentes = new Set();
let usuarioEsperado;
let cliente, talhao, propriedadeDoTalhao, criacaoIncerta = false, etapa = 'pre_requisitos';
const tokens = [env.BD8_TOKEN_A, env.BD8_TOKEN_B];
let alvo;
const limpar = valor => {
  if (Array.isArray(valor)) return valor.map(limpar);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.keys(valor).sort().map(k => [k, limpar(valor[k])]));
  return valor;
};
let aprovado = false, limpezaConfirmada = false;
async function pedido(metodo, rota, token, corpo) {
  const criacao = metodo === 'POST' && rota === '/propriedades';
  if (criacao) criacaoIncerta = true;
  const r = await fetch(new URL(rota, alvo), {
    method: metodo, headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {})},
    body: corpo === undefined ? undefined : JSON.stringify(corpo), signal: AbortSignal.timeout(15000),
  });
  const dados = r.status === 204 ? null : await r.json();
  if (criacao && r.status === 201 && /^[a-f\d]{24}$/i.test(dados?._id)) {
    assert(!preexistentes.has(dados._id));
    assert.equal(dados.nome, nome); assert.equal(dados.usuarioId, usuarioEsperado);
    criados.add(dados._id); criacaoIncerta = false;
    console.log(JSON.stringify({evento: 'temporario_criado', rodada, id: dados._id}));
  } else if (criacao && r.status >= 400 && r.status < 500) criacaoIncerta = false;
  return {status: r.status, dados};
}
async function esperar(caso, metodo, rota, token, corpo, status, codigo) {
  etapa = caso;
  registro.iniciar(caso);
  const r = await pedido(metodo, rota, token, corpo);
  assert.equal(r.status, status);
  if (codigo) assert.equal(r.dados.codigo, codigo);
  registro.aprovar({statusEsperado: status, statusObtido: r.status});
  return r.dados;
}
(async () => {
  try {
    alvo = new URL(env.BD8_API_URL || 'http://127.0.0.1:' + (env.PORT || 3000));
    assert(['127.0.0.1', 'localhost'].includes(alvo.hostname) && alvo.protocol === 'http:');
    assert(tokens.every(Boolean));
    assert(/^(localhost|127\.0\.0\.1):\d+$/.test(env.FIREBASE_AUTH_EMULATOR_HOST || ''));
    const uids = tokens.map(t => {
      const claims = JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());
      assert.equal(claims.aud, env.FIREBASE_PROJECT_ID); return claims.user_id || claims.sub;
    });
    assert(uids[0] && uids[1] && uids[0] !== uids[1]);
    const usuarios = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../database/seed/documentos-sinteticos-bd6.json'))).usuarios;
    const perfis = uids.map(uid => usuarios.find(u => u.firebaseUid === uid));
    assert(perfis.every(Boolean)); // Não criar perfil ou adaptar UIDs no MongoDB.
    usuarioEsperado = perfis[0]._id.$oid;
    const ready = await esperar('Readiness real', 'GET', '/ready', null, undefined, 200);
    assert.equal(ready.banco, 'sentinela'); assert.equal(ready.autenticacao, 'emulator');
    await esperar('Autenticação obrigatória', 'GET', '/propriedades', null, undefined, 401);
    await esperar('Token inválido', 'GET', '/propriedades', 'token-invalido-bd8', undefined, 401);
    const anteriores = [];
    for (const [i, token] of tokens.entries()) {
      const lista = await esperar('Listagem e vínculo produtor ' + i, 'GET', '/propriedades', token, undefined, 200);
      assert(Array.isArray(lista) && lista.length > 0);
      assert(lista.every(p => p.usuarioId === perfis[i]._id.$oid));
      lista.forEach(p => preexistentes.add(p._id));
      anteriores.push(lista);
    }
    if (env.BD8_TOKEN_SEM_PERFIL) {
      await esperar('Perfil ausente', 'GET', '/propriedades', env.BD8_TOKEN_SEM_PERFIL, undefined, 403, 'PERFIL_AUSENTE');
    } else registro.omitir('Perfil ausente', 'BD8_TOKEN_SEM_PERFIL não fornecido');
    const dados = {nome, municipio: 'Município fictício BD8', estado: 'SP', areaTotalHa: 2};
    const criada = await esperar('POST válido pelo backend', 'POST', '/propriedades', tokens[0], dados, 201);
    const id = criada._id, rota = '/propriedades/' + id;
    assert.equal(criada.usuarioId, perfis[0]._id.$oid);
    for (const k of ['ownerUid', 'createdAt', 'updatedAt', '__v']) assert(!(k in criada));
    assert(criada.criadoEm && criada.atualizadoEm && criada.ativa === true);
    const lida = await esperar('GET por ID confirma persistência', 'GET', rota, tokens[0], undefined, 200);
    assert.equal(lida.nome, nome);
    const atualizada = await esperar('PUT válido', 'PUT', rota, tokens[0], {observacoes: 'Persistência BD8 ' + rodada}, 200);
    const novaLeitura = await esperar('GET novo confirma atualização', 'GET', rota, tokens[0], undefined, 200);
    assert.equal(novaLeitura.observacoes, atualizada.observacoes);
    for (const metodo of ['GET', 'PUT', 'DELETE']) {
      await esperar('Isolamento ' + metodo, metodo, rota, tokens[1], metodo === 'PUT' ? {observacoes: 'não permitido'} : undefined, 404);
    }
    await esperar('ID inválido', 'GET', '/propriedades/invalido', tokens[0], undefined, 400);
    await esperar('ID inexistente', 'GET', '/propriedades/' + new ObjectId(), tokens[0], undefined, 404);
    for (const entrada of [{estado: 'XX'}, {municipio: ''}, {areaTotalHa: 0}, {areaTotalHa: '2'}, {usuarioId: perfis[1]._id.$oid}, {criadoEm: new Date()}, {descricao: 'legado'}]) {
      await esperar('PUT inválido/protegido ' + Object.keys(entrada)[0], 'PUT', rota, tokens[0], entrada, 400);
    }
    assert.deepEqual(await esperar('Original preservado após rejeições', 'GET', rota, tokens[0], undefined, 200), novaLeitura);
    if (args.includes('--com-dependentes')) {
      etapa = 'fixture_temporario_talhao'; assert(env.MONGODB_URI);
      cliente = new MongoClient(env.MONGODB_URI, {serverSelectionTimeoutMS: 5000, retryWrites: false});
      await cliente.connect();
      const candidato = new ObjectId(); propriedadeDoTalhao = new ObjectId(id);
      const col = cliente.db('sentinela').collection('talhoes');
      assert.equal(await col.countDocuments({_id: candidato}), 0);
      talhao = candidato;
      console.log(JSON.stringify({evento: 'fixture_talhao_reservado', rodada, id: String(talhao)}));
      await col.insertOne({_id: talhao, propriedadeId: propriedadeDoTalhao, nome, areaHa: 0.5, ativo: true, criadoEm: new Date(), atualizadoEm: new Date()});
      await esperar('DELETE bloqueado por dependente temporário', 'DELETE', rota, tokens[0], undefined, 409, 'POSSUI_DEPENDENTES');
      await esperar('Área menor que talhões ativos', 'PUT', rota, tokens[0], {areaTotalHa: 0.1}, 409, 'AREA_INSUFICIENTE');
      await col.deleteOne({_id: talhao, propriedadeId: propriedadeDoTalhao});
      assert.equal(await col.countDocuments({_id: talhao}), 0); talhao = undefined;
    } else {
      registro.omitir('DELETE bloqueado por dependente temporário', 'Fixture --com-dependentes não autorizado');
      registro.omitir('Área menor que talhões ativos', 'Fixture --com-dependentes não autorizado');
    }
    await esperar('DELETE temporário sem dependentes', 'DELETE', rota, tokens[0], undefined, 204);
    await esperar('GET após exclusão', 'GET', rota, tokens[0], undefined, 404);
    for (const [i, token] of tokens.entries()) {
      const depois = await esperar('Preexistentes preservados produtor ' + i, 'GET', '/propriedades', token, undefined, 200);
      const ordenar = ds => ds.sort((a, b) => a._id.localeCompare(b._id));
      assert.deepEqual(limpar(ordenar(depois)), limpar(ordenar(anteriores[i])));
    }
    aprovado = true;
  } catch { registro.falhar(etapa); }
  finally {
    try {
      if (talhao && cliente) {
        const col = cliente.db('sentinela').collection('talhoes');
        await col.deleteOne({_id: talhao, propriedadeId: propriedadeDoTalhao});
        assert.equal(await col.countDocuments({_id: talhao}), 0);
      }
      for (const id of criados) {
        const r = await pedido('DELETE', '/propriedades/' + id, tokens[0]);
        assert([204, 404].includes(r.status));
        assert.equal((await pedido('GET', '/propriedades/' + id, tokens[0])).status, 404);
      }
      limpezaConfirmada = !criacaoIncerta;
    } catch { aprovado = false; }
    if (cliente) try { await cliente.close(); } catch { aprovado = false; }
  }
  const resumoCenarios = registro.finalizar();
  const pendentes = resumoCenarios.cenariosNaoExecutados;
  console.log(JSON.stringify({banco: 'sentinela', rodada, aprovado: aprovado && limpezaConfirmada && !pendentes,
    casosExecutadosAprovados: aprovado, cenariosNaoExecutados: pendentes, resumoCenarios, testes, limpezaConfirmada,
    criacaoIncerta, idsDaPropriaExecucao: [...criados], talhaoDaPropriaExecucao: talhao && String(talhao),
    limite: 'API + Emulator + MongoDB; fixture direto não comprova endpoints de talhões. Não comprova Flutter, revisão agronômica ou aceite da equipe.'}, null, 2));
  if (!aprovado || !limpezaConfirmada || pendentes) process.exitCode = 1;
})();

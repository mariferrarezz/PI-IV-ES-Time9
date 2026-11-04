// Executar pelo Run All. false = conferência somente de leitura.
// Não executar aplicação no banco principal apenas para repetir evidências já confirmadas.
use('sentinela');
const bancoDestino = 'sentinela'; // Para reprodução isolada: 'sentinela_testes_bd5'.
const aplicar = false;
if (!['sentinela', 'sentinela_testes_bd5'].includes(bancoDestino)) throw new Error('Banco não permitido.');
const alvo = db.getSiblingDB(bancoDestino);
// Chaves e opções exatas do BD4; _id_ e índices adicionais não entram nos 22.
const indices = [
  {
    "colecao": "usuarios",
    "nome": "uq_usuarios_firebaseUid",
    "key": {
      "firebaseUid": 1
    },
    "opcoes": {
      "unique": true
    }
  },
  {
    "colecao": "propriedades",
    "nome": "ix_propriedades_usuarioId",
    "key": {
      "usuarioId": 1
    },
    "opcoes": {}
  },
  {
    "colecao": "talhoes",
    "nome": "ix_talhoes_propriedadeId",
    "key": {
      "propriedadeId": 1
    },
    "opcoes": {}
  },
  {
    "colecao": "plantacoes",
    "nome": "ix_plantacoes_talhao_safra_status",
    "key": {
      "talhaoId": 1,
      "safra": 1,
      "status": 1
    },
    "opcoes": {}
  },
  {
    "colecao": "plantacoes",
    "nome": "uq_plantacoes_talhao_ativa",
    "key": {
      "talhaoId": 1
    },
    "opcoes": {
      "unique": true,
      "partialFilterExpression": {
        "status": "ativa"
      }
    }
  },
  {
    "colecao": "problemas_agricolas",
    "nome": "ix_problemas_culturas_tipo",
    "key": {
      "culturasAfetadasIds": 1,
      "tipo": 1
    },
    "opcoes": {}
  },
  {
    "colecao": "ocorrencias",
    "nome": "ix_ocorrencias_plantacao_data",
    "key": {
      "plantacaoId": 1,
      "dataObservacao": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "monitoramentos",
    "nome": "ix_monitoramentos_ocorrencia_data",
    "key": {
      "ocorrenciaId": 1,
      "dataObservacao": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "tratamentos",
    "nome": "ix_tratamentos_ocorrencia_data",
    "key": {
      "ocorrenciaId": 1,
      "dataAplicacao": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "avaliacoes_tratamento",
    "nome": "ix_avaliacoes_tratamento_data",
    "key": {
      "tratamentoId": 1,
      "dataAvaliacao": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "alertas",
    "nome": "ix_alertas_usuario_data",
    "key": {
      "usuarioId": 1,
      "criadoEm": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "alertas",
    "nome": "uq_alertas_evento_ocorrencia",
    "key": {
      "tipo": 1,
      "contexto.tipo": 1,
      "contexto.id": 1
    },
    "opcoes": {
      "unique": true,
      "partialFilterExpression": {
        "tipo": "ocorrencia_intensidade_alta",
        "contexto.tipo": "ocorrencia"
      }
    }
  },
  {
    "colecao": "monitoramentos",
    "nome": "ix_monitoramentos_plantacao_data",
    "key": {
      "plantacaoId": 1,
      "dataObservacao": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "experiencias_comunidade",
    "nome": "ix_experiencias_feed",
    "key": {
      "publicadoEm": -1,
      "_id": -1
    },
    "opcoes": {
      "partialFilterExpression": {
        "moderacao.status": "aprovada"
      }
    }
  },
  {
    "colecao": "experiencias_comunidade",
    "nome": "ix_experiencias_cultura_feed",
    "key": {
      "culturaId": 1,
      "publicadoEm": -1,
      "_id": -1
    },
    "opcoes": {
      "partialFilterExpression": {
        "moderacao.status": "aprovada"
      }
    }
  },
  {
    "colecao": "experiencias_comunidade",
    "nome": "ix_experiencias_problema_feed",
    "key": {
      "problemaAgricolaId": 1,
      "publicadoEm": -1,
      "_id": -1
    },
    "opcoes": {
      "partialFilterExpression": {
        "moderacao.status": "aprovada"
      }
    }
  },
  {
    "colecao": "experiencias_comunidade",
    "nome": "ix_experiencias_autor_data",
    "key": {
      "autorId": 1,
      "criadoEm": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "experiencias_comunidade",
    "nome": "ix_experiencias_moderacao_fila",
    "key": {
      "moderacao.status": 1,
      "criadoEm": 1,
      "_id": 1
    },
    "opcoes": {}
  },
  {
    "colecao": "adocoes_tratamento",
    "nome": "ix_adocoes_usuario_data",
    "key": {
      "usuarioId": 1,
      "criadoEm": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "denuncias_comunidade",
    "nome": "ix_denuncias_status_fila",
    "key": {
      "status": 1,
      "criadoEm": 1,
      "_id": 1
    },
    "opcoes": {}
  },
  {
    "colecao": "denuncias_comunidade",
    "nome": "ix_denuncias_experiencia_data",
    "key": {
      "experienciaId": 1,
      "criadoEm": -1,
      "_id": -1
    },
    "opcoes": {}
  },
  {
    "colecao": "adocoes_tratamento",
    "nome": "uq_adocoes_experiencia_ocorrencia_planejada",
    "key": {
      "experienciaId": 1,
      "ocorrenciaId": 1
    },
    "opcoes": {
      "unique": true,
      "partialFilterExpression": {
        "status": "planejada"
      }
    }
  }
];

// Normaliza objetos, mas preserva a ordem dos arrays e das chaves dos índices.
function normalizar(valor) {
  if (Array.isArray(valor)) return valor.map(normalizar);
  if (valor && typeof valor === 'object') return Object.fromEntries(
    Object.keys(valor).sort().map(k => [k, normalizar(valor[k])]));
  return valor;
}
function iguais(a, b) {
  return JSON.stringify(normalizar(EJSON.serialize(a))) === JSON.stringify(normalizar(EJSON.serialize(b)));
}
function conferirResposta(r) {
  if (!r || Number(r.ok) !== 1) throw new Error('Comando recusado. Interromper e conferir o estado antes de continuar.');
}

function mesmaChave(a, b) {
  return iguais(Object.entries(a), Object.entries(b));
}
function mesmasOpcoes(atual, esperado) {
  const op = esperado.opcoes;
  return !!atual.unique === !!op.unique && !atual.sparse && !atual.hidden &&
    atual.expireAfterSeconds === undefined && atual.collation === undefined &&
    atual.storageEngine === undefined && atual.wildcardProjection === undefined &&
    iguais(atual.partialFilterExpression || {}, op.partialFilterExpression || {});
}
const conferencias = [];
for (const esperado of indices) {
  const info = alvo.getCollectionInfos({name: esperado.colecao})[0];
  if (!info || info.type !== 'collection') {
    conferencias.push({nome: esperado.nome, colecao: esperado.colecao, situacao: 'bloqueado: coleção ausente ou tipo incompatível'});
    continue;
  }
  const existentes = alvo.getCollection(esperado.colecao).getIndexes();
  const porNome = existentes.find(i => i.name === esperado.nome);
  const porChave = existentes.filter(i => mesmaChave(i.key, esperado.key));
  const equivalente = porChave.find(i => mesmasOpcoes(i, esperado));
  let situacao = porNome && (!mesmaChave(porNome.key, esperado.key) || !mesmasOpcoes(porNome, esperado))
    ? 'bloqueado: nome com definição divergente' : equivalente ? 'equivalente; preservar' :
      porChave.length ? 'bloqueado: chaves com opções divergentes' : 'ausente; pode criar';
  if (info.options && info.options.collation) situacao = 'bloqueado: collation da coleção requer análise';
  let gruposDuplicados = 0;
  // Auditoria dos quatro únicos, com os filtros parciais EXATOS. Não imprime valores agrupados.
  if (esperado.opcoes.unique) {
    const grupo = Object.fromEntries(Object.keys(esperado.key).map((campo, i) => ['k' + i, '$' + campo]));
    const contagem = alvo.getCollection(esperado.colecao).aggregate([
      {$match: esperado.opcoes.partialFilterExpression || {}},
      {$group: {_id: grupo, quantidade: {$sum: 1}}},
      {$match: {quantidade: {$gt: 1}}}, {$count: 'grupos'}
    ]).toArray();
    gruposDuplicados = contagem.length ? Number(contagem[0].grupos) : 0;
    if (gruposDuplicados) situacao = 'bloqueado: duplicidades no filtro do índice';
  }
  conferencias.push({colecao: esperado.colecao, nome: esperado.nome, situacao,
    nomeEquivalente: equivalente ? equivalente.name : null, gruposDuplicados});
}
const bloqueado = conferencias.some(c => c.situacao.startsWith('bloqueado'));
const criados = [];
if (aplicar && !bloqueado) {
  for (const item of conferencias.filter(c => c.situacao === 'ausente; pode criar')) {
    const esperado = indices.find(i => i.nome === item.nome);
    alvo.getCollection(esperado.colecao).createIndex(esperado.key, {name: esperado.nome, ...esperado.opcoes});
    criados.push(esperado.nome);
  }
}
const verificacao = indices.map(esperado => {
  const info = alvo.getCollectionInfos({name: esperado.colecao})[0];
  const atuais = info && info.type === 'collection' ? alvo.getCollection(esperado.colecao).getIndexes() : [];
  const equivalente = atuais.find(i => mesmaChave(i.key, esperado.key) && mesmasOpcoes(i, esperado));
  return {nomeEsperado: esperado.nome, colecao: esperado.colecao, correspondente: !!equivalente,
    nomeEncontrado: equivalente ? equivalente.name : null};
});
const listagem = [...new Set(indices.map(i => i.colecao))].map(nome => {
  const info = alvo.getCollectionInfos({name: nome})[0];
  return {colecao: nome, indices: info && info.type === 'collection' ? alvo.getCollection(nome).getIndexes() : []};
});
({banco: bancoDestino, modo: aplicar ? 'aplicação' : 'somente leitura', bloqueado,
  previstos: indices.length, correspondentes: verificacao.filter(i => i.correspondente).length,
  conferencias, criados, verificacao, listagem,
  observacao: 'Preserva TODOS os índices existentes, inclusive _id_ e ownerUid_1. Auditoria não é snapshot nem prova de referências; executar após conferir schemas e documentos. Em erro, conferir criação parcial antes de continuar.'});

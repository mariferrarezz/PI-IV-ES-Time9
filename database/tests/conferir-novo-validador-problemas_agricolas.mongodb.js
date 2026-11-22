
use('sentinela');
const principal = db.getSiblingDB('sentinela');
const nomeColecao = 'problemas_agricolas';
// Cópia literal do arquivo individual atual. Sincronizar se a origem for alterada.
const novo = {
  collMod: 'problemas_agricolas',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'nomeComum', 'tipo', 'descricao', 'culturasAfetadasIds', 'sintomas', 'medidasPreventivas', 'formasControle', 'fontesIds', 'ativo', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        nomeComum: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        nomeCientifico: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        codigoEditorial: { bsonType: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
        chips: {
          bsonType: 'array', maxItems: 4,
          items: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
        },
        niveisAtencao: {
          bsonType: 'object', additionalProperties: false, required: ['baixo', 'medio', 'alto'],
          properties: {
            baixo: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
            medio: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
            alto: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
          },
        },
        tipo: { bsonType: 'string', enum: ['praga', 'doenca', 'deficiencia'] },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        culturasAfetadasIds: { bsonType: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { bsonType: 'objectId' } },
        sintomas: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        ondeOlhar: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        dicaDeCampo: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        danos: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        perdaEstimada: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        epocaPropicia: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        abrangenciaCulturas: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
        partesAfetadas: { bsonType: 'array', maxItems: 30, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        condicoesFavoraveis: { bsonType: 'array', maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        informacoesDisseminacao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        medidasPreventivas: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        tratamentoIntro: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        boasPraticas: { bsonType: 'array', minItems: 1, maxItems: 30, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        formasControle: {
          bsonType: 'array', minItems: 1, maxItems: 30,
          items: {
            bsonType: 'object', additionalProperties: false, required: ['tipo', 'descricao'],
            properties: {
              tipo: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
              descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
              observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
              classe: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
              exemplosControle: {
                bsonType: 'array', maxItems: 30,
                items: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
              },
            },
          },
        },
        orientacaoBuscaAgronomo: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        imagens: {
          bsonType: 'array', maxItems: 5,
          // Repetição de publicId entre objetos diferentes é conferida na aplicação.
          items: {
            bsonType: 'object', additionalProperties: false, required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
            properties: {
              url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
              publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
              legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
              enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
            },
          },
        },
        fontesIds: { bsonType: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { bsonType: 'objectId' } },
        revisaoEditorial: {
          bsonType: 'object', additionalProperties: false, required: ['status'],
          properties: {
            status: { bsonType: 'string', enum: ['pendente', 'aprovada'] },
            observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
            registroAgrofitConferido: { bsonType: 'bool' },
            fotoPendente: { bsonType: 'bool' },
          },
        },
        revisadoEm: { bsonType: 'date' }, ativo: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Legado conserva a exigência anterior; ausência de status não aprova conteúdo na API.
      oneOf: [
        { not: { required: ['revisaoEditorial'] }, required: ['revisadoEm'] },
        {
          required: ['revisaoEditorial'],
          properties: {
            revisaoEditorial: { properties: { status: { enum: ['pendente'] } } },
            ativo: { enum: [false] },
          },
        },
        {
          required: ['revisaoEditorial', 'revisadoEm'],
          properties: { revisaoEditorial: { properties: { status: { enum: ['aprovada'] } } } },
        },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
};

function normalizar(v) {
  if (v && ['Int32','Long','Double','Decimal128'].includes(v._bsontype))
    return Number(v.toString());
  if (Array.isArray(v)) return v.map(normalizar);
  if (v && typeof v === 'object') return Object.fromEntries(
    Object.keys(v).sort().map(k=>[k,normalizar(v[k])]));
  return v;
}
function diferencas(a,b,caminho='validator') {
  if (JSON.stringify(a)===JSON.stringify(b)) return [];
  if (a && b && typeof a==='object' && typeof b==='object' &&
      !Array.isArray(a) && !Array.isArray(b)) {
    return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>
      diferencas(a[k],b[k],caminho+'.'+k));
  }
  return [caminho];
}
const info = principal.getCollectionInfos({name:nomeColecao})[0];
if (!info || info.type !== 'collection')
  throw new Error('Coleção ausente ou tipo inesperado; nenhuma alteração realizada.');
const opcoes = info.options || {};
const col = principal.getCollection(nomeColecao);
const schema = novo.validator.$jsonSchema;

// O schema COMPLETO decide a compatibilidade, incluindo o oneOf e objetos internos.
const filtroIncompativel = {$nor:[novo.validator]};
const total = col.countDocuments({});
const quantidadeIncompativel = col.countDocuments(filtroIncompativel);
const limiteRelatorio = 50;
const ids = col.find(filtroIncompativel,{_id:1}).limit(limiteRelatorio).toArray();

// Diagnóstico secundário por regra: não substitui o teste completo acima.
// As consultas abaixo projetam somente _id, nunca conteúdo ou valores dos documentos.
const incompativeis = ids.map(({_id})=>{
  const falhas = [];
  function falhaRegra(regra) {
    return !!col.findOne({$and:[{_id},{$nor:[{$jsonSchema:regra}]}]},{_id:1});
  }
  for (const campo of schema.required) {
    if (falhaRegra({required:[campo]})) falhas.push('Obrigatório ausente: '+campo);
  }
  for (const [campo,regra] of Object.entries(schema.properties)) {
    if (falhaRegra({properties:{[campo]:regra}}))
      falhas.push('Tipo, limite, enum ou estrutura interna incompatível: '+campo);
  }
  const camposDeclarados = Object.fromEntries(Object.keys(schema.properties).map(k=>[k,{}]));
  if (falhaRegra({additionalProperties:false,properties:camposDeclarados}))
    falhas.push('Campo adicional não permitido no documento principal.');
  if (falhaRegra({oneOf:schema.oneOf}))
    falhas.push('Condição editorial incompatível: legado exige revisadoEm; pendente exige ativo false; aprovada exige revisadoEm.');
  if (!falhas.length)
    falhas.push('Não detalhado: conferir possível alteração concorrente; repetir a leitura antes de aplicar.');
  return {_id,incompatibilidades:falhas};
});

const caminhos = diferencas(normalizar(opcoes.validator || {}),normalizar(novo.validator));
const nivel = opcoes.validationLevel || 'strict';
const acao = opcoes.validationAction || 'error';
const relatorio = {
  banco:principal.getName(),
  colecao:nomeColecao,
  somenteLeitura:true,
  comparacao:{
    schemaIgualAoArquivo:caminhos.length===0,
    caminhosDiferentes:caminhos,
    validationLevelAtual:nivel,
    validationActionAtual:acao,
    configuracaoIgualAoArquivo:caminhos.length===0 &&
      nivel===novo.validationLevel && acao===novo.validationAction,
  },
  documentos:{
    total,
    compativeis:total-quantidadeIncompativel,
    incompativeis:quantidadeIncompativel,
    limiteIdsDetalhados:limiteRelatorio,
    relatorioTruncado:quantidadeIncompativel>limiteRelatorio,
    detalhes:incompativeis,
  },
  observacao:'Leituras não são snapshot único. Nenhuma alteração realizada; compatibilidade estrutural não comprova revisão técnica, referências ou autorização.'
};
printjson(relatorio);
relatorio;


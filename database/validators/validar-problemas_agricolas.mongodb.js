// Cadastro completo mesmo inativo; revisão técnica e referências cabem à aplicação.
use('sentinela');
db.runCommand({
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
});

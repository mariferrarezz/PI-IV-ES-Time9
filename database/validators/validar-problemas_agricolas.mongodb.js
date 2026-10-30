// Cadastro completo mesmo inativo; revisão técnica e referências cabem à aplicação.
use('sentinela');
db.runCommand({
  collMod: 'problemas_agricolas',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'nomeComum', 'tipo', 'descricao', 'culturasAfetadasIds', 'sintomas', 'medidasPreventivas', 'formasControle', 'fontesIds', 'revisadoEm', 'ativo', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        nomeComum: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        nomeCientifico: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        tipo: { bsonType: 'string', enum: ['praga', 'doenca', 'deficiencia'] },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        culturasAfetadasIds: { bsonType: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { bsonType: 'objectId' } },
        sintomas: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        partesAfetadas: { bsonType: 'array', maxItems: 30, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        condicoesFavoraveis: { bsonType: 'array', maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        informacoesDisseminacao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        medidasPreventivas: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        formasControle: {
          bsonType: 'array', minItems: 1, maxItems: 30,
          items: {
            bsonType: 'object', additionalProperties: false, required: ['tipo', 'descricao'],
            properties: {
              tipo: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
              descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
              observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
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
        revisadoEm: { bsonType: 'date' }, ativo: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

// Catálogo de culturas, com uma imagem representativa opcional.
use('sentinela');
db.runCommand({
  collMod: 'culturas',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'nome', 'ativa', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        nome: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
        nomeCientifico: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        imagem: {
          bsonType: 'object', additionalProperties: false,
          required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
          properties: {
            url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
            publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
            legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
            enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
          },
        },
        ativa: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

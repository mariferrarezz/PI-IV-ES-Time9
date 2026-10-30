// Medidas realizadas; autorização e ocorrência/plantação ativas cabem à aplicação.
use('sentinela');
db.runCommand({
  collMod: 'tratamentos',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'ocorrenciaId', 'registradoPor', 'tipoMedida', 'descricao', 'dataAplicacao', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, ocorrenciaId: { bsonType: 'objectId' }, registradoPor: { bsonType: 'objectId' },
        tipoMedida: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        dataAplicacao: { bsonType: 'date' },
        areaTratadaHa: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
        produtoUtilizado: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        quantidadeUtilizada: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
        unidadeQuantidade: { bsonType: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
        responsavelAplicacao: { bsonType: 'string', minLength: 2, maxLength: 150, pattern: '\\S' },
        observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        imagens: {
          bsonType: 'array', maxItems: 5,
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
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Quantidade e unidade são opcionais, mas sempre juntas.
      dependencies: { quantidadeUtilizada: ['unidadeQuantidade'], unidadeQuantidade: ['quantidadeUtilizada'] },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

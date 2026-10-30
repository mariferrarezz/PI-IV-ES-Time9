// Inspeções com ou sem ocorrência vinculada.
use('sentinela');
db.runCommand({
  collMod: 'monitoramentos',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'plantacaoId', 'registradoPor', 'dataObservacao', 'problemaObservado', 'observacoes', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, plantacaoId: { bsonType: 'objectId' }, ocorrenciaId: { bsonType: 'objectId' },
        registradoPor: { bsonType: 'objectId' }, dataObservacao: { bsonType: 'date' },
        problemaObservado: { bsonType: 'bool' },
        observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        intensidade: { bsonType: 'string', enum: ['baixa', 'media', 'alta'] },
        evolucao: { bsonType: 'string', enum: ['melhorou', 'estavel', 'piorou', 'nao_avaliada'] },
        areaAfetadaHa: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
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
        proximaInspecaoEm: { bsonType: 'date' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      allOf: [
        { oneOf: [
          { properties: { problemaObservado: { enum: [true] } }, required: ['intensidade'] },
          { properties: { problemaObservado: { enum: [false] } },
            not: { anyOf: [{ required: ['intensidade'] }, { required: ['areaAfetadaHa'] }] } },
        ] },
        // Sem ocorrência: evolução ausente ou não avaliada.
        { anyOf: [
          { required: ['ocorrenciaId'] },
          { properties: { evolucao: { enum: ['nao_avaliada'] } } },
        ] },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

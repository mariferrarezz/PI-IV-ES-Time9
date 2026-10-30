// Estrutura da ocorrência; transições e estado da plantação cabem à aplicação.
use('sentinela');
db.runCommand({
  collMod: 'ocorrencias',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'plantacaoId', 'registradoPor', 'tipo', 'dataObservacao', 'sintomas', 'intensidade', 'status', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, plantacaoId: { bsonType: 'objectId' }, registradoPor: { bsonType: 'objectId' },
        tipo: { bsonType: 'string', enum: ['praga', 'doenca', 'deficiencia', 'nao_identificado'] },
        problemaAgricolaId: { bsonType: 'objectId' }, dataObservacao: { bsonType: 'date' },
        sintomas: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        intensidade: { bsonType: 'string', enum: ['baixa', 'media', 'alta'] },
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
        status: { bsonType: 'string', enum: ['aberta', 'em_acompanhamento', 'encerrada'] },
        encerradoEm: { bsonType: 'date' },
        motivoEncerramento: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      allOf: [
        // Encerramento exige data/motivo; demais estados proíbem ambos.
        { oneOf: [
          { properties: { status: { enum: ['encerrada'] } }, required: ['encerradoEm', 'motivoEncerramento'] },
          { properties: { status: { enum: ['aberta', 'em_acompanhamento'] } },
            not: { anyOf: [{ required: ['encerradoEm'] }, { required: ['motivoEncerramento'] }] } },
        ] },
        // Tipo não identificado não pode vincular um problema do catálogo.
        { not: { properties: { tipo: { enum: ['nao_identificado'] } }, required: ['problemaAgricolaId'] } },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

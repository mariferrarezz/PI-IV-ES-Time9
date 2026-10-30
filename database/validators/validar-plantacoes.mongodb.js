// Cultivos; referências, finitude e comparações de datas/áreas cabem à aplicação.
use('sentinela');
db.runCommand({
  collMod: 'plantacoes',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'talhaoId', 'culturaId', 'status', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, talhaoId: { bsonType: 'objectId' }, culturaId: { bsonType: 'objectId' },
        variedade: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        safra: { bsonType: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
        dataPlantio: { bsonType: 'date' },
        areaPlantadaHa: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
        status: { bsonType: 'string', enum: ['ativa', 'encerrada'] },
        dataEncerramento: { bsonType: 'date' },
        observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Encerrada exige data; ativa exige ausência do campo.
      oneOf: [
        { properties: { status: { enum: ['encerrada'] } }, required: ['dataEncerramento'] },
        { properties: { status: { enum: ['ativa'] } }, not: { required: ['dataEncerramento'] } },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

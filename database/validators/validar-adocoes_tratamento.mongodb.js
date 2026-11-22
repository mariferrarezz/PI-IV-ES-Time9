// Planejamento não é tratamento realizado; unicidade depende do índice parcial.
use('sentinela');
db.runCommand({
  collMod: 'adocoes_tratamento',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'usuarioId', 'experienciaId', 'experienciaVersao', 'ocorrenciaId', 'metodoCopiado', 'planejamento', 'status', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, usuarioId: { bsonType: 'objectId' }, experienciaId: { bsonType: 'objectId' },
        experienciaVersao: { bsonType: ['int', 'long'], minimum: 1 }, ocorrenciaId: { bsonType: 'objectId' },
        metodoCopiado: {
          bsonType: 'object', additionalProperties: false, required: ['tipoMedida', 'descricao'],
          properties: {
            tipoMedida: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
            descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
            observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
          },
        },
        planejamento: {
          bsonType: 'object', additionalProperties: false, required: ['descricao'],
          properties: {
            descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
            dataPrevista: { bsonType: 'date' },
            observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
          },
        },
        status: { bsonType: 'string', enum: ['planejada', 'realizada', 'cancelada'] },
        tratamentoId: { bsonType: 'objectId' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Tratamento vinculado somente quando realizada.
      oneOf: [
        { properties: { status: { enum: ['realizada'] } }, required: ['tratamentoId'] },
        { properties: { status: { enum: ['planejada', 'cancelada'] } }, not: { required: ['tratamentoId'] } },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

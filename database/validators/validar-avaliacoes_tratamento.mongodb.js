// Resultados observados; compatibilidade e datas relacionadas cabem à aplicação.
use('sentinela');
db.runCommand({
  collMod: 'avaliacoes_tratamento',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'tratamentoId', 'registradoPor', 'dataAvaliacao', 'resultado', 'observacoes', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, tratamentoId: { bsonType: 'objectId' }, registradoPor: { bsonType: 'objectId' },
        dataAvaliacao: { bsonType: 'date' },
        resultado: { bsonType: 'string', enum: ['melhora_observada', 'sem_mudanca', 'piora_observada', 'inconclusivo'] },
        observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        monitoramentoId: { bsonType: 'objectId' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

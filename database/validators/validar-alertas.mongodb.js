// Tipo inicial do MVP; geração e deduplicação não são garantidas pelo schema.
use('sentinela');
db.runCommand({
  collMod: 'alertas',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'usuarioId', 'tipo', 'titulo', 'mensagem', 'prioridade', 'contexto', 'criadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, usuarioId: { bsonType: 'objectId' },
        tipo: { bsonType: 'string', enum: ['ocorrencia_intensidade_alta'] },
        titulo: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
        mensagem: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
        // O único tipo atual usa obrigatoriamente prioridade alta.
        prioridade: { bsonType: 'string', enum: ['alta'] },
        contexto: {
          bsonType: 'object', additionalProperties: false, required: ['tipo', 'id'],
          properties: { tipo: { bsonType: 'string', enum: ['ocorrencia'] }, id: { bsonType: 'objectId' } },
        },
        lidoEm: { bsonType: 'date' }, expiraEm: { bsonType: 'date' }, criadoEm: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

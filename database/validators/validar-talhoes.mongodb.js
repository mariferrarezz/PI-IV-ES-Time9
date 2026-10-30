// Seleciona o banco na conexão ativa do Playground.
use('sentinela');

// Aplica a validação à coleção existente, sem recriá-la.
db.runCommand({
  collMod: 'talhoes',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      // Aceita somente os campos documentados no BD3 e no BD4.
      additionalProperties: false,
      required: [
        '_id',
        'propriedadeId',
        'nome',
        'areaHa',
        'ativo',
        'criadoEm',
        'atualizadoEm',
      ],
      properties: {
        _id: { bsonType: 'objectId' },
        propriedadeId: { bsonType: 'objectId' },
        nome: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 150,
          pattern: '\\S',
        },
        // Área positiva em hectares; finitude é verificada pela aplicação.
        areaHa: {
          bsonType: ['int', 'long', 'double', 'decimal'],
          minimum: 0,
          exclusiveMinimum: true,
        },
        // Opcional; quando presente, exige texto válido.
        observacoes: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 5000,
          pattern: '\\S',
        },
        ativo: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' },
        atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  // Rejeita inserções e atualizações que não atendam ao schema.
  validationLevel: 'strict',
  validationAction: 'error',
});

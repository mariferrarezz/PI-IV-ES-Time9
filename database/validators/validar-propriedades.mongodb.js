// Seleciona o banco na conexão ativa do Playground.
use('sentinela');

// Configura a coleção existente, sem recriá-la.
db.runCommand({
  collMod: 'propriedades',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      // Permite somente os campos definidos no BD3 e no BD4.
      additionalProperties: false,
      required: [
        '_id',
        'usuarioId',
        'nome',
        'municipio',
        'estado',
        'ativa',
        'criadoEm',
        'atualizadoEm',
      ],
      properties: {
        _id: { bsonType: 'objectId' },
        usuarioId: { bsonType: 'objectId' },
        nome: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 150,
          pattern: '\\S',
        },
        municipio: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 150,
          pattern: '\\S',
        },
        // Aceita somente as 27 siglas de UF brasileiras.
        estado: {
          bsonType: 'string',
          enum: [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
          ],
        },
        // Área total opcional e positiva; finitude cabe à aplicação.
        areaTotalHa: {
          bsonType: ['int', 'long', 'double', 'decimal'],
          minimum: 0,
          exclusiveMinimum: true,
        },
        // Opcional; quando presente, não aceita texto vazio ou só espaços.
        observacoes: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 5000,
          pattern: '\\S',
        },
        ativa: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' },
        atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  // Rejeita inserções e atualizações que não atendam ao schema.
  validationLevel: 'strict',
  validationAction: 'error',
});

// Publicações utilizadas na base de conhecimento.
use('sentinela');
db.runCommand({
  collMod: 'fontes_conhecimento',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'titulo', 'instituicaoOuAutor', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        titulo: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
        instituicaoOuAutor: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https?://[^\\s/?#]+[^\\s]*$' },
        publicadoEm: { bsonType: 'date' }, acessadoEm: { bsonType: 'date' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Uma fonte com URL exige data de acesso.
      dependencies: { url: ['acessadoEm'] },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

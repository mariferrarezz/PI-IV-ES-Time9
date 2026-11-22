// A denúncia não oculta a publicação automaticamente.
use('sentinela');
db.runCommand({
  collMod: 'denuncias_comunidade',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'experienciaId', 'denuncianteId', 'motivo', 'status', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, experienciaId: { bsonType: 'objectId' }, denuncianteId: { bsonType: 'objectId' },
        motivo: { bsonType: 'string', enum: ['dados_pessoais', 'conteudo_inadequado', 'informacao_perigosa', 'outro'] },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 2000, pattern: '\\S' },
        status: { bsonType: 'string', enum: ['pendente', 'analisada'] },
        decisao: { bsonType: 'string', enum: ['manter_publicacao', 'ocultar_publicacao'] },
        justificativa: { bsonType: 'string', minLength: 1, maxLength: 2000, pattern: '\\S' },
        analisadoPor: { bsonType: 'objectId' }, analisadoEm: { bsonType: 'date' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Em pendente, a decisão ainda não existe; em analisada, é obrigatória.
      oneOf: [
        { properties: { status: { enum: ['analisada'] } }, required: ['decisao', 'justificativa', 'analisadoPor', 'analisadoEm'] },
        {
          properties: { status: { enum: ['pendente'] } },
          not: { anyOf: [
            { required: ['decisao'] }, { required: ['justificativa'] },
            { required: ['analisadoPor'] }, { required: ['analisadoEm'] },
          ] },
        },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

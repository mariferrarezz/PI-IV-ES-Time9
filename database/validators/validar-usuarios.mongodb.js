// Perfil, termos e questionário conforme BD3 e BD4.
use('sentinela');
db.runCommand({
  collMod: 'usuarios',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'firebaseUid', 'nomeCompleto', 'cpf', 'telefone', 'termos', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        firebaseUid: { bsonType: 'string', minLength: 1, maxLength: 128, pattern: '\\S' },
        nomeCompleto: { bsonType: 'string', minLength: 2, maxLength: 150, pattern: '\\S' },
        nomePublico: { bsonType: 'string', minLength: 2, maxLength: 80, pattern: '\\S' },
        cpf: { bsonType: 'string', minLength: 11, maxLength: 11, pattern: '^[0-9]{11}$' },
        telefone: { bsonType: 'string', minLength: 14, maxLength: 14, pattern: '^\\+55[0-9]{2}9[0-9]{8}$' },
        // A etapa do cadastro que exige o canal é conferida pela aplicação.
        canalCodigoPreferido: { bsonType: 'string', enum: ['sms', 'email'] },
        fotoPerfil: {
          bsonType: 'object', additionalProperties: false,
          required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
          properties: {
            // Esquema/protocolo; a aplicação confere a URL completa e o recurso.
            url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
            publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
            legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
            enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
          },
        },
        termos: {
          bsonType: 'object', additionalProperties: false,
          required: ['versao', 'aceitoEm'],
          properties: {
            versao: { bsonType: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
            aceitoEm: { bsonType: 'date' },
          },
        },
        questionario: {
          bsonType: 'object', additionalProperties: false,
          required: ['versao', 'portePropriedade', 'quantidadeCulturas', 'culturasIds', 'problemasFrequentes', 'frequenciaProblemas', 'identificaProblemasSozinho', 'concluidoEm'],
          properties: {
            versao: { bsonType: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
            portePropriedade: { bsonType: 'string', enum: ['pequena', 'media', 'grande'] },
            quantidadeCulturas: { bsonType: 'string', enum: ['1', '2', '3', '4_ou_mais'] },
            culturasIds: { bsonType: 'array', maxItems: 50, uniqueItems: true, items: { bsonType: 'objectId' } },
            outraCultura: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
            problemasFrequentes: {
              bsonType: 'array', minItems: 1, maxItems: 2, uniqueItems: true,
              // Não identificado sozinho; pragas/doenças podem ser combinados.
              oneOf: [
                { maxItems: 1, items: { bsonType: 'string', enum: ['nao_identificado'] } },
                { items: { bsonType: 'string', enum: ['pragas', 'doencas'] } },
              ],
            },
            frequenciaProblemas: { bsonType: 'string', enum: ['raramente', 'as_vezes', 'frequentemente', 'sempre'] },
            identificaProblemasSozinho: { bsonType: 'string', enum: ['sim', 'nao', 'as_vezes'] },
            concluidoEm: { bsonType: 'date' },
          },
          // Selecionar ao menos uma cultura ou informar outra (ambos são permitidos).
          anyOf: [
            { properties: { culturasIds: { minItems: 1 } } },
            { required: ['outraCultura'] },
          ],
        },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

// Aplicar somente após criar a coleção; conteúdo público é cópia selecionada.
use('sentinela');
db.runCommand({
  collMod: 'experiencias_comunidade',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'autorId', 'ocorrenciaOrigemId', 'nomePublico', 'culturaId', 'culturaNome', 'tipoProblema', 'statusOcorrencia', 'titulo', 'relato', 'versao', 'moderacao', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, autorId: { bsonType: 'objectId' }, ocorrenciaOrigemId: { bsonType: 'objectId' },
        tratamentoOrigemId: { bsonType: 'objectId' }, avaliacaoOrigemId: { bsonType: 'objectId' },
        nomePublico: { bsonType: 'string', minLength: 2, maxLength: 80, pattern: '\\S' },
        culturaId: { bsonType: 'objectId' },
        culturaNome: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        problemaAgricolaId: { bsonType: 'objectId' },
        problemaNome: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        tipoProblema: { bsonType: 'string', enum: ['praga', 'doenca', 'deficiencia', 'nao_identificado'] },
        statusOcorrencia: { bsonType: 'string', enum: ['aberta', 'em_acompanhamento', 'encerrada'] },
        titulo: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
        relato: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        fotos: {
          bsonType: 'array', maxItems: 5,
          // A aplicação impede publicIds repetidos e exige seleção explícita.
          items: {
            bsonType: 'object', additionalProperties: false, required: ['url', 'publicId'],
            properties: {
              url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
              publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
              legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
            },
          },
        },
        metodo: {
          bsonType: 'object', additionalProperties: false, required: ['tipoMedida', 'descricao'],
          properties: {
            tipoMedida: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
            descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
            observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
          },
        },
        resultadoRelatado: {
          bsonType: 'object', additionalProperties: false, required: ['resultado', 'dataAvaliacao'],
          properties: {
            resultado: { bsonType: 'string', enum: ['melhora_observada', 'sem_mudanca', 'piora_observada', 'inconclusivo'] },
            dataAvaliacao: { bsonType: 'date' },
            observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
          },
        },
        regiao: {
          bsonType: 'object', additionalProperties: false, minProperties: 1,
          properties: {
            municipio: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
            estado: { bsonType: 'string', enum: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] },
          },
        },
        versao: { bsonType: ['int', 'long'], minimum: 1 },
        moderacao: {
          bsonType: 'object', additionalProperties: false, required: ['status'],
          properties: {
            status: { bsonType: 'string', enum: ['pendente', 'aprovada', 'rejeitada', 'oculta', 'retirada'] },
            revisadoPor: { bsonType: 'objectId' }, revisadoEm: { bsonType: 'date' },
            motivo: { bsonType: 'string', minLength: 1, maxLength: 2000, pattern: '\\S' },
          },
          // Cada estado exige ou proíbe os campos da última revisão.
          oneOf: [
            {
              properties: { status: { enum: ['pendente'] } },
              not: { anyOf: [{ required: ['revisadoPor'] }, { required: ['revisadoEm'] }, { required: ['motivo'] }] },
            },
            { properties: { status: { enum: ['aprovada'] } }, required: ['revisadoPor', 'revisadoEm'] },
            { properties: { status: { enum: ['rejeitada', 'oculta'] } }, required: ['revisadoPor', 'revisadoEm', 'motivo'] },
            {
              // Retirada pode preservar a última decisão, sem inventar revisão.
              properties: { status: { enum: ['retirada'] } },
              dependencies: {
                revisadoPor: ['revisadoEm'], revisadoEm: ['revisadoPor'], motivo: ['revisadoPor', 'revisadoEm'],
              },
            },
          ],
        },
        publicadoEm: { bsonType: 'date' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Dependências expressas na BD3; existência/cadeia são da aplicação.
      // BD3 não proíbe expressamente método/nome sem suas referências de origem.
      dependencies: {
        tratamentoOrigemId: ['metodo'],
        avaliacaoOrigemId: ['tratamentoOrigemId', 'resultadoRelatado'],
        resultadoRelatado: ['avaliacaoOrigemId'],
        problemaAgricolaId: ['problemaNome'],
      },
      allOf: [
        // Aprovada exige publicação; outros estados podem preservar a data.
        { oneOf: [
          { properties: { moderacao: { properties: { status: { enum: ['aprovada'] } } } }, required: ['publicadoEm'] },
          { properties: { moderacao: { properties: { status: { enum: ['pendente', 'rejeitada', 'oculta', 'retirada'] } } } } },
        ] },
        // Preserva a consistência do tipo não identificado da ocorrência copiada.
        { not: { properties: { tipoProblema: { enum: ['nao_identificado'] } }, required: ['problemaAgricolaId'] } },
      ],
      // Imutabilidade de publicadoEm/versões e projeção pública são da aplicação.
    },
  },
  validationLevel: 'strict', validationAction: 'error',
});

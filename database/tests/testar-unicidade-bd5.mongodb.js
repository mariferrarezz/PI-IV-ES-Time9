use('sentinela_testes_bd5');
const alvo = db.getSiblingDB('sentinela_testes_bd5');
if (alvo.getName() !== 'sentinela_testes_bd5') throw new Error('Banco incorreto.');
// Referências literais dos validadores individuais atuais; tabela de dados, sem executar os collMod.
const configuracoes = {
"usuarios": {
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
},
"propriedades": {
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
},
"talhoes": {
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
},
"culturas": {
  collMod: 'culturas',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'nome', 'ativa', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        nome: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
        nomeCientifico: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        imagem: {
          bsonType: 'object', additionalProperties: false,
          required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
          properties: {
            url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
            publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
            legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
            enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
          },
        },
        ativa: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
},
"fontes_conhecimento": {
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
},
"problemas_agricolas": {
  collMod: 'problemas_agricolas',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'nomeComum', 'tipo', 'descricao', 'culturasAfetadasIds', 'sintomas', 'medidasPreventivas', 'formasControle', 'fontesIds', 'ativo', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' },
        nomeComum: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        nomeCientifico: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        codigoEditorial: { bsonType: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
        chips: {
          bsonType: 'array', maxItems: 4,
          items: { bsonType: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
        },
        niveisAtencao: {
          bsonType: 'object', additionalProperties: false, required: ['baixo', 'medio', 'alto'],
          properties: {
            baixo: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
            medio: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
            alto: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
          },
        },
        tipo: { bsonType: 'string', enum: ['praga', 'doenca', 'deficiencia'] },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        culturasAfetadasIds: { bsonType: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { bsonType: 'objectId' } },
        sintomas: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        ondeOlhar: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        dicaDeCampo: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        danos: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        perdaEstimada: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        epocaPropicia: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        abrangenciaCulturas: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' },
        partesAfetadas: { bsonType: 'array', maxItems: 30, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        condicoesFavoraveis: { bsonType: 'array', maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        informacoesDisseminacao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        medidasPreventivas: { bsonType: 'array', minItems: 1, maxItems: 50, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        tratamentoIntro: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        boasPraticas: { bsonType: 'array', minItems: 1, maxItems: 30, items: { bsonType: 'string', minLength: 1, maxLength: 1000, pattern: '\\S' } },
        formasControle: {
          bsonType: 'array', minItems: 1, maxItems: 30,
          items: {
            bsonType: 'object', additionalProperties: false, required: ['tipo', 'descricao'],
            properties: {
              tipo: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
              descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
              observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
              classe: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
              exemplosControle: {
                bsonType: 'array', maxItems: 30,
                items: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
              },
            },
          },
        },
        orientacaoBuscaAgronomo: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        imagens: {
          bsonType: 'array', maxItems: 5,
          // Repetição de publicId entre objetos diferentes é conferida na aplicação.
          items: {
            bsonType: 'object', additionalProperties: false, required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
            properties: {
              url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
              publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
              legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
              enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
            },
          },
        },
        fontesIds: { bsonType: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { bsonType: 'objectId' } },
        revisaoEditorial: {
          bsonType: 'object', additionalProperties: false, required: ['status'],
          properties: {
            status: { bsonType: 'string', enum: ['pendente', 'aprovada'] },
            observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
            registroAgrofitConferido: { bsonType: 'bool' },
            fotoPendente: { bsonType: 'bool' },
          },
        },
        revisadoEm: { bsonType: 'date' }, ativo: { bsonType: 'bool' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Legado conserva a exigência anterior; ausência de status não aprova conteúdo na API.
      oneOf: [
        { not: { required: ['revisaoEditorial'] }, required: ['revisadoEm'] },
        {
          required: ['revisaoEditorial'],
          properties: {
            revisaoEditorial: { properties: { status: { enum: ['pendente'] } } },
            ativo: { enum: [false] },
          },
        },
        {
          required: ['revisaoEditorial', 'revisadoEm'],
          properties: { revisaoEditorial: { properties: { status: { enum: ['aprovada'] } } } },
        },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
},
"plantacoes": {
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
},
"ocorrencias": {
  collMod: 'ocorrencias',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'plantacaoId', 'registradoPor', 'tipo', 'dataObservacao', 'sintomas', 'intensidade', 'status', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, plantacaoId: { bsonType: 'objectId' }, registradoPor: { bsonType: 'objectId' },
        tipo: { bsonType: 'string', enum: ['praga', 'doenca', 'deficiencia', 'nao_identificado'] },
        problemaAgricolaId: { bsonType: 'objectId' }, dataObservacao: { bsonType: 'date' },
        sintomas: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        intensidade: { bsonType: 'string', enum: ['baixa', 'media', 'alta'] },
        areaAfetadaHa: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
        imagens: {
          bsonType: 'array', maxItems: 5,
          items: {
            bsonType: 'object', additionalProperties: false, required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
            properties: {
              url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
              publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
              legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
              enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
            },
          },
        },
        status: { bsonType: 'string', enum: ['aberta', 'em_acompanhamento', 'encerrada'] },
        encerradoEm: { bsonType: 'date' },
        motivoEncerramento: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      allOf: [
        // Encerramento exige data/motivo; demais estados proíbem ambos.
        { oneOf: [
          { properties: { status: { enum: ['encerrada'] } }, required: ['encerradoEm', 'motivoEncerramento'] },
          { properties: { status: { enum: ['aberta', 'em_acompanhamento'] } },
            not: { anyOf: [{ required: ['encerradoEm'] }, { required: ['motivoEncerramento'] }] } },
        ] },
        // Tipo não identificado não pode vincular um problema do catálogo.
        { not: { properties: { tipo: { enum: ['nao_identificado'] } }, required: ['problemaAgricolaId'] } },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
},
"tratamentos": {
  collMod: 'tratamentos',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'ocorrenciaId', 'registradoPor', 'tipoMedida', 'descricao', 'dataAplicacao', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, ocorrenciaId: { bsonType: 'objectId' }, registradoPor: { bsonType: 'objectId' },
        tipoMedida: { bsonType: 'string', enum: ['manual', 'cultural', 'biologica', 'quimica', 'outra'] },
        descricao: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        dataAplicacao: { bsonType: 'date' },
        areaTratadaHa: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
        produtoUtilizado: { bsonType: 'string', minLength: 1, maxLength: 200, pattern: '\\S' },
        quantidadeUtilizada: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0, exclusiveMinimum: true },
        unidadeQuantidade: { bsonType: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
        responsavelAplicacao: { bsonType: 'string', minLength: 2, maxLength: 150, pattern: '\\S' },
        observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        imagens: {
          bsonType: 'array', maxItems: 5,
          items: {
            bsonType: 'object', additionalProperties: false, required: ['url', 'publicId', 'enviadaPor', 'enviadaEm'],
            properties: {
              url: { bsonType: 'string', minLength: 1, maxLength: 2048, pattern: '^https://[^\\s/?#]+[^\\s]*$' },
              publicId: { bsonType: 'string', minLength: 1, pattern: '\\S' },
              legenda: { bsonType: 'string', minLength: 1, maxLength: 300, pattern: '\\S' },
              enviadaPor: { bsonType: 'objectId' }, enviadaEm: { bsonType: 'date' },
            },
          },
        },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      // Quantidade e unidade são opcionais, mas sempre juntas.
      dependencies: { quantidadeUtilizada: ['unidadeQuantidade'], unidadeQuantidade: ['quantidadeUtilizada'] },
    },
  },
  validationLevel: 'strict', validationAction: 'error',
},
"experiencias_comunidade": {
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
},
"alertas": {
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
},
"adocoes_tratamento": {
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
}
};

const indices = [
  {colecao:'usuarios',nome:'uq_usuarios_firebaseUid',key:{firebaseUid:1},opcoes:{unique:true}},
  {colecao:'plantacoes',nome:'uq_plantacoes_talhao_ativa',key:{talhaoId:1},
    opcoes:{unique:true,partialFilterExpression:{status:'ativa'}}},
  {colecao:'alertas',nome:'uq_alertas_evento_ocorrencia',
    key:{tipo:1,'contexto.tipo':1,'contexto.id':1},
    opcoes:{unique:true,partialFilterExpression:{tipo:'ocorrencia_intensidade_alta','contexto.tipo':'ocorrencia'}}},
  {colecao:'adocoes_tratamento',nome:'uq_adocoes_experiencia_ocorrencia_planejada',
    key:{experienciaId:1,ocorrenciaId:1},
    opcoes:{unique:true,partialFilterExpression:{status:'planejada'}}},
];
const rodada = new ObjectId().toHexString();
const instante = new Date();
const resultados = [];
const provas = {};
const documentosRodada = [];
function registrar(teste,esperado,situacao,obtido) {
  resultados.push({teste,esperado,situacao,obtido});
}
function detalhe(e) {
  // Não imprimir errInfo, documento rejeitado ou valores das chaves.
  return {codigo:e.code || null,nome:e.codeName || e.name,mensagem:e.message};
}
function clonar(v) { return EJSON.parse(EJSON.stringify(v)); }
function normalizar(v) {
  if(v && ['Int32','Long','Double','Decimal128'].includes(v._bsontype))return Number(v.toString());
  if(Array.isArray(v))return v.map(normalizar);
  if(v && typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalizar(v[k])]));
  return v;
}
function iguais(a,b) { return JSON.stringify(normalizar(a))===JSON.stringify(normalizar(b)); }
function chavesIguais(a,b) {
  return JSON.stringify(Object.entries(a).map(([k,v])=>[k,Number(v)]))===
    JSON.stringify(Object.entries(b).map(([k,v])=>[k,Number(v)]));
}
function opcoesIguais(a,b) {
  return !!a.unique===!!b.unique && !a.sparse && !a.hidden &&
    a.expireAfterSeconds===undefined && !a.collation &&
    iguais(a.partialFilterExpression || {},b.partialFilterExpression || {});
}
function exigirResposta(r) {
  if(r && r.ok!==undefined && Number(r.ok)!==1) {
    const erro=new Error(r.errmsg || 'Comando recusado.');erro.code=r.code;throw erro;
  }
}
function configurar() {
  // Só configura ausência de validator; divergências preexistentes interrompem a preparação.
  for(const [nome,cfg] of Object.entries(configuracoes)) {
    const info=alvo.getCollectionInfos({name:nome})[0];
    if(!info) {
      exigirResposta(alvo.createCollection(nome,{validator:cfg.validator,validationLevel:'strict',validationAction:'error'}));
    } else {
      if(info.type!=='collection')throw new Error('Não é coleção: '+nome);
      const op=info.options || {};
      if(op.collation && op.collation.locale!=='simple')
        throw new Error('Collation inesperada: '+nome);
      if(!op.validator || !Object.keys(op.validator).length) {
        const incompat=alvo.getCollection(nome).find({$nor:[cfg.validator]},{_id:1}).limit(1).toArray();
        if(incompat.length)throw new Error('Dados existentes incompatíveis; não configurar: '+nome);
        exigirResposta(alvo.runCommand({collMod:nome,validator:cfg.validator,
          validationLevel:'strict',validationAction:'error'}));
      } else if(!iguais(op.validator,cfg.validator) ||
        (op.validationLevel || 'strict')!=='strict' || (op.validationAction || 'error')!=='error') {
        throw new Error('Validador existente divergente; preservado: '+nome);
      }
    }
    const salvo=alvo.getCollectionInfos({name:nome})[0].options || {};
    if(!iguais(salvo.validator,cfg.validator) ||
      (salvo.validationLevel || 'strict')!=='strict' || (salvo.validationAction || 'error')!=='error')
      throw new Error('Configuração não confirmada: '+nome);
  }
  for(const indice of indices) {
    const col=alvo.getCollection(indice.colecao), existentes=col.getIndexes();
    const porNome=existentes.find(i=>i.name===indice.nome);
    if(porNome && (!chavesIguais(porNome.key,indice.key) || !opcoesIguais(porNome,indice.opcoes)))
      throw new Error('Nome de índice conflitante; preservado: '+indice.nome);
    if(existentes.some(i=>chavesIguais(i.key,indice.key) && !opcoesIguais(i,indice.opcoes)))
      throw new Error('Chaves com opções conflitantes; preservar e analisar: '+indice.colecao);
    let equivalente=existentes.find(i=>chavesIguais(i.key,indice.key) && opcoesIguais(i,indice.opcoes));
    if(!equivalente) {
      // Audita somente o subconjunto do índice, sem imprimir seus valores.
      const filtro=indice.opcoes.partialFilterExpression || {};
      const grupo=Object.fromEntries(Object.keys(indice.key).map((k,n)=>['k'+n,'$'+k]));
      const duplicadas=col.aggregate([{$match:filtro},{$group:{_id:grupo,n:{$sum:1}}},
        {$match:{n:{$gt:1}}},{$limit:1}]).toArray();
      if(duplicadas.length)throw new Error('Duplicidade preexistente; índice não criado: '+indice.nome);
      col.createIndex(indice.key,{name:indice.nome,...indice.opcoes});
      equivalente=col.getIndexes().find(i=>chavesIguais(i.key,indice.key) && opcoesIguais(i,indice.opcoes));
    }
    if(!equivalente)throw new Error('Índice não confirmado: '+indice.nome);
    registrar('configuração '+indice.colecao,'índice exato do BD4','aprovado',
      {nomeEfetivo:equivalente.name,chaves:equivalente.key,opcoes:indice.opcoes});
    const auxiliar='bd5_prova_schema_'+indice.colecao+'_'+rodada;
    exigirResposta(alvo.createCollection(auxiliar,{validator:configuracoes[indice.colecao].validator,
      validationLevel:'strict',validationAction:'error'}));
    provas[indice.colecao]=auxiliar;
  }
}

// Todos os IDs abaixo pertencem a novos documentos desta rodada, não a sentinela.
const ids=Object.fromEntries(['usuario','propriedade','talhao','cultura','fonte','problema',
  'plantacao','origem','destino','tratamentoOrigem','tratamentoDestino','experiencia',
  'alerta','adocao'].map(n=>[n,new ObjectId()]));
const confirmado={};
function documento(id,campos,alerta=false) {
  return {_id:ids[id],...campos,criadoEm:instante,...(alerta?{}:{atualizadoEm:instante})};
}
const metodo={tipoMedida:'manual',descricao:'Metodo ficticio de teste, sem prescricao.'};
const usuario=documento('usuario',{firebaseUid:'bd5_unicidade_'+rodada,
  nomeCompleto:'Usuario Ficticio BD5',nomePublico:'Produtor ficticio BD5',
  cpf:'00000000000',telefone:'+5511900000000',termos:{versao:'teste-bd5',aceitoEm:instante}});
const plantacao=documento('plantacao',{talhaoId:ids.talhao,culturaId:ids.cultura,
  status:'ativa',areaPlantadaHa:0.5});
const alerta=documento('alerta',{usuarioId:ids.usuario,tipo:'ocorrencia_intensidade_alta',
  titulo:'TESTE UNICIDADE '+rodada,mensagem:'Evento ficticio de intensidade alta.',
  prioridade:'alta',contexto:{tipo:'ocorrencia',id:ids.destino}},true);
const adocao=documento('adocao',{usuarioId:ids.usuario,experienciaId:ids.experiencia,
  experienciaVersao:NumberInt(1),ocorrenciaId:ids.destino,metodoCopiado:metodo,
  planejamento:{descricao:'Planejamento ficticio '+rodada},status:'planejada'});
const fixtures=[
  ['usuario','usuarios',usuario,[]],
  ['propriedade','propriedades',documento('propriedade',{usuarioId:ids.usuario,
    nome:'TESTE UNICIDADE '+rodada,municipio:'Campinas',estado:'SP',areaTotalHa:10,ativa:true}),['usuario']],
  ['talhao','talhoes',documento('talhao',{propriedadeId:ids.propriedade,
    nome:'TESTE UNICIDADE '+rodada,areaHa:1,ativo:true}),['propriedade']],
  ['cultura','culturas',documento('cultura',{nome:'TESTE UNICIDADE '+rodada,ativa:true}),[]],
  ['fonte','fontes_conhecimento',documento('fonte',{titulo:'TESTE UNICIDADE '+rodada,
    instituicaoOuAutor:'Equipe ficticia'}),[]],
  ['problema','problemas_agricolas',documento('problema',{nomeComum:'TESTE UNICIDADE '+rodada,
    tipo:'praga',descricao:'Conteudo exclusivamente ficticio.',culturasAfetadasIds:[ids.cultura],
    sintomas:['Sintoma ficticio'],medidasPreventivas:['Prevencao ficticia'],
    formasControle:[{tipo:'manual',descricao:'Controle ficticio'}],fontesIds:[ids.fonte],
    revisaoEditorial:{status:'aprovada',observacoes:'Revisao simulada para teste estrutural.'},
    revisadoEm:instante,ativo:true}),['cultura','fonte']],
  ['plantacao','plantacoes',plantacao,['talhao','cultura']],
  ['origem','ocorrencias',documento('origem',{plantacaoId:ids.plantacao,registradoPor:ids.usuario,
    tipo:'praga',problemaAgricolaId:ids.problema,dataObservacao:instante,
    sintomas:'Origem ficticia '+rodada,intensidade:'baixa',status:'aberta'}),['plantacao','usuario','problema']],
  ['destino','ocorrencias',documento('destino',{plantacaoId:ids.plantacao,registradoPor:ids.usuario,
    tipo:'praga',problemaAgricolaId:ids.problema,dataObservacao:instante,
    sintomas:'Destino ficticio '+rodada,intensidade:'alta',status:'aberta'}),['plantacao','usuario','problema']],
  ['tratamentoOrigem','tratamentos',documento('tratamentoOrigem',{ocorrenciaId:ids.origem,
    registradoPor:ids.usuario,...metodo,dataAplicacao:instante}),['origem','usuario']],
  ['tratamentoDestino','tratamentos',documento('tratamentoDestino',{ocorrenciaId:ids.destino,
    registradoPor:ids.usuario,...metodo,dataAplicacao:instante}),['destino','usuario']],
  ['experiencia','experiencias_comunidade',documento('experiencia',{autorId:ids.usuario,
    ocorrenciaOrigemId:ids.origem,tratamentoOrigemId:ids.tratamentoOrigem,nomePublico:'Produtor ficticio BD5',
    culturaId:ids.cultura,culturaNome:'TESTE UNICIDADE '+rodada,
    problemaAgricolaId:ids.problema,problemaNome:'TESTE UNICIDADE '+rodada,
    tipoProblema:'praga',statusOcorrencia:'aberta',titulo:'TESTE UNICIDADE '+rodada,
    relato:'Copia ficticia selecionada para teste, sem validade agronomica.',metodo,
    versao:NumberInt(1),moderacao:{status:'aprovada',revisadoPor:ids.usuario,revisadoEm:instante},
    publicadoEm:instante}),['usuario','origem','tratamentoOrigem','cultura','problema']],
  ['alerta','alertas',alerta,['usuario','destino']],
  ['adocao','adocoes_tratamento',adocao,['usuario','experiencia','destino']],
];
const porId=Object.fromEntries(fixtures.map(([alias,col])=>[alias,col]));
function inserirBase(alias,col,doc,pais) {
  const faltam=pais.filter(p=>!confirmado[p]);
  if(faltam.length) {registrar('válido '+alias,'inserir e consultar','não executado',{dependenciasAusentes:faltam});return;}
  try {
    for(const pai of pais) {
      if(!alvo.getCollection(porId[pai]).findOne({_id:ids[pai]},{_id:1}))
        throw new Error('Pai não encontrado: '+pai);
    }
    const r=alvo.getCollection(col).insertOne(clonar(doc));
    const salvo=alvo.getCollection(col).findOne({_id:doc._id});
    if(!r.acknowledged || !salvo)throw new Error('Inserção não confirmada.');
    // Confirma aceitação também por consulta com o schema completo.
    if(!alvo.getCollection(col).findOne({$and:[{_id:doc._id},configuracoes[col].validator]},{_id:1}))
      throw new Error('Documento inserido não corresponde ao schema esperado.');
    confirmado[alias]=true;documentosRodada.push({colecao:col,_id:doc._id});
    registrar('válido '+alias,'inserir e consultar','aprovado',{_id:doc._id});
  }catch(e){registrar('válido '+alias,'inserir e consultar','falhou',detalhe(e));}
}
function novoDocumento(base) {const d=clonar(base);d._id=new ObjectId();return d;}
function e11000DoIndice(e,indice) {
  if(Number(e.code)!==11000)return false;
  if(e.keyPattern)return chavesIguais(e.keyPattern,indice.key);
  return String(e.message).includes('index: '+indice.nome+' ');
}
const casos=[];
function adicionar(nome,col,base,pais,alterar,duplicado=false) {
  const doc=novoDocumento(base);alterar(doc);
  casos.push({nome,col,doc,pais,duplicado});
}
adicionar('usuarios: firebaseUid duplicado','usuarios',usuario,['usuario'],d=>{},true);
adicionar('plantacoes: segunda ativa no mesmo talhao','plantacoes',plantacao,['plantacao'],d=>{},true);
adicionar('plantacoes: primeira encerrada no mesmo talhao','plantacoes',plantacao,['plantacao'],d=>{
  d.status='encerrada';d.dataEncerramento=instante;
});
adicionar('plantacoes: segunda encerrada no mesmo talhao','plantacoes',plantacao,['plantacao'],d=>{
  d.status='encerrada';d.dataEncerramento=instante;
});
adicionar('alertas: evento duplicado','alertas',alerta,['alerta'],d=>{},true);
adicionar('adocoes: segunda planejada no mesmo par','adocoes_tratamento',adocao,['adocao'],d=>{},true);
for(const n of [1,2]) {
  adicionar('adocoes: cancelada '+n+' no mesmo par','adocoes_tratamento',adocao,['adocao'],d=>{d.status='cancelada';});
  adicionar('adocoes: realizada '+n+' no mesmo par','adocoes_tratamento',adocao,
    ['adocao','tratamentoDestino'],d=>{d.status='realizada';d.tratamentoId=ids.tratamentoDestino;});
}
function testar(caso) {
  const esperado=caso.duplicado?'E11000 do índice esperado; documento não inserido':'inserção aceita fora do filtro';
  if(caso.pais.some(p=>!confirmado[p])) {
    registrar(caso.nome,esperado,'não executado','Dependências não confirmadas.');return;
  }
  try {
    // Prova independente: mesmo validator, mas sem índice único além do automático _id.
    // A cópia recebe um _id exclusivo e fica preservada na coleção auxiliar da rodada.
    const prova=alvo.getCollection(provas[caso.col]);
    const r=prova.insertOne(clonar(caso.doc));
    if(!r.acknowledged)throw new Error('Prova de schema não confirmada.');
    documentosRodada.push({colecao:provas[caso.col],_id:caso.doc._id});
  } catch(e) {
    registrar(caso.nome,esperado,'falhou',{etapa:'prova de schema antes da unicidade',erro:detalhe(e)});return;
  }
  const col=alvo.getCollection(caso.col), indice=indices.find(i=>i.colecao===caso.col);
  try {
    const r=col.insertOne(clonar(caso.doc));
    if(r.acknowledged)documentosRodada.push({colecao:caso.col,_id:caso.doc._id});
    const existe=!!col.findOne({_id:caso.doc._id},{_id:1});
    registrar(caso.nome,esperado,!caso.duplicado && r.acknowledged && existe?'aprovado':'falhou',
      {inserido:existe,_id:caso.doc._id,provaSchema:'aceita'});
  }catch(e) {
    try {
      const existe=!!col.findOne({_id:caso.doc._id},{_id:1});
      registrar(caso.nome,esperado,caso.duplicado && e11000DoIndice(e,indice) && !existe?'aprovado':'falhou',
        {erro:detalhe(e),inserido:existe,provaSchema:'aceita'});
    }catch(leitura) {
      registrar(caso.nome,esperado,'falhou',{erro:detalhe(e),erroConferencia:detalhe(leitura)});
    }
  }
}

let pronto=false;
try {configurar();pronto=true;}
catch(e){registrar('preparação do ambiente','schemas e índices compatíveis','falhou',detalhe(e));}
if(pronto) {
  for(const f of fixtures)inserirBase(...f);
  for(const caso of casos)testar(caso);
} else {
  for(const [alias] of fixtures)registrar('válido '+alias,'inserção válida','não executado','Preparação interrompida.');
  for(const caso of casos)registrar(caso.nome,caso.duplicado?'E11000':'inserção aceita','não executado','Preparação interrompida.');
}
registrar('alertas: documento fora do filtro parcial',
  'caso válido fora do filtro, se representável pelo schema','não executado',
  'O schema atual exige tipo ocorrencia_intensidade_alta e contexto.tipo ocorrencia: todo alerta válido entra no filtro. Não flexibilizar o validator nem criar tipo futuro para simular esse caso.');

// Confere que os documentos-base continuam presentes, íntegros e dentro do schema.
if(pronto)for(const [alias,col,esperado] of fixtures) {
  if(!confirmado[alias])continue;
  try {
    const atual=alvo.getCollection(col).findOne({_id:ids[alias]});
    const preservado=atual && iguais(EJSON.serialize(atual),EJSON.serialize(esperado)) &&
      !!alvo.getCollection(col).findOne({$and:[{_id:ids[alias]},configuracoes[col].validator]},{_id:1});
    registrar('preservação '+alias,'documento-base inalterado',preservado?'aprovado':'falhou',{_id:ids[alias],preservado:!!preservado});
  }catch(e){registrar('preservação '+alias,'documento-base inalterado','falhou',detalhe(e));}
}
const falhas=resultados.filter(r=>r.situacao==='falhou');
const relatorio={
  banco:alvo.getName(),rodada,
  resultadoGeral:falhas.length?'falhou: investigar os resultados':
    !pronto || resultados.some(r=>r.situacao==='não executado' &&
      r.teste!=='alertas: documento fora do filtro parcial')?'incompleto':
      'casos executáveis passaram; fora do filtro de alertas não representável',
  totais:Object.fromEntries(['aprovado','falhou','não executado'].map(s=>[s,resultados.filter(r=>r.situacao===s).length])),
  resultados,falhas,
  documentosDaRodada:documentosRodada,
  colecoesAuxiliares:provas,
  limites:[
    'Somente banco isolado. Nenhuma leitura ou escrita no banco principal.',
    'Sem exclusões, substituição de índices, sobrescrita de documentos anteriores ou bypassDocumentValidation.',
    'As cópias auxiliares comprovam schema, não autorização ou integridade referencial automática.',
    'Referências-base foram inseridas e consultadas nesta rodada; data/revisão/moderação são simulações explícitas.',
    'Realizadas e canceladas são snapshots para testar o filtro, não execução de transições da aplicação.',
    'Testes não comprovam desempenho nem execução concorrente.',
    'Falha global de conexão, sintaxe ou do runner pode impedir o relatório; não considerar execução concluída sem relatório final.'
  ]
};
printjson(relatorio);
relatorio;


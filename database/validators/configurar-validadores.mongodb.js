// Executar pelo Run All. false = confer?ncia somente de leitura.
// N?o executar aplica??o no banco principal apenas para repetir evid?ncias j? confirmadas.
use('sentinela');
const bancoDestino = 'sentinela'; // Para reprodu??o isolada: 'sentinela_testes_bd5'.
const aplicar = false;
if (!['sentinela', 'sentinela_testes_bd5'].includes(bancoDestino)) throw new Error('Banco n?o permitido.');
const alvo = db.getSiblingDB(bancoDestino);
// C?pias integrais dos 15 arquivos individuais; manter sincronizadas ao alterar o modelo.
const configuracoes = {
'usuarios': {
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
'propriedades': {
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
'talhoes': {
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
'culturas': {
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
'plantacoes': {
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
'problemas_agricolas': {
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
'fontes_conhecimento': {
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
'ocorrencias': {
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
'monitoramentos': {
  collMod: 'monitoramentos',
  validator: {
    $jsonSchema: {
      bsonType: 'object', additionalProperties: false,
      required: ['_id', 'plantacaoId', 'registradoPor', 'dataObservacao', 'problemaObservado', 'observacoes', 'criadoEm', 'atualizadoEm'],
      properties: {
        _id: { bsonType: 'objectId' }, plantacaoId: { bsonType: 'objectId' }, ocorrenciaId: { bsonType: 'objectId' },
        registradoPor: { bsonType: 'objectId' }, dataObservacao: { bsonType: 'date' },
        problemaObservado: { bsonType: 'bool' },
        observacoes: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
        intensidade: { bsonType: 'string', enum: ['baixa', 'media', 'alta'] },
        evolucao: { bsonType: 'string', enum: ['melhorou', 'estavel', 'piorou', 'nao_avaliada'] },
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
        proximaInspecaoEm: { bsonType: 'date' },
        criadoEm: { bsonType: 'date' }, atualizadoEm: { bsonType: 'date' },
      },
      allOf: [
        { oneOf: [
          { properties: { problemaObservado: { enum: [true] } }, required: ['intensidade'] },
          { properties: { problemaObservado: { enum: [false] } },
            not: { anyOf: [{ required: ['intensidade'] }, { required: ['areaAfetadaHa'] }] } },
        ] },
        // Sem ocorrência: evolução ausente ou não avaliada.
        { anyOf: [
          { required: ['ocorrenciaId'] },
          { properties: { evolucao: { enum: ['nao_avaliada'] } } },
        ] },
      ],
    },
  },
  validationLevel: 'strict', validationAction: 'error',
},
'tratamentos': {
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
'avaliacoes_tratamento': {
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
},
'alertas': {
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
'experiencias_comunidade': {
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
'adocoes_tratamento': {
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
},
'denuncias_comunidade': {
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
}
};

// Normaliza objetos, mas preserva a ordem dos arrays e das chaves dos ?ndices.
function normalizar(valor) {
  if (Array.isArray(valor)) return valor.map(normalizar);
  if (valor && typeof valor === 'object') return Object.fromEntries(
    Object.keys(valor).sort().map(k => [k, normalizar(valor[k])]));
  return valor;
}
function iguais(a, b) {
  return JSON.stringify(normalizar(EJSON.serialize(a))) === JSON.stringify(normalizar(EJSON.serialize(b)));
}
function conferirResposta(r) {
  if (!r || Number(r.ok) !== 1) throw new Error('Comando recusado. Interromper e conferir o estado antes de continuar.');
}

const conferencias = [];
for (const [nome, esperado] of Object.entries(configuracoes)) {
  const info = alvo.getCollectionInfos({name: nome})[0];
  if (!info || info.type !== 'collection') {
    conferencias.push({colecao: nome, situacao: 'bloqueado: cole??o ausente ou tipo incompat?vel'});
    continue;
  }
  const op = info.options || {};
  const temValidator = Object.keys(op.validator || {}).length > 0;
  const schemaIgual = iguais(op.validator || {}, esperado.validator);
  const opcoesIguais = (op.validationLevel || 'strict') === esperado.validationLevel &&
    (op.validationAction || 'error') === esperado.validationAction;
  // Usa TODAS as condi??es do validator; n?o imprime documentos nem dados pessoais.
  const filtro = {$nor: [esperado.validator]};
  const incompativeis = alvo.getCollection(nome).countDocuments(filtro);
  const idsIncompativeis = incompativeis ? alvo.getCollection(nome).find(filtro, {_id: 1}).limit(5).toArray() : [];
  const situacao = incompativeis ? 'bloqueado: documentos incompat?veis' :
    schemaIgual && opcoesIguais ? 'igual; preservar' :
    !temValidator && opcoesIguais ? 'sem validator; pode configurar' : 'bloqueado: configura??o divergente';
  conferencias.push({colecao: nome, situacao, schemaIgual, opcoesIguais, incompativeis,
    idsIncompativeis, idsLimitadosA: 5});
}
const bloqueado = conferencias.some(c => c.situacao.startsWith('bloqueado'));
const aplicados = [];
if (aplicar && !bloqueado) {
  for (const item of conferencias.filter(c => c.situacao === 'sem validator; pode configurar')) {
    conferirResposta(alvo.runCommand(configuracoes[item.colecao]));
    aplicados.push(item.colecao);
  }
}
const verificacao = Object.entries(configuracoes).map(([nome, esperado]) => {
  const info = alvo.getCollectionInfos({name: nome})[0];
  const op = info && info.options || {};
  return {colecao: nome, igual: iguais(op.validator || {}, esperado.validator) &&
    (op.validationLevel || 'strict') === esperado.validationLevel &&
    (op.validationAction || 'error') === esperado.validationAction};
});
({banco: bancoDestino, modo: aplicar ? 'aplica??o' : 'somente leitura', bloqueado,
  conferencias, aplicados, verificacao,
  observacao: 'Leituras n?o s?o snapshot. N?o substitui validator divergente. Em erro, parte pode ter sido aplicada; conferir antes de continuar.'});

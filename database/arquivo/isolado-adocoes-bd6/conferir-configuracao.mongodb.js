// SOMENTE LEITURA. Executar por Run All na conexão ativa da extensão MongoDB.
// Snapshot completo dos 15 validadores, 22 índices e 22 documentos sintéticos.
// Gerado localmente; sincronizar com gerar-conferencia-playground.cjs se as origens mudarem.
// Não carrega .env, credenciais da extensão, arquivos locais ou outro banco.
use('sentinela_testes_bd6');

const snapshotEjson = {
  "configs": {
    "usuarios": {
      "collMod": "usuarios",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "firebaseUid",
            "nomeCompleto",
            "cpf",
            "telefone",
            "termos",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "firebaseUid": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "128"
              },
              "pattern": "\\S"
            },
            "nomeCompleto": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "2"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "nomePublico": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "2"
              },
              "maxLength": {
                "$numberInt": "80"
              },
              "pattern": "\\S"
            },
            "cpf": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "11"
              },
              "maxLength": {
                "$numberInt": "11"
              },
              "pattern": "^[0-9]{11}$"
            },
            "telefone": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "14"
              },
              "maxLength": {
                "$numberInt": "14"
              },
              "pattern": "^\\+55[0-9]{2}9[0-9]{8}$"
            },
            "canalCodigoPreferido": {
              "bsonType": "string",
              "enum": [
                "sms",
                "email"
              ]
            },
            "fotoPerfil": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "url",
                "publicId",
                "enviadaPor",
                "enviadaEm"
              ],
              "properties": {
                "url": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "2048"
                  },
                  "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                },
                "publicId": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "pattern": "\\S"
                },
                "legenda": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "300"
                  },
                  "pattern": "\\S"
                },
                "enviadaPor": {
                  "bsonType": "objectId"
                },
                "enviadaEm": {
                  "bsonType": "date"
                }
              }
            },
            "termos": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "versao",
                "aceitoEm"
              ],
              "properties": {
                "versao": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "30"
                  },
                  "pattern": "\\S"
                },
                "aceitoEm": {
                  "bsonType": "date"
                }
              }
            },
            "questionario": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "versao",
                "portePropriedade",
                "quantidadeCulturas",
                "culturasIds",
                "problemasFrequentes",
                "frequenciaProblemas",
                "identificaProblemasSozinho",
                "concluidoEm"
              ],
              "properties": {
                "versao": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "30"
                  },
                  "pattern": "\\S"
                },
                "portePropriedade": {
                  "bsonType": "string",
                  "enum": [
                    "pequena",
                    "media",
                    "grande"
                  ]
                },
                "quantidadeCulturas": {
                  "bsonType": "string",
                  "enum": [
                    "1",
                    "2",
                    "3",
                    "4_ou_mais"
                  ]
                },
                "culturasIds": {
                  "bsonType": "array",
                  "maxItems": {
                    "$numberInt": "50"
                  },
                  "uniqueItems": true,
                  "items": {
                    "bsonType": "objectId"
                  }
                },
                "outraCultura": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "150"
                  },
                  "pattern": "\\S"
                },
                "problemasFrequentes": {
                  "bsonType": "array",
                  "minItems": {
                    "$numberInt": "1"
                  },
                  "maxItems": {
                    "$numberInt": "2"
                  },
                  "uniqueItems": true,
                  "oneOf": [
                    {
                      "maxItems": {
                        "$numberInt": "1"
                      },
                      "items": {
                        "bsonType": "string",
                        "enum": [
                          "nao_identificado"
                        ]
                      }
                    },
                    {
                      "items": {
                        "bsonType": "string",
                        "enum": [
                          "pragas",
                          "doencas"
                        ]
                      }
                    }
                  ]
                },
                "frequenciaProblemas": {
                  "bsonType": "string",
                  "enum": [
                    "raramente",
                    "as_vezes",
                    "frequentemente",
                    "sempre"
                  ]
                },
                "identificaProblemasSozinho": {
                  "bsonType": "string",
                  "enum": [
                    "sim",
                    "nao",
                    "as_vezes"
                  ]
                },
                "concluidoEm": {
                  "bsonType": "date"
                }
              },
              "anyOf": [
                {
                  "properties": {
                    "culturasIds": {
                      "minItems": {
                        "$numberInt": "1"
                      }
                    }
                  }
                },
                {
                  "required": [
                    "outraCultura"
                  ]
                }
              ]
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "propriedades": {
      "collMod": "propriedades",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "usuarioId",
            "nome",
            "municipio",
            "estado",
            "ativa",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "usuarioId": {
              "bsonType": "objectId"
            },
            "nome": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "municipio": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "estado": {
              "bsonType": "string",
              "enum": [
                "AC",
                "AL",
                "AP",
                "AM",
                "BA",
                "CE",
                "DF",
                "ES",
                "GO",
                "MA",
                "MT",
                "MS",
                "MG",
                "PA",
                "PB",
                "PR",
                "PE",
                "PI",
                "RJ",
                "RN",
                "RS",
                "RO",
                "RR",
                "SC",
                "SP",
                "SE",
                "TO"
              ]
            },
            "areaTotalHa": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "observacoes": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "ativa": {
              "bsonType": "bool"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "talhoes": {
      "collMod": "talhoes",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "propriedadeId",
            "nome",
            "areaHa",
            "ativo",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "propriedadeId": {
              "bsonType": "objectId"
            },
            "nome": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "areaHa": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "observacoes": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "ativo": {
              "bsonType": "bool"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "culturas": {
      "collMod": "culturas",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "nome",
            "ativa",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "nome": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "nomeCientifico": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "descricao": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "imagem": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "url",
                "publicId",
                "enviadaPor",
                "enviadaEm"
              ],
              "properties": {
                "url": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "2048"
                  },
                  "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                },
                "publicId": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "pattern": "\\S"
                },
                "legenda": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "300"
                  },
                  "pattern": "\\S"
                },
                "enviadaPor": {
                  "bsonType": "objectId"
                },
                "enviadaEm": {
                  "bsonType": "date"
                }
              }
            },
            "ativa": {
              "bsonType": "bool"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "plantacoes": {
      "collMod": "plantacoes",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "talhaoId",
            "culturaId",
            "status",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "talhaoId": {
              "bsonType": "objectId"
            },
            "culturaId": {
              "bsonType": "objectId"
            },
            "variedade": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "safra": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "30"
              },
              "pattern": "\\S"
            },
            "dataPlantio": {
              "bsonType": "date"
            },
            "areaPlantadaHa": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "status": {
              "bsonType": "string",
              "enum": [
                "ativa",
                "encerrada"
              ]
            },
            "dataEncerramento": {
              "bsonType": "date"
            },
            "observacoes": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "oneOf": [
            {
              "properties": {
                "status": {
                  "enum": [
                    "encerrada"
                  ]
                }
              },
              "required": [
                "dataEncerramento"
              ]
            },
            {
              "properties": {
                "status": {
                  "enum": [
                    "ativa"
                  ]
                }
              },
              "not": {
                "required": [
                  "dataEncerramento"
                ]
              }
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "problemas_agricolas": {
      "collMod": "problemas_agricolas",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "nomeComum",
            "tipo",
            "descricao",
            "culturasAfetadasIds",
            "sintomas",
            "medidasPreventivas",
            "formasControle",
            "fontesIds",
            "ativo",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "nomeComum": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "nomeCientifico": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "codigoEditorial": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "100"
              },
              "pattern": "\\S"
            },
            "chips": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "4"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "150"
                },
                "pattern": "\\S"
              }
            },
            "niveisAtencao": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "baixo",
                "medio",
                "alto"
              ],
              "properties": {
                "baixo": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "1000"
                  },
                  "pattern": "\\S"
                },
                "medio": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "1000"
                  },
                  "pattern": "\\S"
                },
                "alto": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "1000"
                  },
                  "pattern": "\\S"
                }
              }
            },
            "tipo": {
              "bsonType": "string",
              "enum": [
                "praga",
                "doenca",
                "deficiencia"
              ]
            },
            "descricao": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "culturasAfetadasIds": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "100"
              },
              "uniqueItems": true,
              "items": {
                "bsonType": "objectId"
              }
            },
            "sintomas": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "50"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "1000"
                },
                "pattern": "\\S"
              }
            },
            "ondeOlhar": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "dicaDeCampo": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "danos": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "50"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "1000"
                },
                "pattern": "\\S"
              }
            },
            "perdaEstimada": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "epocaPropicia": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "abrangenciaCulturas": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "1000"
              },
              "pattern": "\\S"
            },
            "partesAfetadas": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "30"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "1000"
                },
                "pattern": "\\S"
              }
            },
            "condicoesFavoraveis": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "50"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "1000"
                },
                "pattern": "\\S"
              }
            },
            "informacoesDisseminacao": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "medidasPreventivas": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "50"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "1000"
                },
                "pattern": "\\S"
              }
            },
            "tratamentoIntro": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "boasPraticas": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "30"
              },
              "items": {
                "bsonType": "string",
                "minLength": {
                  "$numberInt": "1"
                },
                "maxLength": {
                  "$numberInt": "1000"
                },
                "pattern": "\\S"
              }
            },
            "formasControle": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "30"
              },
              "items": {
                "bsonType": "object",
                "additionalProperties": false,
                "required": [
                  "tipo",
                  "descricao"
                ],
                "properties": {
                  "tipo": {
                    "bsonType": "string",
                    "enum": [
                      "manual",
                      "cultural",
                      "biologica",
                      "quimica",
                      "outra"
                    ]
                  },
                  "descricao": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "5000"
                    },
                    "pattern": "\\S"
                  },
                  "observacoes": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "5000"
                    },
                    "pattern": "\\S"
                  },
                  "classe": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "200"
                    },
                    "pattern": "\\S"
                  },
                  "exemplosControle": {
                    "bsonType": "array",
                    "maxItems": {
                      "$numberInt": "30"
                    },
                    "items": {
                      "bsonType": "string",
                      "minLength": {
                        "$numberInt": "1"
                      },
                      "maxLength": {
                        "$numberInt": "200"
                      },
                      "pattern": "\\S"
                    }
                  }
                }
              }
            },
            "orientacaoBuscaAgronomo": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "imagens": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "5"
              },
              "items": {
                "bsonType": "object",
                "additionalProperties": false,
                "required": [
                  "url",
                  "publicId",
                  "enviadaPor",
                  "enviadaEm"
                ],
                "properties": {
                  "url": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "2048"
                    },
                    "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                  },
                  "publicId": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "pattern": "\\S"
                  },
                  "legenda": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "300"
                    },
                    "pattern": "\\S"
                  },
                  "enviadaPor": {
                    "bsonType": "objectId"
                  },
                  "enviadaEm": {
                    "bsonType": "date"
                  }
                }
              }
            },
            "fontesIds": {
              "bsonType": "array",
              "minItems": {
                "$numberInt": "1"
              },
              "maxItems": {
                "$numberInt": "100"
              },
              "uniqueItems": true,
              "items": {
                "bsonType": "objectId"
              }
            },
            "revisaoEditorial": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "status"
              ],
              "properties": {
                "status": {
                  "bsonType": "string",
                  "enum": [
                    "pendente",
                    "aprovada"
                  ]
                },
                "observacoes": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                },
                "registroAgrofitConferido": {
                  "bsonType": "bool"
                },
                "fotoPendente": {
                  "bsonType": "bool"
                }
              }
            },
            "revisadoEm": {
              "bsonType": "date"
            },
            "ativo": {
              "bsonType": "bool"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "oneOf": [
            {
              "not": {
                "required": [
                  "revisaoEditorial"
                ]
              },
              "required": [
                "revisadoEm"
              ]
            },
            {
              "required": [
                "revisaoEditorial"
              ],
              "properties": {
                "revisaoEditorial": {
                  "properties": {
                    "status": {
                      "enum": [
                        "pendente"
                      ]
                    }
                  }
                },
                "ativo": {
                  "enum": [
                    false
                  ]
                }
              }
            },
            {
              "required": [
                "revisaoEditorial",
                "revisadoEm"
              ],
              "properties": {
                "revisaoEditorial": {
                  "properties": {
                    "status": {
                      "enum": [
                        "aprovada"
                      ]
                    }
                  }
                }
              }
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "fontes_conhecimento": {
      "collMod": "fontes_conhecimento",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "titulo",
            "instituicaoOuAutor",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "titulo": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "300"
              },
              "pattern": "\\S"
            },
            "instituicaoOuAutor": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "url": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "2048"
              },
              "pattern": "^https?://[^\\s/?#]+[^\\s]*$"
            },
            "publicadoEm": {
              "bsonType": "date"
            },
            "acessadoEm": {
              "bsonType": "date"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "dependencies": {
            "url": [
              "acessadoEm"
            ]
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "ocorrencias": {
      "collMod": "ocorrencias",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "plantacaoId",
            "registradoPor",
            "tipo",
            "dataObservacao",
            "sintomas",
            "intensidade",
            "status",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "plantacaoId": {
              "bsonType": "objectId"
            },
            "registradoPor": {
              "bsonType": "objectId"
            },
            "tipo": {
              "bsonType": "string",
              "enum": [
                "praga",
                "doenca",
                "deficiencia",
                "nao_identificado"
              ]
            },
            "problemaAgricolaId": {
              "bsonType": "objectId"
            },
            "dataObservacao": {
              "bsonType": "date"
            },
            "sintomas": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "intensidade": {
              "bsonType": "string",
              "enum": [
                "baixa",
                "media",
                "alta"
              ]
            },
            "areaAfetadaHa": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "imagens": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "5"
              },
              "items": {
                "bsonType": "object",
                "additionalProperties": false,
                "required": [
                  "url",
                  "publicId",
                  "enviadaPor",
                  "enviadaEm"
                ],
                "properties": {
                  "url": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "2048"
                    },
                    "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                  },
                  "publicId": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "pattern": "\\S"
                  },
                  "legenda": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "300"
                    },
                    "pattern": "\\S"
                  },
                  "enviadaPor": {
                    "bsonType": "objectId"
                  },
                  "enviadaEm": {
                    "bsonType": "date"
                  }
                }
              }
            },
            "status": {
              "bsonType": "string",
              "enum": [
                "aberta",
                "em_acompanhamento",
                "encerrada"
              ]
            },
            "encerradoEm": {
              "bsonType": "date"
            },
            "motivoEncerramento": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "allOf": [
            {
              "oneOf": [
                {
                  "properties": {
                    "status": {
                      "enum": [
                        "encerrada"
                      ]
                    }
                  },
                  "required": [
                    "encerradoEm",
                    "motivoEncerramento"
                  ]
                },
                {
                  "properties": {
                    "status": {
                      "enum": [
                        "aberta",
                        "em_acompanhamento"
                      ]
                    }
                  },
                  "not": {
                    "anyOf": [
                      {
                        "required": [
                          "encerradoEm"
                        ]
                      },
                      {
                        "required": [
                          "motivoEncerramento"
                        ]
                      }
                    ]
                  }
                }
              ]
            },
            {
              "not": {
                "properties": {
                  "tipo": {
                    "enum": [
                      "nao_identificado"
                    ]
                  }
                },
                "required": [
                  "problemaAgricolaId"
                ]
              }
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "monitoramentos": {
      "collMod": "monitoramentos",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "plantacaoId",
            "registradoPor",
            "dataObservacao",
            "problemaObservado",
            "observacoes",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "plantacaoId": {
              "bsonType": "objectId"
            },
            "ocorrenciaId": {
              "bsonType": "objectId"
            },
            "registradoPor": {
              "bsonType": "objectId"
            },
            "dataObservacao": {
              "bsonType": "date"
            },
            "problemaObservado": {
              "bsonType": "bool"
            },
            "observacoes": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "intensidade": {
              "bsonType": "string",
              "enum": [
                "baixa",
                "media",
                "alta"
              ]
            },
            "evolucao": {
              "bsonType": "string",
              "enum": [
                "melhorou",
                "estavel",
                "piorou",
                "nao_avaliada"
              ]
            },
            "areaAfetadaHa": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "imagens": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "5"
              },
              "items": {
                "bsonType": "object",
                "additionalProperties": false,
                "required": [
                  "url",
                  "publicId",
                  "enviadaPor",
                  "enviadaEm"
                ],
                "properties": {
                  "url": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "2048"
                    },
                    "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                  },
                  "publicId": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "pattern": "\\S"
                  },
                  "legenda": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "300"
                    },
                    "pattern": "\\S"
                  },
                  "enviadaPor": {
                    "bsonType": "objectId"
                  },
                  "enviadaEm": {
                    "bsonType": "date"
                  }
                }
              }
            },
            "proximaInspecaoEm": {
              "bsonType": "date"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "allOf": [
            {
              "oneOf": [
                {
                  "properties": {
                    "problemaObservado": {
                      "enum": [
                        true
                      ]
                    }
                  },
                  "required": [
                    "intensidade"
                  ]
                },
                {
                  "properties": {
                    "problemaObservado": {
                      "enum": [
                        false
                      ]
                    }
                  },
                  "not": {
                    "anyOf": [
                      {
                        "required": [
                          "intensidade"
                        ]
                      },
                      {
                        "required": [
                          "areaAfetadaHa"
                        ]
                      }
                    ]
                  }
                }
              ]
            },
            {
              "anyOf": [
                {
                  "required": [
                    "ocorrenciaId"
                  ]
                },
                {
                  "properties": {
                    "evolucao": {
                      "enum": [
                        "nao_avaliada"
                      ]
                    }
                  }
                }
              ]
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "tratamentos": {
      "collMod": "tratamentos",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "ocorrenciaId",
            "registradoPor",
            "tipoMedida",
            "descricao",
            "dataAplicacao",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "ocorrenciaId": {
              "bsonType": "objectId"
            },
            "registradoPor": {
              "bsonType": "objectId"
            },
            "tipoMedida": {
              "bsonType": "string",
              "enum": [
                "manual",
                "cultural",
                "biologica",
                "quimica",
                "outra"
              ]
            },
            "descricao": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "dataAplicacao": {
              "bsonType": "date"
            },
            "areaTratadaHa": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "produtoUtilizado": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "quantidadeUtilizada": {
              "bsonType": [
                "int",
                "long",
                "double",
                "decimal"
              ],
              "minimum": {
                "$numberInt": "0"
              },
              "exclusiveMinimum": true
            },
            "unidadeQuantidade": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "30"
              },
              "pattern": "\\S"
            },
            "responsavelAplicacao": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "2"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "observacoes": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "imagens": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "5"
              },
              "items": {
                "bsonType": "object",
                "additionalProperties": false,
                "required": [
                  "url",
                  "publicId",
                  "enviadaPor",
                  "enviadaEm"
                ],
                "properties": {
                  "url": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "2048"
                    },
                    "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                  },
                  "publicId": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "pattern": "\\S"
                  },
                  "legenda": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "300"
                    },
                    "pattern": "\\S"
                  },
                  "enviadaPor": {
                    "bsonType": "objectId"
                  },
                  "enviadaEm": {
                    "bsonType": "date"
                  }
                }
              }
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "dependencies": {
            "quantidadeUtilizada": [
              "unidadeQuantidade"
            ],
            "unidadeQuantidade": [
              "quantidadeUtilizada"
            ]
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "avaliacoes_tratamento": {
      "collMod": "avaliacoes_tratamento",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "tratamentoId",
            "registradoPor",
            "dataAvaliacao",
            "resultado",
            "observacoes",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "tratamentoId": {
              "bsonType": "objectId"
            },
            "registradoPor": {
              "bsonType": "objectId"
            },
            "dataAvaliacao": {
              "bsonType": "date"
            },
            "resultado": {
              "bsonType": "string",
              "enum": [
                "melhora_observada",
                "sem_mudanca",
                "piora_observada",
                "inconclusivo"
              ]
            },
            "observacoes": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "monitoramentoId": {
              "bsonType": "objectId"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "alertas": {
      "collMod": "alertas",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "usuarioId",
            "tipo",
            "titulo",
            "mensagem",
            "prioridade",
            "contexto",
            "criadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "usuarioId": {
              "bsonType": "objectId"
            },
            "tipo": {
              "bsonType": "string",
              "enum": [
                "ocorrencia_intensidade_alta"
              ]
            },
            "titulo": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "mensagem": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "1000"
              },
              "pattern": "\\S"
            },
            "prioridade": {
              "bsonType": "string",
              "enum": [
                "alta"
              ]
            },
            "contexto": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "tipo",
                "id"
              ],
              "properties": {
                "tipo": {
                  "bsonType": "string",
                  "enum": [
                    "ocorrencia"
                  ]
                },
                "id": {
                  "bsonType": "objectId"
                }
              }
            },
            "lidoEm": {
              "bsonType": "date"
            },
            "expiraEm": {
              "bsonType": "date"
            },
            "criadoEm": {
              "bsonType": "date"
            }
          }
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "experiencias_comunidade": {
      "collMod": "experiencias_comunidade",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "autorId",
            "ocorrenciaOrigemId",
            "nomePublico",
            "culturaId",
            "culturaNome",
            "tipoProblema",
            "statusOcorrencia",
            "titulo",
            "relato",
            "versao",
            "moderacao",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "autorId": {
              "bsonType": "objectId"
            },
            "ocorrenciaOrigemId": {
              "bsonType": "objectId"
            },
            "tratamentoOrigemId": {
              "bsonType": "objectId"
            },
            "avaliacaoOrigemId": {
              "bsonType": "objectId"
            },
            "nomePublico": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "2"
              },
              "maxLength": {
                "$numberInt": "80"
              },
              "pattern": "\\S"
            },
            "culturaId": {
              "bsonType": "objectId"
            },
            "culturaNome": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "problemaAgricolaId": {
              "bsonType": "objectId"
            },
            "problemaNome": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "200"
              },
              "pattern": "\\S"
            },
            "tipoProblema": {
              "bsonType": "string",
              "enum": [
                "praga",
                "doenca",
                "deficiencia",
                "nao_identificado"
              ]
            },
            "statusOcorrencia": {
              "bsonType": "string",
              "enum": [
                "aberta",
                "em_acompanhamento",
                "encerrada"
              ]
            },
            "titulo": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "150"
              },
              "pattern": "\\S"
            },
            "relato": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "5000"
              },
              "pattern": "\\S"
            },
            "fotos": {
              "bsonType": "array",
              "maxItems": {
                "$numberInt": "5"
              },
              "items": {
                "bsonType": "object",
                "additionalProperties": false,
                "required": [
                  "url",
                  "publicId"
                ],
                "properties": {
                  "url": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "2048"
                    },
                    "pattern": "^https://[^\\s/?#]+[^\\s]*$"
                  },
                  "publicId": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "pattern": "\\S"
                  },
                  "legenda": {
                    "bsonType": "string",
                    "minLength": {
                      "$numberInt": "1"
                    },
                    "maxLength": {
                      "$numberInt": "300"
                    },
                    "pattern": "\\S"
                  }
                }
              }
            },
            "metodo": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "tipoMedida",
                "descricao"
              ],
              "properties": {
                "tipoMedida": {
                  "bsonType": "string",
                  "enum": [
                    "manual",
                    "cultural",
                    "biologica",
                    "quimica",
                    "outra"
                  ]
                },
                "descricao": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                },
                "observacoes": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                }
              }
            },
            "resultadoRelatado": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "resultado",
                "dataAvaliacao"
              ],
              "properties": {
                "resultado": {
                  "bsonType": "string",
                  "enum": [
                    "melhora_observada",
                    "sem_mudanca",
                    "piora_observada",
                    "inconclusivo"
                  ]
                },
                "dataAvaliacao": {
                  "bsonType": "date"
                },
                "observacoes": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                }
              }
            },
            "regiao": {
              "bsonType": "object",
              "additionalProperties": false,
              "minProperties": {
                "$numberInt": "1"
              },
              "properties": {
                "municipio": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "150"
                  },
                  "pattern": "\\S"
                },
                "estado": {
                  "bsonType": "string",
                  "enum": [
                    "AC",
                    "AL",
                    "AP",
                    "AM",
                    "BA",
                    "CE",
                    "DF",
                    "ES",
                    "GO",
                    "MA",
                    "MT",
                    "MS",
                    "MG",
                    "PA",
                    "PB",
                    "PR",
                    "PE",
                    "PI",
                    "RJ",
                    "RN",
                    "RS",
                    "RO",
                    "RR",
                    "SC",
                    "SP",
                    "SE",
                    "TO"
                  ]
                }
              }
            },
            "versao": {
              "bsonType": [
                "int",
                "long"
              ],
              "minimum": {
                "$numberInt": "1"
              }
            },
            "moderacao": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "status"
              ],
              "properties": {
                "status": {
                  "bsonType": "string",
                  "enum": [
                    "pendente",
                    "aprovada",
                    "rejeitada",
                    "oculta",
                    "retirada"
                  ]
                },
                "revisadoPor": {
                  "bsonType": "objectId"
                },
                "revisadoEm": {
                  "bsonType": "date"
                },
                "motivo": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "2000"
                  },
                  "pattern": "\\S"
                }
              },
              "oneOf": [
                {
                  "properties": {
                    "status": {
                      "enum": [
                        "pendente"
                      ]
                    }
                  },
                  "not": {
                    "anyOf": [
                      {
                        "required": [
                          "revisadoPor"
                        ]
                      },
                      {
                        "required": [
                          "revisadoEm"
                        ]
                      },
                      {
                        "required": [
                          "motivo"
                        ]
                      }
                    ]
                  }
                },
                {
                  "properties": {
                    "status": {
                      "enum": [
                        "aprovada"
                      ]
                    }
                  },
                  "required": [
                    "revisadoPor",
                    "revisadoEm"
                  ]
                },
                {
                  "properties": {
                    "status": {
                      "enum": [
                        "rejeitada",
                        "oculta"
                      ]
                    }
                  },
                  "required": [
                    "revisadoPor",
                    "revisadoEm",
                    "motivo"
                  ]
                },
                {
                  "properties": {
                    "status": {
                      "enum": [
                        "retirada"
                      ]
                    }
                  },
                  "dependencies": {
                    "revisadoPor": [
                      "revisadoEm"
                    ],
                    "revisadoEm": [
                      "revisadoPor"
                    ],
                    "motivo": [
                      "revisadoPor",
                      "revisadoEm"
                    ]
                  }
                }
              ]
            },
            "publicadoEm": {
              "bsonType": "date"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "dependencies": {
            "tratamentoOrigemId": [
              "metodo"
            ],
            "avaliacaoOrigemId": [
              "tratamentoOrigemId",
              "resultadoRelatado"
            ],
            "resultadoRelatado": [
              "avaliacaoOrigemId"
            ],
            "problemaAgricolaId": [
              "problemaNome"
            ]
          },
          "allOf": [
            {
              "oneOf": [
                {
                  "properties": {
                    "moderacao": {
                      "properties": {
                        "status": {
                          "enum": [
                            "aprovada"
                          ]
                        }
                      }
                    }
                  },
                  "required": [
                    "publicadoEm"
                  ]
                },
                {
                  "properties": {
                    "moderacao": {
                      "properties": {
                        "status": {
                          "enum": [
                            "pendente",
                            "rejeitada",
                            "oculta",
                            "retirada"
                          ]
                        }
                      }
                    }
                  }
                }
              ]
            },
            {
              "not": {
                "properties": {
                  "tipoProblema": {
                    "enum": [
                      "nao_identificado"
                    ]
                  }
                },
                "required": [
                  "problemaAgricolaId"
                ]
              }
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "adocoes_tratamento": {
      "collMod": "adocoes_tratamento",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "usuarioId",
            "experienciaId",
            "experienciaVersao",
            "ocorrenciaId",
            "metodoCopiado",
            "planejamento",
            "status",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "usuarioId": {
              "bsonType": "objectId"
            },
            "experienciaId": {
              "bsonType": "objectId"
            },
            "experienciaVersao": {
              "bsonType": [
                "int",
                "long"
              ],
              "minimum": {
                "$numberInt": "1"
              }
            },
            "ocorrenciaId": {
              "bsonType": "objectId"
            },
            "metodoCopiado": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "tipoMedida",
                "descricao"
              ],
              "properties": {
                "tipoMedida": {
                  "bsonType": "string",
                  "enum": [
                    "manual",
                    "cultural",
                    "biologica",
                    "quimica",
                    "outra"
                  ]
                },
                "descricao": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                },
                "observacoes": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                }
              }
            },
            "planejamento": {
              "bsonType": "object",
              "additionalProperties": false,
              "required": [
                "descricao"
              ],
              "properties": {
                "descricao": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                },
                "dataPrevista": {
                  "bsonType": "date"
                },
                "observacoes": {
                  "bsonType": "string",
                  "minLength": {
                    "$numberInt": "1"
                  },
                  "maxLength": {
                    "$numberInt": "5000"
                  },
                  "pattern": "\\S"
                }
              }
            },
            "status": {
              "bsonType": "string",
              "enum": [
                "planejada",
                "realizada",
                "cancelada"
              ]
            },
            "tratamentoId": {
              "bsonType": "objectId"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "oneOf": [
            {
              "properties": {
                "status": {
                  "enum": [
                    "realizada"
                  ]
                }
              },
              "required": [
                "tratamentoId"
              ]
            },
            {
              "properties": {
                "status": {
                  "enum": [
                    "planejada",
                    "cancelada"
                  ]
                }
              },
              "not": {
                "required": [
                  "tratamentoId"
                ]
              }
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    },
    "denuncias_comunidade": {
      "collMod": "denuncias_comunidade",
      "validator": {
        "$jsonSchema": {
          "bsonType": "object",
          "additionalProperties": false,
          "required": [
            "_id",
            "experienciaId",
            "denuncianteId",
            "motivo",
            "status",
            "criadoEm",
            "atualizadoEm"
          ],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "experienciaId": {
              "bsonType": "objectId"
            },
            "denuncianteId": {
              "bsonType": "objectId"
            },
            "motivo": {
              "bsonType": "string",
              "enum": [
                "dados_pessoais",
                "conteudo_inadequado",
                "informacao_perigosa",
                "outro"
              ]
            },
            "descricao": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "2000"
              },
              "pattern": "\\S"
            },
            "status": {
              "bsonType": "string",
              "enum": [
                "pendente",
                "analisada"
              ]
            },
            "decisao": {
              "bsonType": "string",
              "enum": [
                "manter_publicacao",
                "ocultar_publicacao"
              ]
            },
            "justificativa": {
              "bsonType": "string",
              "minLength": {
                "$numberInt": "1"
              },
              "maxLength": {
                "$numberInt": "2000"
              },
              "pattern": "\\S"
            },
            "analisadoPor": {
              "bsonType": "objectId"
            },
            "analisadoEm": {
              "bsonType": "date"
            },
            "criadoEm": {
              "bsonType": "date"
            },
            "atualizadoEm": {
              "bsonType": "date"
            }
          },
          "oneOf": [
            {
              "properties": {
                "status": {
                  "enum": [
                    "analisada"
                  ]
                }
              },
              "required": [
                "decisao",
                "justificativa",
                "analisadoPor",
                "analisadoEm"
              ]
            },
            {
              "properties": {
                "status": {
                  "enum": [
                    "pendente"
                  ]
                }
              },
              "not": {
                "anyOf": [
                  {
                    "required": [
                      "decisao"
                    ]
                  },
                  {
                    "required": [
                      "justificativa"
                    ]
                  },
                  {
                    "required": [
                      "analisadoPor"
                    ]
                  },
                  {
                    "required": [
                      "analisadoEm"
                    ]
                  }
                ]
              }
            }
          ]
        }
      },
      "validationLevel": "strict",
      "validationAction": "error"
    }
  },
  "indices": [
    {
      "colecao": "usuarios",
      "nome": "uq_usuarios_firebaseUid",
      "key": {
        "firebaseUid": {
          "$numberInt": "1"
        }
      },
      "opcoes": {
        "unique": true
      }
    },
    {
      "colecao": "propriedades",
      "nome": "ix_propriedades_usuarioId",
      "key": {
        "usuarioId": {
          "$numberInt": "1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "talhoes",
      "nome": "ix_talhoes_propriedadeId",
      "key": {
        "propriedadeId": {
          "$numberInt": "1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "plantacoes",
      "nome": "ix_plantacoes_talhao_safra_status",
      "key": {
        "talhaoId": {
          "$numberInt": "1"
        },
        "safra": {
          "$numberInt": "1"
        },
        "status": {
          "$numberInt": "1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "plantacoes",
      "nome": "uq_plantacoes_talhao_ativa",
      "key": {
        "talhaoId": {
          "$numberInt": "1"
        }
      },
      "opcoes": {
        "unique": true,
        "partialFilterExpression": {
          "status": "ativa"
        }
      }
    },
    {
      "colecao": "problemas_agricolas",
      "nome": "ix_problemas_culturas_tipo",
      "key": {
        "culturasAfetadasIds": {
          "$numberInt": "1"
        },
        "tipo": {
          "$numberInt": "1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "ocorrencias",
      "nome": "ix_ocorrencias_plantacao_data",
      "key": {
        "plantacaoId": {
          "$numberInt": "1"
        },
        "dataObservacao": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "monitoramentos",
      "nome": "ix_monitoramentos_ocorrencia_data",
      "key": {
        "ocorrenciaId": {
          "$numberInt": "1"
        },
        "dataObservacao": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "tratamentos",
      "nome": "ix_tratamentos_ocorrencia_data",
      "key": {
        "ocorrenciaId": {
          "$numberInt": "1"
        },
        "dataAplicacao": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "avaliacoes_tratamento",
      "nome": "ix_avaliacoes_tratamento_data",
      "key": {
        "tratamentoId": {
          "$numberInt": "1"
        },
        "dataAvaliacao": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "alertas",
      "nome": "ix_alertas_usuario_data",
      "key": {
        "usuarioId": {
          "$numberInt": "1"
        },
        "criadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "alertas",
      "nome": "uq_alertas_evento_ocorrencia",
      "key": {
        "tipo": {
          "$numberInt": "1"
        },
        "contexto.tipo": {
          "$numberInt": "1"
        },
        "contexto.id": {
          "$numberInt": "1"
        }
      },
      "opcoes": {
        "unique": true,
        "partialFilterExpression": {
          "tipo": "ocorrencia_intensidade_alta",
          "contexto.tipo": "ocorrencia"
        }
      }
    },
    {
      "colecao": "monitoramentos",
      "nome": "ix_monitoramentos_plantacao_data",
      "key": {
        "plantacaoId": {
          "$numberInt": "1"
        },
        "dataObservacao": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "experiencias_comunidade",
      "nome": "ix_experiencias_feed",
      "key": {
        "publicadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {
        "partialFilterExpression": {
          "moderacao.status": "aprovada"
        }
      }
    },
    {
      "colecao": "experiencias_comunidade",
      "nome": "ix_experiencias_cultura_feed",
      "key": {
        "culturaId": {
          "$numberInt": "1"
        },
        "publicadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {
        "partialFilterExpression": {
          "moderacao.status": "aprovada"
        }
      }
    },
    {
      "colecao": "experiencias_comunidade",
      "nome": "ix_experiencias_problema_feed",
      "key": {
        "problemaAgricolaId": {
          "$numberInt": "1"
        },
        "publicadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {
        "partialFilterExpression": {
          "moderacao.status": "aprovada"
        }
      }
    },
    {
      "colecao": "experiencias_comunidade",
      "nome": "ix_experiencias_autor_data",
      "key": {
        "autorId": {
          "$numberInt": "1"
        },
        "criadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "experiencias_comunidade",
      "nome": "ix_experiencias_moderacao_fila",
      "key": {
        "moderacao.status": {
          "$numberInt": "1"
        },
        "criadoEm": {
          "$numberInt": "1"
        },
        "_id": {
          "$numberInt": "1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "adocoes_tratamento",
      "nome": "ix_adocoes_usuario_data",
      "key": {
        "usuarioId": {
          "$numberInt": "1"
        },
        "criadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "denuncias_comunidade",
      "nome": "ix_denuncias_status_fila",
      "key": {
        "status": {
          "$numberInt": "1"
        },
        "criadoEm": {
          "$numberInt": "1"
        },
        "_id": {
          "$numberInt": "1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "denuncias_comunidade",
      "nome": "ix_denuncias_experiencia_data",
      "key": {
        "experienciaId": {
          "$numberInt": "1"
        },
        "criadoEm": {
          "$numberInt": "-1"
        },
        "_id": {
          "$numberInt": "-1"
        }
      },
      "opcoes": {}
    },
    {
      "colecao": "adocoes_tratamento",
      "nome": "uq_adocoes_experiencia_ocorrencia_planejada",
      "key": {
        "experienciaId": {
          "$numberInt": "1"
        },
        "ocorrenciaId": {
          "$numberInt": "1"
        }
      },
      "opcoes": {
        "unique": true,
        "partialFilterExpression": {
          "status": "planejada"
        }
      }
    }
  ],
  "dados": {
    "usuarios": [
      {
        "_id": {
          "$oid": "7650ca1c4d53eb798e0478b9"
        },
        "firebaseUid": "sentinela_testes_bd6_adocoes_v1_a",
        "nomeCompleto": "Pessoa Ficticia Isolada BD6 A",
        "nomePublico": "Produtor Teste Isolado A",
        "cpf": "12345678909",
        "telefone": "+5511990000001",
        "canalCodigoPreferido": "sms",
        "termos": {
          "versao": "SIMULACAO-PARA-TESTES",
          "aceitoEm": {
            "$date": "2026-11-01T07:00:00.000Z"
          }
        },
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        }
      },
      {
        "_id": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "firebaseUid": "sentinela_testes_bd6_adocoes_v1_b",
        "nomeCompleto": "Pessoa Ficticia Isolada BD6 B",
        "nomePublico": "Produtor Teste Isolado B",
        "cpf": "98765432100",
        "telefone": "+5511990000002",
        "canalCodigoPreferido": "sms",
        "termos": {
          "versao": "SIMULACAO-PARA-TESTES",
          "aceitoEm": {
            "$date": "2026-11-01T07:00:00.000Z"
          }
        },
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        }
      }
    ],
    "propriedades": [
      {
        "_id": {
          "$oid": "2beee07cf0b61ffc37f5c571"
        },
        "usuarioId": {
          "$oid": "7650ca1c4d53eb798e0478b9"
        },
        "nome": "SIMULACAO BD6 - Propriedade a",
        "municipio": "Campinas",
        "estado": "SP",
        "areaTotalHa": {
          "$numberInt": "10"
        },
        "ativa": true,
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        }
      },
      {
        "_id": {
          "$oid": "8e0457e0e98e89021e70d3ed"
        },
        "usuarioId": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "nome": "SIMULACAO BD6 - Propriedade b",
        "municipio": "Campinas",
        "estado": "SP",
        "areaTotalHa": {
          "$numberInt": "10"
        },
        "ativa": true,
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        }
      }
    ],
    "talhoes": [
      {
        "_id": {
          "$oid": "d90ed5ab7dfc4bc8111cb8fa"
        },
        "propriedadeId": {
          "$oid": "2beee07cf0b61ffc37f5c571"
        },
        "nome": "SIMULACAO BD6 - Talhao a",
        "areaHa": {
          "$numberInt": "2"
        },
        "ativo": true,
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        }
      },
      {
        "_id": {
          "$oid": "9e321ca21e0685a974ae9fa6"
        },
        "propriedadeId": {
          "$oid": "8e0457e0e98e89021e70d3ed"
        },
        "nome": "SIMULACAO BD6 - Talhao b",
        "areaHa": {
          "$numberInt": "2"
        },
        "ativo": true,
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        }
      }
    ],
    "culturas": [
      {
        "_id": {
          "$oid": "1b7983da51a7aa49dc2c3e68"
        },
        "nome": "Milho",
        "ativa": true,
        "criadoEm": {
          "$date": "2026-10-01T12:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-10-01T12:00:00.000Z"
        }
      }
    ],
    "plantacoes": [
      {
        "_id": {
          "$oid": "b0605e63e8af9e32727d94d9"
        },
        "talhaoId": {
          "$oid": "d90ed5ab7dfc4bc8111cb8fa"
        },
        "culturaId": {
          "$oid": "1b7983da51a7aa49dc2c3e68"
        },
        "safra": "2026/2027",
        "dataPlantio": {
          "$date": "2026-11-01T09:00:00.000Z"
        },
        "areaPlantadaHa": {
          "$numberDouble": "1.5"
        },
        "status": "ativa",
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "criadoEm": {
          "$date": "2026-11-01T09:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T09:00:00.000Z"
        }
      },
      {
        "_id": {
          "$oid": "81ff91ba24d1aa6c12cf8a82"
        },
        "talhaoId": {
          "$oid": "9e321ca21e0685a974ae9fa6"
        },
        "culturaId": {
          "$oid": "1b7983da51a7aa49dc2c3e68"
        },
        "safra": "2026/2027",
        "dataPlantio": {
          "$date": "2026-11-01T09:00:00.000Z"
        },
        "areaPlantadaHa": {
          "$numberDouble": "1.5"
        },
        "status": "ativa",
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "criadoEm": {
          "$date": "2026-11-01T09:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T09:00:00.000Z"
        }
      }
    ],
    "problemas_agricolas": [
      {
        "codigoEditorial": "lagarta-do-cartucho",
        "nomeCientifico": "Spodoptera frugiperda",
        "descricao": "Lagarta que raspa e perfura folhas, frequentemente abrigada no cartucho do milho.",
        "chips": [
          "Milho",
          "Temperaturas quentes"
        ],
        "sintomas": [
          "Folhas raspadas",
          "Perfurações nas folhas abertas",
          "Fezes no cartucho"
        ],
        "ondeOlhar": "Examine folhas novas e o interior do cartucho.",
        "dicaDeCampo": "Abra o cartucho com cuidado e procure lagartas vivas.",
        "danos": [
          "Desfolha",
          "Destruição do cartucho",
          "Comprometimento de espigas"
        ],
        "perdaEstimada": "Sem percentual único aplicável; a perda depende da cultura, cultivar, fase de ataque e intensidade, e não é calculada por esta ficha.",
        "epocaPropicia": "Da emergência ao desenvolvimento vegetativo; também pode atacar espigas.",
        "tratamentoIntro": "Combine monitoramento e controle biológico, avaliando lagartas pequenas e condições locais.",
        "boasPraticas": [
          "Confirme a espécie ou o agente causal e a cultura antes de escolher o manejo.",
          "Quando houver uso de produto, confira registro para cultura e alvo, bula, proteção dos aplicadores e orientação agronômica.",
          "Registre a intervenção e reavalie o foco; não use os níveis descritivos desta ficha como limiares automáticos de aplicação."
        ],
        "nomeComum": "Lagarta-do-cartucho",
        "tipo": "praga",
        "niveisAtencao": {
          "baixo": "Sinais localizados (folhas raspadas): registre o foco e acompanhe a evolução com identificação técnica.",
          "medio": "Sinais em expansão (perfurações nas folhas abertas): intensifique a amostragem e solicite avaliação do manejo.",
          "alto": "Danos extensos (desfolha) ou progressão rápida: procure assistência agronômica com prioridade."
        },
        "abrangenciaCulturas": "Milho.",
        "condicoesFavoraveis": [
          "Temperaturas quentes",
          "A influência de chuva e umidade varia com a espécie e a região."
        ],
        "medidasPreventivas": [
          "Monitorar desde a emergência",
          "Manejar plantas voluntárias",
          "Preservar inimigos naturais",
          "Cumprir o refúgio recomendado para milho Bt"
        ],
        "orientacaoBuscaAgronomo": "Consulte um agrônomo antes de aplicar. Os itens acima são exemplos de princípios ativos, não indicação de compra. Agrotóxicos exigem receituário agronômico e uso de EPI.",
        "ativo": true,
        "revisaoEditorial": {
          "status": "aprovada",
          "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; status e data exclusivamente simulados para elegibilidade estrutural; nao disponibilizar em ambiente compartilhado.",
          "registroAgrofitConferido": false,
          "fotoPendente": true
        },
        "_id": {
          "$oid": "a0ce8ef75d217b2d6848e2c6"
        },
        "culturasAfetadasIds": [
          {
            "$oid": "1b7983da51a7aa49dc2c3e68"
          }
        ],
        "fontesIds": [
          {
            "$oid": "edb68afdf38a724577cde596"
          },
          {
            "$oid": "cde8ad65f7e94f436fd31536"
          },
          {
            "$oid": "e04add68c47c38068d16e06a"
          }
        ],
        "formasControle": [
          {
            "classe": "Biológicos microbianos",
            "exemplosControle": [
              "Bacillus thuringiensis",
              "Spodoptera frugiperda multiple nucleopolyhedrovirus"
            ],
            "observacoes": "Exemplos educativos, sem confirmação de registro atual para cada cultura e alvo; não equivalem a recomendação de aplicação.",
            "tipo": "biologica",
            "descricao": "Biológicos microbianos"
          }
        ],
        "criadoEm": {
          "$date": "2026-11-01T07:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-01T08:00:00.000Z"
        },
        "revisadoEm": {
          "$date": "2026-11-01T08:00:00.000Z"
        }
      }
    ],
    "fontes_conhecimento": [
      {
        "_id": {
          "$oid": "edb68afdf38a724577cde596"
        },
        "titulo": "Pragas da Fase Vegetativa e Reprodutiva",
        "instituicaoOuAutor": "Embrapa Milho e Sorgo — Ageitec",
        "url": "https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/milho/producao/pragas-e-doencas/pragas/pragas-da-fase-vegetativa-e-reprodutiva",
        "acessadoEm": {
          "$date": "2026-11-03T00:00:00.000Z"
        },
        "criadoEm": {
          "$date": "2026-11-03T23:56:49.203Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T23:56:49.203Z"
        }
      },
      {
        "_id": {
          "$oid": "cde8ad65f7e94f436fd31536"
        },
        "titulo": "Manejo da lagarta-do-cartucho, Spodoptera frugiperda, em milho",
        "instituicaoOuAutor": "Embrapa Milho e Sorgo",
        "url": "https://www.embrapa.br/documents/1344498/2767891/manejo-da-lagarta-do-cartucho-em-milho.pdf/a2f4a72a-9889-4c38-b88d-31e29556911d",
        "acessadoEm": {
          "$date": "2026-11-03T00:00:00.000Z"
        },
        "criadoEm": {
          "$date": "2026-11-04T00:12:13.990Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-04T00:12:13.990Z"
        }
      },
      {
        "_id": {
          "$oid": "e04add68c47c38068d16e06a"
        },
        "titulo": "Manejo integrado de Spodoptera frugiperda na cultura do milho: efeito de diferentes combinações de Bacillus thuringiensis, baculovirus e inseticida químico.",
        "instituicaoOuAutor": "AGUIAR, F. M. et al.",
        "url": "https://www.alice.cnptia.embrapa.br/handle/doc/1176367",
        "acessadoEm": {
          "$date": "2026-11-03T00:00:00.000Z"
        },
        "criadoEm": {
          "$date": "2026-11-03T23:56:49.203Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T23:56:49.203Z"
        }
      }
    ],
    "ocorrencias": [
      {
        "_id": {
          "$oid": "6aba1a3f0cbe4144e7a1ee38"
        },
        "plantacaoId": {
          "$oid": "b0605e63e8af9e32727d94d9"
        },
        "registradoPor": {
          "$oid": "7650ca1c4d53eb798e0478b9"
        },
        "tipo": "praga",
        "dataObservacao": {
          "$date": "2026-11-02T10:00:00.000Z"
        },
        "sintomas": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; ocorrencia sintetica identificada a partir da mesma ficha do catalogo.",
        "intensidade": "baixa",
        "status": "aberta",
        "criadoEm": {
          "$date": "2026-11-02T10:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-02T10:00:00.000Z"
        },
        "problemaAgricolaId": {
          "$oid": "a0ce8ef75d217b2d6848e2c6"
        }
      },
      {
        "_id": {
          "$oid": "00e0617f63d5d055d4737363"
        },
        "plantacaoId": {
          "$oid": "81ff91ba24d1aa6c12cf8a82"
        },
        "registradoPor": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "tipo": "praga",
        "dataObservacao": {
          "$date": "2026-11-02T10:00:00.000Z"
        },
        "sintomas": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; ocorrencia sintetica identificada a partir da mesma ficha do catalogo.",
        "intensidade": "baixa",
        "status": "aberta",
        "criadoEm": {
          "$date": "2026-11-02T10:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-02T10:00:00.000Z"
        },
        "problemaAgricolaId": {
          "$oid": "a0ce8ef75d217b2d6848e2c6"
        }
      }
    ],
    "monitoramentos": [],
    "tratamentos": [
      {
        "tipoMedida": "manual",
        "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; medida manual sintetica, sem prescricao ou comprovacao de eficacia.",
        "ocorrenciaId": {
          "$oid": "6aba1a3f0cbe4144e7a1ee38"
        },
        "registradoPor": {
          "$oid": "7650ca1c4d53eb798e0478b9"
        },
        "dataAplicacao": {
          "$date": "2026-11-02T13:00:00.000Z"
        },
        "criadoEm": {
          "$date": "2026-11-02T13:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-02T13:00:00.000Z"
        },
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "_id": {
          "$oid": "babe31b1955ac15e7ce4044c"
        }
      },
      {
        "tipoMedida": "manual",
        "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; medida manual sintetica, sem prescricao ou comprovacao de eficacia.",
        "ocorrenciaId": {
          "$oid": "00e0617f63d5d055d4737363"
        },
        "registradoPor": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "dataAplicacao": {
          "$date": "2026-11-03T16:00:00.000Z"
        },
        "criadoEm": {
          "$date": "2026-11-03T16:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T16:00:00.000Z"
        },
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "_id": {
          "$oid": "321d9d37187d12647967d9f6"
        }
      }
    ],
    "avaliacoes_tratamento": [
      {
        "tratamentoId": {
          "$oid": "babe31b1955ac15e7ce4044c"
        },
        "registradoPor": {
          "$oid": "7650ca1c4d53eb798e0478b9"
        },
        "dataAvaliacao": {
          "$date": "2026-11-03T10:00:00.000Z"
        },
        "resultado": "inconclusivo",
        "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "criadoEm": {
          "$date": "2026-11-03T10:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T10:00:00.000Z"
        },
        "_id": {
          "$oid": "5d70a012c81d174fe9ca4360"
        }
      }
    ],
    "alertas": [],
    "experiencias_comunidade": [
      {
        "autorId": {
          "$oid": "7650ca1c4d53eb798e0478b9"
        },
        "ocorrenciaOrigemId": {
          "$oid": "6aba1a3f0cbe4144e7a1ee38"
        },
        "tratamentoOrigemId": {
          "$oid": "babe31b1955ac15e7ce4044c"
        },
        "avaliacaoOrigemId": {
          "$oid": "5d70a012c81d174fe9ca4360"
        },
        "nomePublico": "Produtor Teste Isolado A",
        "culturaId": {
          "$oid": "1b7983da51a7aa49dc2c3e68"
        },
        "culturaNome": "Milho",
        "problemaAgricolaId": {
          "$oid": "a0ce8ef75d217b2d6848e2c6"
        },
        "problemaNome": "Lagarta-do-cartucho",
        "tipoProblema": "praga",
        "statusOcorrencia": "aberta",
        "titulo": "SIMULACAO PARA TESTES - experiencia elegivel isolada",
        "relato": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada",
        "versao": {
          "$numberInt": "1"
        },
        "moderacao": {
          "status": "aprovada",
          "revisadoPor": {
            "$oid": "1d98ef2259aa3870943821c9"
          },
          "revisadoEm": {
            "$date": "2026-11-03T12:00:00.000Z"
          },
          "motivo": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; moderacao simulada, sem aceite da equipe."
        },
        "metodo": {
          "tipoMedida": "manual",
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; medida manual sintetica, sem prescricao ou comprovacao de eficacia."
        },
        "resultadoRelatado": {
          "resultado": "inconclusivo",
          "dataAvaliacao": {
            "$date": "2026-11-03T10:00:00.000Z"
          },
          "observacoes": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada"
        },
        "publicadoEm": {
          "$date": "2026-11-03T12:00:00.000Z"
        },
        "criadoEm": {
          "$date": "2026-11-03T11:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T12:00:00.000Z"
        },
        "_id": {
          "$oid": "82b987f5217accc0626c50c1"
        }
      }
    ],
    "adocoes_tratamento": [
      {
        "usuarioId": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "experienciaId": {
          "$oid": "82b987f5217accc0626c50c1"
        },
        "experienciaVersao": {
          "$numberInt": "1"
        },
        "ocorrenciaId": {
          "$oid": "00e0617f63d5d055d4737363"
        },
        "metodoCopiado": {
          "tipoMedida": "manual",
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; medida manual sintetica, sem prescricao ou comprovacao de eficacia."
        },
        "planejamento": {
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; planejamento sintetico confirmado antes da medida."
        },
        "status": "planejada",
        "criadoEm": {
          "$date": "2026-11-03T17:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T17:00:00.000Z"
        },
        "_id": {
          "$oid": "e84a87d6deeba47b1b0df766"
        }
      },
      {
        "usuarioId": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "experienciaId": {
          "$oid": "82b987f5217accc0626c50c1"
        },
        "experienciaVersao": {
          "$numberInt": "1"
        },
        "ocorrenciaId": {
          "$oid": "00e0617f63d5d055d4737363"
        },
        "metodoCopiado": {
          "tipoMedida": "manual",
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; medida manual sintetica, sem prescricao ou comprovacao de eficacia."
        },
        "planejamento": {
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; planejamento sintetico confirmado antes da medida."
        },
        "status": "realizada",
        "criadoEm": {
          "$date": "2026-11-03T14:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T16:00:00.000Z"
        },
        "tratamentoId": {
          "$oid": "321d9d37187d12647967d9f6"
        },
        "_id": {
          "$oid": "0cbaa16b40204c01bb86eeef"
        }
      },
      {
        "usuarioId": {
          "$oid": "1d98ef2259aa3870943821c9"
        },
        "experienciaId": {
          "$oid": "82b987f5217accc0626c50c1"
        },
        "experienciaVersao": {
          "$numberInt": "1"
        },
        "ocorrenciaId": {
          "$oid": "00e0617f63d5d055d4737363"
        },
        "metodoCopiado": {
          "tipoMedida": "manual",
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; medida manual sintetica, sem prescricao ou comprovacao de eficacia."
        },
        "planejamento": {
          "descricao": "SIMULACAO PARA TESTES - SOMENTE sentinela_testes_bd6 - sem revisao tecnica comprovada; planejamento sintetico confirmado antes da medida."
        },
        "status": "cancelada",
        "criadoEm": {
          "$date": "2026-11-03T13:00:00.000Z"
        },
        "atualizadoEm": {
          "$date": "2026-11-03T13:30:00.000Z"
        },
        "_id": {
          "$oid": "0b765584e6f94513393abca5"
        }
      }
    ],
    "denuncias_comunidade": []
  },
  "impressao": "4bc8acb260cce77cf51fc3c358afe4ae448ef01b07b2e23aba18e645fcfd590c"
};
const pacote = EJSON.deserialize(snapshotEjson);

// Corpo usado para gerar o Playground autossuficiente; não executar este fragmento.
// As consultas abaixo são exclusivamente de leitura no banco fixo isolado.
const relatorio = (() => {
  const destino = db.getSiblingDB('sentinela_testes_bd6');
  const resumo = {banco: 'sentinela_testes_bd6', somenteLeitura: true, escritaExecutada: false,
    impressaoPacote: pacote.impressao, configuracaoCompleta: false,
    colecoesAusentes: [], indicesAusentes: [], contagens: {}, indicesExistentesPreservados: {}};
  function interromper(codigo, detalhes = []) { const e = new Error(codigo); e.codigoSeguro = codigo; e.detalhesSeguros = detalhes; throw e; }
  function normal(v) {
    if (Array.isArray(v)) return v.map(normal);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, normal(v[k])]));
    return v;
  }
  const assinatura = v => JSON.stringify(normal(EJSON.serialize(v, {relaxed: false})));
  const igual = (a, b) => assinatura(a) === assinatura(b);
  const campo = (d, k) => k.split('.').reduce((v, t) => v?.[t], d);
  const id = d => d._id.toHexString();
  function dentro(doc, filtro = {}) {
    return Object.entries(filtro).every(([k, v]) => {
      if (k.startsWith('$') || v && typeof v === 'object') interromper('filtro_parcial_requer_revisao', [k]);
      return igual(campo(doc, k), v);
    });
  }
  function corresponde(atual, esperado) {
    return igual(Object.entries(atual.key), Object.entries(esperado.key)) && !!atual.unique === !!esperado.opcoes.unique &&
      igual(atual.partialFilterExpression || {}, esperado.opcoes.partialFilterExpression || {}) &&
      !atual.sparse && !atual.collation && !atual.hidden && atual.expireAfterSeconds === undefined && !atual.storageEngine && !atual.wildcardProjection;
  }
  function naturais(col, doc) {
    if (col === 'usuarios') return [{firebaseUid: doc.firebaseUid}, {cpf: doc.cpf}];
    if (col === 'culturas') return [{nome: doc.nome}];
    if (col === 'fontes_conhecimento') return [{url: doc.url}, {titulo: doc.titulo, instituicaoOuAutor: doc.instituicaoOuAutor}];
    if (col === 'problemas_agricolas') return [{codigoEditorial: doc.codigoEditorial}, {nomeComum: doc.nomeComum, tipo: doc.tipo}];
    return [];
  }
  try {
    if (destino.getName() !== 'sentinela_testes_bd6') interromper('destino_isolado_obrigatorio');
    if (Object.keys(pacote.configs).length !== 15 || pacote.indices.length !== 22) interromper('snapshot_de_configuracao_invalido');
    const infos = destino.getCollectionInfos(), existentes = {};
    for (const [col, cfg] of Object.entries(pacote.configs)) {
      const info = infos.find(c => c.name === col);
      if (!info) { resumo.colecoesAusentes.push(col); existentes[col] = []; continue; }
      const op = info.options || {};
      if (info.type !== 'collection' || !igual(op.validator || {}, cfg.validator) || (op.validationLevel || 'strict') !== 'strict' ||
          (op.validationAction || 'error') !== 'error' || op.collation || op.capped || op.timeseries) interromper('configuracao_isolada_divergente_preservada', [col]);
      existentes[col] = destino.getCollection(col).getIndexes();
      resumo.indicesExistentesPreservados[col] = existentes[col].map(i => i.name);
      const invalidos = destino.getCollection(col).countDocuments({$nor: [cfg.validator]});
      if (invalidos) interromper('documentos_isolados_invalidos_preservados', [col, invalidos]);
    }
    const criar = [];
    for (const i of pacote.indices) {
      const lista = existentes[i.colecao], nome = lista.find(a => a.name === i.nome);
      if (nome && !corresponde(nome, i)) interromper('indice_isolado_divergente_preservado', [i.colecao, i.nome]);
      if (lista.some(a => igual(Object.entries(a.key), Object.entries(i.key)) && !corresponde(a, i))) interromper('chaves_isoladas_com_opcoes_divergentes', [i.colecao, i.nome]);
      if (!lista.some(a => corresponde(a, i))) criar.push(i);
      if (i.opcoes.unique && !resumo.colecoesAusentes.includes(i.colecao)) {
        const duplicados = destino.getCollection(i.colecao).aggregate([
          {$match: i.opcoes.partialFilterExpression || {}},
          {$group: {_id: Object.fromEntries(Object.keys(i.key).map((k, n) => ['c' + n, '$' + k])), total: {$sum: 1}}},
          {$match: {total: {$gt: 1}}}, {$limit: 1}, {$project: {_id: 0, total: 1}},
        ]).toArray();
        if (duplicados.length) interromper('duplicidade_isolada_preservada', [i.colecao, i.nome]);
      }
    }
    resumo.indicesAusentes = criar.map(i => ({colecao: i.colecao, nome: i.nome, key: i.key, ...i.opcoes}));
    let presentes = 0;
    for (const [col, docs] of Object.entries(pacote.dados)) {
      const atuais = docs.length ? destino.getCollection(col).find({_id: {$in: docs.map(d => d._id)}}).toArray() : [];
      const mapa = new Map(atuais.map(d => [id(d), d]));
      let iguais = 0;
      for (const d of docs) if (mapa.has(id(d))) {
        if (!igual(mapa.get(id(d)), d)) interromper('documento_existente_divergente_preservado', [col, id(d)]);
        iguais++;
      }
      presentes += iguais;
      resumo.contagens[col] = {preparados: docs.length, existentesIguais: iguais, novos: docs.length - iguais};
      const filtros = docs.flatMap(d => naturais(col, d));
      if (filtros.length) {
        const encontrados = destino.getCollection(col).find({$or: filtros}, {_id: 1}).collation({locale: 'pt', strength: 1}).toArray();
        const ids = new Set(docs.map(id));
        if (encontrados.some(d => !ids.has(id(d)))) interromper('possivel_equivalente_com_outro_id_resolver_mapa', [col]);
      }
    }
    // Mesmas verificações de índices únicos existentes/planejados da conferência Node.
    for (const [col, docs] of Object.entries(pacote.dados)) {
      const lista = [...existentes[col], ...criar.filter(i => i.colecao === col).map(i => ({name: i.nome, key: i.key, ...i.opcoes}))];
      for (const i of lista.filter(i => i.unique && i.name !== '_id_')) {
        if (i.sparse || i.collation || Object.values(i.key).some(v => ![1, -1].includes(Number(v)))) interromper('indice_unico_adicional_requer_analise', [col, i.name]);
        const vistos = new Set(), campos = Object.keys(i.key);
        for (const d of docs) if (dentro(d, i.partialFilterExpression)) {
          if (campos.some(k => Array.isArray(campo(d, k)))) interromper('indice_unico_multikey_requer_analise', [col, i.name]);
          const chave = assinatura(campos.map(k => campo(d, k) ?? null));
          if (vistos.has(chave)) interromper('duplicidade_local', [col, i.name]);
          vistos.add(chave);
          const filtro = {$and: [Object.fromEntries(campos.map(k => [k, campo(d, k) ?? null])), i.partialFilterExpression || {}, {_id: {$ne: d._id}}]};
          if (destino.getCollection(col).findOne(filtro, {_id: 1})) interromper('colisao_indice_unico_existente', [col, i.name, id(d)]);
        }
      }
    }
    return {...resumo, aprovado: true, configuracaoCompleta: !resumo.colecoesAusentes.length && !criar.length,
      documentosPreparados: 22, documentosPresentesIguais: presentes, documentosNovos: 22 - presentes,
      observacao: 'Plano somente de leitura. Ausências não foram criadas; aprovação do plano não comprova permissão de escrita, revisão técnica ou autorização da API.'};
  } catch (e) {
    // Não retornar message/stack do servidor, documentos ou chaves pessoais.
    return {...resumo, aprovado: false, codigo: e.codigoSeguro || 'erro_mongodb_ou_ambiente',
      codigoMongoDB: typeof e.code === 'number' ? e.code : undefined, detalhes: e.detalhesSeguros || [],
      orientacao: 'Interromper e analisar. Nenhuma alteração foi executada.'};
  }
})();
// Última expressão também entrega o objeto ao Playground Result.
relatorio;

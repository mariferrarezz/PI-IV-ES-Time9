# API HTTP do Sentinela

Base local padrão: `http://localhost:3000`.

Exceto pelas rotas de saúde e validação de cadastro, as rotas exigem `Authorization: Bearer <token do Firebase>` e banco disponível. As respostas são JSON. Esta é uma referência resumida; os schemas completos estão no código da API.

## Infraestrutura

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| GET | `/health` | Verifica se o processo HTTP está ativo. | Não |
| GET | `/ready` | Informa a disponibilidade do banco configurado. | Não |

## Cadastro e perfil

| Método | Rota | Descrição |
|---|---|---|
| POST | `/validacao-cadastro/cpf` | Valida CPF e disponibilidade; corpo: `{ "valor": "..." }`. |
| POST | `/validacao-cadastro/telefone` | Valida telefone e disponibilidade; corpo: `{ "valor": "..." }`. |
| POST | `/auth/cadastro` | Cria o perfil do usuário já autenticado. |
| GET | `/auth/me` | Retorna o perfil autenticado. |
| POST | `/auth/questionario` | Salva o questionário inicial. |
| PATCH | `/auth/perfil` | Atualiza os campos de perfil permitidos pelo contrato. |

## Catálogos e propriedades

| Método | Rota | Descrição |
|---|---|---|
| GET | `/culturas` | Lista culturas disponíveis. |
| GET | `/culturas/:culturaId/problemas` | Lista problemas ligados à cultura. |
| GET/POST | `/propriedades` | Lista ou cria propriedades do usuário. |
| GET/PUT/DELETE | `/propriedades/:id` | Consulta, altera ou exclui uma propriedade autorizada. |
| GET/POST | `/propriedades/:propriedadeId/talhoes` | Lista ou cria talhões. |
| GET/POST | `/talhoes/:talhaoId/plantacoes` | Lista ou cria plantações. |

## Ocorrências e acompanhamento

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/plantacoes/:plantacaoId/ocorrencias` | Lista ou cria ocorrências. |
| GET/POST | `/plantacoes/:plantacaoId/monitoramentos` | Lista ou cria monitoramentos. |
| GET/POST | `/plantacoes/:plantacaoId/ocorrencias/:ocorrenciaId/tratamentos` | Lista ou cria tratamentos. |
| GET/POST | `/plantacoes/:plantacaoId/ocorrencias/:ocorrenciaId/tratamentos/:tratamentoId/avaliacoes` | Lista ou cria avaliações. |

## Comunidade

| Método | Rota | Descrição |
|---|---|---|
| GET | `/comunidade/experiencias` | Lista experiências aprovadas; aceita filtros de cultura, problema e tipo. |
| GET | `/comunidade/experiencias/:experienciaId` | Consulta uma experiência aprovada. |
| POST | `/comunidade/experiencias/:experienciaId/denuncias` | Cria denúncia pendente. |

## Idempotência e erros

Algumas criações aceitam o cabeçalho `Idempotency-Key`. Repetir uma requisição com a mesma chave e corpo evita duplicação; usar a mesma chave com outro corpo é inválido.

Erros retornam status HTTP e um corpo com mensagem e código. O aplicativo exibe mensagens recebidas e trata timeout ou falha de rede como resultado potencialmente desconhecido; nesses casos, o usuário deve conferir os registros antes de reenviar.

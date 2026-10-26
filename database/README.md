# BD5 — Configuração e criação do banco de dados

Esta pasta organiza os arquivos da tarefa BD5 do projeto Sentinela. O banco utiliza **MongoDB Atlas**.

## Organização

| Pasta | Finalidade |
|---|---|
| `collections/` | Comandos de criação das coleções. |
| `validators/` | Validações dos documentos no MongoDB. |
| `indexes/` | Comandos de criação dos índices iniciais. |
| `tests/` | Testes iniciais da estrutura do banco e verificação dos índices. |
| `seed/` | Futura massa de dados de teste, prevista para a BD6. |

Cada subpasta contém um arquivo `.gitkeep` para que a estrutura vazia seja registrada pelo Git.

## Escopo do MVP

A geolocalização foi adiada para uma versão futura para reduzir o escopo do MVP e priorizar as funcionalidades principais. Município e estado da propriedade permanecem no modelo. Detalhes descritivos podem utilizar os campos de observações já existentes, sem criar novos campos.

Os futuros Playgrounds não deverão incluir campos ou objetos de coordenadas geográficas, suas validações ou índices geoespaciais no MVP. Esta revisão é apenas documental e não remove dados existentes do banco.

## Alertas do MVP

As intensidades permanecem `baixa`, `media` e `alta`. A aplicação gera um alerta somente no cadastro de uma ocorrência com intensidade `alta`, com tipo `ocorrencia_intensidade_alta`. O destinatário é o responsável pela propriedade, obtido pelo vínculo ocorrência → plantação → talhão → propriedade → usuário responsável. O contexto é a ocorrência cadastrada. A exibição ocorre somente dentro do aplicativo, sem envio por e-mail, SMS ou notificação push. Deve existir apenas um alerta desse tipo por ocorrência, inclusive em tentativas repetidas. Alterações posteriores de intensidade e registros de monitoramento não geram esse alerta. A aplicação gera o alerta; o MongoDB apenas o armazena e aplica as restrições configuradas.

Manter `lidoEm` opcional e não incluir `regraOrigem`. Conforme a BD4, a futura aplicação deverá repetir o cadastro do alerta de forma segura, usando upsert com `$setOnInsert` por tipo e ocorrência. Um índice único parcial sobre `tipo`, `contexto.tipo` e `contexto.id`, limitado ao tipo `ocorrencia_intensidade_alta` e contexto `ocorrencia`, impedirá duplicidades concorrentes. O índice de listagem por destinatário permanece separado. Auditar conflitos antes de criar o índice, sem apagar dados existentes. Esses comandos serão preparados futuramente em Playgrounds; nada foi implementado ou executado. A correspondência entre intensidade e prioridade, assim como a recuperação de falhas entre o cadastro da ocorrência e do alerta, ainda precisa ser definida.

## Preparação posterior

Os comandos de configuração serão preparados posteriormente em **MongoDB Playgrounds**. Nenhum Playground foi criado nesta etapa.

As definições das tarefas BD3 e BD4, disponíveis em `docs/`, orientarão essa implementação:

- [BD3 — Modelagem das coleções do MongoDB](../docs/modelagem-mongodb.md): coleções, campos, tipos, obrigatoriedade e relacionamentos.
- [BD4 — Definição de regras, validações e índices](../docs/regras-validacoes-indices.md): regras de integridade, validações e índices previstos.

Antes da implementação e execução, deverão ser confirmadas as propostas e decisões pendentes desses documentos, incluindo a compatibilidade do backend com a modelagem. A regra de alertas abaixo já foi definida, sem representar implementação ou aprovação coletiva das demais propostas.

A futura configuração deverá preservar os dados existentes, criar somente os índices iniciais confirmados e manter os índices candidatos fora da criação automática. Em alertas, deverá ser mantido `lidoEm`, sem incluir `regraOrigem`.

A análise dos índices deverá utilizar `explain("executionStats")`, observando a escolha natural do MongoDB, sem `hint` na verificação inicial. A comparação antes/depois será realizada em banco de teste separado, sem remover índices do banco Sentinela. Os testes de desempenho com volume representativo dependerão da massa de dados da BD6.

Esta etapa mantém apenas a organização das pastas e a documentação. Não há credenciais, conexão ou operações no MongoDB Atlas.

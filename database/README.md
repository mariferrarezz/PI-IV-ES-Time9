# BD5 — Configuração e criação do banco de dados

Esta pasta organiza os arquivos de configuração do banco do projeto Sentinela. O banco utiliza **MongoDB Atlas**.

## Organização

| Pasta | Finalidade |
|---|---|
| `collections/` | Comandos de criação das coleções. |
| `validators/` | Validações dos documentos no MongoDB. |
| `indexes/` | Espaço para comandos de criação dos índices a definir. |
| `tests/` | Testes iniciais da estrutura do banco e verificação dos índices. |
| `seed/` | Futura massa de dados de teste, prevista para a BD6. |

Os arquivos `.gitkeep` permitem registrar pastas vazias no Git.

## Escopo do MVP

A geolocalização foi adiada para uma versão futura para reduzir o escopo do MVP e priorizar as funcionalidades principais. Município e estado da propriedade permanecem no modelo. Detalhes descritivos podem utilizar os campos de observações já existentes, sem criar novos campos.

Os futuros Playgrounds não deverão incluir campos ou objetos de coordenadas geográficas, suas validações ou índices geoespaciais no MVP.

## Alertas do MVP

As intensidades permanecem `baixa`, `media` e `alta`. A aplicação gera um alerta somente no cadastro de uma ocorrência com intensidade `alta`, com tipo `ocorrencia_intensidade_alta`. O destinatário é o responsável pela propriedade, obtido pelo vínculo ocorrência → plantação → talhão → propriedade → usuário responsável. O contexto é a ocorrência cadastrada. A exibição ocorre somente dentro do aplicativo, sem envio por e-mail, SMS ou notificação push. Deve existir apenas um alerta desse tipo por ocorrência, inclusive em tentativas repetidas. Alterações posteriores de intensidade e registros de monitoramento não geram esse alerta. A aplicação gera o alerta; o MongoDB apenas o armazena e aplica as restrições configuradas.

Manter `lidoEm` opcional e não incluir `regraOrigem`. Conforme a BD4, a futura aplicação deverá repetir o cadastro do alerta de forma segura, usando upsert com `$setOnInsert` por tipo e ocorrência. A regra de apenas um alerta desse tipo por ocorrência permanece válida, inclusive em operações concorrentes. Auditar conflitos antes da futura implementação, sem apagar dados existentes. A prioridade é `alta`, conforme a BD4, seção 4.13; a recuperação de falhas entre o cadastro da ocorrência e do alerta ainda precisa ser definida.

## Configuração

Os comandos de configuração utilizam MongoDB Playgrounds. As pastas contêm arquivos para criação de coleções, validação e conferência.

A configuração segue os documentos técnicos:

- [BD3 — Modelagem das coleções do MongoDB](../docs/modelagem-mongodb.md): coleções, campos, tipos, obrigatoriedade e relacionamentos.
- [BD4 — Definição de regras, validações e índices](../docs/regras-validacoes-indices.md): regras de integridade e validações.

Antes da configuração, conferir a compatibilidade do backend com a modelagem.

Antes de configurar índices, definir as consultas atendidas e os requisitos de integridade. Manter lidoEm opcional nos alertas, sem incluir regraOrigem.

A análise dos índices deverá utilizar `explain("executionStats")`, observando a escolha natural do MongoDB, sem `hint` na verificação inicial. A comparação antes/depois será realizada em banco de teste separado, sem remover índices do banco Sentinela. Os testes de desempenho com volume representativo dependerão da massa de dados da BD6.

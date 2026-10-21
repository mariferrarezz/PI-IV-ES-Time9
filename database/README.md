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

## Preparação posterior

Os comandos de configuração serão preparados posteriormente em **MongoDB Playgrounds**. Nenhum Playground foi criado nesta etapa.

As definições das tarefas BD3 e BD4, disponíveis em `docs/`, orientarão essa implementação:

- [BD3 — Modelagem das coleções do MongoDB](../docs/modelagem-mongodb.md): coleções, campos, tipos, obrigatoriedade e relacionamentos.
- [BD4 — Definição de regras, validações e índices](../docs/regras-validacoes-indices.md): regras de integridade, validações e índices previstos.

Antes da implementação e execução, deverão ser confirmadas as propostas e decisões pendentes desses documentos, incluindo a inclusão de alertas no MVP e a compatibilidade do backend com a modelagem.

A futura configuração deverá preservar os dados existentes, criar somente os índices iniciais confirmados e manter os índices candidatos fora da criação automática. Em alertas, deverá ser mantido `lidoEm`, sem incluir `regraOrigem`.

A análise dos índices deverá utilizar `explain("executionStats")`, observando a escolha natural do MongoDB, sem `hint` na verificação inicial. A comparação antes/depois será realizada em banco de teste separado, sem remover índices do banco Sentinela. Os testes de desempenho com volume representativo dependerão da massa de dados da BD6.

Esta etapa mantém apenas a organização das pastas e a documentação. Não há credenciais, conexão ou operações no MongoDB Atlas.

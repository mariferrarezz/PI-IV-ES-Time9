# BD5 — Configuração e criação do banco de dados

Esta pasta organiza os arquivos de configuração do banco do projeto Sentinela. O banco utiliza **MongoDB Atlas**.

A massa BD6 tem **200 documentos confirmados nos três lotes** no `sentinela` de desenvolvimento, incluindo três adoções e uma alteração editorial explicitamente simulada. Contagens, limites da evidência, contorno temporário de DNS e pendências de acesso/aceite estão em [evidências BD6](evidencias-bd6.md) e [instruções da massa](seed/README.md). Isso não comprova revisão agronômica real nem funcionamento/autorização da API.

## Organização

| Pasta | Finalidade |
|---|---|
| `collections/` | Comandos de criação das coleções. |
| `validators/` | Validações dos documentos no MongoDB. |
| `indexes/` | Conferência, auditoria de duplicidades e criação dos 22 índices definidos na BD4, §§8 e 14.6. |
| `tests/` | Testes iniciais da estrutura do banco e verificação dos índices. |
| `seed/` | Massa BD6, manifestos e comando único; ver [instruções](seed/README.md). |

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
- [BD4 — Definição de regras, validações e índices](../docs/regras-validacoes-indices.md): regras de integridade, validações e conjunto inicial de índices na seção 8.

A configuração do banco segue a BD3 e a BD4. O backend existente é uma estrutura inicial e não determina os campos ou os índices do modelo.

### Compatibilidade do backend de propriedades

A conexão do backend com o Atlas não comprova que seu CRUD atende ao schema atual. O módulo em `backend/src/modules/propriedades/` ainda utiliza uma estrutura anterior:

| Aspecto | Backend atual | BD3/BD4 e validator aplicado |
|---|---|---|
| Responsável | Model/repository usam `ownerUid` String do Firebase | `usuarioId` ObjectId que referencia `usuarios`; resolver a identidade autenticada antes da operação |
| Datas | `timestamps: true` cria `createdAt`/`updatedAt`; listagem ordena por `createdAt` | `criadoEm`/`atualizadoEm` obrigatórios; não há ordenação definida para essa listagem |
| Estado do cadastro | Model/DTO não fornecem `ativa` | `ativa` Boolean obrigatório |
| Localização | DTO aceita município e UF ausentes; UF tem apenas limite de dois caracteres | Município obrigatório de 1–150 caracteres; estado obrigatório no enum das 27 UFs |
| Texto descritivo | DTO/model usam `descricao` | Campo opcional permitido é `observacoes`; `descricao` não é permitido |
| Área | DTO/model não contemplam `areaTotalHa` | Campo numérico opcional e positivo, com finitude conferida pela aplicação |
| Campos gerados pelo ODM | Mongoose pode acrescentar `__v` pela configuração padrão | Objetos fechados não permitem `__v` ou outros campos adicionais |
| Exclusão | Repository usa `findOneAndDelete`; service não confere dependentes | Conferir autorização e dependentes conforme BD3 §8.1 e BD4 §7.2 antes de permitir exclusão |

Assim, o caminho atual de inserção não produz um documento compatível, e buscas por `ownerUid` não representam o vínculo por `usuarioId` dos documentos atuais. Será necessário adaptar DTO, model, repository e service em tarefa de integração, incluindo limites e regras da aplicação. Nenhuma adaptação foi feita nesta revisão. Não flexibilizar o validator para acomodar o módulo antigo nem considerar os testes diretos do BD5 testes da API. Preservar `ownerUid_1` até analisar seu uso e os dados legados; não remover esse índice automaticamente.

O validador individual de `problemas_agricolas` inclui a ficha em seções separadas, até 4 chips e revisão editorial conforme BD3 §5.6 e BD4 §4.7. Permite ficha completa pendente com `ativo: false` e sem `revisadoEm`; revisão aprovada e legado sem estado editorial exigem a data. Ausência de estado no legado não aprova conteúdo pela API. Imagens são opcionais e o primeiro item é o principal. A preparação local do arquivo não comprova aplicação no Atlas: comparar configuração e documentos existentes antes de executar o Playground. Testar em banco isolado os caminhos legado/pendente/aprovada, limites e preservação de referências. O JSON em `seed/` permanece material editorial original, sem importação direta, IDs ou revisão técnica inventados; os 22 índices continuam os definidos na BD4.

As consultas atendidas, a ordem das chaves e as opções estão definidas na BD4, §§8 e 14.6. Os scripts de reprodução estão descritos abaixo; sua existência não comprova execução. Os 22 índices do banco principal foram conferidos por resultados enviados pelo executor, conforme o registro de evidências. O desenvolvimento funcional do backend não é pré-requisito para essa definição ou para os testes diretos das consultas no banco.

Conferir os índices efetivamente existentes, inclusive o automático de `_id`, antes de configurar. Auditar duplicidades de `firebaseUid`, plantações ativas por talhão, alertas do evento inicial por ocorrência e adoções planejadas por experiência/ocorrência antes de criar os quatro índices únicos, respeitando os filtros parciais. Interromper para análise se houver conflitos, sem apagar ou corrigir dados automaticamente. Manter `lidoEm` opcional nos alertas, sem incluir `regraOrigem`.

A análise dos índices deverá utilizar `explain("executionStats")`, observando a escolha natural do MongoDB, sem `hint` na verificação inicial. A comparação antes/depois será realizada em banco de teste separado, sem remover índices do banco Sentinela. Os testes de desempenho com volume representativo dependerão da massa de dados da BD6.

Na BD5, verificar chaves e opções criadas e executar as consultas exatas da BD4 com o mesmo filtro, projeção, ordenação e limite. Incluir problemas por cultura e por cultura + tipo, verificando o multikey, além dos históricos e da listagem de propriedades por `usuarioId`. Registrar índice/plano vencedor, SORT quando houver, `nReturned`, `totalDocsExamined`, `totalKeysExamined` e `executionTimeMillis`, conforme a seção 10.3 da BD4. Separar testes de integridade das medições de leitura. A definição documental não comprova ganho de desempenho; relatar resultados somente após os testes.


## Reprodução pelo MongoDB Playground

Pré-requisitos: conexão ativa na extensão MongoDB do VS Code, acesso de rede autorizado e usuário de banco com permissões para as operações da etapa. Conferir o banco antes de Run All. Não colocar URI/senha nos Playgrounds, relatórios ou capturas. O backend carrega `MONGODB_URI` por variável de ambiente; `backend/.env` é local e ignorado, e `.env.example` é somente referência. Permissões de banco não equivalem às autorizações de produtores/moderadores na API.

Os três scripts abaixo usam `aplicar = false` por padrão: somente leitura. `bancoDestino` aceita apenas `sentinela` ou `sentinela_testes_bd5`; `getSiblingDB` seleciona explicitamente o destino. Para reproduzir no isolado, ajustar somente essa constante na cópia de execução dos três scripts, mantendo os validadores individuais apontados ao principal. Não executar todos os arquivos de `database/` em lote.

1. Executar [criar-colecoes-ausentes.mongodb.js](collections/criar-colecoes-ausentes.mongodb.js) em conferência. Para ambiente novo, revisar a lista e executar com `aplicar = true`: cria somente as coleções ausentes, sem excluir/recriar as existentes. Um conflito de tipo bloqueia todas as criações. Nesta etapa, coleções novas ainda estão sem validator: não inserir dados antes da etapa seguinte.
2. Executar [configurar-validadores.mongodb.js](validators/configurar-validadores.mongodb.js) em conferência. Compara os schemas completos e strict/error das 15 coleções e procura documentos incompatíveis com todas as condições, exibindo somente até cinco IDs por coleção. Ausência de validator com opções padrão e dados compatíveis permite configuração; validator existente divergente, opções divergentes ou dados incompatíveis bloqueiam a aplicação inteira. Somente após revisar um ambiente que precise de configuração, executar com `aplicar = true`. Schemas iguais são preservados, sem collMod desnecessário. Este arquivo contém cópias integrais dos 15 validadores individuais: qualquer mudança futura deve atualizar ambas as versões e conferir sua igualdade localmente.
3. Executar [configurar-indices.mongodb.js](indexes/configurar-indices.mongodb.js) em conferência, depois de resolver qualquer bloqueio da etapa anterior. Compara chaves na ordem exata, unicidade, filtros parciais e opções; audita os quatro únicos pelos seus filtros. O relatório informa índices ausentes, equivalentes, divergências e duplicidades, sem imprimir os valores agrupados. Divergências bloqueiam a aplicação inteira. Quando necessário, executar com `aplicar = true` para criar apenas os ausentes. Índice equivalente com outro nome é preservado e informado. `_id_`, `ownerUid_1` e demais adicionais nunca são removidos; a finalidade do legado `ownerUid_1` precisa ser analisada antes de qualquer decisão futura.
4. Repetir as três conferências com `aplicar = false` e guardar os relatórios. Verificar as 15 coleções, 15 configurações correspondentes e 22 índices correspondentes, excluindo `_id_` e adicionais da contagem esperada. Nomes sozinhos não comprovam correspondência.

Não há substituição automática de configurações divergentes. Uma divergência intencional exige comparação e intervenção específica antes de retomar; o script não autoriza sua correção. As leituras não constituem snapshot único, e a sequência de criações não é uma transação. Em erro, parte pode ter sido criada/configurada: voltar ao modo de conferência antes de continuar. O índice único continua sendo a garantia contra duplicidade concorrente; auditoria prévia não a substitui. Auditar os documentos pelo validator não comprova existência de referências, revisão técnica ou autorização.

Os arquivos individuais `validators/validar-*.mongodb.js` usam collMod diretamente e podem substituir um validator. Preservam-se como comandos de aplicação específica, mas não devem ser executados em lote nem sem comparação prévia. `collections/criar-colecoes.mongodb.js` e `criar-colecoes-comunidade.mongodb.js` são comandos anteriores de criação explícita: não repetir em coleções existentes. Para reprodução geral, usar a sequência acima.

O estado atual do `sentinela` já possui evidências de aplicação e conferência; não reaplicar apenas para preencher esta documentação. Os scripts de reprodução agora preparados ainda não foram executados no Atlas.

## Testes e evidências

- [testar-unicidade-bd5.mongodb.js](tests/testar-unicidade-bd5.mongodb.js): escreve somente em `sentinela_testes_bd5`, com identificação exclusiva de rodada e referências fictícias coerentes. Prepara configurações compatíveis, cria documentos e coleções auxiliares por rodada, preserva os anteriores e não faz limpeza automática. Não executar com credencial do backend limitada ao banco principal. Os cenários de moderação/revisão são simulações explícitas, não aprovação humana.
- [avaliar-consultas-bd5.mongodb.js](tests/avaliar-consultas-bd5.mongodb.js): somente leitura no `sentinela`, com 29 consultas e explain sem hint. Depende dos registros fictícios específicos já conferidos; em outra reprodução, conferir referências reais antes de adaptar os IDs, sem inventá-los. A ausência desses registros não implica configuração incorreta. A massa editorial não é pré-requisito. O relatório mascara ObjectIds e valores dos planos; preserva estágios, nomes dos índices e métricas. Filtros, limites de índice e texto interno SBE dos planos são omitidos na saída para evitar divulgar identificadores. A versão anterior imprimia o UID fictício em indexBounds apesar de mascarar o filtro externo; os resultados e as métricas já confirmados continuam preservados, sem necessidade de repetir consultas.
- [conferir-novo-validador-problemas_agricolas.mongodb.js](tests/conferir-novo-validador-problemas_agricolas.mongodb.js): conferência específica de leitura do schema e da compatibilidade dos documentos. Não aplica o validator.
- Os testes manuais anteriores de schema e CRUD estão consolidados em [evidencias-bd5.md](evidencias-bd5.md). Não há necessidade de repetir todas as combinações ou recriar a antiga automação removida. Testes confirmados não significam cobertura de todas as regras da aplicação.

O banco isolado do BD5 não altera o principal. Não transportar seus IDs como prova de referências existentes no `sentinela`. A restrição histórica de não importar o catálogo durante o BD5 foi superada pela carga explícita do BD6: [200 documentos nos três lotes e limites da evidência](evidencias-bd6.md). Não repetir essa carga para reproduzir os testes do BD5, nem importar diretamente o JSON editorial. Comparação de desempenho antes/depois e volume representativo continuam fora da avaliação inicial já confirmada. A revisão pela equipe e as confirmações de acesso/rede são externas aos scripts.

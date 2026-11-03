# BD5 — Configuração e criação do banco de dados

Esta pasta organiza os arquivos de configuração do banco do projeto Sentinela. O banco utiliza **MongoDB Atlas**.

## Organização

| Pasta | Finalidade |
|---|---|
| `collections/` | Comandos de criação das coleções. |
| `validators/` | Validações dos documentos no MongoDB. |
| `indexes/` | Conferência, auditoria de duplicidades e criação dos 22 índices definidos na BD4, §§8 e 14.6. |
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
- [BD4 — Definição de regras, validações e índices](../docs/regras-validacoes-indices.md): regras de integridade, validações e conjunto inicial de índices na seção 8.

A configuração do banco segue a BD3 e a BD4. O backend existente é uma estrutura inicial e não determina os campos ou os índices do modelo.

O validador individual de `problemas_agricolas` inclui a ficha em seções separadas, até 4 chips e revisão editorial conforme BD3 §5.6 e BD4 §4.7. Permite ficha completa pendente com `ativo: false` e sem `revisadoEm`; revisão aprovada e legado sem estado editorial exigem a data. Ausência de estado no legado não aprova conteúdo pela API. Imagens são opcionais e o primeiro item é o principal. A preparação local do arquivo não comprova aplicação no Atlas: comparar configuração e documentos existentes antes de executar o Playground. Testar em banco isolado os caminhos legado/pendente/aprovada, limites e preservação de referências. O JSON em `seed/` permanece material editorial original, sem importação direta, IDs ou revisão técnica inventados; os 22 índices continuam os definidos na BD4.

As consultas atendidas, a ordem das chaves e as opções estão definidas na BD4, §§8 e 14.6. Os scripts de reprodução estão descritos abaixo; sua existência não comprova execução. Os 22 índices do banco principal foram conferidos por resultados enviados pelo executor, conforme o registro de evidências. O desenvolvimento funcional do backend não é pré-requisito para essa definição ou para os testes diretos das consultas no banco.

Conferir os índices efetivamente existentes, inclusive o automático de `_id`, antes de configurar. Auditar duplicidades de `firebaseUid`, plantações ativas por talhão, alertas do evento inicial por ocorrência e adoções planejadas por experiência/ocorrência antes de criar os quatro índices únicos, respeitando os filtros parciais. Interromper para análise se houver conflitos, sem apagar ou corrigir dados automaticamente. Manter `lidoEm` opcional nos alertas, sem incluir `regraOrigem`.

A análise dos índices deverá utilizar `explain("executionStats")`, observando a escolha natural do MongoDB, sem `hint` na verificação inicial. A comparação antes/depois será realizada em banco de teste separado, sem remover índices do banco Sentinela. Os testes de desempenho com volume representativo dependerão da massa de dados da BD6.

Na BD5, verificar chaves e opções criadas e executar as consultas exatas da BD4 com o mesmo filtro, projeção, ordenação e limite. Incluir problemas por cultura e por cultura + tipo, verificando o multikey, além dos históricos e da listagem de propriedades por `usuarioId`. Registrar índice/plano vencedor, SORT quando houver, `nReturned`, `totalDocsExamined`, `totalKeysExamined` e `executionTimeMillis`, conforme a seção 10.3 da BD4. Separar testes de integridade das medições de leitura. A definição documental não comprova ganho de desempenho; relatar resultados somente após os testes.


## Reprodu??o pelo MongoDB Playground

Pr?-requisitos: conex?o ativa na extens?o MongoDB do VS Code, acesso de rede autorizado e usu?rio de banco com permiss?es para as opera??es da etapa. Conferir o banco antes de Run All. N?o colocar URI/senha nos Playgrounds, relat?rios ou capturas. O backend carrega `MONGODB_URI` por vari?vel de ambiente; `backend/.env` ? local e ignorado, e `.env.example` ? somente refer?ncia. Permiss?es de banco n?o equivalem ?s autoriza??es de produtores/moderadores na API.

Os tr?s scripts abaixo usam `aplicar = false` por padr?o: somente leitura. `bancoDestino` aceita apenas `sentinela` ou `sentinela_testes_bd5`; `getSiblingDB` seleciona explicitamente o destino. Para reproduzir no isolado, ajustar somente essa constante na c?pia de execu??o dos tr?s scripts, mantendo os validadores individuais apontados ao principal. N?o executar todos os arquivos de `database/` em lote.

1. Executar [criar-colecoes-ausentes.mongodb.js](collections/criar-colecoes-ausentes.mongodb.js) em confer?ncia. Para ambiente novo, revisar a lista e executar com `aplicar = true`: cria somente as cole??es ausentes, sem excluir/recriar as existentes. Um conflito de tipo bloqueia todas as cria??es. Nesta etapa, cole??es novas ainda est?o sem validator: n?o inserir dados antes da etapa seguinte.
2. Executar [configurar-validadores.mongodb.js](validators/configurar-validadores.mongodb.js) em confer?ncia. Compara os schemas completos e strict/error das 15 cole??es e procura documentos incompat?veis com todas as condi??es, exibindo somente at? cinco IDs por cole??o. Aus?ncia de validator com op??es padr?o e dados compat?veis permite configura??o; validator existente divergente, op??es divergentes ou dados incompat?veis bloqueiam a aplica??o inteira. Somente ap?s revisar um ambiente que precise de configura??o, executar com `aplicar = true`. Schemas iguais s?o preservados, sem collMod desnecess?rio. Este arquivo cont?m c?pias integrais dos 15 validadores individuais: qualquer mudan?a futura deve atualizar ambas as vers?es e conferir sua igualdade localmente.
3. Executar [configurar-indices.mongodb.js](indexes/configurar-indices.mongodb.js) em confer?ncia, depois de resolver qualquer bloqueio da etapa anterior. Compara chaves na ordem exata, unicidade, filtros parciais e op??es; audita os quatro ?nicos pelos seus filtros. O relat?rio informa ?ndices ausentes, equivalentes, diverg?ncias e duplicidades, sem imprimir os valores agrupados. Diverg?ncias bloqueiam a aplica??o inteira. Quando necess?rio, executar com `aplicar = true` para criar apenas os ausentes. ?ndice equivalente com outro nome ? preservado e informado. `_id_`, `ownerUid_1` e demais adicionais nunca s?o removidos; a finalidade do legado `ownerUid_1` precisa ser analisada antes de qualquer decis?o futura.
4. Repetir as tr?s confer?ncias com `aplicar = false` e guardar os relat?rios. Verificar as 15 cole??es, 15 configura??es correspondentes e 22 ?ndices correspondentes, excluindo `_id_` e adicionais da contagem esperada. Nomes sozinhos n?o comprovam correspond?ncia.

N?o h? substitui??o autom?tica de configura??es divergentes. Uma diverg?ncia intencional exige compara??o e interven??o espec?fica antes de retomar; o script n?o autoriza sua corre??o. As leituras n?o constituem snapshot ?nico, e a sequ?ncia de cria??es n?o ? uma transa??o. Em erro, parte pode ter sido criada/configurada: voltar ao modo de confer?ncia antes de continuar. O ?ndice ?nico continua sendo a garantia contra duplicidade concorrente; auditoria pr?via n?o a substitui. Auditar os documentos pelo validator n?o comprova exist?ncia de refer?ncias, revis?o t?cnica ou autoriza??o.

Os arquivos individuais `validators/validar-*.mongodb.js` usam collMod diretamente e podem substituir um validator. Preservam-se como comandos de aplica??o espec?fica, mas n?o devem ser executados em lote nem sem compara??o pr?via. `collections/criar-colecoes.mongodb.js` e `criar-colecoes-comunidade.mongodb.js` s?o comandos anteriores de cria??o expl?cita: n?o repetir em cole??es existentes. Para reprodu??o geral, usar a sequ?ncia acima.

O estado atual do `sentinela` j? possui evid?ncias de aplica??o e confer?ncia; n?o reaplicar apenas para preencher esta documenta??o. Os scripts de reprodu??o agora preparados ainda n?o foram executados no Atlas.

## Testes e evid?ncias

- [testar-unicidade-bd5.mongodb.js](tests/testar-unicidade-bd5.mongodb.js): escreve somente em `sentinela_testes_bd5`, com identifica??o exclusiva de rodada e refer?ncias fict?cias coerentes. Prepara configura??es compat?veis, cria documentos e cole??es auxiliares por rodada, preserva os anteriores e n?o faz limpeza autom?tica. N?o executar com credencial do backend limitada ao banco principal. Os cen?rios de modera??o/revis?o s?o simula??es expl?citas, n?o aprova??o humana.
- [avaliar-consultas-bd5.mongodb.js](tests/avaliar-consultas-bd5.mongodb.js): somente leitura no `sentinela`, com 29 consultas e explain sem hint. Depende dos registros fict?cios espec?ficos j? conferidos; em outra reprodu??o, conferir refer?ncias reais antes de adaptar os IDs, sem invent?-los. A aus?ncia desses registros n?o implica configura??o incorreta. A massa editorial n?o ? pr?-requisito.
- [conferir-novo-validador-problemas_agricolas.mongodb.js](tests/conferir-novo-validador-problemas_agricolas.mongodb.js): confer?ncia espec?fica de leitura do schema e da compatibilidade dos documentos. N?o aplica o validator.
- Os testes manuais anteriores de schema e CRUD est?o consolidados em [evidencias-bd5.md](evidencias-bd5.md). N?o h? necessidade de repetir todas as combina??es ou recriar a antiga automa??o removida. Testes confirmados n?o significam cobertura de todas as regras da aplica??o.

O banco isolado n?o altera o principal. N?o transportar seus IDs como prova de refer?ncias existentes no `sentinela`, nem importar o cat?logo de `seed/` nesta etapa. Volume representativo, compara??o antes/depois e cat?logo ficam para a etapa posterior apropriada. A revis?o pela equipe e as confirma??es de acesso/rede s?o externas aos scripts.

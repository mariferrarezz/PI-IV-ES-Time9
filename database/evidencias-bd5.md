# BD5 — Evidências da configuração

## Coleções, validadores e testes estruturais

A listagem de configuração enviada na conversa mostrou as 15 coleções com validator presente, `validationLevel: strict` e `validationAction: error`. As conferências individuais anteriores e os resultados de inserções/rejeições constituem a evidência de schema; uma listagem que apenas informa presença não comprova, sozinha, igualdade integral do schema.

| Coleção | Evidência enviada na conversa |
|---|---|
| usuarios | Configuração conferida; inserção aceita, rejeição de inválido e consulta; exclusão do registro inicial de teste confirmada pelo executor. |
| propriedades | Configuração conferida e inválido rejeitado; propriedade fictícia de apoio inserida e consultada posteriormente. |
| talhoes | Configuração conferida e inválido rejeitado; talhão fictício de apoio inserido e consultado com vínculo à propriedade. |
| culturas | Configuração conferida, inserção válida e rejeição; exclusão de um teste inicial com `deletedCount: 1`. Cultura de apoio posterior preservada. |
| plantacoes | Schema e condição de encerramento conferidos; inserção aceita, rejeições relatadas e documento original consultado. |
| problemas_agricolas | Testes iniciais confirmados. Adaptação editorial testada no isolado; aplicação e comparação integral posteriores no principal descritas abaixo. |
| fontes_conhecimento | Configuração conferida; fonte válida inserida, inválidos rejeitados e fontes consultadas preservadas. |
| ocorrencias | Configuração conferida; válida inserida, inválidos rejeitados e original consultado. |
| monitoramentos | Inserções válidas com e sem ocorrência; rejeições relatadas e ambos os documentos consultados preservados. |
| tratamentos | Válidos sem quantidade/unidade e com ambos; rejeições relatadas e originais consultados preservados. |
| avaliacoes_tratamento | Configuração conferida; inserção válida, rejeições relatadas e original consultado. |
| alertas | Configuração conferida; ocorrência de apoio e alerta inseridos, rejeições relatadas e alerta original consultado. |
| experiencias_comunidade | Criação e configuração confirmadas; experiência pendente inserida, rejeições relatadas e original consultado. |
| adocoes_tratamento | Criação/configuração e adoção planejada válida confirmadas; rejeições condicionais relatadas. Consulta final preservou a adoção `6ae92afd1e95b13e555267a1`, planejada e sem tratamentoId, após a atualização inválida. |
| denuncias_comunidade | Criação/configuração confirmadas; denúncia pendente inserida, rejeições relatadas e documento original consultado. |

Mensagens `Document failed validation` sem o comando correspondente preservado não permitem atribuir retrospectivamente cada erro a um campo específico ou afirmar cobertura exaustiva. As referências de apoio foram consultadas durante os testes: usuário → propriedade → talhão → plantação, ocorrência, tratamentos e vínculos da Comunidade. Isso comprova os casos consultados, não integridade referencial automática do MongoDB. Os documentos de moderação/revisão simulada não comprovam autorização de moderador nem revisão técnica humana.

### Adaptação de problemas_agricolas

No banco isolado, o executor enviou aceitação de ficha pendente completa, casos de compatibilidade legada/aprovação simulada e rejeições das condições principais; a consulta posterior preservou a ficha pendente, quatro chips e `ativo: false`. Nenhuma data de revisão técnica foi inventada para a pendência.

Após a aplicação no `sentinela` com `ok: 1`, a conferência integral retornou:

- `schemaIgualAoArquivo: true` e `configuracaoIgualAoArquivo: true`;
- nenhuma diferença de caminhos; `strict/error`;
- 2 documentos no total, 2 compatíveis e 0 incompatíveis.

Não reaplicar nem repetir essa rodada para reproduzir sua evidência. Compatibilidade estrutural não aprova conteúdo editorial nem comprova referências ou autorização.

## Índices e unicidade

Os quatro levantamentos de duplicidades no principal retornaram listas vazias antes da criação. A listagem posterior dos índices foi comparada com o BD4: 22 correspondentes por chaves, ordem, unicidade e filtros parciais, sem contar os automáticos `_id_`. O adicional `propriedades.ownerUid_1` foi preservado. A comparação utilizou o resultado anexado `1b765843-d5a9-40f3-9327-2d3fae0c0ff5`, não apenas nomes ou quantidade.

O relatório da rodada `6aea329af945d2afef12fa4b`, anexo `fdbeec67-f0be-41dc-9977-c7cd1b7dc7a0`, comprovou no `sentinela_testes_bd5`:

- 42 verificações aprovadas, zero falhas e um cenário não executado;
- definições dos quatro únicos correspondentes; válidos aceitos e quatro duplicidades rejeitadas com código 11000 do índice esperado;
- candidatos negativos aceitos previamente em coleções auxiliares com o mesmo schema, separando erro de unicidade de erro de validação;
- encerradas fora do parcial de plantações e canceladas/realizadas fora do parcial de adoções aceitas;
- 14 documentos-base preservados.

O cenário de alerta fora do filtro parcial não é representável pelo schema atual: todo alerta estruturalmente válido usa os valores do filtro. Não foi executado nem considerado aprovado. Não houve enfraquecimento do validator para criar esse caso. Os testes não demonstram concorrência ou transições da API e deixaram os dados fictícios no isolado.

## Consultas e CRUD

O relatório completo do anexo `6b57b7d2-c348-477e-9d8b-461d4c21e067` confirmou 29 consultas no `sentinela`, com `explain("executionStats")`, sem hint: zero erros, zero não executadas, todas com índice escolhido, sem SORT bloqueante ou COLLSCAN nos planos relatados. Incluiu históricos, inspeções sem ocorrência, dashboard e Comunidade. O índice de problemas foi confirmado como multikey. A inspeção sem ocorrência escolheu o índice por ocorrência; essa escolha alternativa não foi classificada como falha.

Limitações: massa pequena e fictícia; listagens com projeção mínima de `_id` e limite 20; campos adicionais da tela podem exigir FETCH. As duas consultas do catálogo usaram índice, examinaram dois documentos cada e retornaram zero, sem comprovar custo com fichas disponíveis. Não aprovar conteúdo ou importar catálogo apenas para alterar esse resultado. No dashboard, nReturned conta linhas/grupos, não o valor do indicador. Tempo de 0 ms não demonstra desempenho em escala. Não foi feito benchmark representativo antes/depois.

A atualização válida foi confirmada no isolado para a ficha `6aea26c9e34c50b02da007fd`, alterando somente `revisaoEditorial.observacoes`: `acknowledged: true`, `matchedCount: 1`, `modifiedCount: 1`, `upsertedCount: 0` e `novoValorConfirmado: true` na leitura posterior. Vínculos e status não foram alvo da alteração. Inserções e consultas válidas, rejeições de atualizações inválidas e exclusões iniciais autorizadas já constam dos testes anteriores; não é necessário repetir exclusão ou remover registros de apoio.

## Acesso e credenciais

| Informação | Natureza da evidência e limite |
|---|---|
| Backend conectado após troca para usuário `sentinela_backend`, com readWrite em `sentinela` e restrição a um cluster | Informado manualmente pelo executor neste fechamento. Não verificado por ferramenta Atlas nem por relatório técnico anexado nesta rodada. Não reproduzir credenciais. |
| Três IPs /32 ativos no acesso de rede | Informado manualmente; identificação de dois ainda pendente. Não registrar os endereços neste documento. |
| `.env` ignorado e não rastreado | Conferido localmente com Git. Sem commits encontrados para os caminhos `backend/.env` e `.env` nas referências locais examinadas. Conteúdo do `.env` não foi lido ou alterado. |
| Exemplo e conexão por ambiente | `.env.example` com valores de exemplo/local, sem autenticação MongoDB embutida; `env.ts` carrega dotenv e exige MONGODB_URI; `database.ts` conecta com env.mongodbUri. |
| Busca de possíveis segredos | Arquivos rastreados e 232 versões de arquivos alcançáveis no histórico local examinados por padrões; sem possível credencial MongoDB real detectada. Chaves de cliente Firebase encontradas em `android/app/google-services.json` e `lib/firebase_options.dart`, também no histórico; não são chave privada administrativa. Restrições do serviço não foram verificadas. |

A busca não garante ausência de segredos em formatos desconhecidos, binários, logs, commits inacessíveis ou referências apenas remotas. Não houve acesso ao Atlas ou exposição de valores sensíveis. Permissões de MongoDB não comprovam autorização de produtores/moderadores, consentimento ou bloqueios de encerramento na API. O usuário do backend limitado ao principal não deve ser ampliado apenas para executar testes/configuração em outro banco; usar uma conexão apropriada para a etapa.

## Reprodução e confirmações restantes

Os scripts de reprodução e a sequência estão no [README](README.md#reprodução-pelo-mongodb-playground). Os novos arquivos foram preparados e verificados apenas localmente; não são prova de reaplicação no Atlas nem exigem reaplicar o que já está confirmado. Os relatórios futuros devem registrar banco, modo, divergências, erros e resultados, sem documentos pessoais ou credenciais.

Na preparação local, passaram: análise sintática dos três novos Playgrounds com `node --check`; comparação em memória dos literais de configuração, com 15/15 schemas iguais aos arquivos individuais; comparação das 22 chaves e sua ordem com as tabelas do BD4; comparação das opções dos quatro únicos com o teste confirmado e dos três parciais de feed com o BD4. Os três arquivos começam em modo de leitura e não contêm comandos de exclusão ou inserção de documentos. Essa análise não executou os Playgrounds nem simulou respostas do Atlas. `git diff --check` não indicou erros de whitespace, e o hash SHA-256 do JSON editorial permaneceu `34C8B175EA332A72EBD50FFE8B3375448725CA6E5388C72F4759F8174AEB821B`.

Permanecem a identificação e confirmação da necessidade dos dois IPs /32 informados, a confirmação externa das permissões/restrições manuais quando necessária à revisão e a revisão/aceite pela equipe. Nenhum aceite da equipe foi presumido. Este registro não declara o BD5 concluído. No fechamento histórico do BD5, a importação editorial e o cadastro de culturas/fontes estavam pausados para BD6. Essa pausa foi superada: o [estado final do BD6](evidencias-bd6.md) registra 200 documentos nos três lotes e a única alteração editorial simulada, com seus limites de evidência. Os registros anteriores e o JSON editorial original foram preservados.

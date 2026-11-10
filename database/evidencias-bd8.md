# BD8 — Integração do banco com o backend

## Escopo e estado

Enunciado integral da Issue 8 recebido do usuário nesta conversa. Implementação local em `database/configuracao-bd5`: Node/TypeScript/Express/Mongoose/Zod, conexão reutilizável e demonstração pelo módulo de propriedades. **Execução real aprovada: 29 testes e limpeza confirmados pelo usuário. Fechamento documental aprovado por declaração do usuário em 10/11/2026, conforme registro ao final.** O aceite da dependência BD7 foi posteriormente declarado pelo usuário; testes técnicos, isoladamente, não equivalem a esse aceite.

Na preparação local inicial não houve conexão ao Atlas, execução de cargas, escrita remota ou criação/alteração de contas Firebase. As tabelas abaixo registram essa fase histórica; a consolidação ao final atualiza as pendências de execução. Esta atualização documental não acessou o banco nem repetiu testes. Nenhum documento BD6/preexistente, JSON editorial, manifesto, hash esperado, schema, índice ou arquivo de frontend foi alterado. `.env` e `.env.example` permanecem intactos. As versões de dependências e o lockfile foram preservados; adicionados somente comandos de testes em package.json.

## Critérios e implementação — preparação local histórica

| Critério do BD8 | Implementação / evidência local | Estado |
|---|---|---|
| Backend conecta ao MongoDB | Configuração central, banco sentinela explícito, pool único e promessa compartilhada de inicialização | Implementado; conexão anterior funcionou, nova versão ainda sem execução remota |
| Credenciais seguras | MONGODB_URI por ambiente, .env relativo ao backend, erros/logs sem objeto bruto ou URI, tokens nunca versionados | Implementado/local; privilégios reais dependem de confirmação externa |
| Banco correto | dbName sentinela, readiness verifica estado e nome da conexão | Implementado/local |
| Camada reutilizável | Config, rotas, middleware, controller, service, repository e model separados; interfaces para testes | Implementado/local; [guia](../backend/README.md) |
| Inserção por backend | DTO estrito, usuário resolvido pelo token, BSON e campos atuais | Preparação local aprovada; execução real posteriormente confirmada pelo usuário |
| Consulta por ID e referência | UID → usuarios.firebaseUid → usuarios._id → propriedades.usuarioId em todas as operações | Preparação local aprovada; execução real posteriormente confirmada pelo usuário |
| Atualização | Campos permitidos, timestamps, runValidators, dono imutável, área versus talhões ativos | Implementado/local; transação real pendente |
| Exclusão conforme regras | 404 sem revelar dono alheio; 409 com talhões ativos ou inativos; sem exclusões em cascata | Implementado/local; caso real preparado só com fixture próprio |
| Estrutura/validações | Model sem ownerUid, datas inglesas e __v; DTO/model compatíveis com validator atual; autoIndex/autoCreate desativados | Verificação local contra schema completo; sem aplicação de collMod/índices |
| Erros de conexão e operação | 400/401/403/404/409/422/503/500 seguros; readiness, seleção limitada e encerramento SIGINT/SIGTERM | Implementado; falhas simuladas, sem desligar Atlas |
| Testes de integração com MongoDB executados | Harness API + Emulator + MongoDB preparado; não executado por restrição desta etapa | Pendente obrigatório para conclusão |
| Falhas de conexão verificadas | Connect/reutilização/encerramento do pool simulados; HTTP permanece vivo em indisponibilidade controlada | Local aprovado; não é falha real provocada no Atlas |
| Nenhuma credencial adicionada | Arquivos de configuração/cliente preservados, exemplos sem segredos, .env continua ignorado | Conferência local; não é nova auditoria completa de histórico |
| Documentação reproduzível | Variáveis, comandos, contrato HTTP, contas/perfis mínimos e teste real com limpeza | Preparado; reprodução por outro integrante pendente |
| Equipe revisou/validou | Sem confirmação | Pendente |

## Verificações locais e limites

Os testes usam valores de ambiente exclusivos e não conectam ao banco. Rotas HTTP são exercitadas em loopback com repositories e verificador Firebase simulados; isso **não** é prova de integração real no Atlas ou autenticação real no Emulator.

Cobertura local:

- Model validado sem save e comparado ao `$jsonSchema` completo de propriedades; coleção explícita, sem __v/ownerUid/createdAt e sem índices declarados.
- DTO: município, UF, limites, espaços, número finito/positivo e recusa de campos adicionais/protegidos.
- Inicialização concorrente reutiliza uma conexão; dbName/autoIndex/autoCreate conferidos; desconexão chamada; falha de connect não propaga mensagem sensível.
- Repository sondado sem banco: filtros com ObjectId e proprietário em create/list/get/update/delete; update com runValidators, strict e sessão.
- HTTP local: autenticação obrigatória, perfil ausente sem criação, resolução do usuário, CRUD/ID/nova leitura, isolamento GET/PUT/DELETE, entradas e JSON inválidos, área insuficiente, dependentes e exclusão apenas quando permitida.
- HTTP local: banco indisponível retorna 503 em readiness/operações, health continua 200, recuperação simulada; códigos 121/11000/rede mapeados sem conteúdo sensível.

Resultados da rodada final local:

| Verificação executada | Resultado |
|---|---|
| `npm --prefix backend run typecheck` | Aprovado, sem erros TypeScript |
| `npm --prefix backend run build` | Aprovado; saída dist gerada localmente e ignorada pelo Git |
| `npm --prefix backend test` | 10 testes aprovados, zero falhas/cancelados/ignorados (quatro grupos de topo, seis subtestes HTTP) |
| `node --check backend/tests/integracao-real-bd8.cjs` | Sintaxe aprovada, sem execução do fluxo remoto |
| `node backend/tests/integracao-real-bd8.cjs` sem opções | Somente ajuda e código zero; não carregou ambiente nem fez pedidos |
| Revisão de diff e `git diff --check` | Sem erros de whitespace nos arquivos rastreados; dados/configurações protegidos sem alterações |
| `.env` / build / dependências | .env ignorado e não rastreado; dist ignorado; lockfile e versões sem diff |

Build/typecheck não provam autenticação, permissões, transações ou persistência remotas. O harness real é somente preparado nesta etapa; ausência de contas/perfis não é contornada. O encerramento do pool foi testado por chamada simulada; sinais e encerramento com operações remotas em andamento não foram exercitados contra Atlas.

## Regras e decisões

- Sem perfil MongoDB: 403 PERFIL_AUSENTE, sem cadastrar automaticamente. Inexistente e de outro produtor: mesmo 404, sem revelar existência.
- Exclusão confere todos os talhões; arquivamento utiliza ativa false. Área total não pode ficar abaixo da soma de talhões ativos; comparação no servidor conserva Decimal128.
- Atualização/exclusão usam transação snapshot/majority. Futuras escritas de talhões devem coordenar o mesmo pai para evitar corrida entre coleções; transação isolada deste módulo não impede talhão externo concorrente ou cria foreign keys. Limitação explícita, sem campo de trava novo ou schema enfraquecido.
- A autenticação Firebase/Emulator foi preservada. Injeção em funções construtoras serve aos testes; o servidor padrão usa Firebase real e não tem variável para desligar autenticação.
- Health é liveness, não prova de CRUD. Readiness reflete estado do pool e banco correto, não substitui teste de consulta.
- Não há ordem nova presumida para listagem de propriedades. Demais funcionalidades permanecem fora do escopo.

## Teste real — preparação histórica anterior à rodada aprovada

Ver [backend/README.md](../backend/README.md#preparação-do-teste-real--não-executado-nesta-implementação). O harness exige tokens do Emulator e os dois perfis BD6 existentes (UIDs A/B), mais um token sem perfil para o caso correspondente. Nenhuma conta foi criada/consultada nesta implementação; contas ausentes precisam de autorização/preparação separada no Emulator, sem editar usuarios no Atlas.

```powershell
npm --prefix backend run test:real -- --autorizar-temporarios --com-dependentes
```

Executar somente depois de aprovação para escritas temporárias, backend e Emulator locais prontos e acesso autorizado. Sem as opções necessárias não há aprovação integral; sem --autorizar-temporarios apenas ajuda é exibida. Driver direto é usado só para criar/remover um fixture de talhão ligado à propriedade temporária; CRUD e recusa por dependentes são feitos por HTTP autenticado. Não se prova API de talhões, Flutter, eficácia agrícola ou revisão profissional.

IDs novos e marcadores exclusivos; não se atualizam ou excluem preexistentes. Tokens e senhas somente no processo, sem log. Limpeza em finally só dos próprios IDs e fixture; erro/incerteza é reportado, sem repetição cega. Snapshot das propriedades preexistentes dos dois atores é comparado; não se declara revalidação global de coleções sem endpoints. Os 200 documentos BD6 continuam como massa protegida, não como alvos de mutação.

## Execução real aprovada — evidência atual

O usuário confirmou nesta conversa **29 testes aprovados e limpeza confirmada**. Essa evidência é uma confirmação do executor humano, distinta dos testes locais e do diagnóstico realizado pelo agente. Não foi fornecido nesta mensagem o JSON integral da rodada final, seu identificador ou IDs temporários; não se atribuem campos adicionais não apresentados.

Os 29 casos do fluxo completo abrangem readiness, autenticação obrigatória e token inválido, listagem/vínculo A/B, perfil ausente, POST e leitura por ID, atualização e nova leitura, isolamento GET/PUT/DELETE, IDs inválido/inexistente, sete entradas inválidas/protegidas, preservação após rejeições, bloqueios por dependente e área insuficiente, exclusão/leitura posterior e comparação dos preexistentes A/B.

A limpeza do executor remove somente a propriedade retornada pelo próprio POST e seu fixture de talhão. A limpeza foi confirmada pelo usuário. A comparação final cobre propriedades A/B; não é revalidação global dos 200 documentos BD6, que permanecem protegidos e não são alvos dos testes.

### Primeira tentativa interrompida por DNS

O backend estava com DNS temporário no próprio processo, mas o teste foi iniciado em outro Node sem esse ajuste. Passaram os casos anteriores ao fixture; houve falha em `fixture_temporario_talhao`. O usuário informou `limpezaConfirmada: true` e `criacaoIncerta: false` nessa primeira tentativa.

O diagnóstico posterior, limitado à abertura/fechamento da conexão direta e sem CRUD, reproduziu **querySrv / ECONNREFUSED**, com DNS loopback presente. A falha precedeu autenticação e inserção. O código original da primeira rodada não pode ser recuperado de seu catch genérico; a reprodução comprova a falha DNS no diagnóstico, consistente com a interrupção relatada. Não há evidência de violação de schema/permissão nessa etapa.

**Defeito do contador:** `cenariosNaoExecutados` soma somente entradas explicitamente registradas com `executado: false`. Exceções impedem o registro dos testes seguintes; portanto o zero da primeira tentativa **não representa cobertura completa**. Ficaram sem comprovação naquela tentativa: bloqueio por dependente, recusa de área insuficiente, exclusão/leitura posterior no fluxo normal e comparação final dos preexistentes A/B. A limpeza no finally é separada. A rodada final aprovada supera essa lacuna de execução. O contador foi corrigido posteriormente em verificação local. O registro histórico não atribui retroativamente cobertura à primeira tentativa.

### DNS temporário usado separadamente nos dois processos

Antes da conexão, tanto o processo do backend quanto o processo do teste receberam:

```javascript
require('node:dns').setServers(['172.16.0.3','172.16.0.4'])
```

O ajuste de um processo não se propaga a outro Node iniciado independentemente. Esses endereços foram uma solução temporária deste ambiente, não uma configuração universal, alteração do DNS do Windows ou instrução para fixá-los no projeto/.env. Nenhuma URI, senha ou token foi incluído neste registro.

### Limites da comprovação

O CRUD foi realizado pelos endpoints de propriedades, com Firebase Auth Emulator. O driver direto cria/remove somente o fixture: **não comprova endpoints de talhões, integração Flutter ou Firebase de produção**. Não comprova concorrência com escritores externos, desempenho em escala ou revisão agronômica real. A ficha ativa/aprovada BD6 continua sendo simulação acadêmica.

## Checklist atual e critérios restantes

| Critério | Situação / evidência |
|---|---|
| Conexão, banco correto e camada reutilizável | Atendido na cobertura local e na execução real aprovada informada |
| Inserção, consulta por ID/referência, atualização e exclusão | Atendido para propriedades nos 29 casos reais; não abrange todos os módulos |
| Validações, isolamento e dependentes | Atendido na cobertura local e real descrita |
| Integração real e limpeza | 29 aprovados e limpeza confirmados pelo usuário; não repetidos nesta consolidação |
| Falhas de conexão e indisponibilidade | Testes locais anteriores: connect rejeitado sem segredo, HTTP 503 em readiness/operações, health 200 e recuperação simulada. Diagnóstico real DNS reproduzido; não houve desligamento/reconfiguração do Atlas nem ensaio remoto de todas as falhas |
| Credenciais protegidas | Ambiente, mensagens e .env ignorado conferidos anteriormente; não é nova auditoria integral do histórico Git |
| Privilégios mínimos | Conferência manual informada pelo usuário em 10/11/2026: backend usa sentinela_backend, com readWrite em sentinela, acesso restrito ao cluster Sentinela-PI e nenhum papel administrativo exibido na listagem. Não houve consulta independente ao Atlas pelo agente |
| Documentação reproduzível | Instruções preparadas, execução do usuário confirmada e aceite declarado em 10/11/2026; reprodução independente pela amiga não foi informada e não é alegada |
| Contador de interrompidos | Corrigido e testado localmente; sem repetição da integração real |
| Acesso/rede da equipe | Pendências aprovadas por declaração do usuário em 10/11/2026; somente ele e sua amiga acessarão o banco. Sem nova inspeção técnica dos IPs |
| Revisão/aprovação | Aprovados por declaração do usuário em 10/11/2026, sem verificação independente da revisão |

- [x] Implementação e verificações locais anteriores: typecheck, build e 10 testes aprovados.
- [x] Integração real: 29 casos aprovados, conforme confirmação do usuário.
- [x] Limpeza confirmada e comparação dos preexistentes A/B no fluxo completo.
- [x] Primeira tentativa e defeito do contador documentados.
- [x] Corrigida/testada localmente a contabilização dos cenários interrompidos.
- [x] Privilégios da conexão usada no BD8 conferidos manualmente pelo usuário em 10/11/2026, conforme registro abaixo.
- [x] Acesso/rede e pendências dos IPs autorizados aprovados por declaração do usuário em 10/11/2026.
- [x] Revisão/aceite BD7 e BD8 aprovados por declaração do usuário em 10/11/2026.

As antigas pendências de preparar contas e executar a rodada real foram superadas pela execução aprovada informada. Não é necessário repetir essa rodada por esta consolidação. Preservar o relatório integral, se disponível, complementa a rastreabilidade.

**Conclusão:** integração técnica demonstrada no escopo de propriedades e privilégios conferidos manualmente pelo usuário. BD8 concluído no escopo documentado, com base nas evidências existentes e no aceite declarado em 10/11/2026. Flutter, demais módulos e revisão agronômica real pertencem a escopos próprios.

## Correção local do contador após a execução real

O harness agora registra previamente os 29 casos planejados, com IDs distintos inclusive para os dois testes de areaTotalHa. Cada caso termina como aprovado, reprovado, omitido ou interrompido. Falhas em pré-requisitos/fixture são registradas como etapas técnicas reprovadas adicionais, sem aumentar o plano de 29 casos. O resumo inclui contagens por estado; cenariosNaoExecutados soma omitidos e interrompidos e impede aprovação completa.

Asserções posteriores à resposta HTTP também podem reprovar o caso corrente. A limpeza permanece independente e conserva as operações/proteções originais; sua execução não transforma casos interrompidos em aprovados.

Verificações locais desta alteração: **11 testes aprovados, zero falhas**, incluindo teste da função de contabilização extraída do harness, isolada por VM sem carregar ambiente ou abrir conexões. Simulação de falha no fixture: 23 aprovados, uma etapa técnica reprovada e seis interrompidos/não executados. Também foram verificados fluxo completo de 29 aprovados, omissão explícita e reprovação após conferir resposta. Typecheck, sintaxe do harness e diff sem erros. Um bloqueio EPERM inicial do sandbox exigiu repetição das verificações locais fora dele.

Nenhum teste remoto foi repetido. Os 29 testes reais anteriores permanecem uma evidência separada, confirmada pelo usuário; a correção do relatório foi validada somente localmente. A confirmação de permissões foi posteriormente informada em 10/11/2026, conforme registro abaixo; as pendências de acesso/rede e aceite foram posteriormente aprovadas por declaração do usuário em 10/11/2026.

## Conferência manual de acesso MongoDB — 10/11/2026

O usuário informou ter conferido manualmente no Atlas e localmente, nessa data:

- O backend utiliza o usuário `sentinela_backend`, identificado no `.env` local.
- Esse usuário possui `readWrite` no banco `sentinela`.
- O acesso está restrito ao cluster `Sentinela-PI`.
- Nenhum papel administrativo foi exibido na listagem consultada.

Esta é uma evidência de conferência manual informada pelo usuário, não uma auditoria independente ou consulta ao Atlas pelo agente. Não foram registrados URI, senha ou tokens, nem alteradas configurações. A ausência de papel administrativo é registrada nos limites da listagem observada, sem ampliar a conclusão para configurações não verificadas.

A conferência manual atendeu à pendência de privilégios. As pendências de acesso/rede e revisão/aceite ainda estavam abertas nesse momento e foram posteriormente aprovadas por declaração do usuário, registrada abaixo.

## Declaração de aceite e fechamento documental — 10/11/2026

O usuário declarou que somente ele e sua amiga acessarão o banco e considerou aprovadas as pendências de acesso dos integrantes, rede/IPs autorizados e revisão/aceite da equipe. Este registro reproduz **a declaração do usuário**: não comprova nova inspeção do Atlas, teste de acesso pela amiga, identificação técnica individual dos IPs ou reunião/revisão independente. Não se inventam nomes, datas de testes ou atas.

Foram conferidos os critérios restantes nos registros existentes. Os resultados técnicos e seus limites permanecem preservados; as pendências de confirmação/aceite foram atendidas pela declaração acima. O BD8 tem conexão reutilizável, CRUD de propriedades, validação, isolamento, tratamento de indisponibilidade local, 29 casos reais confirmados, limpeza e correção local do contador documentados. A confirmação manual de privilégios permanece uma evidência separada.

**BD8 considerado concluído no escopo da issue neste documento**, com base nas evidências anteriores e no aceite declarado. Não houve alteração do status de issues em serviço externo. Não foram repetidos testes nem acessado o Atlas ou alteradas configurações nesta atualização. As limitações registradas continuam válidas: integração Flutter e outros endpoints não são comprovados; simulação acadêmica não equivale a revisão agronômica real.

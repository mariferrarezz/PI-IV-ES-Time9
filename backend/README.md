# Backend — integração BD8

Node.js 20+, TypeScript, Express 5, Mongoose, Zod e Firebase Admin. As versões do projeto e o lockfile foram preservados. O Firebase CLI é necessário para executar o Auth Emulator e não foi instalado por esta implementação.

## Configuração e execução

Na raiz, quando as dependências ainda não estiverem instaladas: `npm ci --prefix backend`. Não é necessário reinstalar para executar os testes se `backend/node_modules` já existir.

Copiar `.env.example` para `.env` **somente se o arquivo local ainda não existir**, sem sobrescrever credenciais existentes. Preencher localmente:

| Variável | Uso |
|---|---|
| `MONGODB_URI` | Conexão autorizada do cluster de desenvolvimento; nunca versionar seu valor |
| `PORT` | Porta HTTP, padrão 3000 |
| `FIREBASE_PROJECT_ID` | Mesmo projeto utilizado pelo Emulator/cliente |
| `FIREBASE_AUTH_EMULATOR_HOST` | No desenvolvimento, host e porta do Auth Emulator, sem `http://` (por exemplo `127.0.0.1:9099`) |

O carregamento de `.env` é relativo à pasta backend, tanto em `src` quanto em `dist`; variáveis do processo têm precedência. O nome do banco é explicitamente **sentinela**, mesmo que a URI tenha outro nome no caminho. Usar somente a conexão de desenvolvimento correta. Não enviar a URI ao Flutter ou aos clientes HTTP. Banco Atlas e Auth Emulator são serviços distintos.

Em terminais separados, a partir da raiz:

```powershell
# Substituir pelo MESMO ID público do projeto usado no backend e no cliente:
firebase emulators:start --only auth --project "ID_DO_PROJETO"
npm --prefix backend run dev
```

Ou, dentro de `backend`: `npm run build` e `npm start`. O servidor começa a ouvir somente após conectar. `GET /health` é liveness; `GET /ready` retorna 200 com pool conectado ao banco esperado, ou 503. A resposta de readiness informa somente estado, nome do banco e modo Firebase/Emulator; não executa ping a cada chamada nem comprova CRUD.

A conexão Mongoose é única/reutilizada, inclusive por chamadas concorrentes de inicialização. autoIndex, autoCreate, bufferCommands e debug estão desativados; nenhum script configura coleções, schemas ou índices. Falhas iniciais encerram com código seguro; falhas de operações são convertidas em respostas seguras. SIGINT/SIGTERM fecham o servidor HTTP e depois o pool, com prazo para encerrar conexões HTTP pendentes. Não há URI, token, corpo de requisição, objeto bruto ou stack do driver nos logs implementados.

## Organização e regras de propriedades

`rotas → validação Zod → controller → service → repository/Mongoose → MongoDB`.

- `config/`: ambiente e ciclo da conexão; `middlewares/`: Firebase e erros.
- `usuarios.repository`: consulta mínima em `usuarios` por `firebaseUid`, sem criar ou atualizar perfis.
- `propriedades.service`: resolve UID autenticado → `usuarios._id` e aplica regras de área/dependentes.
- `propriedades.repository`: toda busca/mutação de propriedades inclui `usuarioId` ObjectId. Coleção explicitamente `propriedades`; talhões são consultados apenas para referências/dependência/área.
- `propriedades.model/schema`: campos do BD3/BD4, `criadoEm`/`atualizadoEm`, sem `__v`, `ownerUid` ou datas inglesas. Nenhum índice é declarado/criado pelo model; o adicional legado `ownerUid_1` permanece intacto no banco.

`POST /propriedades` aceita nome e município (1–150 caracteres não vazios), UF no enum brasileiro, `observacoes` opcional (1–5000), `areaTotalHa` opcional (número positivo e finito), `ativa` opcional (padrão true). Textos são aparados; limites contam caracteres Unicode. Não aceita null nos opcionais nem converte texto numérico silenciosamente.

`PUT /propriedades/:id` atualiza parcialmente os mesmos campos e exige ao menos um. `_id`, `usuarioId`, `ownerUid`, datas, operadores e campos adicionais são recusados pelo DTO estrito; o service também valida chamadas internas. O Mongoose usa `runValidators: true`, timestamps próprios e responsável imutável. O cliente nunca escolhe o proprietário. `GET /propriedades` não impõe ordenação adicional, conforme BD3.

Atualizações e exclusões fazem suas verificações na mesma transação snapshot/majority. Não reduzir área total abaixo da soma dos talhões **ativos**; a comparação numérica fica no servidor para suportar Decimal128 existentes. Exclusão física somente sem talhões, incluindo inativos. Havendo dependentes, retorna 409; arquivar por `PUT {"ativa": false}` preserva o histórico. O módulo não cria/edita talhões nem implementa outras funcionalidades agrícolas.

**Concorrência:** a transação mantém consistência das operações deste módulo, mas não cria foreign keys nem bloqueia automaticamente uma inserção de talhão feita por outro escritor. O futuro módulo de talhões deve coordenar alterações no mesmo documento-pai para proteger a soma de áreas e a exclusão contra corridas; não alegar garantia sobre escritas diretas/externas. Não foi adicionado campo de trava ou alterado schema para contornar isso.

## Contrato HTTP e exemplos

Todas as operações de propriedades exigem `Authorization: Bearer <ID_TOKEN>`. Tokens reais não devem aparecer em exemplos, relatórios, histórico do terminal, commits ou arquivos de configuração versionados.

| Operação | Sucesso |
|---|---|
| `POST /propriedades` | 201, documento |
| `GET /propriedades` | 200, somente registros do próprio perfil |
| `GET /propriedades/:id` | 200, documento próprio |
| `PUT /propriedades/:id` | 200, documento atualizado |
| `DELETE /propriedades/:id` | 204, apenas sem dependentes |

Respostas de erro têm `erro` e `codigo`; erros de entrada podem incluir campos, sem os valores recebidos.

| HTTP | Código / condição |
|---|---|
| 400 | ENTRADA_INVALIDA / identificador malformado, DTO ou validação Mongoose; CastError usa IDENTIFICADOR_INVALIDO |
| 401 | NAO_AUTENTICADO / token ausente, inválido ou expirado |
| 403 | PERFIL_AUSENTE / Firebase autenticou, mas não existe perfil MongoDB |
| 404 | NAO_ENCONTRADO / inexistente **ou de outro produtor**, sem revelar existência alheia |
| 409 | POSSUI_DEPENDENTES, AREA_INSUFICIENTE ou CONFLITO_UNICIDADE (11000) |
| 422 | VALIDACAO_BANCO (121) |
| 503 | BANCO_INDISPONIVEL ou AUTENTICACAO_INDISPONIVEL |
| 500 | ERRO_INTERNO, sem detalhes sensíveis |

Exemplo de corpo POST, somente dados fictícios:

```json
{"nome":"TEMP BD8 exemplo","municipio":"Cidade fictícia","estado":"SP","areaTotalHa":2}
```

Exemplo PowerShell, apenas depois de obter token autorizado e autorizar a criação temporária:

```powershell
$cabecalhos = @{ Authorization = "Bearer $env:BD8_TOKEN_A" }
# Não imprimir o objeto de cabeçalhos.
$p = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/propriedades -Headers $cabecalhos -ContentType application/json -Body '{"nome":"TEMP BD8 exemplo","municipio":"Cidade fictícia","estado":"SP"}'
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/propriedades/$($p._id)" -Headers $cabecalhos
# Ao finalizar, excluir SOMENTE o ID retornado por esta criação, sem dependentes:
Invoke-RestMethod -Method Delete -Uri "http://127.0.0.1:3000/propriedades/$($p._id)" -Headers $cabecalhos
```

## Testes locais executáveis sem Atlas

```powershell
npm --prefix backend test
npm --prefix backend run typecheck
npm --prefix backend run build
```

Os testes locais usam HTTP loopback com verificador Firebase e repository em memória, model.validate sem save, sondas do Mongoose e conexão simulada. Não são prova de autenticação no Emulator ou de integração real com MongoDB. Não leem contas reais, não iniciam servidor de produção, não criam usuários e não conectam ao Atlas. Falha de conexão/indisponibilidade é simulada sem desligar serviços compartilhados. Testes desta etapa e pendências estão em [evidencias-bd8.md](../database/evidencias-bd8.md).

<a id="preparação-do-teste-real--não-executado-nesta-implementação"></a>

## Preparação e resultado do teste real

A integração real de propriedades (API + Auth Emulator + MongoDB) teve **29 testes aprovados e limpeza confirmada**, conforme confirmação do usuário registrada nas [evidências BD8](../database/evidencias-bd8.md). As instruções abaixo descrevem a preparação para reprodução, não uma pendência de execução. O fixture direto não comprova endpoints de talhões; a rodada não comprova integração Flutter ou Firebase de produção. Não é necessário repetir os testes para documentar esse resultado.

Não criar ou alterar perfis MongoDB para viabilizar autenticação. São necessários dois usuários **já presentes na massa BD6** e contas correspondentes no Auth Emulator:

| Ator | Firebase UID esperado | Perfil MongoDB existente |
|---|---|---|
| A | sentinela_bd6_v1_20261103_a | be013a28bfb4773b09f619d3 |
| B | sentinela_bd6_v1_20261103_b | f143382bb56503d766a8f961 |
| Sem perfil | UID exclusivo, por exemplo bd8_sem_perfil | Nenhum perfil deve ser criado |

A existência desses documentos MongoDB não comprova contas Firebase. Nesta etapa nenhuma conta foi consultada, criada ou alterada. Primeiro conferir as contas do Emulator. Se faltarem, solicitar autorização separada para criá-las **somente no Emulator**, com UID exato, e-mail fictício como `produtor.a.bd8@example.invalid` e senha local escolhida pela equipe. Não alterar usuários que já existam nem criar perfis automaticamente. O terceiro ator testa explicitamente a resposta PERFIL_AUSENTE.

Após autorização e preparação das contas, autenticar por SDK Firebase Auth conectado ao Emulator ou pelo endpoint local `POST /identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` (base `http://127.0.0.1:9099`, parâmetro key da configuração Firebase), com email, password e returnSecureToken true. Guardar apenas o idToken retornado em variável de processo, sem imprimi-lo ou salvá-lo. Projeto do token, CLI e backend devem coincidir. Referências primárias: [Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth) e [REST Auth](https://firebase.google.com/docs/reference/rest/auth/).

Carregar tokens já obtidos de forma oculta, no terminal que executará o teste:

```powershell
$segredo = Read-Host 'ID token do ator A' -AsSecureString
$env:BD8_TOKEN_A = [System.Net.NetworkCredential]::new('', $segredo).Password
$segredo = Read-Host 'ID token do ator B' -AsSecureString
$env:BD8_TOKEN_B = [System.Net.NetworkCredential]::new('', $segredo).Password
$segredo = Read-Host 'ID token do ator sem perfil' -AsSecureString
$env:BD8_TOKEN_SEM_PERFIL = [System.Net.NetworkCredential]::new('', $segredo).Password
Remove-Variable segredo
```

`BD8_API_URL` é opcional (padrão loopback/PORT). O harness exige servidor local com `/ready` indicando sentinela/emulator e UIDs A/B da massa. Não possui modo para pular autenticação. A URI só é usada pelo harness se o fixture direto de dependente for solicitado.

Comandos **para autorização/execução posterior**, na raiz:

```powershell
# API/Emulator/MongoDB reais, apenas propriedades temporárias; dependentes ficam não executados:
npm --prefix backend run test:real -- --autorizar-temporarios
# Rodada completa inclui fixture mínimo de talhão, criado/removido diretamente só para testar DELETE/área pela API:
npm --prefix backend run test:real -- --autorizar-temporarios --com-dependentes
# Limpar tokens da sessão depois:
Remove-Item Env:BD8_TOKEN_A, Env:BD8_TOKEN_B, Env:BD8_TOKEN_SEM_PERFIL -ErrorAction SilentlyContinue
```

Sem autorização o harness só mostra ajuda, sem carregar .env ou fazer pedidos. A rodada incompleta (sem terceiro token ou sem fixture) registra cenários não executados e não marca aprovação total.

O teste cria propriedade com marcador exclusivo, usa POST/GET/PUT/DELETE autenticados e compara novas leituras. Verifica identidade por referência, campos/datas, entradas inválidas, campos protegidos, IDs e isolamento A/B. Nunca tenta DELETE em propriedade preexistente para testar dependência. O fixture opcional é um talhão ligado apenas à propriedade nova; o **DELETE e a recusa da área são testados pelos endpoints**, mas a criação direta do fixture não comprova uma API de talhões.

A limpeza remove somente o fixture e os IDs que o próprio POST retornou e que não constavam da listagem anterior; IDs são registrados antes do restante dos testes. Compara as propriedades preexistentes A/B ao final. Falha de criação com resposta incerta não autoriza repetir ou apagar por prefixo: o relatório informa rodada/incerteza e exige conferência. Queda abrupta ou falha de limpeza impede aprovação; não se promete limpeza remota em todos os cenários. Nenhuma carga, schema ou índice é aplicado. Não se afirma nova validação global dos 200 via esses endpoints limitados.

O Atlas continua exigindo IP autorizado e usuário MongoDB de privilégios mínimos (readWrite em sentinela, sem administração desnecessária); JWT Firebase autoriza produtores na API e não substitui essas permissões. As pendências de acesso dos integrantes, rede/IPs autorizados (incluindo os dois IPs /32 anteriormente pendentes) e revisão/aceite BD7/BD8 foram aprovadas por declaração do usuário em **10/11/2026**, com acesso previsto somente para ele e sua amiga. Esse aceite não representa nova inspeção técnica dos IPs ou teste independente de acesso pela amiga; a conferência manual de privilégios está registrada separadamente nas evidências BD8.

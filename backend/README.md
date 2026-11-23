# Backend — integração BD8

## Clientes isolados de Comunidade

`validarExperienciaComunidadeNoJava(campos, metadados, referencia)`,
`validarAdocaoTratamentoNoJava(campos, metadados)` e
`validarDenunciaComunidadeNoJava(campos, metadados, referencia)` reutilizam o TCP
existente. Metadados e referência são fornecidos pelo código confiável chamador;
versões usam bigint, sem perda ao representar BSON long. Não há HTTP/persistência.
Contratos e pendências: [Comunidade](../servidor-java/comunidade.md).
Teste: `npm --prefix backend run test:comunidade:java` (Java ativo).
Perfil mantém telefone canônico estrito e agora confere os 67 DDDs oficiais;
normalização continua pendente, sem aceitar formatos extras ou comprovar posse.

## Cliente isolado de problemas agrícolas

`validarProblemaAgricolaNoJava(campos, instanteReferencia)` retorna
`ResultadoValidacaoProblemaAgricola` (`valido`, `erros`). Os tipos de entrada
`CamposValidacaoProblemaAgricola`, `FormaControleProblema`, `NiveisAtencaoProblema` e
`RevisaoEditorialProblema` são reexportados pelo serviço. Não são modelos de persistência.
Serialização está em `src/shared/protocolo-problema-agricola.ts`, conforme as 59 partes
fixas e blocos variáveis documentados em `../servidor-java/protocolo-problema-agricola.md`.

Referência obrigatória separada, fornecida pelo código confiável chamador. Datas Date
válidas são serializadas em UTC, sem datas geradas silenciosamente. Opcionais omitidos
diferem de textos/listas/objetos vazios; flags false são preservadas. IDs chegam
canonicalizados pelo Node; Java só confere estrutura, tamanho e repetição das listas.
Não normaliza/deduplica/reordena valores. Aprovação não comprova referências existentes,
revisão humana, Agrofit, fundamentação científica ou disponibilidade.

Reutiliza transporte: conexão por chamada, timeout total de 3 segundos e resposta até
64 KiB, sem logs de campos. Não há limite de bytes de pedido configurado; o teste de
limites finitos mede o pedido real de grande tamanho. PublicId não tem teto, portanto
não existe tamanho máximo absoluto calculável. O Java limita respostas de erro a
64 KiB, reservando CRLF: mantém mensagens completas em ordem e acrescenta
`Existem erros adicionais não exibidos nesta resposta.` quando houver omissão.
O cliente interpreta essa resposta como `valido=false`; os validadores diretos
mantêm todos os erros. Respostas excessivas de um servidor incompatível continuam
rejeitadas com JavaIndisponivelError.
Nenhum limite foi ampliado ou reduzido nesta etapa.

Com Java ativo: `npm --prefix backend run test:problemas:java`.
Nenhuma rota/modelo, consulta, autorização, upload, persistência, invalidação de revisão
ou aprovação real foi implementada. Seções editoriais opcionais permanecem opcionais;
aplicabilidade e transições continuam pendências do fluxo Node. Não aplica a exceção BD6.

## Clientes isolados de culturas e fontes

`validarCulturaNoJava(campos: CamposValidacaoCultura)` retorna
`ResultadoValidacaoCultura` e recebe nome, nomeCientifico, descricao, ativa e imagem
opcional única (`MetadadosImagemOcorrencia`). False explícito é preservado; ausência
é encaminhada como campo obrigatório ausente. Texto opcional omitido difere de vazio.
Data inválida da imagem e ativa preenchido não booleano são recusados antes da conexão.
Metadados e publicId não são transformados, e envio futuro é permitido.

`validarFonteConhecimentoNoJava(campos: CamposValidacaoFonteConhecimento,
instanteReferencia: Date)` retorna `ResultadoValidacaoFonteConhecimento`. Campos:
titulo, instituicaoOuAutor, url, publicadoEm, acessadoEm. Referência separada obrigatória
vem do código Node confiável chamador, nunca de um futuro body HTTP. Datas Date válidas
são serializadas em UTC; valores inválidos são rejeitados antes da conexão.
URL permite HTTP e HTTPS; exige acesso, sem dependência inversa. O Java compara
publicação/acesso com referência e acesso com publicação, aceitando igualdade.

Ambos reutilizam codec e transporte existentes (conexão por chamada, timeout total
de 3 segundos, fragmentação, resposta até 64 KiB e `JavaIndisponivelError`), sem logs
dos campos. Protocolos de 13 e 8 partes estão no README Java.
Com Java ativo: `npm --prefix backend run test:catalogos:java`.

Não há rotas, modelos ou persistência. Autorização, consultas de possíveis duplicações,
disponibilidade do catálogo, upload/autoria, proteção contra exclusão referenciada e
concorrência continuam pendentes da integração. Não há novas unicidades ou julgamento
científico/editorial. Datas de calendário sem horário continuam sem convenção definida.

## Clientes isolados de perfil

`validarCadastroPerfilNoJava(campos: CamposValidacaoCadastroPerfil)` recebe somente
nomeCompleto, cpf, telefoneCanonico e canalCodigoPreferido. Não normaliza telefone nem
escolhe canal padrão; `email` é valor do canal, não endereço de conta.
Telefone é validado pela estrutura canônica e lista oficial de DDDs, sem comprovar posse.

`validarOpcionaisPerfilNoJava(campos: CamposValidacaoOpcionaisPerfil)` recebe somente
nomePublico e fotoPerfil opcional, objeto único `MetadadosImagemOcorrencia`. Textos
omitidos diferem de presentes vazios. EnviadaEm é Date válida serializada em UTC;
data inválida é rejeitada antes da conexão. Valores e publicId são preservados.
Retorno tipado: `ResultadoValidacaoPerfil` (`valido`, `erros`).

Ambos reutilizam codec e transporte existentes: conexão por chamada, timeout total
de 3 segundos, resposta fragmentada até 64 KiB e `JavaIndisponivelError`, sem logs dos
campos. Protocolos de 5/9 partes estão no README Java. Com Java ativo:
`npm --prefix backend run test:perfil:java`.

Não há rotas, modelos, persistência ou definição de remoção de opcionais/contrato HTTP
de edição. UID permanece exclusivamente no token; não enviar email, senha, confirmação
ou códigos ao perfil. Não há novas unicidades. Normalização,
versão/aceite dos termos, autoria, upload e autorização de arquivos continuam pendentes.
O questionário mantém seu contrato separado.

## Cliente isolado do questionário

`validarQuestionarioNoJava(respostas, metadados)` recebe
`RespostasValidacaoQuestionario` e `MetadadosValidacaoQuestionario`, retornando
`ResultadoValidacaoQuestionario` (`valido`, `erros`). Respostas: portePropriedade,
quantidadeCulturas, culturasIds, outraCultura, problemasFrequentes, frequenciaProblemas
e identificaProblemasSozinho. Metadados separados e obrigatórios: `versao` (String)
e `concluidoEm` (Date válida). O cliente não escolhe versão nem gera data silenciosamente.
Versão vazia é encaminhada ao Java; conclusão inválida é recusada antes da conexão.
Nenhuma versão vigente é definida nesta implementação.

Listas omitidas e vazias permanecem distintas. Texto opcional omitido difere de
presença vazia. IDs devem ser canonicalizados pelo Node chamador; aprovação Java não
comprova existência/disponibilidade do catálogo. Não há comparação de quantidade
declarada com a lista nem porte com área. Conclusão futura não é proibida.

O comando `VALIDAR_QUESTIONARIO` usa 13 partes fixas + N culturas + M problemas,
documentadas no README Java. Reutiliza codec e transporte: conexão por chamada,
timeout total de 3 segundos, fragmentação, limite de resposta de 64 KiB e
`JavaIndisponivelError`, sem registrar campos. Com Java ativo:
`npm --prefix backend run test:questionario:java`.

Sem rota, modelo ou persistência. Autorização, perfil, consulta de todas as culturas,
controle da versão apresentada e gravação completa continuam pendentes. Divergências
das telas Flutter não são corrigidas e não motivam mudanças no banco nesta etapa.

## Cliente isolado de avaliações de tratamento

`validarAvaliacaoTratamentoNoJava(campos, instanteReferencia)` recebe
`CamposValidacaoAvaliacaoTratamento` (dataAvaliacao, resultado, observacoes) e retorna
`ResultadoValidacaoAvaliacaoTratamento` (`valido`, `erros`). Datas são objetos Date
válidos serializados para instantes UTC. Campos omitidos são enviados vazios para
validação de obrigatoriedade no Java. Datas inválidas e referência ausente/inválida
são rejeitadas antes da conexão. A referência é parâmetro obrigatório separado,
fornecido pelo código confiável chamador, nunca por um futuro body HTTP do usuário.

Reutiliza o codec e o transporte TCP existente: conexão por chamada, timeout total
de 3 segundos, acumulação de fragmentos, limite de resposta de 64 KiB e
`JavaIndisponivelError` nas falhas. Não registra campos nem modifica seus valores.
O comando tem exatamente cinco partes: comando, dataAvaliacao, resultado,
observacoes, instanteReferencia. Detalhes e regras estão no README Java.

Com Java ativo: `npm --prefix backend run test:avaliacoes:java`.
Não há rotas ou modelos. Referências, autoria, autorização, comparação com aplicação,
vínculo/intervalo do monitoramento, estados, concorrência e persistência permanecem
fora desta etapa. Não há nova regra sobre notas, eficácia, unicidade ou prazo mínimo.

## Cliente isolado de tratamentos

`validarTratamentoNoJava(campos, instanteReferencia)` recebe `CamposValidacaoTratamento`
e retorna `ResultadoValidacaoTratamento` (`valido`, `erros`). Campos: tipoMedida,
descricao, dataAplicacao, areaTratadaHa, produtoUtilizado, quantidadeUtilizada,
unidadeQuantidade, responsavelAplicacao, observacoes e imagens. Reutiliza
`MetadadosImagemOcorrencia`, sem autoria ou binários enviados ao Java.

Instante de referência é parâmetro obrigatório separado e confiável do código
chamador, nunca um futuro body HTTP. Datas são Date válidas serializadas em UTC;
datas inválidas são recusadas antes da conexão. Opcionais omitidos são distintos de
textos presentes vazios, sem defaults ou normalização no cliente. Null não faz parte
do contrato TypeScript de entrada. Dependência quantidade/unidade é validada no Java.

Transporte reutilizado: conexão por chamada, timeout total de 3 segundos, fragmentação,
limite de resposta de 64 KiB, `JavaIndisponivelError` e liberação de recursos. Não registra
campos. O contrato `VALIDAR_TRATAMENTO` de 17 partes fixas + 5 por imagem está documentado
no README Java. Com Java ativo: `npm --prefix backend run test:tratamentos:java`.

Nenhuma rota, modelo ou persistência de tratamentos é criada. Consultas, referências,
autorização, plantação ativa, ocorrência aberta/em acompanhamento, observação inicial,
área plantada, upload, autoria e concorrência continuam pendências da integração.
Não há dose, prescrição, enum/conversão de unidades ou exigência de produto para química.

## Cliente isolado de monitoramentos

`validarMonitoramentoNoJava(campos, instanteReferencia)` recebe
`CamposValidacaoMonitoramento` e retorna `ResultadoValidacaoMonitoramento` (`valido`,
`erros`). Usa o transporte TCP existente: conexão por chamada, timeout total de 3 segundos,
limite de resposta de 64 KiB, fragmentação e `JavaIndisponivelError`, sem registrar campos.
O indicador de ocorrência é booleano obrigatório; problema observado pode estar ausente
para o Java produzir o erro de obrigatoriedade. False explícito é preservado.
Intensidade e evolução omitidas são diferentes de textos presentes vazios.

Datas são objetos Date válidos transmitidos em UTC. O instante de referência é
parâmetro obrigatório separado, fornecido pelo código chamador confiável, nunca por
um futuro body HTTP. Imagens reutilizam `MetadadosImagemOcorrencia`, sem autoria enviada.
Java reutiliza `ImagemOcorrencia` e a validação extraída em `ValidadorImagens`, sem mudar
o comportamento anterior de ocorrências. O contrato exato `VALIDAR_MONITORAMENTO`
(14 partes fixas + 5 por imagem) está no README do servidor Java.

Com Java iniciado, execute `npm --prefix backend run test:monitoramentos:java`.
Não importa Express, Firebase ou MongoDB. Autorização, consultas, vínculo com plantação,
data inicial da ocorrência e área plantada permanecem fora do validador. Não há novas
rotas, modelos ou persistência. Validators, índices e dados não são alterados.

## Cliente isolado de ocorrências

`validarOcorrenciaNoJava(campos, instanteReferencia)` em
`src/services/validacao-java.service.ts` recebe `CamposValidacaoOcorrencia` e retorna
`ResultadoValidacaoOcorrencia` (`valido`, `erros`). Imagens usam `MetadadosImagemOcorrencia`:
url, publicId, legenda opcional e enviadaEm. Intensidade é String baixa/media/alta.
Nenhum autor, identificador de referência ou conteúdo binário é enviado ao Java.
O indicador booleano de problema comunica somente presença, não existência/autorização.

Referência temporal é obrigatória e separada dos campos, fornecida pelo código
chamador confiável; não deve vir de um futuro body HTTP. Datas são `Date`,
serializadas para UTC; datas inválidas são rejeitadas antes da conexão. Ausência de
texto opcional difere de presença vazia. Não há defaults ou normalização silenciosa.
Transporte reutilizado: conexão por chamada, timeout total de 3 segundos, fragmentação,
limite de 64 KiB e `JavaIndisponivelError` nas falhas, sem registrar campos.

O contrato `VALIDAR_OCORRENCIA` de 14 partes fixas + 5 por imagem está documentado no
README Java. Execute `npm --prefix backend run test:ocorrencias:java` com Java ativo.
Não existem novas rotas, modelos ou persistência. Autorização, referências, cultura,
área plantada, transições, uploads e autoria continuam responsabilidade futura do Node.
Validators, índices e regras de alertas não foram alterados.

## Cliente isolado de plantações

`validarPlantacaoNoJava(campos, instanteReferencia)` em `src/services/validacao-java.service.ts`
reutiliza o transporte TCP existente (timeout total de 3 segundos, resposta até 64 KiB,
fragmentação e `JavaIndisponivelError`). Retorna `{ valido, erros }` tipado.
`campos` aceita variedade, safra, dataPlantio, areaPlantadaHa, status,
dataEncerramento e observacoes; datas são objetos `Date` válidos serializados em UTC.
Opcionais omitidos permanecem ausentes; textos vazios são enviados como presentes.
O instante de referência é parâmetro obrigatório separado, fornecido pelo código
confiável chamador, nunca por um futuro body HTTP. Datas inválidas são rejeitadas
antes da conexão. Não há padrão automático de status nem normalização no cliente.

O módulo de plantações também expõe `GET` e `POST /talhoes/:talhaoId/plantacoes`.
As rotas resolvem a propriedade pelo talhão e pelo perfil autenticado, verificam
disponibilidade e área, chamam o Java e gravam em transação. A restrição de uma
plantação ativa por talhão continua apoiada pelo índice parcial do banco. O app
envia a data de plantio convertida a partir da meia-noite de `America/Sao_Paulo`.
O contrato de 12 partes `VALIDAR_PLANTACAO` está no README do servidor Java.
Concorrência real e alteração externa de cultura ainda não foram verificadas.

Com Java rodando: `npm --prefix backend run test:plantacoes:java`.
Testes locais não importam Express, Firebase ou MongoDB e não acessam o Atlas.

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

Cada integrante precisa liberar o próprio IP no Atlas (**Network Access** → **Add IP Address** → **Add Current IP Address**). Ao trocar de rede (outro Wi-Fi), liberar o novo IP e reiniciar a API: sem isso, a inicialização falha com `BANCO_ERRO_CONEXAO` ou as rotas respondem `BANCO_INDISPONIVEL`.

Em terminais separados, a partir da raiz:

```powershell
# Substituir pelo MESMO ID público do projeto usado no backend e no cliente.
# Usar o pacote firebase-tools via npx (o pacote "firebase" não tem a CLI; não instalar com npm install -g):
npx firebase-tools emulators:start --only auth --project "ID_DO_PROJETO"
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

O cadastro chama `validarPropriedadeNoJava` após o schema preparar os textos e após resolver o perfil autenticado, antes de qualquer escrita. Somente nome, município e observações recebem o trim já existente; UF exige sigla exata, recusando `sp` e ` SP `. O Java valida conteúdo, limites em pontos de código Unicode, UF e área; não transforma os campos. Tipos, campos protegidos, limites do schema/modelo, validators MongoDB, autenticação, permissões e persistência permanecem no Node/MongoDB. Nenhum teto de área, limite de casas decimais, unicidade de nome ou consulta a municípios foi acrescentado.

Resultado Java inválido retorna 400 `ENTRADA_INVALIDA` com `detalhes: [{"mensagem":"..."}]`. Falha TCP retorna 503 `JAVA_INDISPONIVEL`, sem detalhes internos. Ambas impedem a gravação. As verificações atuais do schema continuam podendo rejeitar dados antes da chamada Java. O sucesso do POST continua retornando 201 com o documento. O PUT também consulta o Java conforme o fluxo abaixo, sem alterar o protocolo.

O cliente TCP reutiliza uma conexão por chamada, timeout total de 3 segundos, acumulação de fragmentos e limite de resposta de 64 KiB. Propriedades usam `VALIDAR_PROPRIEDADE` com sete partes e escapes reversíveis para barras, TAB, CR e LF; observações omitidas são distintas de observações presentes vazias. O contrato está no [README Java](../servidor-java/README.md#cadastro-de-propriedades). `VALIDAR_TALHAO` e suas respostas permanecem compatíveis.

Testes sem Atlas: `npm run test:propriedades` cobre a rota com mocks; `npm run test:java` cobre transporte e codec. Com Java iniciado, `npm run test:propriedades:java` usa TCP real, sem Firebase/MongoDB. `npm test` mantém a suíte local de propriedades com validação Java injetada por mock. Execuções HTTP reais de cadastro, inclusive o harness BD8 existente, agora precisam também de Java acessível em `JAVA_HOST`/`JAVA_PORT` (localhost/7000 por padrão). Os resultados históricos documentados não representam nova execução desta integração.

`PUT /propriedades/:id` atualiza parcialmente os mesmos campos e exige ao menos um. `_id`, `usuarioId`, `ownerUid`, datas, operadores e campos adicionais são recusados pelo DTO estrito; o service também valida chamadas internas. O Mongoose usa `runValidators: true`, timestamps próprios e responsável imutável. O cliente nunca escolhe o proprietário. `GET /propriedades` não impõe ordenação adicional, conforme BD3.

No PUT, o backend resolve o perfil e lê a propriedade autorizada fora da transação. Captura os seis campos editáveis (`nome`, `municipio`, `estado`, `areaTotalHa`, `observacoes`, `ativa`), incluindo presença/ausência dos opcionais e valores BSON. Monta o estado final sobrepondo somente os campos efetivamente enviados. Não aplica defaults do POST nem trim/normalização aos campos herdados. `false` é preservado; omissão mantém valor ou ausência; null, vazio e espaços inválidos continuam recusados, sem mecanismo de remoção de opcionais. Propriedades arquivadas continuam editáveis e podem ser reativadas explicitamente.

Esse estado é validado no Java **fora de qualquer transação**. Erros 400/503 impedem inclusive o início da transação de escrita. Após aprovação, uma transação curta relê a propriedade pelo dono e confere a imagem originalmente validada. Mudança em conteúdo ou presença de campos retorna 409 `PROPRIEDADE_ALTERADA`: `A propriedade foi alterada durante a operação. Recarregue os dados e tente novamente.`. Ausência/inacessibilidade na releitura retorna 404. Mudanças somente em datas não invalidam uma imagem cujo conteúdo permanece igual.

Quando área é enviada, a soma dos talhões ativos continua sendo conferida no MongoDB dentro da transação (igualdade é permitida). A escrita usa `$set` somente do patch mais `atualizadoEm`, com guarda atômica dos valores/presença originais e filtro do dono. As comparações usam `$expr`/`$literal` para evitar trim ou conversão de valores BSON no filtro pelo Mongoose. A data de atualização avança ao menos um milissegundo, inclusive em PUT idempotente, garantindo escrita efetiva no pai para coordenar com o cadastro de talhões. O timestamp não é usado sozinho como versão. Nas repetições automáticas da transação, a imagem original é reconferida; o Java não é chamado dentro do callback. Não há repetição externa que remonte silenciosamente o patch sobre outro estado.

**Áreas legadas no PUT:** a leitura geral atual com `lean()` conserva Decimal128 e, por padrão do BSON instalado, promove Longs na faixa suportada para `number`. A leitura específica da atualização usa `promoteLongs: false`, preservando Longs para conferência e conversão explícita. Valores `number` já são doubles do contrato atual. Long/Decimal128 só são enviados como Double ao Java se a igualdade matemática exata entre a fração decimal/inteira e o IEEE-754 for comprovada. Por exemplo, Decimal128 `0.5` e Long `42` são aceitos; Decimal128 `0.1`, valores com overflow/underflow e Long `9007199254740993` são recusados com 422 `AREA_LEGADA_INCOMPATIVEL`, sem escrita. Não há arredondamento silencioso; trata-se de limitação do contrato Double, não de novo teto ou precisão de cadastro. Mesmo valores legados representáveis continuam armazenados em seu tipo original quando área é omitida. Uma área nova explicitamente enviada segue o contrato HTTP já existente. Outros tipos herdados incompatíveis retornam 422 `PROPRIEDADE_LEGADA_INCOMPATIVEL`; não são corrigidos automaticamente.

Testes locais: `npm run test:propriedades:put` cobre montagem do estado, omissões, guarda atômica, BSON, autorização, conflitos no mesmo milissegundo, idempotência e repetição sem nova chamada Java. Com Java local iniciado, `npm run test:propriedades:put:java` exercita HTTP → service → TCP → Java reais com identidade e persistência simuladas, sem Atlas. Esses testes não comprovam concorrência MongoDB real.

Foi preparado, **sem execução nesta etapa**, o comando `npm --prefix backend run test:talhoes:real -- --executar --com-put`. Ele mantém os sete cenários existentes e acrescenta PUT parcial, mudança de conteúdo durante a chamada Java sem alteração da data, redução concorrente com talhão e PUT idempotente concorrente com talhão. As duas últimas provas forçam snapshots reais sobrepostos e exigem repetição transacional, verificando a soma após persistência. O harness rastreia nomes/IDs exclusivos para limpar também as propriedades renomeadas e aguarda os services antes da limpeza. Exige os mesmos pré-requisitos e autorização de execução real; não executá-lo como teste local. Não há nova evidência de transação/concorrência real do PUT nesta etapa.

Atualizações e exclusões fazem suas verificações na mesma transação snapshot/majority. Não reduzir área total abaixo da soma dos talhões **ativos**; a comparação numérica fica no servidor para suportar Decimal128 existentes. Exclusão física somente sem talhões, incluindo inativos. Havendo dependentes, retorna 409; arquivar por `PUT {"ativa": false}` preserva o histórico. O cadastro de talhões está no módulo descrito abaixo.

**Concorrência:** o cadastro de talhões escreve `atualizadoEm` no mesmo documento-pai dentro da transação, coordenando cadastros concorrentes com as atualizações e exclusões de propriedades deste backend. A data avança ao menos um milissegundo para garantir uma escrita efetiva. Conflitos são tratados pelo mecanismo de repetição de transações do Mongoose. Escritores diretos/externos que não adotem essa coordenação continuam fora dessa garantia; não há foreign keys ou novos campos de trava.

## Cadastro de talhões com validação Java

`POST /propriedades/:propriedadeId/talhoes` exige Bearer e perfil cadastrado. O identificador do pai vem da URL; o responsável vem do perfil autenticado. Propriedade inexistente ou alheia retorna o mesmo 404. Propriedade arquivada retorna 409 `PROPRIEDADE_INATIVA`.

Corpo de exemplo: `{"nome":"Talhão Norte","areaHa":2.5}`. Campos documentados: `nome` (texto obrigatório de 1–150 pontos de código Unicode sobre o valor original, incluindo espaços externos, sem trim ou normalização), `areaHa` (número, sem conversão de strings), `observacoes` opcional (texto aparado de 1–5000 caracteres), `ativo` opcional (booleano, padrão true). Campos adicionais, datas, IDs no corpo e tipos incompatíveis são recusados. Nome ou área omitidos seguem para o Java como campos vazios para que ele devolva os erros de obrigatoriedade; null não é aceito pelo contrato HTTP. Nome vazio ou somente com espaços continua inválido e recebe apenas o erro de obrigatoriedade para o nome no Java. A contagem `[...valor].length` equivale ao `codePointCount` do Java e ao comprimento Unicode do validator MongoDB; caracteres fora do BMP contam 1 e acentos combinantes contam separadamente. Acentos, números e pontuação não são filtrados. Os campos nome/área não podem conter TAB, CR ou LF, conforme o protocolo TCP.

Fluxo: estrutura/tipos → perfil e propriedade autorizada/ativa → Java → transação com nova conferência do pai → soma de áreas ativas → Mongoose/MongoDB. A soma pode ser menor ou igual à área total; ausência de área total dispensa o teto. Talhões inativos não entram na soma. Não há unicidade de nome. As validações do modelo e os validators já configurados no MongoDB permanecem ativos.

Java inválido retorna 400 `ENTRADA_INVALIDA`, com `detalhes: [{"mensagem":"..."}]` para cada erro recebido. Falha de comunicação retorna 503 `JAVA_INDISPONIVEL`, sem detalhes internos. Ambas impedem qualquer escrita. Sucesso retorna 201 com o documento, incluindo vínculo, situação e datas. Falhas inesperadas continuam no error handler existente.

Inicie o Java separadamente e configure `JAVA_HOST`/`JAVA_PORT` (padrões localhost/7000). O backend não inicia o Java. `npm run test:talhoes` usa HTTP real local com autenticação, Java e repositórios simulados, sem Atlas. `npm test` cobre regressões de propriedades; `npm run test:java` cobre o cliente TCP. Esses testes não comprovam transações ou concorrência em um MongoDB real, nem integração Flutter.

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

### Cadastro de talhões: HTTP → Firebase → Node → Java → MongoDB

**PUT concorrente em ambiente isolado:** `--com-put` exige agora
`BD8_TEST_MONGODB_URI`, sem fallback para MONGODB_URI. Aceita exclusivamente
`mongodb://127.0.0.1:27017/?replicaSet=rs0` (ou localhost/IPv6 loopback e outra porta).
Não aceita credenciais, nome de banco, SRV, hosts remotos ou opções além de replicaSet.
O banco gerado é `sentinela_testes_put_<UUID>`; nunca `sentinela`. O harness confere
replica set e ausência de coleções antes de preparar fixtures, cria somente coleções
de teste e perfis sintéticos mínimos, usa repositórios e transações reais e remove
somente esse banco exclusivo no finally. O URI do processo é substituído pelo local;
o `.env` real não é alterado. Autenticação continua no Auth Emulator com os tokens A/B
e projeto já exigidos pelo harness; não há bypass. Readiness é injetada apenas nessa
instância HTTP para conferir a conexão do banco isolado, sem mudar a API de produção.
Não instala validators/índices compartilhados nem comprova seus efeitos nessa rodada.

```powershell
$env:BD8_TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
# Exige replica set local e tokens sintéticos A/B atuais do Auth Emulator em memória.
npm --prefix backend run test:talhoes:real -- --executar --com-put
```

`npm --prefix backend run test:propriedades:isolamento` verifica as recusas antes de
qualquer conexão. Sem os pré-requisitos, os cenários permanecem não executados e o
processo retorna código 1. Testes HTTP com repositórios simulados, mesmo com Java real,
não comprovam concorrência MongoDB. O modo histórico sem `--com-put` não deve ser
executado nesta tarefa, pois conserva o destino compartilhado anterior.

Na retomada, passaram 122 testes locais/HTTP/TCP: POST e PUT com Java real e banco
simulado, erros 400/503 sem escrita, omissões, autorização, BSON, guarda de imagem,
repetições transacionais simuladas e proteção do destino isolado. TypeScript e
compilação Java passaram. O comando `--executar --com-put` foi tentado, mas bloqueou
antes de qualquer conexão/escrita por `BD8_TEST_MONGODB_URI_AUSENTE`,
`BD8_TOKEN_A_AUSENTE` e `BD8_TOKEN_B_AUSENTE`. Os 11 cenários ficaram não executados.
Não foi encontrado mongod/Docker nem listener MongoDB local nas portas usuais.
Portanto, a prova real de redução/idempotência concorrente com cadastro de talhão
permanece pendente de replica set local e credenciais sintéticas atuais do Emulator;
nenhum resultado com mocks é usado como evidência dessa concorrência.

O novo harness é separado dos testes BD8 de propriedades:

```powershell
# Na raiz: apenas preparação, sem conexões ou escritas.
npm --prefix backend run test:talhoes:real
# Com Emulator acessível e tokens sintéticos válidos na sessão:
npm --prefix backend run test:talhoes:real -- --executar
```

São exigidos `MONGODB_URI`, `FIREBASE_PROJECT_ID`, Emulator local configurado e `BD8_TOKEN_A`/`BD8_TOKEN_B` das contas sintéticas A/B descritas abaixo. O script verifica os tokens com revogação e os perfis existentes da massa BD6. Não cria contas, perfis, coleções ou índices; não adapta permissões nem altera `.env`. Tokens podem ser carregados com `Read-Host -AsSecureString`, conforme o exemplo desta seção, sem imprimi-los ou enviá-los ao chat. São necessários Java/Javac disponíveis no PATH.

Depois dos pré-requisitos, compila recursivamente os fontes Java em um subdiretório temporário exclusivo de `servidor-java/out/` e executa `sentinela.servidor.Servidor` com esse classpath. Inicia uma instância própria em porta efêmera, além de HTTP local em outra porta efêmera. Desliga somente seu processo Java para o cenário 503. HTTP usa timeout de 15 segundos; a chamada TCP mantém o prazo total de 3 segundos. Nenhum servidor preexistente é interrompido. Para compilação e execução manual, consulte [as instruções do servidor Java](../servidor-java/README.md).

Reserva e registra três IDs de propriedades exclusivamente temporárias antes da inserção dos fixtures: própria (10 ha), do ator B (10 ha) e própria para concorrência (1 ha). Todo cadastro de talhão passa pela rota real, autenticação e service/repository reais. Leituras diretas confirmam persistência/ausência de gravação. Os sete cenários verificam 201, 400 com ambos os erros Java, 503, 401, 404, área insuficiente e duas criações de 0,6 ha concorrentes.

Na concorrência, a instrumentação do harness faz duas leituras reais com sessões/transações separadas sobre o pai exclusivo antes de liberar as reservas reais. Isso estabelece snapshots sobrepostos: exige um conflito real com repetição da transação, respostas 201/409, um único talhão ativo e soma de 0,6 ha. Não substitui o repositório por mocks nem altera o código de produção.

O `finally` aguarda as operações reais do service, recupera IDs de respostas incertas somente sob os pais novos desta rodada e registra os IDs antes de removê-los. Exclui cada talhão por ID e vínculo, depois cada propriedade por ID e marcador exclusivo, e confere ausência. Não usa exclusão por prefixo sobre registros anteriores. Falha de limpeza impede aprovação e informa IDs para conferência. Encerramento abrupto do processo ou perda de conexão pode impedir limpeza remota; o relatório não esconde essa incerteza.

O relatório não imprime URI, tokens, credenciais nem erros brutos. Pré-requisitos ausentes deixam todos os cenários como **não executados**, retornam código de saída 1 com `--executar` e impedem qualquer conexão ao banco ou escrita. A tentativa de 12/11/2026 ficou bloqueada por tokens A/B ausentes; o Emulator também não estava acessível nesta sessão. Ver [registro da tentativa](../database/evidencias-talhoes-java.md). Não há comprovação real de transação/concorrência dessa tentativa.

A execução posterior de 12/11/2026 superou esse bloqueio: **sete cenários reais aprovados**, incluindo concorrência com duas leituras sobrepostas e quatro tentativas de reserva. A limpeza das três propriedades e dos dois talhões exclusivos foi confirmada. Contas sintéticas A/B foram preparadas somente no Emulator, com tokens obtidos e repassados em memória. Os IDs, respostas e limites estão nas [evidências da execução real](../database/evidencias-talhoes-java.md#execução-real-aprovada--12112026). Não comprova integração Flutter.

### Resultado histórico BD8 de propriedades

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

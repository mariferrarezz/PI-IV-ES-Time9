# BD3 — Modelagem das coleções do MongoDB

## 1. Objetivo

Transformar o modelo conceitual do Sentinela em uma estrutura adequada ao MongoDB, definindo coleções, documentos, campos, tipos, obrigatoriedade, referências e dados incorporados.

## 2. Convenções

- Banco utilizado: sentinela.
- Todos os documentos das coleções possuem _id do tipo ObjectId.
- String: texto.
- Number: número, incluindo valores decimais.
- Boolean: verdadeiro ou falso.
- Date: data armazenada como data BSON.
- ObjectId: identificador ou referência a outro documento.
- Array: lista de elementos.
- Object: documento incorporado.
- S: obrigatório.
- N: opcional.
- C: obrigatório na condição indicada.
- Campos opcionais podem ser omitidos.
- A obrigatoriedade interna de um objeto vale quando esse objeto existir.
- Datas de criação e atualização são preenchidas pelo sistema.
- O backend identifica o autor pela autenticação e verifica a autorização de acesso.

Os limites específicos de município, informações de disseminação, orientação para buscar agrônomo, sintomas da ocorrência, motivo de encerramento, produto utilizado e nome do responsável pela aplicação estão definidos na BD4, seção 3.3.1. Opcionais e condicionais mantêm sua obrigatoriedade; limites se aplicam quando preenchidos. O formato de telefone está definido na seção 5.1; a regra de `publicId` está definida na seção 4.1 e na BD4, seção 3.3.2, sem limite máximo arbitrário.

### 2.1 Campos permitidos nos schemas

Os schemas usarão `additionalProperties: false` em cada objeto.

As tabelas da seção 5 descrevem os campos permitidos em cada coleção, incluindo `_id`, datas e campos opcionais ou condicionais. Todos deverão constar em `properties`; a presença em `properties` não torna um campo obrigatório. Manter `required` conforme a obrigatoriedade já definida.

Cada objeto incorporado terá suas próprias declarações de `properties` e `additionalProperties: false`. O fechamento do documento principal não fecha automaticamente os objetos internos. Nos arrays de objetos, aplicar a mesma definição ao schema de cada item em `items`. Arrays de Strings ou ObjectIds mantêm as regras dos valores escalares.

Não acrescentar identificadores ou datas automaticamente aos objetos incorporados. `$oid` e `$date` nos exemplos são representações Extended JSON de valores BSON, não propriedades extras dos documentos.

### 2.2 Áreas em hectares

Todas as áreas são informadas manualmente em hectares, sem necessidade de coordenadas, e devem ser números positivos e finitos quando preenchidas. A área total da propriedade não equivale à área cultivada. A área plantada não pode ultrapassar a área do talhão; a aplicação confere essa comparação entre documentos, enquanto o MongoDB valida o tipo numérico e a positividade. O porte do questionário permanece declaratório, sem cálculo automático com base na área.

| Campo | Tipo | Obrigatoriedade |
|---|---|---|
| propriedades.areaTotalHa | Number | Opcional |
| talhoes.areaHa | Number | Obrigatório |
| plantacoes.areaPlantadaHa | Number | Opcional |

A unidade em hectares também se aplica a `areaAfetadaHa` e `areaTratadaHa`, preservando a obrigatoriedade e as condições existentes. Campos opcionais sem informação são omitidos; zero não representa área desconhecida. Permanecem as demais regras de compatibilidade de áreas da BD4.

A soma de `areaHa` dos talhões com `ativo: true` de uma propriedade não pode ultrapassar `areaTotalHa`, quando informada, e pode ser menor. A aplicação confere a regra ao criar, alterar ou reativar talhões e ao reduzir a área da propriedade, inclusive em operações concorrentes. A aplicação rejeita valores não finitos; os tipos BSON numéricos e a positividade no banco não substituem essa verificação.

A análise da distribuição das áreas e os indicadores de área afetada são possibilidades futuras. Estão fora do escopo desta versão e exigem requisitos específicos para novos campos, cálculos, índices ou restrições. Eventuais indicadores deverão ter sua definição e interpretação discutidas antes da implementação; não somar registros de área afetada como se representassem necessariamente áreas distintas.

## 3. Coleções propostas

| Coleção | Finalidade |
|---|---|
| usuarios | Perfil, termos e questionário atual |
| propriedades | Propriedades administradas |
| talhoes | Áreas de cultivo das propriedades |
| culturas | Catálogo de culturas |
| plantacoes | Cultivos por talhão e período |
| problemas_agricolas | Base de conhecimento |
| fontes_conhecimento | Publicações utilizadas na base |
| ocorrencias | Problemas observados nas plantações |
| monitoramentos | Inspeções e acompanhamentos |
| tratamentos | Medidas de controle realizadas |
| avaliacoes_tratamento | Resultados observados após tratamentos |
| alertas | Avisos aos usuários |
| experiencias_comunidade | Cópias voluntárias de experiências, sujeitas à moderação |
| adocoes_tratamento | Planejamentos próprios baseados em métodos compartilhados |
| denuncias_comunidade | Denúncias e decisões restritas à moderação |

## 4. Objetos incorporados compartilhados

### 4.1 Imagem

| Campo | Tipo | Obrigatório |
|---|---|---|
| url | String | S |
| publicId | String não vazia nem composta apenas por espaços; valor original do Cloudinary | S, quando houver objeto de imagem |
| legenda | String | N |
| enviadaPor | ObjectId → usuarios | S |
| enviadaEm | Date | S |

Os arquivos ficam no Cloudinary. O MongoDB guarda somente os metadados. A imagem é um objeto incorporado sem identificador próprio na proposta atual; `publicId` identifica o recurso externo no Cloudinary. Não será criada uma coleção de imagens ou um campo adicional de identificação.

`publicId` é uma String obrigatória quando houver um objeto de imagem, inclusive em cada item de um array de imagens. A aplicação deve preenchê-la com o valor retornado pelo Cloudinary e preservá-lo integralmente, sem trim, alteração de maiúsculas/minúsculas ou outra transformação. Não aceitar String vazia ou composta apenas por espaços; verificar esse conteúdo sem modificar o identificador. Não aplicar regras de URL ao `publicId` nem definir `maxLength` arbitrário. Caso seja necessário um limite, conferir primeiro a documentação oficial do Cloudinary. Essa obrigatoriedade interna não torna a imagem obrigatória; a obrigatoriedade de cada campo de imagem permanece como já definida.

## 5. Estrutura das coleções

### 5.1 usuarios

**Objetivo:** armazenar o perfil vinculado à conta do Firebase.

**Identificador:** _id.

**Dados incorporados:** termos, questionário atual e foto de perfil.

**Referências:** culturas selecionadas no questionário e remetente da foto.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| firebaseUid | String | S |
| nomeCompleto | String | S |
| nomePublico | String (2 a 80 caracteres) | N no perfil; exigido pela aplicação ao enviar experiência |
| cpf | String (11 dígitos, sem pontuação) | S, conforme a tela existente |
| telefone | String (14 caracteres; +55, DDD e celular iniciado por 9) | S |
| canalCodigoPreferido | String (sms ou email) | C — obrigatório ao concluir a etapa de escolha do canal |
| fotoPerfil | Object de imagem | N |
| termos | Object | S |
| termos.versao | String | S |
| termos.aceitoEm | Date | S |
| questionario | Object | N — até conclusão |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

O cadastro aceita somente celulares brasileiros. `telefone` é String obrigatória no formato `+55`, DDD de dois dígitos e número de celular de nove dígitos iniciado por `9`: exatamente 14 caracteres contando o sinal `+`, sem espaços, parênteses ou hífens. O banco valida a estrutura com `bsonType: "string"`, `minLength: 14`, `maxLength: 14` e `pattern: "^\\+55[0-9]{2}9[0-9]{8}$"`. A aplicação normaliza a entrada e verifica se o DDD é válido; a expressão estrutural não valida a existência do DDD nem a posse do número. A confirmação de posse pertence ao fluxo de autenticação. Não criar índice único para telefone.

`cpf` é obrigatório e deve conter exatamente 11 dígitos, sem pontuação. A aplicação valida os dígitos verificadores; não definir índice único sem decisão específica.

`canalCodigoPreferido` registra somente a escolha entre `sms` e `email`. Pode estar ausente antes da conclusão da escolha, mas é obrigatório ao concluir essa etapa. Essa condição deve ser conferida pela aplicação no fluxo de cadastro, sem criar novos campos de controle nesta proposta. O envio e a verificação são responsabilidades da autenticação; códigos de verificação não são armazenados no perfil do MongoDB. A viabilidade do envio por ambos os canais ainda precisa ser conferida na implementação da autenticação.

#### Requisitos planejados para dados pessoais

CPF e telefone serão utilizados somente nas finalidades documentadas de cadastro e autenticação. O acesso aos dados pessoais será restrito ao próprio usuário e a pessoas autorizadas, conforme a função e a necessidade. CPF e telefone não deverão constar em alertas nem em logs da aplicação. Exemplos, testes e massa de dados deverão utilizar dados fictícios. A exclusão de conta ficará indisponível no aplicativo nesta versão. A política de retenção, anonimização e atendimento a solicitações de exclusão ainda deve ser definida; a ausência de exclusão automática não autoriza armazenamento permanente.

A aplicação deverá controlar autorizações e impedir a inclusão desses valores em titulo, mensagem ou outros campos de alertas e nos logs; Schema Validation não comprova finalidade, autorização ou anonimização.

#### Campos de termos

O objeto `termos` aceita somente `versao` (String, obrigatório) e `aceitoEm` (Date, obrigatório), sem `_id` próprio. As linhas `termos.versao` e `termos.aceitoEm` da tabela representam campos dentro do objeto, não nomes literais com ponto.

#### Campos de questionario

O porte informado no questionário é declaratório, com as opções pequena, média e grande (`pequena`, `media` e `grande` no MongoDB). Não será calculado automaticamente pela área nem apresentado como classificação oficial. A resposta não será usada para impor restrições de área ou de quantidade de propriedades. Essa regra está definida e não constitui pendência de modelagem.

O questionário é incorporado ao documento do usuário, sem identificador próprio na proposta atual. Ele é acessado pelo usuário ao qual pertence, sem coleção ou campo de identificação adicional.

| Campo | Tipo | Obrigatório no objeto |
|---|---|---|
| versao | String | S |
| portePropriedade | String (pequena, media ou grande; resposta declaratória) | S |
| quantidadeCulturas | String | S |
| culturasIds | Array<ObjectId> → culturas | S; pode estar vazio se outra cultura for informada |
| outraCultura | String | C — opção Outro |
| problemasFrequentes | Array<String> | S; de 1 a 2 respostas, sem repetição, no questionário concluído |
| frequenciaProblemas | String | S |
| identificaProblemasSozinho | String | S |
| concluidoEm | Date | S |

### 5.2 propriedades

**Objetivo:** armazenar propriedades e seus responsáveis.

**Identificador:** _id.

**Dados incorporados:** nenhum objeto complexo.

**Referência:** usuarioId → usuarios.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| usuarioId | ObjectId | S |
| nome | String | S |
| municipio | String (1 a 150 caracteres) | S |
| estado | String | S |
| areaTotalHa | Number | N |
| observacoes | String | N |
| ativa | Boolean | S |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

### 5.3 talhoes

**Objetivo:** armazenar as áreas de cultivo de cada propriedade.

**Identificador:** _id.

**Dados incorporados:** nenhum objeto complexo.

**Referência:** propriedadeId → propriedades.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| propriedadeId | ObjectId | S |
| nome | String | S |
| areaHa | Number | S |
| observacoes | String | N |
| ativo | Boolean | S |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

### 5.4 culturas

**Objetivo:** manter um catálogo compartilhado.

**Identificador:** _id.

**Dados incorporados:** imagem ilustrativa.

**Referência:** remetente da imagem → usuarios, quando houver imagem.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| nome | String | S |
| nomeCientifico | String | N |
| descricao | String | N |
| imagem | Object de imagem | N |
| ativa | Boolean | S |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Cada cultura possui zero ou uma imagem representativa em `culturas.imagem`, objeto opcional. Sem imagem, o aplicativo poderá usar uma imagem padrão, sem incluir novo campo ou documento.

### 5.5 plantacoes

**Objetivo:** representar uma cultura cultivada em um talhão e período.

**Identificador:** _id.

**Dados incorporados:** nenhum objeto complexo.

**Referências:**

- talhaoId → talhoes.
- culturaId → culturas.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| talhaoId | ObjectId | S |
| culturaId | ObjectId | S |
| variedade | String | N |
| safra | String | N |
| dataPlantio | Date | N |
| areaPlantadaHa | Number | N |
| status | String | S |
| dataEncerramento | Date | C — plantação encerrada |
| observacoes | String | N |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Cada talhão pode ter várias plantações ao longo do tempo, mas no máximo uma com status `ativa`. Para iniciar outra plantação no mesmo talhão, a atual deverá estar encerrada. Cultivos simultâneos, consorciados e áreas sobrepostas ficam fora do escopo desta versão. O histórico das plantações encerradas será preservado; a cardinalidade histórica talhão → plantações permanece 1:N, permitindo talhões ainda sem plantação.

A aplicação confere essa regra antes de cadastrar ou ativar uma plantação. A regra de no máximo uma plantação ativa por talhão permanece válida, inclusive em operações concorrentes. A garantia no banco será o índice único parcial definido na BD4, seção 8.1. Antes da futura implementação, conferir plantações ativas duplicadas por talhão, sem correção ou exclusão automática.

Ocorrências não serão incorporadas à plantação. Ao finalizar o cultivo, a plantação deverá ser encerrada, preservando os vínculos e o histórico, conforme a definição na BD4, seção 7.2.

Quando `status: "encerrada"`, a aplicação bloqueia novas ocorrências, monitoramentos, tratamentos e avaliações de tratamento ligados à plantação, inclusive lançamentos atrasados com data anterior ao encerramento. Também bloqueia edições e exclusões dos registros vinculados pela operação comum do aplicativo, preservando todo o histórico para consulta autorizada. O tratamento chega à plantação por sua ocorrência; a avaliação, por tratamento → ocorrência → plantação. A aplicação deve resolver esses vínculos e verificar as condições antes da operação; referências ObjectId, índices e validação estrutural não garantem o bloqueio entre documentos. Não apagar registros existentes. Esses bloqueios não se confundem com procedimentos específicos de privacidade e tratamento de dados pessoais, que dependem de política própria e não autorizam remoções automáticas.

A Comunidade permite criar uma cópia pública de experiência histórica de plantação encerrada e editar essa cópia mediante nova revisão (seção 10). Essa permissão não libera edição dos documentos privados de origem nem novos registros agronômicos. Adoções de destino continuam sujeitas aos bloqueios de encerramento.

### 5.6 problemas_agricolas

**Objetivo:** reunir conhecimento sobre pragas, doenças e deficiências.

**Identificador:** _id.

**Dados incorporados:** sintomas, prevenção, formas de controle e metadados das imagens.

**Referências:**

- culturasAfetadasIds → culturas.
- fontesIds → fontes_conhecimento.
- Remetentes das imagens → usuarios.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| nomeComum | String | S |
| nomeCientifico | String | N |
| tipo | String | S |
| descricao | String | S |
| culturasAfetadasIds | Array<ObjectId> | S |
| sintomas | Array<String> | S |
| partesAfetadas | Array<String> | N |
| condicoesFavoraveis | Array<String> | N |
| informacoesDisseminacao | String (1 a 5000 caracteres) | N |
| medidasPreventivas | Array<String> | S |
| formasControle | Array<Object> | S |
| orientacaoBuscaAgronomo | String (1 a 5000 caracteres) | N |
| imagens | Array<Object de imagem> | N |
| fontesIds | Array<ObjectId> | S |
| revisadoEm | Date | C — obrigatório no legado sem revisaoEditorial e na revisão aprovada; opcional na pendente |
| codigoEditorial | String | N; rastreabilidade, sem unicidade imposta |
| chips | Array<String> | N; até 4 rótulos editoriais |
| niveisAtencao | Object | N; baixo, medio e alto obrigatórios no objeto |
| ondeOlhar | String | N |
| dicaDeCampo | String | N |
| danos | Array<String> | N |
| perdaEstimada | String | N; explicação textual, não percentual calculado |
| epocaPropicia | String | N |
| abrangenciaCulturas | String | N; qualifica o alcance, sem substituir referências |
| tratamentoIntro | String | N |
| boasPraticas | Array<String> | N |
| revisaoEditorial | Object | N para compatibilidade; obrigatório no fluxo editorial das novas fichas |
| ativo | Boolean | S |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

#### Campos de cada forma de controle

| Campo | Tipo | Obrigatório |
|---|---|---|
| tipo | String | S |
| descricao | String | S |
| observacoes | String | N |

`tipo` é uma String com valores `praga`, `doenca` ou `deficiencia`, conforme a BD4. `culturasAfetadasIds` é um array de ObjectIds que referenciam `_id` de `culturas`, sem copiar nomes ou substituir o catálogo por textos. A busca por uma cultura compara seu ObjectId com os elementos do array.

Cada forma de controle também permite `classe` (String opcional) e `exemplosControle` (Array<String> opcional, inclusive vazio). `tipo` e `descricao` permanecem obrigatórios. Exemplos podem incluir agentes biológicos; não são todos princípios ativos químicos nem representam indicação automática de uso. Classes mistas exigem classificação técnica ou separação, sem preencher `tipo: outra` apenas por falta de informação.

#### Seções da ficha e origem editorial

| Seção | Campos de persistência e transformação |
|---|---|
| Cabeçalho | nomeComum ← nomePopular; nomeCientifico; tipo (`PRAGA` → `praga`, `DOENÇA` → `doenca`); descricao como resumo; chips; imagens |
| Níveis de atenção | niveisAtencao.baixo/medio/alto ← nivelBaixo/nivelMedio/nivelAlto; textos qualitativos sem equivalência automática com intensidade, alerta ou limiar de aplicação |
| Identificar | sintomas, partesAfetadas quando conhecidas, ondeOlhar e dicaDeCampo |
| Causa | Identificação do agente em nomeCientifico; danos e perdaEstimada em campos próprios. O catálogo não fornece explicação causal independente; não inventá-la nem criar campo sem conteúdo definido. |
| Onde ocorre | culturasAfetadasIds; abrangenciaCulturas preserva a redação de culturasAfetadas e suas ressalvas; condicoesFavoraveis ← climaFavoravel; epocaPropicia |
| Prevenir | medidasPreventivas ← prevencao |
| Tratar | tratamentoIntro; formasControle (classe ← classe, exemplosControle ← exemplosPrincipiosAtivos, observacoes ← observacao; tipo/descricao preparados após revisão); boasPraticas; orientacaoBuscaAgronomo ← avisoAgronomo |
| Fontes | fontesIds referencia documentos reais de fontes_conhecimento; não incorporar fontes do JSON diretamente |

As seções não devem ser concatenadas em `descricao`. Os novos campos são opcionais no banco para aceitar documentos antigos; a aplicação confere as seções aplicáveis à nova ficha antes de disponibilizá-la. Textos ausentes não são fabricados. `textoBotao` é derivado de `tipo` na interface. `codigoEditorial` não substitui `_id`. Preservar o JSON editorial de preparação sem importação direta; a conferência de compatibilidade com o validador pertence ao processo de importação, não a um campo da ficha.

`imagens` continua opcional e aceita até 5 objetos válidos; o primeiro item é a imagem principal. Array ausente ou vazio permite apresentação padrão no aplicativo. Não armazenar `fotoPrincipal: null` nem imagens fictícias; alteração da ordem altera a principal. Os metadados continuam os da seção 4.1.

`revisaoEditorial` aceita somente `status` (String obrigatória no objeto: `pendente` ou `aprovada`), `observacoes` (String opcional), `registroAgrofitConferido` e `fotoPendente` (Booleans opcionais). `niveisAtencao` aceita somente `baixo`, `medio` e `alto` (Strings obrigatórias no objeto). Todos os objetos são fechados, sem `_id` ou datas internas adicionais. Limites na BD4 §4.7.1.

Na adaptação futura, `rascunho_para_revisao_tecnica` do JSON corresponde a `revisaoEditorial.status: pendente`, preservando observacoes e os indicadores disponíveis, com ativo false e sem data fictícia de revisão. O campo editorial niveisAtencao (ressalva textual) não é o objeto homônimo de persistência: a interface deve apresentar a ressalva junto dos três textos, sem substituir baixo/medio/alto. A referência editorial à escala 1–5 precisa ser harmonizada com as intensidades documentadas, sem criar equivalência automática. Não importar o objeto editorial inteiro, pois contém campos de preparação não permitidos no schema.

O conteúdo deverá estar completo e revisado antes de ser disponibilizado.

Todo cadastro deve cumprir os demais campos obrigatórios e listas mínimas mesmo com `ativo: false`. Permitir ficha completa pendente de revisão com `revisaoEditorial.status: pendente`, `ativo: false` e `revisadoEm` ausente. Aprovação exige `revisadoEm` real e não ativa automaticamente o conteúdo. Em nova revisão pendente, a data anterior pode permanecer como última revisão, sem aprovar o conteúdo atual. Conteúdo incompleto permanece no material editorial externo; não flexibilizar referências ou os demais obrigatórios.

Documentos antigos sem `revisaoEditorial` continuam estruturalmente válidos com `revisadoEm` obrigatório, sem alteração de IDs ou referências. Ausência de status não significa aprovação automática pela API, mesmo com `ativo: true` e data existente. Para novas disponibilizações/seleções, a aplicação exige revisão explícita aprovada e `ativo: true`; consulta histórica autorizada preserva os vínculos. Qualquer edição de conteúdo revisado exige retorno a pendente e `ativo: false`, preservando o histórico; a aplicação deve fazê-lo na mesma operação. O schema valida o documento resultante, não detecta revisão humana nem comparação com a versão anterior.

### 5.7 fontes_conhecimento

**Objetivo:** permitir que uma publicação seja utilizada por diferentes problemas agrícolas.

**Identificador:** _id.

**Dados incorporados:** nenhum objeto complexo.

**Referências:** os problemas armazenam fontesIds; a fonte não mantém uma lista inversa dos problemas. Uma fonte pode ser cadastrada antes de ser vinculada e participar de zero ou vários problemas. A obrigatoriedade de fontes nos problemas agrícolas permanece inalterada.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| titulo | String | S |
| instituicaoOuAutor | String | S |
| url | String | N |
| publicadoEm | Date | N |
| acessadoEm | Date | C — fonte online |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

### 5.8 ocorrencias

**Objetivo:** registrar problemas observados nas plantações.

**Identificador:** _id.

**Dados incorporados:** imagens.

**Referências:**

- plantacaoId → plantacoes.
- registradoPor → usuarios.
- problemaAgricolaId → problemas_agricolas, quando identificado.
- Remetentes das imagens → usuarios.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| plantacaoId | ObjectId | S |
| registradoPor | ObjectId | S |
| tipo | String | S |
| problemaAgricolaId | ObjectId | N |
| dataObservacao | Date | S |
| sintomas | String (1 a 5000 caracteres) | S |
| intensidade | String | S |
| areaAfetadaHa | Number | N |
| imagens | Array<Object de imagem> | N |
| status | String | S |
| encerradoEm | Date | C — ocorrência encerrada |
| motivoEncerramento | String (1 a 5000 caracteres) | C — ocorrência encerrada |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

As transições permitidas são `aberta → em_acompanhamento`, `aberta → encerrada` e `em_acompanhamento → encerrada`. Não há reabertura nesta versão: uma nova observação após o encerramento deverá gerar outra ocorrência. `encerradoEm` e `motivoEncerramento` são obrigatórios quando encerrada e devem estar ausentes nos demais status. O motivo explica a finalização do acompanhamento; encerrar não comprova resolução do problema. A aplicação verifica as transições, autorização, referências e dependentes; o MongoDB valida a estrutura e os valores permitidos.

### 5.9 monitoramentos

**Objetivo:** registrar inspeções e acompanhamentos.

**Identificador:** _id.

**Dados incorporados:** imagens.

**Referências:**

- plantacaoId → plantacoes.
- ocorrenciaId → ocorrencias, quando houver.
- registradoPor e remetentes das imagens → usuarios.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| plantacaoId | ObjectId | S |
| ocorrenciaId | ObjectId | N |
| registradoPor | ObjectId | S |
| dataObservacao | Date | S |
| problemaObservado | Boolean | S |
| observacoes | String | S |
| intensidade | String | C — problema observado |
| evolucao | String | N |
| areaAfetadaHa | Number | N |
| imagens | Array<Object de imagem> | N |
| proximaInspecaoEm | Date | N |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Cada inspeção será um documento independente.

O monitoramento pode existir sem ocorrência. Quando houver ocorrência vinculada, ela deverá pertencer à mesma plantação.

### 5.10 tratamentos

**Objetivo:** registrar medidas de controle realizadas.

**Identificador:** _id.

**Dados incorporados:** imagens.

**Referências:**

- ocorrenciaId → ocorrencias.
- registradoPor e remetentes das imagens → usuarios.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| ocorrenciaId | ObjectId | S |
| registradoPor | ObjectId | S |
| tipoMedida | String | S |
| descricao | String | S |
| dataAplicacao | Date | S |
| areaTratadaHa | Number | N |
| produtoUtilizado | String (1 a 200 caracteres) | N |
| quantidadeUtilizada | Number | C — se informar unidade |
| unidadeQuantidade | String | C — se informar quantidade |
| responsavelAplicacao | String (2 a 150 caracteres; nome de uma pessoa) | N |
| observacoes | String | N |
| imagens | Array<Object de imagem> | N |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Novos tratamentos exigem que a ocorrência esteja `aberta` ou `em_acompanhamento` e sua plantação esteja `ativa`. A aplicação bloqueia novos tratamentos em ocorrência `encerrada`, inclusive lançamentos atrasados com data anterior ao encerramento. Essa verificação não altera o status automaticamente. Novas avaliações, edições e exclusões estão sujeitas ao bloqueio por encerramento da plantação definido na seção 5.5.

### 5.11 avaliacoes_tratamento

**Objetivo:** registrar resultados observados em diferentes momentos.

**Identificador:** _id.

**Dados incorporados:** nenhum objeto complexo.

**Referências:**

- tratamentoId → tratamentos.
- registradoPor → usuarios.
- monitoramentoId → monitoramentos, quando informado.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| tratamentoId | ObjectId | S |
| registradoPor | ObjectId | S |
| dataAvaliacao | Date | S |
| resultado | String | S |
| observacoes | String | S |
| monitoramentoId | ObjectId | N |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

### 5.12 alertas

**Objetivo:** armazenar avisos destinados aos usuários.

**Situação:** regra de alertas definida para o MVP; implementação ainda não realizada.

As intensidades permanecem `baixa`, `media` e `alta`. A aplicação gera um alerta somente no cadastro de uma ocorrência com intensidade `alta`, com tipo `ocorrencia_intensidade_alta`. O destinatário é o responsável pela propriedade, obtido pelo vínculo ocorrência → plantação → talhão → propriedade → usuário responsável. O contexto é a ocorrência cadastrada. A exibição ocorre somente dentro do aplicativo, sem envio por e-mail, SMS ou notificação push. Deve existir apenas um alerta desse tipo por ocorrência, inclusive em tentativas repetidas. Alterações posteriores de intensidade e registros de monitoramento não geram esse alerta. A aplicação gera o alerta; o MongoDB apenas o armazena e aplica as restrições configuradas.

**Identificador:** _id.

**Dados incorporados:** contexto principal.

**Referências:**

- usuarioId → usuarios: responsável pela propriedade vinculada à ocorrência.
- contexto.id → ocorrencias: ocorrência cadastrada que originou o alerta.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| usuarioId | ObjectId | S |
| tipo | String | S |
| titulo | String | S |
| mensagem | String | S |
| prioridade | String | S |
| contexto | Object | S |
| contexto.tipo | String | S |
| contexto.id | ObjectId | S |
| lidoEm | Date | N |
| expiraEm | Date | N |
| criadoEm | Date | S |

Para esse alerta, `tipo` é `ocorrencia_intensidade_alta` e `contexto.tipo` é `ocorrencia`. `contexto.id` recebe o `_id` da ocorrência. `lidoEm` é opcional e fica ausente até a leitura; não incluir `regraOrigem`. A BD4 define a prevenção de duplicidades por tipo e ocorrência. O alerta `ocorrencia_intensidade_alta` terá `prioridade: "alta"`. Essa prioridade reflete a intensidade informada pelo produtor; não representa diagnóstico ou classificação técnica de risco.

#### Campos de contexto

O objeto `alertas.contexto` aceita somente `tipo` (String, obrigatório; `ocorrencia` para o tipo inicial) e `id` (ObjectId da ocorrência, obrigatório), sem `_id` próprio. As linhas `contexto.tipo` e `contexto.id` representam campos internos do objeto.

### 5.13 Conferência dos objetos incorporados

Cada objeto abaixo deverá declarar seus campos em `properties` e usar `additionalProperties: false`. Nos arrays, essa definição pertence ao schema de cada item em `items`.

| Objeto ou item | Campos permitidos | Definição de tipos e obrigatoriedade |
|---|---|---|
| usuarios.termos | versao, aceitoEm | Seção 5.1 |
| usuarios.questionario | versao, portePropriedade, quantidadeCulturas, culturasIds, outraCultura, problemasFrequentes, frequenciaProblemas, identificaProblemasSozinho, concluidoEm | Seção 5.1 |
| usuarios.fotoPerfil e culturas.imagem | url, publicId, legenda, enviadaPor, enviadaEm | Seção 4.1 |
| Cada item de imagens em problemas_agricolas, ocorrencias, monitoramentos e tratamentos | url, publicId, legenda, enviadaPor, enviadaEm | Seção 4.1 |
| Cada item de problemas_agricolas.formasControle | tipo, descricao, observacoes, classe, exemplosControle | Seção 5.6 |
| problemas_agricolas.niveisAtencao | baixo, medio, alto | Seção 5.6 |
| problemas_agricolas.revisaoEditorial | status, observacoes, registroAgrofitConferido, fotoPendente | Seção 5.6 |
| alertas.contexto | tipo, id | Seção 5.12 |

Nenhum desses objetos recebe identificador interno adicional. Suas datas são somente as já previstas: `aceitoEm` em termos, `concluidoEm` em questionario e `enviadaEm` em imagens. Nos documentos principais, todas as coleções declaram `_id` e `criadoEm`; as demais coleções também declaram `atualizadoEm`, mas alertas não possui esse campo. Datas opcionais e condicionais de cada coleção permanecem nas respectivas tabelas.

Campos opcionais como `legenda`, `outraCultura`, `observacoes`, `lidoEm` e `expiraEm` devem continuar declarados, sem alterar sua obrigatoriedade ou as condições existentes. A geolocalização continua fora do escopo do MVP.

As coleções e os objetos adicionais da Comunidade estão na seção 10 e também devem constar nos futuros schemas fechados. `usuarios.nomePublico` passa a integrar os campos permitidos do perfil, sem tornar a participação na Comunidade obrigatória.

## 6. Exemplos de documentos

Os exemplos são fictícios e utilizam Extended JSON:

- $oid representa ObjectId.
- $date representa Date.

Eles não são comandos de inserção nem massa de dados definitiva. As datas foram simplificadas para demonstrar a estrutura.

### 6.1 usuarios

O exemplo seleciona `pragas` e `doencas` juntos. Também são válidas as seleções isoladas `["pragas"]`, `["doencas"]` e `["nao_identificado"]`. `nao_identificado` não pode ser combinado com outra resposta. A regra completa está na seção 4.2 da BD4.

Exemplo fictício de perfil após a escolha do canal. O CPF é ilustrativo, sem vínculo com pessoa real; não constitui massa de dados ou comprovação de identidade.

```json
{
  "_id": {"$oid": "000000000000000000000001"},
  "firebaseUid": "uid_produtor_teste",
  "nomeCompleto": "Produtor Teste",
  "cpf": "52998224725",
  "canalCodigoPreferido": "sms",
  "telefone": "+5519999999999",
  "termos": {
    "versao": "1.0",
    "aceitoEm": {"$date": "2026-10-20T12:00:00Z"}
  },
  "questionario": {
    "versao": "1.0",
    "portePropriedade": "pequena",
    "quantidadeCulturas": "1",
    "culturasIds": [
      {"$oid": "000000000000000000000004"}
    ],
    "problemasFrequentes": ["pragas", "doencas"],
    "frequenciaProblemas": "as_vezes",
    "identificaProblemasSozinho": "nao",
    "concluidoEm": {"$date": "2026-10-20T12:05:00Z"}
  },
  "criadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:05:00Z"}
}
```

### 6.2 propriedades

```json
{
  "_id": {"$oid": "000000000000000000000002"},
  "usuarioId": {"$oid": "000000000000000000000001"},
  "nome": "Fazenda Primavera",
  "municipio": "Campinas",
  "estado": "SP",
  "areaTotalHa": 20,
  "ativa": true,
  "criadoEm": {"$date": "2026-10-20T12:10:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:10:00Z"}
}
```

### 6.3 talhoes

```json
{
  "_id": {"$oid": "000000000000000000000003"},
  "propriedadeId": {"$oid": "000000000000000000000002"},
  "nome": "Talhão A",
  "areaHa": 5,
  "ativo": true,
  "criadoEm": {"$date": "2026-10-20T12:15:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:15:00Z"}
}
```

### 6.4 culturas

```json
{
  "_id": {"$oid": "000000000000000000000004"},
  "nome": "Milho",
  "nomeCientifico": "Zea mays",
  "ativa": true,
  "criadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:00:00Z"}
}
```

### 6.5 plantacoes

```json
{
  "_id": {"$oid": "000000000000000000000005"},
  "talhaoId": {"$oid": "000000000000000000000003"},
  "culturaId": {"$oid": "000000000000000000000004"},
  "safra": "2026/2027",
  "areaPlantadaHa": 5,
  "status": "ativa",
  "criadoEm": {"$date": "2026-10-20T12:20:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:20:00Z"}
}
```

### 6.6 problemas_agricolas

Conteúdo fictício, mantido inativo.

```json
{
  "_id": {"$oid": "000000000000000000000006"},
  "nomeComum": "Problema demonstrativo",
  "tipo": "praga",
  "descricao": "Conteúdo fictício para demonstrar a estrutura.",
  "culturasAfetadasIds": [
    {"$oid": "000000000000000000000004"}
  ],
  "sintomas": ["Sintoma demonstrativo"],
  "medidasPreventivas": ["Informação demonstrativa"],
  "formasControle": [
    {
      "tipo": "manual",
      "descricao": "Descrição demonstrativa."
    }
  ],
  "fontesIds": [
    {"$oid": "000000000000000000000007"}
  ],
  "revisadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "ativo": false,
  "criadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:00:00Z"}
}
```

### 6.7 fontes_conhecimento

```json
{
  "_id": {"$oid": "000000000000000000000007"},
  "titulo": "Publicação demonstrativa",
  "instituicaoOuAutor": "Autor fictício",
  "criadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:00:00Z"}
}
```

### 6.8 ocorrencias

```json
{
  "_id": {"$oid": "000000000000000000000008"},
  "plantacaoId": {"$oid": "000000000000000000000005"},
  "registradoPor": {"$oid": "000000000000000000000001"},
  "tipo": "nao_identificado",
  "dataObservacao": {"$date": "2026-10-20T13:00:00Z"},
  "sintomas": "Alterações observadas nas folhas.",
  "intensidade": "alta",
  "status": "aberta",
  "criadoEm": {"$date": "2026-10-20T13:10:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T13:10:00Z"}
}
```

### 6.9 monitoramentos

```json
{
  "_id": {"$oid": "000000000000000000000009"},
  "plantacaoId": {"$oid": "000000000000000000000005"},
  "ocorrenciaId": {"$oid": "000000000000000000000008"},
  "registradoPor": {"$oid": "000000000000000000000001"},
  "dataObservacao": {"$date": "2026-10-21T13:00:00Z"},
  "problemaObservado": true,
  "observacoes": "Alterações continuam presentes.",
  "intensidade": "baixa",
  "evolucao": "estavel",
  "criadoEm": {"$date": "2026-10-21T13:10:00Z"},
  "atualizadoEm": {"$date": "2026-10-21T13:10:00Z"}
}
```

### 6.10 tratamentos

```json
{
  "_id": {"$oid": "00000000000000000000000a"},
  "ocorrenciaId": {"$oid": "000000000000000000000008"},
  "registradoPor": {"$oid": "000000000000000000000001"},
  "tipoMedida": "outra",
  "descricao": "Ação fictícia para demonstrar a estrutura.",
  "dataAplicacao": {"$date": "2026-10-21T14:00:00Z"},
  "criadoEm": {"$date": "2026-10-21T14:10:00Z"},
  "atualizadoEm": {"$date": "2026-10-21T14:10:00Z"}
}
```

### 6.11 avaliacoes_tratamento

```json
{
  "_id": {"$oid": "00000000000000000000000b"},
  "tratamentoId": {"$oid": "00000000000000000000000a"},
  "registradoPor": {"$oid": "000000000000000000000001"},
  "dataAvaliacao": {"$date": "2026-10-22T13:00:00Z"},
  "resultado": "inconclusivo",
  "observacoes": "Ainda não foi possível avaliar o resultado.",
  "criadoEm": {"$date": "2026-10-22T13:10:00Z"},
  "atualizadoEm": {"$date": "2026-10-22T13:10:00Z"}
}
```

### 6.12 alertas

Exemplo vinculado à ocorrência da seção 6.8. `usuarioId` corresponde ao responsável pela propriedade da seção 6.2. A prioridade `alta` reflete a intensidade informada pelo produtor, sem representar diagnóstico ou classificação técnica de risco. A ausência de `lidoEm` representa um alerta ainda não lido.

```json
{
  "_id": {"$oid": "00000000000000000000000c"},
  "usuarioId": {"$oid": "000000000000000000000001"},
  "tipo": "ocorrencia_intensidade_alta",
  "titulo": "Ocorrência de intensidade alta cadastrada",
  "mensagem": "Uma ocorrência com intensidade alta foi cadastrada em uma plantação da sua propriedade.",
  "prioridade": "alta",
  "contexto": {
    "tipo": "ocorrencia",
    "id": {"$oid": "000000000000000000000008"}
  },
  "criadoEm": {"$date": "2026-10-20T13:10:00Z"}
}
```

## 7. Consultas consideradas

| Necessidade | Caminho de consulta |
|---|---|
| Abrir perfil após login | usuarios por firebaseUid |
| Listar propriedades do produtor | propriedades por usuarioId |
| Listar talhões da propriedade | talhoes por propriedadeId |
| Consultar cultivos por talhão e safra | plantacoes por talhaoId, safra e status |
| Consultar problemas de uma cultura | problemas_agricolas por culturasAfetadasIds |
| Consultar problemas de uma cultura e tipo | problemas_agricolas por culturasAfetadasIds e tipo; por exemplo, pragas que afetam a batata |
| Consultar fontes de um problema | fontes_conhecimento pelos fontesIds |
| Listar ocorrências | ocorrencias por plantacaoId, dataObservacao e status |
| Consultar histórico por talhão | Plantações do talhão e suas ocorrências |
| Consultar evolução | monitoramentos por ocorrenciaId e dataObservacao |
| Listar inspeções da plantação | monitoramentos por plantacaoId; todas, com ocorrência ou sem ocorrência; dataObservacao e _id decrescentes |
| Consultar medidas realizadas | tratamentos por ocorrenciaId |
| Consultar resultados | avaliacoes_tratamento por tratamentoId |
| Consultar alertas não lidos | alertas por usuarioId e ausência de lidoEm |
| Montar dashboard | Agregações sobre registros autorizados |
| Consultar Comunidade e moderação | Feed, detalhes públicos, experiências próprias, adoções próprias e denúncias conforme seção 10.6 |

Consultas por propriedade podem exigir múltiplas consultas ou agregações.

### 7.1 Filtros e ordenações previstos

As consultas da tabela representam funcionalidades previstas. O backend existente é uma estrutura inicial, sem implementação funcional que determine a modelagem. As coleções, os campos e as consultas deste documento são a referência para os índices da BD4 e para o futuro desenvolvimento.

Para a consulta prevista “pragas que afetam a batata”, a aplicação recebe o ObjectId da cultura selecionada no catálogo e consulta `problemas_agricolas` com `{ culturasAfetadasIds: culturaId, tipo: "praga" }`. Sem `tipo`, o filtro é `{ culturasAfetadasIds: culturaId }`. `culturaId` representa aqui um valor BSON ObjectId, não um novo campo. Não há ordenação definida para essas duas consultas; para novas seleções/exibição do catálogo disponível, acrescentar `ativo: true` e `"revisaoEditorial.status": "aprovada"`, conforme a BD4. Documentos legados sem status não recebem aprovação implícita; histórico autorizado permanece separado.

As ocorrências por plantação e os monitoramentos por ocorrência ou por plantação serão ordenados por `dataObservacao` decrescente e `_id` decrescente. Tratamentos por ocorrência usarão `dataAplicacao` decrescente e `_id` decrescente; avaliações por tratamento usarão `dataAvaliacao` decrescente e `_id` decrescente. Alertas não lidos serão filtrados por `usuarioId` e `{ lidoEm: { $exists: false } }`, ordenados por `criadoEm` decrescente e `_id` decrescente. O `_id` desempata datas iguais. Essas são definições para as consultas futuras, com paginação conforme a BD4, seção 10.2.

A referência `monitoramentos.plantacaoId` já é ObjectId obrigatório (seção 5.9); nenhuma referência nova é necessária. A consulta usa `{ plantacaoId }`. O filtro opcional de vínculo acrescenta `{ ocorrenciaId: { $exists: true } }` ou `{ ocorrenciaId: { $exists: false } }`; sem esse filtro, retorna todas as inspeções. `null` não representa ausência. Quando presente, a ocorrência deve pertencer à mesma plantação. A consulta por `{ ocorrenciaId }` continua disponível.

Plantações serão filtradas por `talhaoId`, com `safra` e `status` opcionais; ocorrências, por `plantacaoId`, com período em `dataObservacao` e `status` opcionais. A evolução por ocorrência poderá restringir um período em `dataObservacao`. Os limites de período serão valores BSON Date. Não há ordenação definida para perfil, propriedades, talhões, plantações e fontes; não presumir ordenação alfabética ou por criação nessas consultas.

Os índices correspondentes estão na [BD4, seção 8](regras-validacoes-indices.md#8-índices). O histórico por talhão reúne suas plantações e ocorrências; a ordenação global entre plantações ainda precisa ser especificada se exigida pela tela. As consultas e contagens do dashboard estão na seção 7.2; a implementação do pipeline é posterior.

### 7.2 Dashboard do MVP

O dashboard usa somente registros autorizados do usuário autenticado. Resolver sua identidade Firebase em `usuarios.firebaseUid` e obter `usuarios._id`; `propriedades.usuarioId` e `alertas.usuarioId` usam esse ObjectId. O filtro opcional de propriedade deve pertencer ao usuário; identificador válido sem autorização não permite acesso.

| Indicador | Vínculos, filtros e agrupamento |
|---|---|
| Total de propriedades ativas | Contar `propriedades` com `usuarioId` do usuário e `ativa: true`. Sempre geral, sem aplicar a seleção de propriedade. |
| Total de talhões ativos | Obter as propriedades do usuário (todas, sem impor `ativa: true` aos pais), ou somente a propriedade selecionada e autorizada. Contar `talhoes` com `propriedadeId` nesse conjunto e `ativo: true`. |
| Total de plantações ativas | Obter os talhões das propriedades autorizadas no escopo selecionado, sem impor `ativo: true` aos talhões. Contar `plantacoes` com `talhaoId` nesse conjunto e `status: "ativa"`. |
| Quantidade de ocorrências por status | Obter todas as plantações dos talhões do escopo autorizado e agrupar `ocorrencias` por `status`, contando documentos com `plantacaoId` nesse conjunto. Não filtrar propriedades/talhões ativos nem plantações ativas para excluir histórico. |
| Quantidade de alertas não lidos | Contar `alertas` com `usuarioId` do usuário e `lidoEm: { $exists: false }`. Sempre geral, independente do filtro de propriedade. |

Somente talhões, plantações e ocorrências recebem o filtro opcional por propriedade. A visão geral usa todas as propriedades autorizadas. Cada indicador de atividade filtra a situação do próprio documento contado; não há exclusão implícita pelo estado do pai. Não contar múltiplas vezes o mesmo registro ao reunir vínculos. Grupos sem ocorrências devem ser apresentados com zero. Não há filtro temporal ou ordenação de histórico nesses totais.

Agrupar os status persistidos `aberta`, `em_acompanhamento` e `encerrada` (seção 5.8), exibindo aberta, em acompanhamento e encerrada. Acompanhamento pode ocorrer sem tratamento e encerramento não comprova resolução. Não exibir “em tratamento” ou “resolvida” como equivalentes e não introduzir novos status.

## 8. Decisões de embedding e referencing

| Decisão | Justificativa |
|---|---|
| Incorporar termos e questionário ao usuário | Dados pequenos e consultados junto ao perfil |
| Adiar a geolocalização para uma versão futura | Reduzir o escopo do MVP e priorizar as funcionalidades principais |
| Incorporar metadados das imagens | Acesso junto ao contexto e quantidade limitada |
| Separar propriedades e talhões | Identidade e operações próprias |
| Separar culturas e plantações | Catálogo reutilizável e histórico de cultivos |
| Separar problemas agrícolas e ocorrências | Conhecimento geral e observação real possuem finalidades distintas |
| Separar fontes | Reutilização de publicações sem duplicação |
| Separar monitoramentos | Histórico crescente e consultas por período |
| Separar tratamentos | Cada medida possui identidade e ciclo próprios |
| Separar avaliações | Crescimento independente ao longo do tempo |
| Utilizar referências por ObjectId | Evitar cópia de cadastros completos |
| Não manter listas inversas nos pais | Evitar arrays crescentes e duplicação de vínculos |
| Utilizar contexto único no alerta | Evitar associações contraditórias |
| Manter lidoEm | Registrar leitura sem campo booleano redundante |
| Não utilizar regraOrigem | O alerta é descrito por titulo e mensagem, sem campo adicional de origem |

### 8.1 Exclusão e preservação

As regras abaixo estão detalhadas na BD4, seção 7.2:

- Desativar propriedades, talhões, culturas e problemas agrícolas já utilizados, preservando vínculos e histórico pelos campos existentes.
- Excluir cadastros feitos por engano somente sem dependentes e após conferir autorização e vínculos, respeitando as restrições específicas de preservação.
- Encerrar plantações ao finalizar o cultivo e ocorrências com data e motivo, conforme a seção 5.8.
- Preservar monitoramentos, tratamentos e avaliações, sem exclusão comum nesta versão. Correções autorizadas permanecem sujeitas ao bloqueio de edições após o encerramento da plantação; nessa situação, a operação comum permite consultar o histórico, sem novas avaliações, edições ou exclusões dos registros vinculados.
- Manter indisponível a exclusão de conta nesta versão; a política de tratamento de dados pessoais ainda deve ser definida.
- A aplicação verifica autorização, referências, dependentes e transições; o MongoDB valida estrutura e valores permitidos.

## 9. Crescimento e duplicação

- Usuários não armazenam arrays com todas as propriedades.
- Propriedades não armazenam arrays com todos os talhões.
- Talhões não armazenam todo o histórico de plantações.
- Plantações não armazenam todas as ocorrências.
- Ocorrências não incorporam todo o histórico de monitoramentos e tratamentos.
- Tratamentos não incorporam avaliações ilimitadas.
- As listagens de históricos terão paginação.
- Os documentos não armazenam os arquivos das imagens.
- Arrays incorporados e textos terão limites definidos na BD4.
- Nomes e cadastros completos não serão duplicados por padrão.

plantacaoId no monitoramento permite registrar inspeções sem ocorrência. Quando ocorrenciaId estiver presente, os vínculos deverão ser consistentes.

## 10. Modelagem da Comunidade

As funcionalidades e a separação público/privado seguem a BD1, seção 8. Os campos e enums abaixo especificam o mínimo para os fluxos confirmados, sem representar implementação ou validação pela equipe. As decisões de primeira aprovação, edição suspensa, liberação de ocultas pela moderação, adoção/denúncia e acesso somente autenticado estão harmonizadas com a BD4 §14. Nenhum desses fluxos modifica automaticamente os registros privados.

### 10.1 experiencias_comunidade

| Campo | Tipo | Obrigatoriedade e finalidade |
|---|---|---|
| _id | ObjectId | S |
| autorId | ObjectId → usuarios | S; interno |
| ocorrenciaOrigemId | ObjectId → ocorrencias | S; interno, ocorrência própria |
| tratamentoOrigemId | ObjectId → tratamentos | N; interno, da ocorrência de origem |
| avaliacaoOrigemId | ObjectId → avaliacoes_tratamento | C se compartilhar resultado; exige tratamentoOrigemId correspondente; interno |
| nomePublico | String | S; cópia do nome escolhido, não do nome completo |
| culturaId | ObjectId → culturas | S; da plantação de origem |
| culturaNome | String | S; rótulo copiado para publicação |
| problemaAgricolaId | ObjectId → problemas_agricolas | N; problema da ocorrência quando identificado |
| problemaNome | String | C quando houver problemaAgricolaId; rótulo copiado |
| tipoProblema | String | S; praga, doenca, deficiencia ou nao_identificado |
| statusOcorrencia | String | S; cópia de aberta, em_acompanhamento ou encerrada |
| titulo | String | S |
| relato | String | S |
| fotos | Array<Object> | N; até 5 fotos explicitamente selecionadas |
| metodo | Object | C quando houver tratamentoOrigemId; método compartilhado |
| resultadoRelatado | Object | C quando houver avaliacaoOrigemId; cópia da avaliação selecionada |
| regiao | Object | N; município/UF informados voluntariamente |
| versao | Number (BSON int ou long) | S; inteiro positivo, começa em 1 |
| moderacao | Object | S; estado e última decisão restritos ao sistema/à equipe |
| publicadoEm | Date | C a partir da primeira aprovação; mantido nas revisões posteriores |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Referências de origem existem para checagem interna, não para navegação pública. Não armazenar `propriedadeId`, `plantacaoId` ou `talhaoId` redundantes. Cultura/problema são referências de catálogo para os filtros; os nomes, tipo e status publicados são cópias explícitas, sem atualização silenciosa. `nomePublico` no perfil é opcional, mas deve ser escolhido antes do envio; cada experiência mantém sua cópia e mudanças do perfil não a reescrevem.

### 10.2 adocoes_tratamento

| Campo | Tipo | Obrigatoriedade e finalidade |
|---|---|---|
| _id | ObjectId | S |
| usuarioId | ObjectId → usuarios | S; obtido da autenticação |
| experienciaId | ObjectId → experiencias_comunidade | S; referência histórica |
| experienciaVersao | Number (BSON int ou long) | S; versão positiva adotada |
| ocorrenciaId | ObjectId → ocorrencias | S; destino próprio, sem propriedadeId redundante |
| metodoCopiado | Object | S; cópia imutável do método da versão adotada |
| planejamento | Object | S; revisado pelo produtor antes da confirmação |
| status | String | S; planejada, realizada ou cancelada |
| tratamentoId | ObjectId → tratamentos | C quando realizada; ausente nos demais estados |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Criar a adoção somente após revisão/confirmação do planejamento; a prévia não exige rascunho persistido. O ciclo confirmado é `planejada → realizada` ou `planejada → cancelada`, sem reabertura. A criação do tratamento efetivamente realizado deve preencher `adocoes_tratamento.tratamentoId` e marcar a adoção realizada como operação consistente da aplicação. Não adicionar referência inversa redundante a tratamentos. A regra de unicidade confirmada é uma adoção planejada por `{ experienciaId, ocorrenciaId }`, inclusive entre versões e sob concorrência, garantida pelo único parcial da BD4 §14.6.1. Realizadas/canceladas não ocupam essa restrição. Não foi exigida unicidade do tratamento vinculado. Avaliações continuam na coleção existente, sem resultado duplicado na adoção.

### 10.3 denuncias_comunidade

| Campo | Tipo | Obrigatoriedade e finalidade |
|---|---|---|
| _id | ObjectId | S |
| experienciaId | ObjectId → experiencias_comunidade | S |
| denuncianteId | ObjectId → usuarios | S; interno, não público |
| motivo | String | S; dados_pessoais, conteudo_inadequado, informacao_perigosa ou outro |
| descricao | String | N; texto restrito à moderação |
| status | String | S; pendente ou analisada |
| decisao | String | C em analisada; manter_publicacao ou ocultar_publicacao |
| justificativa | String | C em analisada; restrita à moderação |
| analisadoPor | ObjectId → usuarios | C em analisada; moderador autorizado |
| analisadoEm | Date | C em analisada |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

Denunciar não altera automaticamente a disponibilidade. A transição confirmada é `pendente → analisada`: decisão, justificativa, responsável e data são obrigatórios em analisada e ausentes em pendente. A decisão de ocultar atualiza a moderação da experiência, preservando documentos e adoções. Múltiplas denúncias podem existir; não criar unicidade por denunciante/publicação sem regra específica. Identidade do denunciante e textos da análise nunca integram o feed.

### 10.4 Objetos incorporados da Comunidade

| Objeto | Campos permitidos e tipos | Obrigatoriedade interna |
|---|---|---|
| Cada foto em experiencias_comunidade.fotos | url: String HTTPS; publicId: String Cloudinary; legenda: String | url/publicId S; legenda N; sem identificadores ou autoria extras |
| experiencias_comunidade.metodo e adocoes_tratamento.metodoCopiado | tipoMedida: String; descricao: String; observacoes: String | tipoMedida/descricao S; observacoes N |
| experiencias_comunidade.resultadoRelatado | resultado: String; dataAvaliacao: Date; observacoes: String | resultado/dataAvaliacao S; observacoes N, selecionadas pelo autor |
| experiencias_comunidade.regiao | municipio: String; estado: String | Ambos N; ao menos um presente se houver objeto |
| experiencias_comunidade.moderacao | status: String; revisadoPor: ObjectId → usuarios; revisadoEm: Date; motivo: String | status S; demais conforme a decisão na BD4 §14.3; internos |
| adocoes_tratamento.planejamento | descricao: String; dataPrevista: Date; observacoes: String | descricao S; demais N; não representa aplicação realizada |

Todos esses objetos usam `additionalProperties: false`, com `properties`, `required` e `items` próprios, sem `_id` ou timestamps extras. O tipo do método usa manual, cultural, biologica, quimica ou outra. O resultado usa melhora_observada, sem_mudanca, piora_observada ou inconclusivo. Não incluir produtos, quantidades, unidades ou dosagens estruturados no método copiado/planejamento; a descrição compartilhada continua relato, não prescrição. Dados reais da intervenção são informados pelo produtor em tratamentos, sem preenchimento automático.

### 10.5 Projeção pública, arquivos e versões

No MVP, todas as rotas da Comunidade e a entrega das fotos compartilhadas exigem usuário autenticado. “Público” significa compartilhado entre usuários autenticados, não acesso anônimo. A autenticação não libera dados privados de origem ou funções de moderação.

A resposta pública usa somente `_id` da experiência, `versao`, `nomePublico`, `culturaId`, `culturaNome`, `problemaAgricolaId`/`problemaNome` quando presentes, `tipoProblema`, `statusOcorrencia`, `titulo`, `relato`, `metodo`, `resultadoRelatado`, `regiao`, `publicadoEm` e fotos contendo apenas URL e legenda. Não retornar `autorId`, referências de origem, `publicId` dos arquivos, dados de moderação, adoções, denúncias ou o documento privado de usuário. Os ObjectIds públicos de cultura/problema são do catálogo, sem dar acesso aos registros privados. A API pública da Comunidade não é uma rota para o perfil nem autoriza acesso a propriedade, ocorrência ou tratamento de origem.

Não copiar automaticamente fotos: selecionar, conferir na prévia e preparar recursos de compartilhamento separados dos privados, com somente os metadados permitidos. Proposta técnica: cópias próprias para a Comunidade, sem reutilizar URLs de acesso privado; remover metadados de localização/identificação e controlar disponibilidade dos arquivos conforme retirada/ocultação. A proteção efetiva das URLs e da entrega dos arquivos deve ser definida antes de exposição pública real. `publicId` segue a preservação integral definida na BD4; não retornar esse identificador na projeção pública.

Proposta de versão simples: manter uma experiência por documento, incrementar `versao` a cada alteração de conteúdo público ou recópia explícita de dados de origem e exigir nova revisão. Alterar dados privados não muda versão pública automaticamente. A adoção conserva `experienciaVersao` e `metodoCopiado`, mesmo que o documento da experiência avance de versão. Não é proposto histórico ilimitado de versões incorporadas. Mudanças de estado de moderação sem mudança de conteúdo não incrementam a versão.

Regra confirmada do feed: `publicadoEm` da primeira aprovação, preenchido pelo sistema e preservado em novas revisões; ordenar por `{ publicadoEm: -1, _id: -1 }`. Antes da primeira aprovação, a data fica ausente. Edições suspendem a exibição até nova aprovação e retornam à posição da publicação original, sem promover o relato antigo.

Quando retirada, oculta, rejeitada ou pendente, a experiência não aparece no feed nem no detalhe público; retornar indisponibilidade sem divulgar motivo interno. Não excluir automaticamente documentos ou adoções. Autor e equipe mantêm acesso autorizado; quem já adotou consulta sua própria cópia do método e versão, sem acesso ao conteúdo retirado completo ou aos dados privados de origem. Novas adoções exigem a versão atualmente aprovada e disponível, verificada novamente na confirmação. O autor não pode converter publicação oculta em retirada ou pendente para contornar a moderação; somente moderador pode liberar após análise, retornando a pendente para nova aprovação, conforme BD4 §14.3.

### 10.6 Consultas previstas da Comunidade

| Necessidade | Filtro e ordenação |
|---|---|
| Feed | `moderacao.status: "aprovada"`; filtros opcionais de igualdade por culturaId, problemaAgricolaId e tipoProblema; `{ publicadoEm: -1, _id: -1 }` |
| Detalhe público | `_id` e `moderacao.status: "aprovada"`, com projeção pública; sem acesso por origem privada |
| Experiências próprias | autorId autenticado, estado de moderação opcional; `{ criadoEm: -1, _id: -1 }`; não aplicar projeção interna a outros usuários |
| Adoções próprias | usuarioId autenticado, status opcional; `{ criadoEm: -1, _id: -1 }`; detalhe por `_id` com autorização |
| Conferir adoção planejada do mesmo par | `{ experienciaId, ocorrenciaId, status: "planejada" }`, sem ordenação; consulta prévia não substitui o índice único parcial nem a autorização |
| Fila de publicações para moderação | moderacao.status, inicialmente pendente; `{ criadoEm: 1, _id: 1 }`, mais antigas primeiro |
| Fila de denúncias | status: pendente; consulta das analisadas por status: analisada; `{ criadoEm: 1, _id: 1 }`; somente moderação |
| Denúncias de uma experiência | experienciaId; `{ criadoEm: -1, _id: -1 }`; somente moderação |

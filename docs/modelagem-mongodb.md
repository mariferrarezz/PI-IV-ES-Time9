# BD3 — Modelagem das coleções do MongoDB

## 2. Objetivo

Transformar o modelo conceitual do Sentinela em uma estrutura adequada ao MongoDB, definindo coleções, documentos, campos, tipos, obrigatoriedade, referências e dados incorporados.

### 2.1 Escopo do MVP

A geolocalização foi adiada para uma versão futura para reduzir o escopo do MVP e priorizar as funcionalidades principais. Município e estado da propriedade permanecem no modelo. Detalhes descritivos podem utilizar os campos de observações já existentes, sem criar novos campos.

## 3. Convenções

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

Os limites específicos de município, informações de disseminação, orientação para buscar agrônomo, sintomas da ocorrência, motivo de encerramento, produto utilizado e nome do responsável pela aplicação estão definidos na BD4, seção 4.3.1. A revisão coletiva permanece pendente. Opcionais e condicionais mantêm sua obrigatoriedade; limites se aplicam quando preenchidos. O formato de telefone está definido na seção 6.1; a regra de `publicId` está definida na seção 5.1 e na BD4, seção 4.3.2, sem limite máximo arbitrário.

### 3.1 Campos permitidos nos schemas

Os schemas usarão `additionalProperties: false` em cada objeto. Este registro não representa aprovação coletiva da equipe nem aplicação no banco.

As tabelas da seção 6 descrevem os campos permitidos em cada coleção, incluindo `_id`, datas e campos opcionais ou condicionais. Todos deverão constar em `properties`; a presença em `properties` não torna um campo obrigatório. Manter `required` conforme a obrigatoriedade já definida.

Cada objeto incorporado terá suas próprias declarações de `properties` e `additionalProperties: false`. O fechamento do documento principal não fecha automaticamente os objetos internos. Nos arrays de objetos, aplicar a mesma definição ao schema de cada item em `items`. Arrays de Strings ou ObjectIds mantêm as regras dos valores escalares.

Não acrescentar identificadores ou datas automaticamente aos objetos incorporados. `$oid` e `$date` nos exemplos são representações Extended JSON de valores BSON, não propriedades extras dos documentos.

### 3.2 Áreas em hectares

Todas as áreas são informadas manualmente em hectares, sem necessidade de coordenadas, e devem ser números positivos e finitos quando preenchidas. A área total da propriedade não equivale à área cultivada. A área plantada não pode ultrapassar a área do talhão; a aplicação confere essa comparação entre documentos, enquanto o MongoDB valida o tipo numérico e a positividade. O porte do questionário permanece declaratório, sem cálculo automático com base na área.

| Campo | Tipo | Obrigatoriedade |
|---|---|---|
| propriedades.areaTotalHa | Number | Opcional |
| talhoes.areaHa | Number | Obrigatório |
| plantacoes.areaPlantadaHa | Number | Opcional |

A unidade em hectares também se aplica a `areaAfetadaHa` e `areaTratadaHa`, preservando a obrigatoriedade e as condições existentes. Campos opcionais sem informação são omitidos; zero não representa área desconhecida. Permanecem as demais regras de compatibilidade de áreas da BD4.

A análise da distribuição das áreas e os indicadores de área afetada são possibilidades futuras. Não representam funcionalidades implementadas ou requisitos desta versão e não autorizam novos campos, cálculos, índices ou restrições automaticamente. Eventuais indicadores deverão ter sua definição e interpretação discutidas antes da implementação; não somar registros de área afetada como se representassem necessariamente áreas distintas.

## 4. Coleções propostas

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

## 5. Objetos incorporados compartilhados

### 5.1 Imagem

| Campo | Tipo | Obrigatório |
|---|---|---|
| url | String | S |
| publicId | String não vazia nem composta apenas por espaços; valor original do Cloudinary | S, quando houver objeto de imagem |
| legenda | String | N |
| enviadaPor | ObjectId → usuarios | S |
| enviadaEm | Date | S |

Os arquivos ficam no Cloudinary. O MongoDB guarda somente os metadados. A imagem é um objeto incorporado sem identificador próprio na proposta atual; `publicId` identifica o recurso externo no Cloudinary. Não será criada uma coleção de imagens ou um campo adicional de identificação.

`publicId` é uma String obrigatória quando houver um objeto de imagem, inclusive em cada item de um array de imagens. A aplicação deve preenchê-la com o valor retornado pelo Cloudinary e preservá-lo integralmente, sem trim, alteração de maiúsculas/minúsculas ou outra transformação. Não aceitar String vazia ou composta apenas por espaços; verificar esse conteúdo sem modificar o identificador. Não aplicar regras de URL ao `publicId` nem definir `maxLength` arbitrário. Caso seja necessário um limite, conferir primeiro a documentação oficial do Cloudinary. Essa obrigatoriedade interna não torna a imagem obrigatória; a obrigatoriedade de cada campo de imagem permanece como já definida.

## 6. Estrutura das coleções

### 6.1 usuarios

**Objetivo:** armazenar o perfil vinculado à conta do Firebase.

**Identificador:** _id.

**Dados incorporados:** termos, questionário atual e foto de perfil.

**Referências:** culturas selecionadas no questionário e remetente da foto.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| firebaseUid | String | S |
| nomeCompleto | String | S |
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

Estes são requisitos planejados, sem comprovação de controles implementados ou de política de privacidade concluída. CPF e telefone serão utilizados somente nas finalidades documentadas de cadastro e autenticação. O acesso aos dados pessoais será restrito ao próprio usuário e a pessoas autorizadas, conforme a função e a necessidade. CPF e telefone não deverão constar em alertas nem em logs da aplicação. Exemplos, testes e massa de dados deverão utilizar dados fictícios. A exclusão de conta ficará indisponível no aplicativo nesta versão. A política de retenção, anonimização e atendimento a solicitações de exclusão permanece pendente; a ausência de exclusão automática não autoriza armazenamento permanente.

Essas definições não criam campos ou coleções adicionais nem alteram tipos e obrigatoriedade. A aplicação deverá controlar autorizações e impedir a inclusão desses valores em titulo, mensagem ou outros campos de alertas e nos logs; Schema Validation não comprova finalidade, autorização ou anonimização.

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

### 6.2 propriedades

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

### 6.3 talhoes

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

### 6.4 culturas

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


### 6.5 plantacoes

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

A aplicação confere essa regra antes de cadastrar ou ativar uma plantação. O índice único parcial em `plantacoes`, com chave `{ talhaoId: 1 }` e filtro `{ status: "ativa" }`, garante a restrição inclusive em operações concorrentes, conforme a BD4, seção 9. Ele não substitui automaticamente o índice composto de consultas. Antes de criá-lo na BD5, conferir plantações ativas duplicadas por talhão, sem correção ou exclusão automática.

Ocorrências não serão incorporadas à plantação. Ao finalizar o cultivo, a plantação deverá ser encerrada, preservando os vínculos e o histórico, conforme a definição na BD4, seção 8.2.

### 6.6 problemas_agricolas

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
| revisadoEm | Date | S |
| ativo | Boolean | S |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

#### Campos de cada forma de controle

| Campo | Tipo | Obrigatório |
|---|---|---|
| tipo | String | S |
| descricao | String | S |
| observacoes | String | N |

O conteúdo deverá estar completo e revisado antes de ser disponibilizado.

### 6.7 fontes_conhecimento

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

### 6.8 ocorrencias

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

As transições permitidas são `aberta → em_acompanhamento`, `aberta → encerrada` e `em_acompanhamento → encerrada`. Não há reabertura nesta versão: uma nova observação após o encerramento deverá gerar outra ocorrência. `encerradoEm` e `motivoEncerramento` são obrigatórios quando encerrada e devem estar ausentes nos demais status. O motivo explica a finalização do acompanhamento; encerrar não comprova resolução do problema. A aplicação verifica as transições, autorização, referências e dependentes; o MongoDB valida a estrutura e os valores permitidos. Este registro não representa aprovação coletiva nem implementação.

### 6.9 monitoramentos

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

### 6.10 tratamentos

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

### 6.11 avaliacoes_tratamento

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


### 6.12 alertas

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

Para esse alerta, `tipo` é `ocorrencia_intensidade_alta` e `contexto.tipo` é `ocorrencia`. `contexto.id` recebe o `_id` da ocorrência. `lidoEm` é opcional e fica ausente até a leitura; não incluir `regraOrigem`. A BD4 define a prevenção de duplicidades por tipo e ocorrência. O alerta `ocorrencia_intensidade_alta` terá `prioridade: "alta"`. Essa prioridade reflete a intensidade informada pelo produtor; não representa diagnóstico ou classificação técnica de risco. Este registro não representa aprovação coletiva da equipe.

#### Campos de contexto

O objeto `alertas.contexto` aceita somente `tipo` (String, obrigatório; `ocorrencia` para o tipo inicial) e `id` (ObjectId da ocorrência, obrigatório), sem `_id` próprio. As linhas `contexto.tipo` e `contexto.id` representam campos internos do objeto.

### 6.13 Conferência dos objetos incorporados

Cada objeto abaixo deverá declarar seus campos em `properties` e usar `additionalProperties: false`. Nos arrays, essa definição pertence ao schema de cada item em `items`.

| Objeto ou item | Campos permitidos | Definição de tipos e obrigatoriedade |
|---|---|---|
| usuarios.termos | versao, aceitoEm | Seção 6.1 |
| usuarios.questionario | versao, portePropriedade, quantidadeCulturas, culturasIds, outraCultura, problemasFrequentes, frequenciaProblemas, identificaProblemasSozinho, concluidoEm | Seção 6.1 |
| usuarios.fotoPerfil e culturas.imagem | url, publicId, legenda, enviadaPor, enviadaEm | Seção 5.1 |
| Cada item de imagens em problemas_agricolas, ocorrencias, monitoramentos e tratamentos | url, publicId, legenda, enviadaPor, enviadaEm | Seção 5.1 |
| Cada item de problemas_agricolas.formasControle | tipo, descricao, observacoes | Seção 6.6 |
| alertas.contexto | tipo, id | Seção 6.12 |

Nenhum desses objetos recebe identificador interno adicional. Suas datas são somente as já previstas: `aceitoEm` em termos, `concluidoEm` em questionario e `enviadaEm` em imagens. Nos documentos principais, todas as coleções declaram `_id` e `criadoEm`; as demais coleções também declaram `atualizadoEm`, mas alertas não possui esse campo. Datas opcionais e condicionais de cada coleção permanecem nas respectivas tabelas.

Campos opcionais como `legenda`, `outraCultura`, `observacoes`, `lidoEm` e `expiraEm` devem continuar declarados, sem alterar sua obrigatoriedade ou as condições existentes. A geolocalização continua fora do escopo do MVP.

## 7. Exemplos de documentos

Os exemplos são fictícios e utilizam Extended JSON:

- $oid representa ObjectId.
- $date representa Date.

Eles não são comandos de inserção nem massa de dados definitiva. As datas foram simplificadas para demonstrar a estrutura.

### 7.1 usuarios

O exemplo seleciona `pragas` e `doencas` juntos. Também são válidas as seleções isoladas `["pragas"]`, `["doencas"]` e `["nao_identificado"]`. `nao_identificado` não pode ser combinado com outra resposta. A regra completa está na seção 5.2 da BD4.

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

### 7.2 propriedades

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

### 7.3 talhoes

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

### 7.4 culturas

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

### 7.5 plantacoes

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

### 7.6 problemas_agricolas

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

### 7.7 fontes_conhecimento

```json
{
  "_id": {"$oid": "000000000000000000000007"},
  "titulo": "Publicação demonstrativa",
  "instituicaoOuAutor": "Autor fictício",
  "criadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:00:00Z"}
}
```

### 7.8 ocorrencias

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

### 7.9 monitoramentos

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

### 7.10 tratamentos

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

### 7.11 avaliacoes_tratamento

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

### 7.12 alertas

Exemplo vinculado à ocorrência da seção 7.8. `usuarioId` corresponde ao responsável pela propriedade da seção 7.2. A prioridade `alta` reflete a intensidade informada pelo produtor, sem representar diagnóstico ou classificação técnica de risco. A ausência de `lidoEm` representa um alerta ainda não lido.

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


## 8. Consultas consideradas

| Necessidade | Caminho de consulta |
|---|---|
| Abrir perfil após login | usuarios por firebaseUid |
| Listar propriedades do produtor | propriedades por usuarioId |
| Listar talhões da propriedade | talhoes por propriedadeId |
| Consultar cultivos por talhão e safra | plantacoes por talhaoId, safra e status |
| Consultar problemas de uma cultura | problemas_agricolas por culturasAfetadasIds |
| Consultar fontes de um problema | fontes_conhecimento pelos fontesIds |
| Listar ocorrências | ocorrencias por plantacaoId, dataObservacao e status |
| Consultar histórico por talhão | Plantações do talhão e suas ocorrências |
| Consultar evolução | monitoramentos por ocorrenciaId e data |
| Consultar medidas realizadas | tratamentos por ocorrenciaId |
| Consultar resultados | avaliacoes_tratamento por tratamentoId |
| Consultar alertas não lidos | alertas por usuarioId e ausência de lidoEm |
| Montar dashboard | Agregações sobre registros autorizados |

Consultas por propriedade podem exigir múltiplas consultas ou agregações.

## 9. Decisões de embedding e referencing

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

### 9.1 Exclusão e preservação

As regras abaixo estão detalhadas na BD4, seção 8.2. A revisão coletiva permanece pendente e não há comprovação de implementação:

- Desativar propriedades, talhões, culturas e problemas agrícolas já utilizados, preservando vínculos e histórico pelos campos existentes.
- Excluir cadastros feitos por engano somente sem dependentes e após conferir autorização e vínculos, respeitando as restrições específicas de preservação.
- Encerrar plantações ao finalizar o cultivo e ocorrências com data e motivo, conforme a seção 6.8.
- Preservar monitoramentos, tratamentos e avaliações, admitindo correções autorizadas e sem exclusão comum nesta versão.
- Manter indisponível a exclusão de conta nesta versão; a política de tratamento de dados pessoais permanece pendente.
- A aplicação verifica autorização, referências, dependentes e transições; o MongoDB valida estrutura e valores permitidos. Não foram acrescentados campos para essas decisões.

## 10. Crescimento e duplicação

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


# BD4 — Definição de regras, validações e índices

## 1. Objetivo

Definir regras de integridade, validações e índices para manter os dados consistentes e apoiar as principais consultas do Sentinela.

## 2. Responsabilidades

| Verificação | MongoDB | Backend |
|---|---|---|
| Presença de campos obrigatórios | Sim, com Schema Validation | Sim, antes de salvar |
| Tipos BSON dos campos | Sim | Sim, validar e converter |
| Finitude de áreas e quantidades | Tipo numérico e positividade não substituem a verificação de finitude | Rejeitar NaN e infinitos antes de salvar |
| Valores permitidos de status | Sim, com enum | Sim |
| Limites de texto, número e lista | Sim | Sim |
| Unicidade de firebaseUid | Índice único definido na seção 8.1, a implementar na BD5 | Tratar erro de duplicidade |
| Existência de documentos referenciados | Não automaticamente | Sim |
| Autorização do usuário | Não pelo Schema Validation | Sim |
| Compatibilidade entre referências | Não automaticamente | Sim |
| Bloqueios de registros vinculados a plantação encerrada | ObjectId, índices e validação estrutural não verificam o estado de outro documento | Resolver vínculos e verificar o estado antes de permitir a operação |
| Transições de status | Não apenas pelo schema | Sim |
| Comparações entre datas | Possível em validadores adicionais; não previsto no schema básico | Sim |
| Existência do arquivo no Cloudinary | Não | Sim |
| Autenticação e credenciais | Não | Firebase e backend |

## 3. Regras gerais

### 3.1 Campos obrigatórios e opcionais

- Manter os campos obrigatórios e opcionais definidos na BD3, conforme o resumo da seção 4.
- Campos opcionais devem ser omitidos quando não houver informação.
- Não utilizar null como substituto de ausência nesta proposta.
- Campos condicionais serão exigidos quando a condição ocorrer.
- Não aceitar texto vazio ou composto apenas por espaços em campos preenchidos.
- Não utilizar zero para representar uma quantidade ou área desconhecida.
- Arrays opcionais sem itens podem ser omitidos.
- Arrays obrigatórios devem respeitar as regras específicas.

### 3.2 Identificadores

- _id deve ser ObjectId.
- Referências internas devem ser ObjectId.
- firebaseUid deve ser String.
- O backend deve validar identificadores recebidos antes de convertê-los.
- Não aceitar objetos de consulta enviados no lugar de identificadores ou textos.

### 3.3 Textos

Os limites de textos são os definidos abaixo.

Campos opcionais continuam opcionais; os limites se aplicam quando forem preenchidos.

| Categoria | Limite |
|---|---|
| Nome completo | 2 a 150 caracteres |
| Nome de propriedade, talhão ou cultura | 1 a 150 caracteres |
| Nome comum, científico ou variedade | 1 a 200 caracteres |
| Título de fonte | 1 a 300 caracteres |
| Instituição ou autor | 1 a 200 caracteres |
| Descrição ou observações | 1 a 5000 caracteres |
| Título de alerta | 1 a 150 caracteres |
| Mensagem de alerta | 1 a 1000 caracteres |
| Legenda de imagem | 1 a 300 caracteres |
| URL | 1 a 2048 caracteres |
| Versão dos termos ou questionário | 1 a 30 caracteres |
| Safra | 1 a 30 caracteres |

O backend remove espaços nas extremidades dos textos de entrada e rejeita conteúdo vazio. Exceção: `publicId` deve preservar integralmente o valor retornado pelo Cloudinary, sem trim ou outra transformação, conforme a seção 3.6. Nomes de pessoas não devem ser limitados somente a letras sem acentos.

#### 3.3.1 Limites específicos dos campos

Os limites específicos são os definidos abaixo. Campos opcionais continuam opcionais; os limites se aplicam quando preenchidos. Campos condicionais mantêm suas condições existentes.

| Campo | Limite definido | Finalidade |
|---|---|---|
| propriedades.municipio | 1 a 150 caracteres | Nome do município. |
| problemas_agricolas.informacoesDisseminacao | 1 a 5000 caracteres | Descrição da disseminação. |
| problemas_agricolas.orientacaoBuscaAgronomo | 1 a 5000 caracteres | Orientação para buscar agrônomo. |
| ocorrencias.sintomas | 1 a 5000 caracteres | Descrição textual dos sintomas; não é a lista de sintomas do catálogo. |
| ocorrencias.motivoEncerramento | 1 a 5000 caracteres | Explicação do encerramento, exigida quando a ocorrência estiver encerrada. |
| tratamentos.produtoUtilizado | 1 a 200 caracteres | Nome do produto utilizado, quando informado. |
| tratamentos.responsavelAplicacao | 2 a 150 caracteres | Nome de uma pessoa responsável pela aplicação, quando informado. |

#### 3.3.2 Identificador externo de imagem: publicId

`publicId` é uma String obrigatória quando houver um objeto de imagem, inclusive em cada item de um array de imagens. A aplicação deve preenchê-la com o valor retornado pelo Cloudinary e preservá-lo integralmente, sem trim, alteração de maiúsculas/minúsculas ou outra transformação. Não aceitar String vazia ou composta apenas por espaços; verificar esse conteúdo sem modificar o identificador. Não aplicar regras de URL ao `publicId` nem definir `maxLength` arbitrário. Caso seja necessário um limite, conferir primeiro a documentação oficial do Cloudinary. Essa obrigatoriedade interna não torna a imagem obrigatória; a obrigatoriedade de cada campo de imagem permanece como já definida.

Campos com enum, como estado, status, tipo, intensidade, resultado, canalCodigoPreferido e respostas do questionário, já têm o conjunto permitido delimitado e não precisam de um limite adicional de comprimento. CPF possui comprimento fixo de 11 dígitos; firebaseUid possui máximo de 128; outraCultura possui máximo de 150; unidadeQuantidade possui máximo de 30. Os demais textos são atendidos pelas categorias da seção 3.3 ou pelos limites de itens da seção 5.

### 3.4 Números

Todas as áreas são informadas manualmente em hectares, sem necessidade de coordenadas, e devem ser números positivos e finitos quando preenchidas. A área total da propriedade não equivale à área cultivada. A área plantada não pode ultrapassar a área do talhão; a aplicação confere essa comparação entre documentos, enquanto o MongoDB valida o tipo numérico e a positividade. O porte do questionário permanece declaratório, sem cálculo automático com base na área.

| Campo | Tipo | Obrigatoriedade | Validação |
|---|---|---|---|
| propriedades.areaTotalHa | Number | Opcional | Positivo e finito quando preenchido. |
| talhoes.areaHa | Number | Obrigatório | Positivo e finito. |
| plantacoes.areaPlantadaHa | Number | Opcional | Positivo e finito quando preenchido; aplicação confere que não supera talhoes.areaHa. |

A entrada manual e a unidade em hectares também se aplicam às áreas afetadas e tratadas já previstas. A obrigatoriedade e as condições desses campos permanecem inalteradas. Não substituir área desconhecida por zero; omitir campos opcionais sem informação. A área da propriedade pode incluir partes não cultivadas; não exigir igualdade com a área plantada ou com a soma das áreas cultivadas.

- Áreas e quantidades informadas devem ser finitas e maiores que zero.
- Área de talhão não pode superar a área total da propriedade, quando conhecida.
- Área plantada não pode superar a área do talhão.
- Área afetada e área tratada não podem superar a área plantada, quando conhecida.
- Áreas sobrepostas ficam fora do escopo desta versão. A soma de `areaHa` dos talhões com `ativo: true` deve ser menor ou igual a `propriedades.areaTotalHa`, quando informada; pode ser menor. A aplicação verifica a soma ao criar, alterar ou reativar talhões e ao reduzir a área total da propriedade. Se a alteração mover um talhão entre propriedades, conferir as propriedades afetadas. Sem área total informada, não inventar um teto nem substituir ausência por zero.
- A regra da soma deve permanecer válida também em operações concorrentes. Verificações isoladas seguidas de gravação não bastam para preservar a soma diante de alterações simultâneas; o mecanismo de coordenação será definido na implementação, sem exigir uma solução específica nesta etapa.
- Não estabelecer limite máximo arbitrário de propriedade sem requisito do domínio.

Na aplicação, áreas e quantidades serão números. O schema aceitará os tipos BSON numéricos int, long, double e decimal, com as restrições correspondentes. O backend utilizará uma representação consistente.

A aplicação deve rejeitar valores não finitos (NaN e infinitos) antes da gravação, além de exigir valor maior que zero. O banco valida os tipos numéricos aceitos e a positividade; essas restrições isoladas não garantem finitude. O exemplo da seção 6.3 não deve ser interpretado como garantia completa dessa regra ou das comparações entre documentos.

A precisão de apresentação não deve alterar o valor armazenado sem uma regra explícita.

### 3.5 Datas

- Armazenar datas como Date BSON.
- Receber timestamps com fuso explícito na API e normalizar para UTC.
- Mostrar datas e horários no fuso adequado ao usuário.
- Se uma tela coletar apenas o dia, definir na implementação uma convenção de conversão que preserve esse dia.
- Datas de criação e atualização são geradas pelo backend.
- atualizadoEm não pode anteceder criadoEm.
- Datas de observação, aplicação e avaliação não podem estar no futuro no momento do registro.
- Datas de próxima inspeção podem estar no futuro.
- A data de plantio poderá ser futura, caso represente planejamento; essa situação não deve ser confundida com plantio já realizado.

As comparações temporais serão responsabilidade do backend.

### 3.6 Imagens

- url deve ser uma URL HTTPS válida.
- `publicId` é uma String obrigatória quando houver um objeto de imagem, inclusive em cada item de um array de imagens. A aplicação deve preenchê-la com o valor retornado pelo Cloudinary e preservá-lo integralmente, sem trim, alteração de maiúsculas/minúsculas ou outra transformação. Não aceitar String vazia ou composta apenas por espaços; verificar esse conteúdo sem modificar o identificador. Não aplicar regras de URL ao `publicId` nem definir `maxLength` arbitrário. Caso seja necessário um limite, conferir primeiro a documentação oficial do Cloudinary. Essa obrigatoriedade interna não torna a imagem obrigatória; a obrigatoriedade de cada campo de imagem permanece como já definida. O objeto de imagem não possui identificador interno próprio na proposta atual da BD3.
- enviadaPor deve referenciar um usuário existente.
- enviadaEm deve ser Date.
- Foto de perfil: no máximo uma.
- Demais registros com imagens: até cinco, conforme o limite definido na seção 5; a obrigatoriedade das imagens permanece inalterada.
- Não repetir publicId dentro do mesmo registro.
- O backend deve conferir o resultado do upload e utilizar a URL e o identificador devolvidos pelo serviço.
- Remoção do arquivo e remoção do vínculo devem ser coordenadas.
- Não excluir o documento inteiro por falha isolada de upload.

## 4. Obrigatoriedade e validações por coleção

### 4.1 usuarios

**Obrigatórios:**

- _id.
- firebaseUid.
- nomeCompleto.
- cpf, conforme a tela existente.
- telefone: String obrigatória, somente celular brasileiro.
- termos, com versao e aceitoEm.
- criadoEm.
- atualizadoEm.

**Opcionais ou condicionais:**

- fotoPerfil: opcional.
- canalCodigoPreferido: obrigatório ao concluir a etapa de escolha do canal; pode estar ausente antes dessa conclusão.
- questionario: ausente até sua conclusão.

**Regras:**

- firebaseUid: texto não vazio, com até 128 caracteres e único.
- O backend obtém firebaseUid do token validado.
- Não permitir alteração do vínculo de um perfil para outra conta.
- O cadastro aceita somente celulares brasileiros. `telefone` é String obrigatória no formato `+55`, DDD de dois dígitos e número de celular de nove dígitos iniciado por `9`: exatamente 14 caracteres contando o sinal `+`, sem espaços, parênteses ou hífens. O banco valida a estrutura com `bsonType: "string"`, `minLength: 14`, `maxLength: 14` e `pattern: "^\\+55[0-9]{2}9[0-9]{8}$"`. A aplicação normaliza a entrada e verifica se o DDD é válido; a expressão estrutural não valida a existência do DDD nem a posse do número. A confirmação de posse pertence ao fluxo de autenticação. Não criar índice único para telefone.
- CPF obrigatório: `cpf` como String com exatamente 11 dígitos, sem pontuação. O banco deverá validar o tipo e o formato (`^[0-9]{11}$`); a aplicação valida os dígitos verificadores e rejeita sequências inválidas.
- Validação de CPF não comprova identidade.
- Não definir índice único para CPF sem decisão específica; sua obrigatoriedade não implica unicidade.
- canalCodigoPreferido: String com valores permitidos `sms` e `email`; quando presente, o banco deverá validar tipo e enum. A aplicação exige o preenchimento ao concluir a etapa de escolha do canal, sem novos campos de controle nesta proposta.
- O campo registra somente a escolha. O envio e a verificação pertencem ao fluxo de autenticação; não armazenar códigos de verificação no perfil do MongoDB.
- A viabilidade do envio por ambos os canais ainda precisa ser conferida na implementação da autenticação; essa pendência não torna opcional a escolha ao concluir a etapa.
- Aceite dos termos deve resultar de uma ação explícita do usuário.
- O backend registra a versão vigente e o momento do aceite.
- Senhas, confirmações e códigos não são armazenados.

### 4.2 Questionário incorporado

O questionário não possui identificador próprio na proposta atual da BD3 e é acessado pelo usuário ao qual pertence.

Se questionario existir, exigir:

- versao.
- portePropriedade.
- quantidadeCulturas.
- culturasIds.
- problemasFrequentes.
- frequenciaProblemas.
- identificaProblemasSozinho.
- concluidoEm.

**Valores:**

| Campo | Valores permitidos |
|---|---|
| portePropriedade | pequena, media, grande |
| quantidadeCulturas | Strings: `"1"`, `"2"`, `"3"`, `"4_ou_mais"` |
| problemasFrequentes | pragas, doencas, nao_identificado |
| frequenciaProblemas | raramente, as_vezes, frequentemente, sempre |
| identificaProblemasSozinho | sim, nao, as_vezes |

**Regras:**

- culturasIds contém ObjectId sem repetições.
- Cada cultura deve existir e estar disponível no momento da seleção.
- Deve existir pelo menos uma cultura selecionada ou outraCultura preenchida.
- outraCultura: até 150 caracteres.
- questionario.problemasFrequentes: Array de Strings, sem valores repetidos, com mínimo de 1 e máximo de 2 respostas no questionário concluído, conforme a tela apresentada.
- Valores permitidos: `pragas`, `doencas` e `nao_identificado`.
- `nao_identificado` só pode ser selecionado sozinho.
- `pragas` e `doencas` podem ser selecionados juntos.
- Combinações válidas: `["pragas"]`, `["doencas"]`, `["nao_identificado"]` ou `["pragas", "doencas"]`; a ordem das respostas não altera a seleção.
- Guardar o questionário completo, sem persistência parcial nesta proposta.
- A quantidade declarada não será comparada rigidamente ao número de itens do catálogo: uma opção como “Hortaliças” pode representar um grupo.
- O porte informado no questionário é declaratório, com as opções pequena, média e grande (`pequena`, `media` e `grande` no MongoDB). Não será calculado automaticamente pela área nem apresentado como classificação oficial. A resposta não será usada para impor restrições de área ou de quantidade de propriedades. Essa regra está definida e não constitui pendência de modelagem.

### 4.3 propriedades

**Obrigatórios:** _id, usuarioId, nome, municipio, estado, ativa, criadoEm e atualizadoEm.

**Opcionais:** areaTotalHa e observacoes.

**Regras:**

- usuarioId deve existir.
- O backend define o responsável a partir do usuário autenticado.
- estado deve corresponder a uma das 27 siglas de UF brasileiras.
- municipio não pode ser vazio.
- Área informada deve ser positiva.
- Nome repetido não será proibido por índice único nesta proposta.
- Não permitir novas operações de cultivo em propriedade arquivada sem reativação.

### 4.4 talhoes

**Obrigatórios:** _id, propriedadeId, nome, areaHa, ativo, criadoEm e atualizadoEm.

**Opcionais:** observacoes.

**Regras:**

- A propriedade deve existir.
- O usuário deve possuir autorização sobre a propriedade.
- A propriedade deve estar ativa para novos cadastros.
- areaHa deve ser positiva e compatível com a área conhecida da propriedade.
- Não impor unicidade de nome nesta versão; se necessário, a regra deverá ser aprovada antes de criar índice único.
- Talhão inativo não recebe nova plantação sem reativação.

### 4.5 culturas

**Obrigatórios:** _id, nome, ativa, criadoEm e atualizadoEm.

**Opcionais:** nomeCientifico, descricao e imagem.

**Regras:**

- Manutenção somente por usuário autorizado da equipe.
- Antes de cadastrar, conferir possíveis duplicações de nome no catálogo.
- A conferência por nome não será uma garantia técnica de unicidade nesta versão.
- Cultura inativa permanece disponível no histórico, mas não em novas seleções.
- Desativar cultura não apaga suas plantações anteriores.
- Cada cultura possui zero ou uma imagem representativa, em objeto opcional conforme a BD3. Sem imagem, o aplicativo poderá exibir uma imagem padrão; não exigir seu armazenamento nem adicionar outro campo.

### 4.6 plantacoes

**Obrigatórios:** _id, talhaoId, culturaId, status, criadoEm e atualizadoEm.

**Opcionais:** variedade, safra, dataPlantio, areaPlantadaHa e observacoes.

**Condicional:** dataEncerramento quando status for encerrada.

**Valores de status:** ativa ou encerrada.

**Regras:**

- Talhão e cultura devem existir.
- Talhão, propriedade e cultura devem estar disponíveis para novo cadastro.
- Área plantada positiva e não superior à área do talhão.
- Encerramento não pode anteceder o plantio, quando informado.
- Encerramento não pode ser futuro.
- Quando ativa, dataEncerramento deve estar ausente.
- Cada talhão pode ter várias plantações ao longo do tempo, mas no máximo uma com status `ativa`. Para iniciar outra plantação no mesmo talhão, a atual deverá estar encerrada. Cultivos simultâneos, consorciados e áreas sobrepostas ficam fora do escopo desta versão. O histórico das plantações encerradas será preservado; a cardinalidade histórica talhão → plantações permanece 1:N, permitindo talhões ainda sem plantação.
- A aplicação confere a existência de plantação ativa antes de cadastrar ou ativar outra no mesmo talhão. Uma consulta prévia isolada não impede conflitos concorrentes: a garantia dessa restrição no banco será o índice único parcial da seção 8.1, a implementar na BD5. A aplicação deve tratar erro de duplicidade sem apagar ou encerrar automaticamente a plantação existente.
- Preservar o histórico quando a cultura do talhão mudar.
- Em plantação encerrada, a aplicação bloqueia novas ocorrências, monitoramentos, tratamentos e avaliações de tratamento, inclusive lançamentos atrasados com data anterior ao encerramento. Também bloqueia edições e exclusões dos registros vinculados pela operação comum do aplicativo, preservando todo o histórico para consulta autorizada, sem apagar os registros existentes.
- Antes dessas operações, a aplicação verifica o estado da plantação e os vínculos: ocorrência/monitoramento → plantação, tratamento → ocorrência → plantação e avaliação → tratamento → ocorrência → plantação. O bloqueio de edição abrange os campos e objetos incorporados dos registros vinculados. ObjectIds, índices e Schema Validation estrutural não garantem essas regras entre documentos; uma data anterior ao encerramento não permite contornar a verificação.
- Os bloqueios da operação comum não definem nem substituem procedimentos específicos de privacidade e tratamento de dados pessoais (seção 7.2.1). Esses procedimentos dependem de política própria; não há autorização para remoção ou anonimização automática.
- A publicação voluntária de uma cópia de experiência histórica e a edição dessa cópia pública mediante nova revisão são permitidas pela decisão específica da Comunidade (seção 14), inclusive com plantação de origem encerrada. Isso não libera alterações nos registros privados; adoções de destino continuam sujeitas aos bloqueios de plantação encerrada.

### 4.7 problemas_agricolas

**Obrigatórios:**

- _id, nomeComum, tipo e descricao.
- culturasAfetadasIds e sintomas.
- medidasPreventivas e formasControle.
- fontesIds, revisadoEm e ativo.
- criadoEm e atualizadoEm.

**Opcionais:**

- nomeCientifico.
- partesAfetadas.
- condicoesFavoraveis.
- informacoesDisseminacao.
- orientacaoBuscaAgronomo.
- imagens.

**Valores de tipo:** praga, doenca ou deficiencia.

**Regras:**

- Listas obrigatórias devem conter pelo menos um item.
- Referências de culturas e fontes devem existir e não se repetir.
- Cada forma de controle exige tipo e descricao.
- Tipo de controle: manual, cultural, biologica, quimica ou outra.
- Informações de controle devem possuir fundamentação nas fontes.
- Manutenção restrita à equipe autorizada.
- revisadoEm não pode ser futuro.
- Conteúdo somente fica ativo após revisão.
- Todo cadastro deve cumprir os campos obrigatórios e os mínimos das listas mesmo inativo. Não há rascunhos incompletos no MVP. A inativação impede novas seleções para registros, preservando vínculos e consultas históricas.
- Não gerar diagnóstico ou urgência automaticamente a partir do nome do problema.

### 4.8 fontes_conhecimento

**Obrigatórios:** _id, titulo, instituicaoOuAutor, criadoEm e atualizadoEm.

**Opcionais:** url e publicadoEm.

**Condicional:** acessadoEm quando houver url.

**Regras:**

- URL válida com protocolo HTTP ou HTTPS.
- Datas de acesso e publicação não podem ser futuras.
- Quando ambas forem conhecidas, acesso não deve anteceder publicação.
- Uma fonte pode ser cadastrada antes de ser vinculada a um problema, ficando relacionada a zero ou vários problemas. Os problemas agrícolas continuam exigindo fontes.
- Fonte referenciada não pode ser excluída fisicamente.
- Antes do cadastro, conferir se a publicação já existe.
- Não impor unicidade apenas pelo título: publicações diferentes podem ter títulos iguais.

### 4.9 ocorrencias

**Obrigatórios:**

- _id, plantacaoId e registradoPor.
- tipo, dataObservacao, sintomas e intensidade.
- status, criadoEm e atualizadoEm.

**Opcionais:** problemaAgricolaId, areaAfetadaHa e imagens.

**Condicionais:** encerradoEm e motivoEncerramento quando encerrada.

**Valores:**

| Campo | Valores permitidos |
|---|---|
| tipo | praga, doenca, deficiencia, nao_identificado |
| intensidade | baixa, media, alta |
| status | aberta, em_acompanhamento, encerrada |

**Regras:**

- Plantação e autor devem existir.
- Para novas ocorrências, a plantação deve estar ativa; plantação encerrada bloqueia inclusive lançamentos atrasados (seção 4.6). Conferir a autorização sobre a propriedade e as demais condições existentes dos cadastros relacionados.
- Se problemaAgricolaId existir, o problema deve ser compatível com o tipo e a cultura.
- Se tipo for nao_identificado, problemaAgricolaId deve estar ausente.
- Área afetada deve ser positiva e não superior à área plantada conhecida.
- Data de observação não pode ser futura.
- Encerramento não pode anteceder a observação.
- Quando não encerrada, campos de encerramento devem estar ausentes.
- Seleção de problema pelo produtor não representa confirmação de diagnóstico.

**Transições permitidas:**

- aberta → em_acompanhamento.
- aberta → encerrada.
- em_acompanhamento → encerrada.
- Sem reabertura nesta versão. Uma nova observação após o encerramento deverá gerar outra ocorrência.
- Encerramento não comprova resolução do problema; o motivo deve explicar a finalização do acompanhamento.
- `encerradoEm` e `motivoEncerramento` devem estar presentes quando o status for `encerrada` e ausentes em `aberta` e `em_acompanhamento`.
- A aplicação verifica autorização, referências, dependentes e transições de status. O MongoDB valida a estrutura, os valores permitidos e as condições estruturais dos campos; a comparação com o status anterior pertence à aplicação.

### 4.10 monitoramentos

**Obrigatórios:**

- _id, plantacaoId e registradoPor.
- dataObservacao, problemaObservado e observacoes.
- criadoEm e atualizadoEm.

**Opcionais:** ocorrenciaId, evolucao, areaAfetadaHa, imagens e proximaInspecaoEm.

**Condicional:** intensidade quando problemaObservado for true.

**Valores:**

- intensidade: baixa, media ou alta.
- evolucao: melhorou, estavel, piorou ou nao_avaliada.

**Regras:**

- Plantação e autor devem existir.
- Se houver ocorrência, ela deve pertencer à mesma plantação.
- A plantação deve estar ativa para novos monitoramentos, inclusive quando não houver ocorrência vinculada. Bloquear lançamentos atrasados em plantação encerrada, conforme a seção 4.6.
- Se problemaObservado for false, intensidade e areaAfetadaHa devem estar ausentes.
- Sem ocorrência vinculada, evolucao deve estar ausente ou ser nao_avaliada.
- Data de observação não pode ser futura.
- Em acompanhamento de ocorrência, observação não pode anteceder a observação inicial da ocorrência.
- Próxima inspeção deve ser posterior à observação.
- Área afetada deve ser compatível com a plantação.

### 4.11 tratamentos

**Obrigatórios:** _id, ocorrenciaId, registradoPor, tipoMedida, descricao, dataAplicacao, criadoEm e atualizadoEm.

**Opcionais:** areaTratadaHa, produtoUtilizado, responsavelAplicacao, observacoes e imagens.

**Condicionais:** quantidadeUtilizada e unidadeQuantidade devem ser informadas juntas.

**Tipos de medida:** manual, cultural, biologica, quimica ou outra.

**Regras:**

- Ocorrência e autor devem existir.
- Novos tratamentos exigem plantação `ativa` e ocorrência `aberta` ou `em_acompanhamento`. Bloquear novos tratamentos em ocorrência `encerrada`, inclusive lançamentos atrasados com data anterior ao encerramento, mesmo que a plantação permaneça ativa. Plantação encerrada também bloqueia o cadastro independentemente do status da ocorrência. A aplicação confere as duas condições antes de salvar, sem alterar status automaticamente.
- Aplicação não pode ser futura.
- Aplicação não deve anteceder a observação inicial da ocorrência.
- Quantidade e área informadas devem ser positivas.
- Área tratada não pode superar a área plantada conhecida.
- Unidade deve ser texto não vazio com até 30 caracteres.
- Não confundir quantidade total utilizada com dose por área.
- O sistema registra a ação; não calcula dose nem emite prescrição automaticamente.

### 4.12 avaliacoes_tratamento

**Obrigatórios:** _id, tratamentoId, registradoPor, dataAvaliacao, resultado, observacoes, criadoEm e atualizadoEm.

**Opcional:** monitoramentoId.

**Resultados permitidos:**

- melhora_observada.
- sem_mudanca.
- piora_observada.
- inconclusivo.

**Regras:**

- Tratamento e autor devem existir.
- A aplicação resolve tratamento → ocorrência → plantação e exige plantação ativa para nova avaliação. Plantação encerrada bloqueia inclusive avaliações lançadas com data anterior ao encerramento; edições e exclusões comuns de avaliações vinculadas também ficam bloqueadas, conforme a seção 4.6.
- Avaliação não pode anteceder a aplicação.
- Avaliação não pode ser futura.
- Se houver monitoramento, ele deve pertencer à mesma plantação do tratamento, obtida por sua ocorrência. Se o monitoramento possuir `ocorrenciaId`, esse identificador deve ser o mesmo `ocorrenciaId` do tratamento; a condição refere-se à ocorrência opcional do monitoramento, não à referência obrigatória do tratamento.
- O monitoramento utilizado deve ter data entre a aplicação e a avaliação.
- Resultado representa observação, sem comprovação automática de eficácia.

### 4.13 alertas

O alerta do MVP é gerado no cadastro de uma ocorrência de intensidade alta.

As intensidades permanecem `baixa`, `media` e `alta`. A aplicação gera um alerta somente no cadastro de uma ocorrência com intensidade `alta`, com tipo `ocorrencia_intensidade_alta`. O destinatário é o responsável pela propriedade, obtido pelo vínculo ocorrência → plantação → talhão → propriedade → usuário responsável. O contexto é a ocorrência cadastrada. A exibição ocorre somente dentro do aplicativo, sem envio por e-mail, SMS ou notificação push. Deve existir apenas um alerta desse tipo por ocorrência, inclusive em tentativas repetidas. Alterações posteriores de intensidade e registros de monitoramento não geram esse alerta. A aplicação gera o alerta; o MongoDB apenas o armazena e aplica as restrições configuradas.

**Obrigatórios:** _id, usuarioId, tipo, titulo, mensagem, prioridade, contexto e criadoEm.

**Opcionais:** lidoEm e expiraEm.

**Dentro de contexto:** tipo e id são obrigatórios.

**Valores:**

- contexto.tipo: ocorrencia para o tipo inicial definido.
- prioridade: baixa, media ou alta.
- tipo: ocorrencia_intensidade_alta. Novos tipos exigem definição de sua finalidade e regra.
- O alerta `ocorrencia_intensidade_alta` terá `prioridade: "alta"`. Essa prioridade reflete a intensidade informada pelo produtor; não representa diagnóstico ou classificação técnica de risco. Este tipo de alerta deve usar somente a prioridade `alta`.

**Regras:**

- Destinatário e contexto devem existir.
- O destinatário deve estar autorizado a acessar o contexto.
- Cada alerta possui exatamente a ocorrência cadastrada como contexto principal.
- Validar na aplicação o cadastro com intensidade alta e a cadeia de vínculos até o responsável; Schema Validation não consulta outras coleções e não gera alertas.
- lidoEm fica ausente até a leitura.
- lidoEm é preenchido pelo backend e não pode anteceder criadoEm.
- expiraEm, quando informado, deve ser posterior a criadoEm.
- Não utilizar regraOrigem.
- Não utilizar um booleano lido junto com lidoEm.
- Não apagar automaticamente alertas expirados enquanto não houver política de retenção.

### 4.13.1 Prevenção de alertas duplicados

- A identidade deste evento é a combinação de `tipo`, `contexto.tipo` e `contexto.id`, sem `usuarioId`: trocar o destinatário não deve permitir um segundo alerta para a mesma ocorrência.
- A aplicação deverá usar essa combinação como filtro de um upsert com `$setOnInsert`, preenchendo o alerta somente se ainda não existir. Repetições não deverão apagar `lidoEm` ou reescrever um alerta existente.
- Uma consulta de existência seguida de inserção não impede duplicidade em operações concorrentes. A garantia no banco será o índice único parcial da seção 8.1, a implementar na BD5; a aplicação deverá tratar o conflito de duplicidade como evento já registrado, sem esconder outros erros.
- A regra de não duplicidade se aplica ao evento com `tipo: "ocorrencia_intensidade_alta"` e `contexto.tipo: "ocorrencia"`. O índice da seção 8.1 fica restrito a esse evento; antes da implementação, auditar duplicidades existentes, sem apagar documentos automaticamente.
- A restrição garante no máximo um alerta, mas não garante sua geração. A aplicação deverá prever falhas entre salvar a ocorrência e salvar o alerta, com repetição segura do mesmo evento de cadastro; não deve varrer ocorrências antigas como novos eventos nem gerar alertas em simples edições. O mecanismo de recuperação ainda precisa ser definido na implementação.

## 5. Limites de listas

Os limites de listas são os definidos abaixo, mantendo a obrigatoriedade existente.

Listas opcionais continuam opcionais; seus limites se aplicam quando forem preenchidas. Para `questionario.problemasFrequentes`, permanecem de 1 a 2 respostas no questionário concluído, sem repetições, com `nao_identificado` selecionado somente sozinho, conforme a seção 4.2.

| Lista | Limite |
|---|---|
| imagens | Até 5 |
| questionario.culturasIds | Até 50 |
| questionario.problemasFrequentes | 1 a 2 no questionário concluído; regra definida conforme a tela, detalhada na seção 4.2 |
| culturasAfetadasIds | 1 a 100 |
| fontesIds | 1 a 100 |
| sintomas | 1 a 50 |
| medidasPreventivas | 1 a 50 |
| formasControle | 1 a 30 |
| partesAfetadas | Até 30 |
| condicoesFavoraveis | Até 50 |

- Itens de listas textuais: até 1000 caracteres.
- Descrição de forma de controle: até 5000 caracteres.
- Não permitir referências ou opções repetidas.
- Esses limites são operacionais; não representam limites biológicos ou agronômicos.

## 6. MongoDB Schema Validation

### 6.1 Configuração de validação

A estrutura mínima de cada coleção será validada com `$jsonSchema` e as configurações abaixo.

Configuração definida:

- `validationLevel: "strict"`.
- `validationAction: "error"`.

Isso faz com que inserções e atualizações inválidas sejam rejeitadas. Antes da aplicação dos validadores, os documentos existentes deverão ser conferidos. Não apagar nem corrigir dados automaticamente; inconsistências encontradas deverão ser registradas para análise. Aplicar um validator não corrige retroativamente os dados.

### 6.2 Recursos previstos

- required: campos obrigatórios.
- bsonType: tipos aceitos.
- enum: valores permitidos.
- minLength e maxLength: limites de texto.
- pattern: formatos textuais e presença de pelo menos um caractere que não seja espaço, conforme as regras já definidas.
- minimum, maximum e exclusiveMinimum: limites numéricos.
- minItems e maxItems: quantidade de itens.
- uniqueItems: impedir repetições exatas em listas.
- properties e items: estrutura de objetos e arrays.

A exclusividade de publicId entre objetos de imagem será conferida pelo backend, pois objetos diferentes podem compartilhar o mesmo publicId.

#### 6.2.1 Campos extras serão bloqueados

Os schemas usarão `additionalProperties: false`.

- Declarar em `properties` todos os campos legítimos descritos na BD3: `_id`, datas e campos opcionais ou condicionais. A obrigatoriedade existente permanece definida por `required` e pelas condições documentadas; declarar um campo não o torna obrigatório.
- Aplicar o fechamento separadamente ao documento principal e a cada objeto incorporado: termos, questionario, fotoPerfil, imagem e contexto. Cada objeto deve declarar seus respectivos campos conforme a BD3.
- Nos arrays `imagens` e `formasControle`, declarar em `items` o schema de cada objeto, com `bsonType: "object"`, `properties`, `required` conforme a definição existente e `additionalProperties: false`. O fechamento do documento principal não se propaga automaticamente.
- Objetos incorporados e itens de arrays não recebem `_id` ou datas adicionais automaticamente. A BD3, seção 5.13, lista seus campos permitidos. Os marcadores Extended JSON dos exemplos não são campos dos documentos.
- Arrays de Strings ou ObjectIds mantêm as validações de seus itens, sem `additionalProperties` em valores escalares. As demais regras, incluindo problemasFrequentes, permanecem inalteradas.
- Antes da aplicação dos validadores, conferir também campos extras nos documentos e objetos existentes. Registrar inconsistências para análise, sem apagar documentos, remover campos ou corrigir dados automaticamente. Campos legítimos ainda não documentados devem ser discutidos antes de alterar o schema.
- A aplicação continua responsável por controlar os campos recebidos; isso não substitui o bloqueio no banco.

### 6.3 Exemplo ilustrativo

Exemplo ilustrativo de validador para talhoes, incluindo todos os campos permitidos pela BD3. `observacoes` permanece opcional; `_id`, `criadoEm` e `atualizadoEm` estão declarados e continuam obrigatórios.

O padrão `"\\S"` exige pelo menos um caractere que não seja espaço, complementando os limites de tamanho. A aplicação continua responsável pela normalização dos textos conforme a seção 3.3.

```javascript
{
  $jsonSchema: {
    bsonType: "object",
    additionalProperties: false,
    required: [
      "_id",
      "propriedadeId",
      "nome",
      "areaHa",
      "ativo",
      "criadoEm",
      "atualizadoEm"
    ],
    properties: {
      _id: { bsonType: "objectId" },
      propriedadeId: { bsonType: "objectId" },
      nome: {
        bsonType: "string",
        minLength: 1,
        maxLength: 150,
        pattern: "\\S"
      },
      areaHa: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        exclusiveMinimum: true
      },
      observacoes: {
        bsonType: "string",
        minLength: 1,
        maxLength: 5000,
        pattern: "\\S"
      },
      ativo: { bsonType: "bool" },
      criadoEm: { bsonType: "date" },
      atualizadoEm: { bsonType: "date" }
    }
  }
}
```

## 7. Referências e integridade

| Coleção | Referências |
|---|---|
| usuarios | Culturas do questionário e autor da foto |
| propriedades | Usuário responsável |
| talhoes | Propriedade |
| plantacoes | Talhão e cultura |
| problemas_agricolas | Culturas e fontes |
| ocorrencias | Plantação, autor e problema opcional |
| monitoramentos | Plantação, autor e ocorrência opcional |
| tratamentos | Ocorrência e autor |
| avaliacoes_tratamento | Tratamento, autor e monitoramento opcional |
| alertas | Destinatário e contexto |
| Objetos de imagem | Remetente |

### 7.1 Criação

- O documento referenciado precisa existir antes da vinculação.
- Criar pai antes do filho.
- Para novos registros, conferir a situação dos cadastros relacionados.

### 7.2 Exclusão e desativação

As regras de exclusão e preservação são:

- Não realizar exclusão física de documentos que possuam dependentes.
- Desativar propriedades, talhões, culturas e problemas agrícolas já utilizados, usando os campos existentes e preservando vínculos e histórico.
- Permitir excluir cadastros feitos por engano somente quando não tiverem dependentes, após a aplicação conferir autorização e vínculos. Essa permissão não substitui as restrições específicas de preservação abaixo.
- Encerrar plantações ao finalizar o cultivo, preservando os registros relacionados.
- Plantação encerrada não recebe novas ocorrências, monitoramentos, tratamentos ou avaliações de tratamento, inclusive lançamentos atrasados; edições e exclusões dos registros vinculados ficam bloqueadas na operação comum do aplicativo, conforme a seção 4.6. Preservar todos os registros e permitir a consulta autorizada do histórico. A aplicação verifica essas condições; referências ObjectId e índices não as garantem.
- Encerrar ocorrências com data (`encerradoEm`) e motivo (`motivoEncerramento`) obrigatórios, conforme a seção 4.9. Encerramento significa finalização do acompanhamento, sem comprovar resolução do problema.
- Preservar monitoramentos, tratamentos e avaliações, sem exclusão comum nesta versão, mesmo que não tenham dependentes. Correções autorizadas somente quando não incidirem os bloqueios de edição por encerramento da plantação; a permissão geral de correção não prevalece sobre esse bloqueio.
- Exclusão de conta indisponível nesta versão. A política de tratamento de dados pessoais ainda deve ser definida. Não aplicar remoção ou anonimização automática sem essa definição.
- A aplicação verifica autorização, referências, dependentes e transições de status. O MongoDB valida estrutura e valores permitidos; o Schema Validation não confere a existência de dependentes em outras coleções.

### 7.2.1 Requisitos planejados para dados pessoais

CPF e telefone serão utilizados somente nas finalidades documentadas de cadastro e autenticação. O acesso aos dados pessoais será restrito ao próprio usuário e a pessoas autorizadas, conforme a função e a necessidade. CPF e telefone não deverão constar em alertas nem em logs da aplicação. Exemplos, testes e massa de dados deverão utilizar dados fictícios. A exclusão de conta ficará indisponível no aplicativo nesta versão. A política de retenção, anonimização e atendimento a solicitações de exclusão ainda deve ser definida; a ausência de exclusão automática não autoriza armazenamento permanente.

A aplicação deverá aplicar as verificações de acesso e impedir a inclusão de CPF e telefone em alertas e logs, inclusive mensagens de erro. A validação estrutural do MongoDB não controla o conteúdo pessoal incluído em textos livres. Esse controle pertence à aplicação. A remoção e a anonimização dependem da política de tratamento de dados pessoais.

### 7.3 Referências inválidas encontradas

- Não ignorar silenciosamente o erro.
- Registrar a inconsistência para correção.
- Retornar mensagem controlada à aplicação.
- Não apagar automaticamente registros filhos.
- Distinguir cadastro inativo de cadastro inexistente.

Se o sistema permitir exclusões concorrentes, as verificações deverão ser coordenadas para evitar referências órfãs. Uma consulta de existência isolada não garante integridade diante de alterações simultâneas.

## 8. Índices

### 8.1 Conjunto inicial para o modelo da BD3

As especificações abaixo definem o conjunto inicial de índices com base nas coleções, regras e consultas previstas na BD3, incluindo os filtros e as ordenações da seção 7.1. Serão implementadas na BD5; não são comandos executados nem confirmação do estado do Atlas. A estrutura inicial do backend não determina este conjunto.

Nos filtros e nas chaves, `_id`, `usuarioId`, `propriedadeId`, `talhaoId`, `plantacaoId`, `ocorrenciaId`, `tratamentoId` e `contexto.id` são ObjectIds. `culturasAfetadasIds` é Array<ObjectId>; `firebaseUid`, `safra`, `status`, `tipo` e `contexto.tipo` são Strings. `dataObservacao`, `dataAplicacao`, `dataAvaliacao`, `criadoEm` e `lidoEm` são datas BSON; `ativo` é Boolean. `lidoEm` ausente significa não lido, sem substituição por null. Os pontos em `contexto.tipo` e `contexto.id` indicam campos do objeto incorporado. `1` indica ordem crescente e `-1`, decrescente. Salvo indicação expressa, os índices não são únicos, parciais, sparse ou TTL.

| Coleção | Campos na ordem escolhida | Tipo | Consulta atendida e ordenação | Justificativa e opções |
|---|---|---|---|---|
| usuarios | `{ firebaseUid: 1 }` | Simples, único | Igualdade por `firebaseUid` ao abrir perfil; sem ordenação | `unique: true`, pois a seção 4.1 exige um perfil por identidade Firebase. Não adicionar outro índice simples não único. |
| propriedades | `{ usuarioId: 1 }` | Simples | Propriedades por `usuarioId`; sem ordenação; acesso às propriedades para o dashboard | Começa pelo responsável. No total de ativas, `ativa: true` é filtro residual; não impõe unicidade de nome. |
| talhoes | `{ propriedadeId: 1 }` | Simples | Talhões por `propriedadeId`; sem ordenação; vínculos e contagem do dashboard | Delimita propriedades autorizadas, isoladas ou em conjunto; `ativo: true` é residual quando exigido pelo indicador. |
| plantacoes | `{ talhaoId: 1, safra: 1, status: 1 }` | Composto | Igualdade por talhão, opcionalmente safra e status; sem ordenação | O prefixo atende ao histórico por talhão e a talhão + safra. Sem safra, status não forma prefixo contíguo; não presumir a mesma eficiência. |
| plantacoes | `{ talhaoId: 1 }` | Simples, único e parcial | Plantação ativa por `{ talhaoId, status: "ativa" }`; contagem de ativas por talhões autorizados no dashboard | `unique: true`, `partialFilterExpression: { status: "ativa" }`. Garante no máximo uma ativa por talhão e permite várias encerradas. Não é redundante com o composto e não atende ao histórico completo. |
| problemas_agricolas | `{ culturasAfetadasIds: 1, tipo: 1 }` | Composto multikey | Igualdade por cultura, com ou sem `tipo`; sem ordenação; na exibição, também `ativo: true` | Não único. Cultura primeiro reutiliza o prefixo nas duas consultas. `ativo` é residual. Detalhes na seção 8.2. |
| ocorrencias | `{ plantacaoId: 1, dataObservacao: -1, _id: -1 }` | Composto | Por `plantacaoId`, período e status opcionais; ordem `{ dataObservacao: -1, _id: -1 }`; delimitação de ocorrências no dashboard | Prioriza o histórico por plantação com desempate estável. Status é residual; no dashboard, agrupar e contar exige ler os status, sem prometer consulta coberta. |
| monitoramentos | `{ ocorrenciaId: 1, dataObservacao: -1, _id: -1 }` | Composto | Evolução por `ocorrenciaId`, período opcional; ordem `{ dataObservacao: -1, _id: -1 }` | Igualdade antes da data; preserva a consulta por ocorrência, diferente da consulta por plantação. |
| tratamentos | `{ ocorrenciaId: 1, dataAplicacao: -1, _id: -1 }` | Composto | Medidas por `ocorrenciaId`; ordem `{ dataAplicacao: -1, _id: -1 }` | Reúne as medidas da ocorrência e sua sequência temporal, sem índice simples adicional por ocorrência. |
| avaliacoes_tratamento | `{ tratamentoId: 1, dataAvaliacao: -1, _id: -1 }` | Composto | Resultados por `tratamentoId`; ordem `{ dataAvaliacao: -1, _id: -1 }` | Apoia o histórico de avaliações, sem impor avaliação única. |
| alertas | `{ usuarioId: 1, criadoEm: -1, _id: -1 }` | Composto | `{ usuarioId, lidoEm: { $exists: false } }`; ordem `{ criadoEm: -1, _id: -1 }`; total geral de não lidos no dashboard | Restringe ao destinatário. Ausência de `lidoEm` é residual, sem consulta coberta. Não usar sparse em `lidoEm` nem filtro parcial com `$exists: false`. |
| alertas | `{ tipo: 1, "contexto.tipo": 1, "contexto.id": 1 }` | Composto, único e parcial | Busca/upsert por tipo e ocorrência, sem ordenação, conforme seção 4.13.1 | `unique: true`, `partialFilterExpression: { tipo: "ocorrencia_intensidade_alta", "contexto.tipo": "ocorrencia" }`. Não incluir destinatário, pois permitiria duplicar o evento. Não estende a regra a futuros tipos. |
| monitoramentos | `{ plantacaoId: 1, dataObservacao: -1, _id: -1 }` | Composto | Inspeções por plantação; todas, com ocorrência ou sem ocorrência; ordem `{ dataObservacao: -1, _id: -1 }` | Índice adicional não único e não parcial. `plantacaoId` já é ObjectId obrigatório na BD3. Atende à nova listagem com e sem vínculo, usando a ordenação e o desempate. Presença/ausência de `ocorrenciaId` é filtro residual. |

Conferir dados incompatíveis e duplicidades antes de criar índices únicos; interromper para análise sem corrigir ou excluir dados automaticamente. O backend deve tratar conflitos de duplicidade. Os índices não verificam existência das referências nem garantem que o alerta será gerado; a recuperação de falhas continua necessária.

### 8.2 Cultura e tipo: índice composto multikey

O filtro `{ culturasAfetadasIds: culturaId, tipo: "praga" }` procura um elemento do array e o tipo escalar no mesmo documento. O catálogo `culturas` permanece referenciado por ObjectId. A ordem `{ culturasAfetadasIds: 1, tipo: 1 }` atende tanto cultura isolada quanto cultura + tipo pelo prefixo; inverter os campos priorizaria buscas por tipo e perderia o prefixo da busca somente por cultura. Como ambos são igualdades na consulta combinada, a escolha decorre da reutilização entre consultas, não de uma seletividade presumida.

O MongoDB torna o índice multikey automaticamente porque `culturasAfetadasIds` é array. Um documento pode gerar várias chaves. `tipo` permanece escalar; não acrescentar outro campo de array ao mesmo índice composto. Não usar `unique`: vários problemas do mesmo tipo podem afetar a mesma cultura. O índice não substitui a validação de referências ou de itens repetidos no array. Não prometer consulta coberta ao retornar o array nem ordenação por nome; nenhuma dessas capacidades é requisito destas duas buscas.

### 8.3 Integridade, cobertura e redundâncias evitadas

O índice único parcial de plantações aplica a regra explícita da BD3, seção 5.5, e da seção 4.6 deste documento: no máximo uma plantação com status `ativa` por talhão. O índice único parcial de alertas aplica a regra da BD3, seção 5.12, e das seções 4.13 e 4.13.1: um alerta do tipo `ocorrencia_intensidade_alta` por ocorrência. São restrições de integridade já documentadas, não novas regras introduzidas pela indexação. Os filtros das consultas que usarem esses índices parciais devem incluir suas condições para não omitir resultados fora do subconjunto indexado.

Consultas por `_id` podem localizar o documento pelo índice automático e conferir a autorização na aplicação; dispensam outro índice composto apenas para essa busca. O mesmo vale para as referências consultadas por `_id` no modelo: culturas selecionadas, problema identificado, cadeia de autorização e `fontes_conhecimento` com `{ _id: { $in: fontesIds } }`. Não duplicar o índice automático. Objetos incorporados, como o questionário, são recuperados junto ao perfil e não exigem índice próprio para esse acesso.

O histórico por talhão utiliza o prefixo `talhaoId` em plantações e, depois, `plantacaoId` em ocorrências (ou `$in` com as plantações encontradas). A ordenação global entre várias plantações pode exigir SORT/mesclagem; o índice por plantação não garante ordem global por data. Não criar índice próprio para essa navegação sem consulta adicional definida.

Não adicionar índices simples que já sejam prefixos não únicos dos compostos acima. `_id` nos históricos faz parte da ordenação conjunta e do desempate, sem duplicar a finalidade do índice automático. Os dois índices de monitoramentos começam por vínculos diferentes: um atende à plantação, outro à ocorrência; não são redundantes. Não incluir `ocorrenciaId` antes da data no índice por plantação, pois a listagem de todas as inspeções também deve manter ordem temporal. Buscas somente por tipo, conferências de dependentes e catálogos por nome exigirão consultas concretas e avaliação própria antes de novos índices. Não criar TTL sem política de retenção, nem unicidade para CPF, telefone ou nomes.

O conjunto da seção 8.1 preserva os 12 índices anteriores e acrescenta o índice de inspeções por plantação, totalizando 13 além dos automáticos de `_id`. A avaliação do dashboard está na seção 8.5. A ordenação global do histórico entre plantações e a retenção de alertas não justificam novos índices ou TTL sem requisitos adicionais. Ajustes motivados por seletividade, filtros residuais e custo de escrita dependerão de `explain("executionStats")` e das medições da seção 10.

### 8.4 Referências técnicas

- [MongoDB — índices compostos e prefixos](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/).
- [MongoDB — índices multikey e restrições em compostos](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/).
- [MongoDB — índices parciais, operadores aceitos e unicidade](https://www.mongodb.com/docs/manual/core/index-partial/).
- [MongoDB — explain e estatísticas de execução](https://www.mongodb.com/docs/manual/reference/explain-results/).

### 8.5 Consultas do dashboard e avaliação dos índices

As regras de autorização, vínculos, filtros opcionais e agrupamentos estão na BD3, seção 7.2. Propriedades ativas e alertas não lidos são totais gerais do usuário; talhões, plantações e ocorrências aceitam filtro opcional por propriedade autorizada. O dashboard não recebe dados pessoais nem registros fora desses vínculos.

O acesso parte de `propriedades.usuarioId`, segue para `talhoes.propriedadeId` e `plantacoes.talhaoId`, chegando a `ocorrencias.plantacaoId`. Os índices existentes delimitam cada conjunto autorizado, por igualdade ou `$in` com os identificadores obtidos. O total de plantações ativas inclui `status: "ativa"` e pode usar o índice único parcial por talhão; o agrupamento de ocorrências precisa de todas as plantações do escopo, inclusive encerradas, usando o composto por talhão em vez do parcial para obter o histórico. Alertas usam o índice por `usuarioId`, conferindo ausência de `lidoEm` nos documentos.

Não se define índice adicional só para o dashboard neste conjunto inicial: os caminhos de vínculo já estão indexados e os filtros residuais de atividade e leitura são explícitos. Compostos com atividade ou status poderiam reduzir leituras em distribuições específicas, mas acrescentariam custo de armazenamento/escrita e precisam de evidência. Agrupar ocorrências por status não implica exigir ordenação temporal ou inserir status no índice do histórico. Contagens e agrupamentos ainda podem percorrer muitos documentos; não prometer ganho ou consulta coberta. A implementação do pipeline e a medição ficam para etapas posteriores, com avaliação por indicador e por escopo.

## 9. Decisão de escopo: geolocalização adiada

A geolocalização foi adiada para uma versão futura para reduzir o escopo do MVP e priorizar as funcionalidades principais. Município e estado da propriedade permanecem no modelo. Detalhes descritivos podem utilizar os campos de observações já existentes, sem criar novos campos.

O MVP não prevê armazenamento de coordenadas geográficas, validações desses dados ou índices geoespaciais. Uma eventual inclusão futura exigirá nova definição do modelo, das validações e das consultas, sem índices geoespaciais no MVP.

## 10. Desempenho

### 10.1 Consultas prioritárias

- Perfil por firebaseUid.
- Propriedades do produtor.
- Talhões da propriedade.
- Plantações por talhão.
- Problemas por cultura e por cultura + tipo.
- Histórico de ocorrências.
- Evolução dos monitoramentos.
- Inspeções por plantação, com filtro opcional de presença ou ausência de ocorrência.
- Tratamentos e avaliações.
- Alertas do responsável pela propriedade.
- Totais e agrupamentos do dashboard, na visão geral e por propriedade autorizada, conforme a BD3, seção 7.2.

### 10.1.1 Possibilidades futuras de análise de áreas

A análise da distribuição das áreas e os indicadores de área afetada são possibilidades futuras. Estão fora do escopo desta versão e exigem requisitos específicos para novos campos, cálculos, índices ou restrições. Eventuais indicadores deverão ter sua definição e interpretação discutidas antes da implementação; não somar registros de área afetada como se representassem necessariamente áreas distintas.

### 10.2 Estratégia de listagem

- Paginar históricos.
- Proposta inicial: 20 registros por página e máximo de 100.
- Utilizar ordenação por data e _id.
- Preferir paginação por cursor em históricos grandes.
- Retornar apenas os campos necessários.
- Não carregar todo o histórico para montar uma tela simples.

### 10.3 Plano futuro de avaliação com explain

Preparar as consultas de avaliação dos índices com `explain("executionStats")`, considerando as consultas prioritárias da seção 10.1.

Manter o mesmo filtro, projeção, ordenação e limite nas fases comparadas. Nas listagens, documentar o limite utilizado, considerando a proposta de 20 registros por página. Não usar `hint` na verificação inicial: observar a escolha natural do otimizador.

Registrar para cada consulta e fase:

| Informação | O que registrar |
|---|---|
| Consulta e ambiente | Coleção, filtro, ordenação, projeção, limite, versão do MongoDB, recursos do ambiente e volume/distribuição da massa. Não publicar dados pessoais ou credenciais. |
| Plano escolhido | Nome dos índices efetivamente escolhidos, se houver, e estágios do plano vencedor, como IXSCAN, FETCH, COLLSCAN e SORT, ou equivalentes da versão usada. Guardar o plano para análise. |
| nReturned | Quantidade de resultados retornados. |
| totalDocsExamined | Quantidade de documentos examinados. |
| totalKeysExamined | Quantidade de chaves de índice examinadas. |
| executionTimeMillis | Tempo de execução informado pelo explain, em milissegundos. Não equivale necessariamente à latência total do aplicativo. |

Comparar documentos e chaves examinados com os resultados retornados, existência de ordenação separada e plano escolhido. Tempo isolado não demonstra eficiência. Um multikey pode examinar várias chaves por documento; uma coleção pequena pode levar à escolha de COLLSCAN. Retorno zero exige verificar se os parâmetros representam os casos pretendidos. Um índice não escolhido deve ser registrado como tal, sem forçar o resultado ou declarar melhoria.

### 10.4 Comparação antes/depois em banco separado

1. Após a massa da BD6, preparar banco de teste separado do `sentinela`, com dados sintéticos e volume, distribuição e seletividade representativos.
2. Preparar uma linha de base em banco novo, com as mesmas coleções e dados e apenas os índices padrão. Se o banco de teste já tiver outros índices, preparar outro banco; não remover índices do banco principal para simular a linha de base. Não conectar a aplicação a esse laboratório sem restrições de integridade.
3. Registrar consultas e todas as métricas da seção 10.3 na fase antes. Preservar os dados durante a comparação.
4. Após a conferência prévia dos dados e do ambiente, implementar no ambiente de teste os índices da seção 8 aplicáveis às consultas avaliadas e repetir exatamente as consultas na fase depois.
5. Manter recursos, carga e condições comparáveis; identificar aquecimento de cache e fazer múltiplas amostras por fase. Registrar tempos sem ocultar variações e analisar também os planos e o trabalho examinado.
6. Registrar tamanho dos índices e executar os testes de integridade separados das medições de leitura. Ensaios de escrita devem usar cópias equivalentes da massa sintética, para não alterar os dados entre as consultas comparadas.
7. Relatar benefício, ausência de benefício ou regressão somente com evidência. Os testes com volume representativo dependem da BD6.

### 10.5 Custo dos índices

Índices ocupam armazenamento adicional além dos documentos. Seu tamanho depende do número de documentos, valores indexados e quantidade de chaves; no multikey, um documento pode gerar várias entradas por causa dos itens do array. Também disputam espaço no cache.

- **Inserção:** além de salvar o documento, o MongoDB precisa incluir as entradas nos índices aplicáveis e verificar restrições únicas.
- **Atualização:** quando valores indexados mudam, suas entradas precisam ser atualizadas. A entrada ou saída de um filtro parcial também exige manutenção; nem toda atualização altera todos os índices.
- **Exclusão:** remover um documento também exige remover suas entradas dos índices.
- **Criação:** construir um índice sobre dados existentes exige leitura dos dados, processamento e armazenamento, devendo ter execução planejada.

O benefício esperado nas consultas deve ser comparado com esse custo. Evitar índices redundantes ou sem consulta justificada. Índices únicos também atendem à integridade, mesmo quando não houver ganho de tempo demonstrado. Na futura avaliação, registrar tamanho total e por índice antes/depois e, quando viável no ambiente de teste, comparar lotes equivalentes de inserções, atualizações e exclusões com a mesma massa sintética. Não realizar esses ensaios no banco principal.

## 11. Tratamento de erros na aplicação

- Dados inválidos: mensagem de validação com campos identificados.
- Usuário não autenticado: rejeitar operação.
- Usuário sem autorização: negar acesso.
- Documento não encontrado: retornar erro controlado.
- firebaseUid duplicado: tratar conflito sem expor detalhes internos do banco.
- Falha do Cloudinary: informar falha e permitir tentativa controlada.
- Não retornar URI, credenciais, stack trace ou informações internas ao aplicativo.

## 12. Casos de teste futuros e resultados esperados

Executar os casos de teste em banco isolado e, quando indicado, no fluxo da aplicação. Usar um documento válido de cada coleção como base e alterar somente o campo sob teste. Repetir os testes gerais nas coleções definidas na BD3, incluindo as três propostas da Comunidade (15 no total), cobrindo os objetos incorporados presentes.

| Caso | Camada responsável | Resultado esperado |
|---|---|---|
| Documento com campos e tipos válidos; opcionais ausentes | MongoDB | Aceitar após configuração do validator; a ausência do opcional não é erro. |
| Omitir um campo obrigatório ou um obrigatório interno de objeto presente | MongoDB | Rejeitar a gravação. |
| Campo conhecido com tipo incorreto, inclusive referência em String em vez de ObjectId | MongoDB | Rejeitar. |
| Enviar null em campo sem tipo null, inclusive opcional | MongoDB | Rejeitar; omitir o campo quando não houver informação. |
| Texto vazio ou somente espaços | MongoDB para a restrição de conteúdo; aplicação para normalização | Rejeitar no banco após implementação dessa restrição; a aplicação também rejeita após remover espaços nas extremidades. minLength sozinho não cobre espaços. |
| Texto no mínimo/máximo definido e fora do limite | MongoDB | Aceitar os limites inclusivos e rejeitar valores menores/maiores, quando o campo estiver presente. Incluir os limites específicos definidos na seção 3.3.1; não inventar maxLength para publicId, conforme a seção 3.3.2. |
| Lista no limite definido ou acima dele; lista obrigatória abaixo do mínimo | MongoDB | Aceitar fronteiras válidas e rejeitar excesso ou falta de itens obrigatórios. Imagens: aceitar até 5 e rejeitar 6; opcional pode estar ausente. |
| Campo extra no documento principal, termos, questionario, imagem, contexto ou item de formasControle | MongoDB | Rejeitar pelo additionalProperties: false do objeto correspondente; preservar campos opcionais legítimos. |
| Telefone ausente, numérico, com pontuação/espaços, tamanho diferente de 14, país diferente de +55 ou celular sem 9 inicial | MongoDB | Rejeitar pela obrigatoriedade, tipo, comprimento e formato estrutural. |
| Telefone estruturalmente correto, mas com DDD inexistente | Aplicação | Rejeitar o DDD; formato válido no banco não comprova DDD válido nem posse. |
| Telefone normalizado, com DDD válido e estrutura correta | Banco e aplicação, nas respectivas verificações | Aceitar o formato; confirmação de posse permanece no fluxo de autenticação. |
| CPF com pontuação, tamanho errado ou tipo numérico | MongoDB | Rejeitar pelo tipo/formato. |
| CPF com 11 dígitos, mas verificadores inválidos | Aplicação | Rejeitar; a checagem de formato no banco não comprova a validade dos verificadores. |
| Canal fora de sms/email; escolha ausente ao concluir a etapa | MongoDB para enum; aplicação para etapa | Rejeitar enum inválido; a aplicação impede concluir a escolha sem o campo. Ausência anterior à conclusão permanece permitida. |
| Área total e área plantada ausentes, com área do talhão válida | MongoDB | Aceitar a ausência dos campos opcionais; rejeitar ausência da área obrigatória do talhão. |
| Área plantada maior que a do talhão, ou igual/menor e positiva | Aplicação | Rejeitar quando maior; aceitar igualdade ou valor menor se as demais regras forem atendidas. |
| Área ou quantidade não finita (NaN ou infinito) | Aplicação | Rejeitar antes da gravação; não considerar tipo numérico e positividade no banco como garantia de finitude. |
| Soma das áreas dos talhões ativos ao criar, alterar ou reativar talhão ou reduzir área total | Aplicação | Aceitar soma menor ou igual à área total informada; rejeitar excesso. Preservar a restrição em operações concorrentes, sem exigir mecanismo específico neste documento. |
| Áreas informadas sem coordenadas; área total diferente da cultivada | Banco e aplicação | Não exigir coordenadas nem igualdade entre área total e cultivada; preservar as verificações existentes de compatibilidade. |
| Porte declarado pequena, media ou grande, independentemente da área ou quantidade de propriedades | MongoDB e aplicação | Aceitar o valor permitido sem cálculo por área ou classificação oficial; não restringir área ou quantidade de propriedades com base nessa resposta. |
| problemasFrequentes válido | MongoDB | Aceitar pragas, doencas ou nao_identificado isolados e pragas/doencas juntos, em qualquer ordem. |
| problemasFrequentes vazio, repetido, com 3 itens ou nao_identificado combinado | MongoDB | Rejeitar as combinações inválidas no questionário concluído. |
| Área zero ou negativa; enum não previsto; data como String | MongoDB | Rejeitar conforme tipo e limites. |
| ObjectId bem formado apontando a documento inexistente ou de contexto incompatível | Aplicação | Rejeitar o vínculo; o banco não verifica existência entre coleções automaticamente. |
| Exclusão de documento com dependentes; referência inválida encontrada | Aplicação | Impedir exclusão com dependentes conforme as regras da seção 7.2; registrar inconsistência sem apagar filhos automaticamente. Monitoramentos, tratamentos e avaliações não têm exclusão comum; exclusão de conta indisponível. |
| Campos condicionais de encerramento, acessadoEm com URL e quantidade/unidade | MongoDB nas condições estruturais; aplicação antes de salvar | Rejeitar falta de campos exigidos pela condição; impedir campos de encerramento quando a regra exige ausência. |
| Datas em ordem inválida ou futura onde proibida; área superior à área relacionada | Aplicação | Rejeitar conforme as comparações documentadas; o schema básico não consulta outros documentos nem aplica as comparações temporais. |
| Duas plantações ativas para o mesmo talhão, inclusive cadastros ou ativações concorrentes | Aplicação e índice único parcial da seção 8.1, após implementação | Rejeitar a segunda ativa. Não encerrar ou excluir a outra automaticamente. |
| Plantação atual encerrada e novo cultivo no mesmo talhão | Aplicação e MongoDB | Permitir nova plantação ativa se as demais regras forem atendidas, preservando o histórico das encerradas e a relação histórica 1:N. |
| Novas ocorrências, monitoramentos, tratamentos ou avaliações em plantação encerrada, inclusive com data anterior ao encerramento | Aplicação | Resolver os vínculos até a plantação e rejeitar o cadastro; preservar registros existentes e consulta autorizada de todo o histórico. ObjectId e índices não dispensam essa verificação. |
| Edição ou exclusão de registro vinculado à plantação encerrada na operação comum, inclusive correções e objetos incorporados | Aplicação | Rejeitar a operação e preservar o registro. Não interpretar o bloqueio como definição de procedimentos específicos de privacidade e tratamento de dados pessoais. |
| Tratamento em plantação ativa com ocorrência aberta, em acompanhamento ou encerrada | Aplicação | Permitir nas duas primeiras, se as demais regras forem atendidas; rejeitar em encerrada, inclusive lançamentos atrasados. |
| Cultura com imagem opcional ausente ou presente | MongoDB e aplicação nas respectivas funções | Aceitar ausência ou um único objeto válido; o aplicativo pode exibir imagem padrão sem exigir sua gravação. Rejeitar array no campo imagem. |
| Problema agrícola inativo com campos obrigatórios ou mínimos de listas ausentes | MongoDB | Rejeitar; inatividade não autoriza rascunho incompleto. Preservar referências históricas ao inativar. |
| Inspeções por plantação: todas, com ocorrência e sem ocorrência | Aplicação e avaliação futura do índice | Filtrar pelo plantacaoId autorizado e pela presença/ausência de ocorrenciaId quando solicitado; ordenar por dataObservacao e _id decrescentes, sem perder inspeções sem ocorrência. |
| Dashboard geral ou por propriedade | Aplicação e avaliação futura das consultas | Contar somente vínculos autorizados; manter propriedades e alertas gerais. Ocorrências incluem histórico dos pais e são agrupadas em aberta/em_acompanhamento/encerrada, sem alegar resolução. Propriedade de outro usuário não autoriza consulta. |
| Conferência de plantações ativas duplicadas antes da implementação | Conferência antes da configuração | Registrar ativas duplicadas por talhão e interromper a criação para análise, sem corrigir ou excluir dados automaticamente. |
| firebaseUid duplicado | Índice único da seção 8.1, após implementação; aplicação trata conflito | Rejeitar a segunda identidade duplicada; retornar conflito controlado. |
| Cadastro de ocorrência alta e repetição do mesmo evento, inclusive concorrente | Aplicação e índice único parcial da seção 8.1, após implementação | Exatamente um alerta do tipo para a ocorrência; destinatário responsável e contexto corretos; repetição preserva lidoEm. O alerta deve ter prioridade alta, sem diagnóstico ou classificação técnica de risco. Não executar esse cenário de ponta a ponta antes de definir a recuperação de falhas. |
| Ocorrência cadastrada com intensidade baixa/media, edição para alta ou monitoramento alto | Aplicação | Não gerar esse alerta; geração restrita ao evento de cadastro de ocorrência alta. |
| Objeto de imagem sem publicId, com tipo diferente de String, vazio ou somente espaços | MongoDB | Rejeitar; a ausência de uma imagem opcional continua permitida. |
| publicId retornado pelo Cloudinary | Aplicação | Armazenar exatamente o valor recebido, sem trim ou regras de URL; não rejeitar por máximo arbitrário. |
| Dois objetos de imagem com mesmo publicId e outros metadados diferentes | Aplicação | Rejeitar repetição do recurso; uniqueItems sobre objetos completos não resolve esse caso sozinho. |
| Acesso a dados pessoais por outro usuário sem autorização ou sem necessidade para sua função | Aplicação, em testes futuros com dados fictícios | Negar acesso; permitir somente ao próprio usuário ou a pessoas autorizadas conforme função e necessidade. |
| Geração de alertas ou logs, inclusive de erro | Aplicação, em testes futuros com dados fictícios | Não incluir CPF ou telefone. Conferir os textos e registros produzidos, não somente os campos do schema. |
| Exclusão de conta pelo aplicativo nesta versão | Aplicação | Operação indisponível; não interpretar essa indisponibilidade como permissão de retenção permanente. |
| Conferência dos documentos existentes antes de strict/error e fechamento dos objetos | Conferência antes da configuração | Registrar documentos/campos incompatíveis e solicitar análise; não apagar nem corrigir automaticamente. |
| Índices da seção 8 e consultas da seção 10.3 | Conferência de estrutura e avaliação no banco de teste | Conferir chaves, ordem e opções dos índices implementados; registrar plano/métricas reais, sem exigir ganho de tempo como resultado obrigatório. |

Os casos abaixo são cenários futuros da proposta de Comunidade, sem execução nesta etapa:

| Caso | Camada responsável | Resultado esperado |
|---|---|---|
| Enviar experiência de outra pessoa ou combinar avaliação/tratamento de cadeias diferentes | Aplicação | Rejeitar; referências válidas não bastam para autoria e consistência |
| Consultar feed ou detalhe em pendente/rejeitada/oculta/retirada | Aplicação | Não retornar conteúdo público nem dados internos; autor/equipe usam acesso separado e autorizado |
| Resposta da Comunidade e fotos selecionadas | Aplicação e revisão de conteúdo | Somente campos da projeção pública, sem perfil/IDs de origem, dados pessoais privados ou fotos não selecionadas |
| Experiência sem avaliação compartilhada | Banco para estrutura; aplicação para apresentação | Aceitar ausência do resultado e exibir “Resultado ainda não informado”, sem inventar eficácia |
| Alteração privada após compartilhamento | Aplicação | Manter a cópia pública; nenhuma atualização silenciosa |
| Edição de experiência já aprovada | Aplicação | Nova versão pendente fora do feed; exigir revisão da nova versão antes de exibir |
| Publicar/editar cópia pública de origem encerrada | Aplicação | Permitir mediante seleção/prévia/revisão; continuar rejeitando alterações nos registros privados |
| Adoção incompatível, não identificada, de versão desatualizada ou publicação indisponível | Aplicação | Rejeitar; comparar mesma cultura e problema cadastrado e verificar estado/versão na confirmação |
| Adoção confirmada e posterior intervenção | Aplicação | Criar somente planejamento inicialmente; tratamento real informado depois, na ocorrência correta; avaliações na coleção existente |
| Duas confirmações de adoção planejada da mesma experiência/ocorrência, entre versões ou concorrentes | Aplicação e único parcial da seção 14.6.1 após implementação | Rejeitar a duplicada sem apagar histórico; realizadas/canceladas ficam fora da restrição; tratar conflito controlado |
| Criação do tratamento efetivamente realizado por adoção | Aplicação | Manter tratamentoId e estado realizada consistentes com o tratamento gravado; repetição não gera outro tratamento para a mesma adoção |
| Acesso sem autenticação a feed, detalhe, fotos ou operações | Aplicação | Negar acesso no MVP; compartilhado não significa acesso anônimo |
| Plantação de destino encerrada | Aplicação | Bloquear nova adoção e alterações comuns, realização de tratamento e novas avaliações, inclusive atrasadas; preservar consulta própria |
| Experiência retirada após adoção | Aplicação | Impedir novas adoções e detalhe público; manter método/versionamento já copiados na adoção própria |
| Denúncia e decisão | Aplicação | Não ocultar automaticamente; restringir denunciante/descrição/decisão à moderação e preservar consistência ao ocultar |
| Denúncia pendente ou analisada | Banco para condições estruturais; aplicação para transição | Aceitar somente os dois estados; exigir decisão, justificativa, analisadoPor e analisadoEm em analisada e ausência desses campos em pendente |
| Feed com datas iguais, filtros combinados e mudanças de aprovação | Aplicação e avaliação futura dos índices | Paginação por data + _id; somente aprovadas; observar filtros residuais, custo e uso real dos parciais |

## 13. Considerações de implementação

A prioridade do alerta `ocorrencia_intensidade_alta` está definida como `alta`, conforme a seção 4.13. A recuperação de falhas na geração, a viabilidade de SMS/e-mail, a implementação da normalização e da conferência de DDD conforme a regra de telefone já definida, a paginação e a convenção de datas sem horário são detalhes a resolver nos fluxos da aplicação. A política de exclusão e preservação está definida na seção 7.2, com exclusão de conta indisponível. A política de tratamento de dados pessoais e a retenção de alertas ainda devem ser definidas; não criar TTL ou novas unicidades para antecipá-las. A geolocalização está fora do escopo do MVP.

Os status de ocorrência aceitos para novos tratamentos estão definidos na seção 4.11. O encerramento da plantação bloqueia novas ocorrências, monitoramentos, tratamentos e avaliações, inclusive lançamentos atrasados, além de edições e exclusões comuns dos registros vinculados, conforme as seções 4.6 e 7.2; preservar todo o histórico para consulta autorizada. A aplicação verifica essas condições, sem atribuir a garantia a ObjectIds ou índices. Procedimentos específicos de privacidade e tratamento de dados pessoais permanecem distintos desses bloqueios e dependem de política própria. O dashboard possui indicadores, vínculos e filtros definidos na BD3, seção 7.2; somente a construção do pipeline e sua avaliação são posteriores. A ordenação global do histórico entre plantações não faz parte das ordenações já definidas por plantação e só exigirá nova decisão se a tela a requerer. A revisão e validação das decisões pela equipe são confirmação externa e não são comprovadas por este documento.

## 14. Comunidade: regras e proposta técnica mínima

O escopo confirmado está na BD1, seção 8; entidades e vínculos na BD2, seção 6; campos e projeções na BD3, seção 10. Permanecem os 13 índices anteriores. Estão confirmados: primeira aprovação como data estável do feed, suspensão após edição até nova aprovação, liberação de ocultas exclusiva da moderação, adoção planejada → realizada/cancelada, unicidade de adoção planejada por experiência/ocorrência, denúncia pendente → analisada e acesso somente autenticado. Limites e detalhes técnicos mínimos abaixo orientam a modelagem; não representam validação externa pela equipe. Não usar a Comunidade para modificar silenciosamente registros privados.

### 14.1 Tipos, obrigatoriedade e limites propostos

Aplicar as regras gerais de ausência em vez de null, textos não vazios, datas BSON, ObjectIds, campos fechados e objetos sem identificadores próprios. A BD3 §10 lista todos os campos permitidos e as condições. `versao` e `experienciaVersao` aceitam somente BSON int/long, inteiros maiores ou iguais a 1. Exigir enums escalares; arrays não substituem um campo String. Datas de criação, atualização, publicação e decisão são geradas pelo sistema. `dataPrevista` de planejamento pode ser futura; datas copiadas de aplicação/avaliação mantêm as regras dos registros de origem.

| Campo/conteúdo | Limite ou formato proposto |
|---|---|
| usuarios.nomePublico e experiencias_comunidade.nomePublico | String de 2 a 80 caracteres, escolhida pelo produtor; sem unicidade de nome público |
| titulo | String de 1 a 150 caracteres |
| relato | String de 1 a 5000 caracteres |
| culturaNome e problemaNome | String de 1 a 200 caracteres; cópias dos rótulos autorizados do catálogo |
| metodo.descricao, metodoCopiado.descricao e planejamento.descricao | String de 1 a 5000 caracteres |
| Observações dos objetos metodo, metodoCopiado, resultadoRelatado e planejamento | String de 1 a 5000 caracteres quando presentes |
| Fotos da experiência | Array opcional de até 5 objetos; sem repetição de publicId, conferida pela aplicação; cada foto escolhida explicitamente |
| Foto.url, publicId e legenda | HTTPS até 2048 caracteres; publicId original não vazio, sem máximo arbitrário; legenda opcional até 300 caracteres |
| regiao.municipio e regiao.estado | Município de 1 a 150 caracteres; estado como uma das 27 siglas de UF. Ambos opcionais, ao menos um se houver objeto; não copiar localização privada automaticamente |
| moderacao.motivo, denuncia.descricao e denuncia.justificativa | String de 1 a 2000 caracteres quando presentes |

Enums propostos de moderação: `pendente`, `aprovada`, `rejeitada`, `oculta`, `retirada`. A disponibilidade pública é derivada exclusivamente de `moderacao.status: "aprovada"`, sem booleano redundante. `tipoProblema` e `statusOcorrencia` preservam os enums atuais da ocorrência; métodos e resultados preservam os enums existentes da BD3. A ausência de `resultadoRelatado` é exibida como “Resultado ainda não informado”, sem criar um resultado fictício.

### 14.2 Autoria, seleção e fronteira pública

A aplicação identifica o autor pelo token e confere a ocorrência própria pela cadeia ocorrência → plantação → talhão → propriedade → usuarioId. Não basta a ocorrência ter sido registrada pelo mesmo usuário para dispensar a autorização sobre a propriedade. Quando selecionados, tratamento deve pertencer à ocorrência, e avaliação deve pertencer ao tratamento selecionado. Conferir cultura da plantação, problema/tipo da ocorrência e acesso às fotos. Exigir nome público escolhido; não usar nome completo como fallback.

Copiar somente campos explicitamente aprovados pelo autor na prévia e usar a projeção pública da BD3 §10.5. Não publicar documentos privados, identificadores de origem, CPF, telefone, endereço, coordenadas ou nome da propriedade. A aplicação deve conferir o conteúdo livre e a equipe deve revisar textos e imagens, inclusive informações identificáveis; Schema Validation não detecta dados pessoais inseridos em prosa ou em pixels. Somente fotos selecionadas recebem recursos de compartilhamento próprios. A seleção não autoriza a divulgação de outras fotos do registro.

Confirmar o envio contra a versão exibida na prévia: se a origem ou seleção mudar antes da confirmação, exigir nova prévia em vez de publicar silenciosamente outro conteúdo. Mudanças privadas posteriores não reescrevem a experiência. Compartilhar origem encerrada e editar sua cópia pública é permitido mediante nova revisão, sem alterar origem, estado ou bloqueios privados. Uma referência interna não confere acesso público ao destino.

### 14.3 Moderação, versões e retirada

| Operação | Responsável e efeito proposto |
|---|---|
| Enviar | Autor autorizado após prévia; moderacao.status pendente, versão 1; sem publicação automática |
| Aprovar | Moderador autorizado; aprovada, revisadoPor e revisadoEm obrigatórios; preencher publicadoEm somente na primeira aprovação |
| Rejeitar | Moderador autorizado; rejeitada, com revisadoPor/revisadoEm/motivo obrigatórios; fora do feed |
| Editar conteúdo e reenviar | Somente autor; incrementar versão e voltar a pendente; remover decisão anterior dos campos de última revisão, preservar publicadoEm quando já existente e exigir nova prévia/revisão |
| Ocultar | Moderador autorizado; oculta, com responsável, data e motivo; sem exclusão física |
| Retirar | Autor autorizado em pendente/aprovada/rejeitada; retirada; suspender feed e detalhe público, sem remover adoções ou origem privada. Se já oculta, não converter o estado para contornar a restrição da moderação |
| Reenviar rejeitada ou retirada | Autor; nova versão pendente e nova revisão, nunca aprovação automática |

Somente conteúdo pendente pode ser aprovado/rejeitado. Ocultação é decisão da equipe: autor não pode editar/reenviar ou converter em retirada para contornar o bloqueio. Somente moderador autorizado pode liberar após análise; o retorno a pendente exige nova aprovação antes da exibição. A aplicação identifica o responsável pela moderação, sem confiar em papel enviado pelo cliente nem inventar campo de papel no perfil sem definição do controle de acesso.

`revisadoPor`/`revisadoEm` são condicionais em aprovada/rejeitada/oculta; `motivo` é obrigatório em rejeitada/oculta e opcional em aprovada. No estado pendente esses campos de última decisão ficam ausentes; retirada não inventa revisão da equipe e pode preservar a última decisão existente. A autoria da retirada é conferida pela aplicação; `atualizadoEm` registra a operação. Essas informações são internas e não compõem a resposta pública. Esse modelo mínimo guarda a última decisão, não um registro completo de auditoria de todas as ações.

Em aprovada, exigir `publicadoEm` Date. Nos demais estados, a data só pode existir se houve aprovação anterior; não removê-la para simular uma nova publicação. Essa condição histórica e a comparação `criadoEm ≤ publicadoEm ≤ atualizadoEm` são conferidas pela aplicação. `revisadoEm` não pode ser futuro ou anterior à criação; `analisadoEm` da denúncia não pode ser futuro ou anterior à criação da denúncia.

A data de ordenação confirmada é a primeira aprovação (`publicadoEm`), não `criadoEm`, com desempate por `_id` decrescente. Preservar a data em revisões evita promover relato antigo por edição. Toda alteração pública, incluindo nome, fotos, região e resultado copiado, incrementa versão e suspende a exibição até nova aprovação. Conferir a versão esperada na gravação e na aprovação para não aprovar versão diferente da revisada em operações concorrentes. A aprovação para a banca é revisão de conteúdo, não validação agronômica profissional nem comprovação de prontidão para operação pública real.

Retirada/ocultação impede novas adoções e acesso público ao conteúdo completo, incluindo entrega dos arquivos de compartilhamento. O comportamento real de URLs, cache e revogação precisa ser projetado antes da abertura pública. Adoções existentes conservam versão e método copiado para consulta própria; não passam a referenciar a versão nova automaticamente. Não há cascata de exclusão, TTL ou expurgo automático. Procedimentos de privacidade são específicos, separados da retirada do feed, sem assumir retenção permanente.

### 14.4 Adoção como planejamento

Antes de confirmar, a aplicação verifica: usuário autenticado e autorizado sobre a ocorrência de destino, plantação ativa, ocorrência aberta ou em acompanhamento, experiência aprovada/disponível com método, versão ainda igual à revisada, mesma cultura e mesmo problema agrícola cadastrado. Comparar ObjectIds dos catálogos, não nomes livres; se o problema não estiver identificado em origem ou destino, não permitir adoção. Verificar novamente na confirmação, inclusive se houver retirada/moderação concorrente. Não basta o método existir no documento para ele estar disponível publicamente.

Preservar experienciaId, experienciaVersao e metodoCopiado. O produtor revisa o planejamento antes de confirmar; não preencher produtos, doses, quantidades ou tratamento realizado automaticamente. O ciclo confirmado é `planejada → realizada` ou `planejada → cancelada`; planejamento pode ser ajustado enquanto planejada, preservando a cópia de origem. A criação do tratamento efetivamente realizado, com dados reais e na ocorrência correta, deve preencher tratamentoId e marcar a adoção realizada. A aplicação mantém a consistência entre gravação do tratamento, vínculo e transição diante de falhas/concorrência; o mecanismo técnico é posterior. Repetir a confirmação de realização não deve gerar outro tratamento para a mesma adoção. Resultado próprio permanece nas avaliações do tratamento.

Não permitir duas adoções planejadas para o mesmo par experienciaId/ocorrenciaId, mesmo se mudarem a versão ou o usuário. A aplicação verifica e trata conflito; o índice único parcial da seção 14.6.1 garante a restrição entre documentos, inclusive com concorrência. Uma consulta prévia isolada não a garante. A restrição não limita realizadas/canceladas nem exige apagar histórico.

Planejada exige tratamentoId ausente; realizada exige referência existente ao tratamento correto; cancelada exige tratamentoId ausente. Não há transição automática por leitura do feed nem alteração da experiência original por adoção. Uma experiência posteriormente retirada conserva apenas a referência histórica e a cópia adotada; não atualizar o planejamento automaticamente. Fechamento da plantação bloqueia novas adoções e alterações comuns das adoções existentes, inclusive realização/cancelamento; preservar consulta própria do histórico. Novos tratamentos/avaliações continuam sujeitos aos bloqueios anteriores, incluindo lançamentos atrasados.

### 14.5 Denúncias e responsabilidades

Usuário autenticado pode denunciar uma experiência disponível; autor da denúncia vem do token. Motivos: dados_pessoais, conteudo_inadequado, informacao_perigosa ou outro. Descrição opcional limitada, sem publicação no feed. O fluxo confirmado é `pendente → analisada`, sem reabertura automática: analisadoPor, analisadoEm, decisao e justificativa são obrigatórios em analisada e ausentes em pendente. Denúncia pendente não oculta a publicação automaticamente. A decisão manter_publicacao não aprova ou libera uma experiência rejeitada/retirada/oculta; ocultar_publicacao exige atualização consistente da experiência pela moderação. Não revelar identidade do denunciante ao público nem ao autor da publicação.

No MVP, autenticação é obrigatória para feed, detalhes, fotos e todas as operações da Comunidade. Moderadores também exigem autorização específica. A projeção compartilhada não autoriza navegação pelos registros privados; a aplicação deve conferir autenticação e autorização a cada acesso, inclusive na entrega dos arquivos.

| Verificação | Banco | Aplicação |
|---|---|---|
| Campos, tipos BSON, enums, tamanhos e condições internas | Schema Validation com objetos fechados e condições estruturais | Validar antes de salvar |
| Autoria, propriedade dos registros, papéis e referências existentes | Não garantidos por ObjectId/índices | Resolver cadeia e negar acesso indevido |
| Consistência cultura/problema/ocorrência/tratamento/avaliação | Não consulta outros documentos automaticamente | Conferir origem e destino |
| Publicação voluntária, prévia, moderação e projeção pública | Schema não comprova consentimento ou revisão humana | Controlar operações, permissões e campos retornados |
| Versão aprovada/adotada, transições e concorrência | Índices propostos não garantem o fluxo | Conferir versão/estado e preservar consistência |
| Seleção de fotos, dados pessoais em conteúdo, arquivos públicos | Não verificável pelo schema | Seleção explícita, revisão e controle de entrega dos recursos |
| Bloqueios por encerramento e distinção de cópia histórica | Não garantidos por referências ou índices | Preservar bloqueios privados e da adoção, permitindo somente a cópia pública autorizada |

Referências de origem, adoções e denúncias passam a ser dependentes na política da seção 7.2: não apagar fisicamente pais referenciados nem remover filhos automaticamente. Retirada do feed não exclui documentos. As decisões de comportamento confirmadas não substituem a validação externa da documentação pela equipe.

### 14.6 Índices adicionais propostos pelas consultas

Preservar integralmente os 13 índices da seção 8.1. A tabela reavalia os nove candidatos anteriores e recomenda oito para o conjunto inicial; o candidato por tipo fica adiado, sem retirar o filtro do produto. Não há índices criados nesta etapa. Todos os nove candidatos são não únicos, sem sparse ou TTL. Na tabela, **P** significa exatamente `partialFilterExpression: { "moderacao.status": "aprovada" }`; as consultas de feed sempre incluem essa igualdade. Índices sem P são completos, sem filtro parcial. Autenticação/autorização são verificadas pela aplicação, não pelos índices.

| Coleção | Chaves exatas na ordem | Opções e avaliação | Consulta: filtro e ordenação | Justificativa, redundâncias e limitações |
|---|---|---|---|---|
| experiencias_comunidade | `{ publicadoEm: -1, _id: -1 }` | P; manter no conjunto inicial | `{ "moderacao.status": "aprovada" }`; ordem `{ publicadoEm: -1, _id: -1 }` | Feed geral paginado; índices que começam por cultura/problema não substituem sua ordenação global. Tipo isolado pode ser residual; pode exigir muitas leituras. |
| experiencias_comunidade | `{ culturaId: 1, publicadoEm: -1, _id: -1 }` | P; manter no conjunto inicial | Aprovada + culturaId por igualdade; ordem `{ publicadoEm: -1, _id: -1 }` | Delimita cultura antes da ordenação. Não redundante com feed geral; problema/tipo combinados permanecem residuais quando não forem o caminho escolhido. |
| experiencias_comunidade | `{ problemaAgricolaId: 1, publicadoEm: -1, _id: -1 }` | P; manter no conjunto inicial | Aprovada + problemaAgricolaId por igualdade; ordem `{ publicadoEm: -1, _id: -1 }` | Busca específica confirmada sem exigir cultura no prefixo. Campo opcional não se torna obrigatório; usar para problema identificado, não para busca por ausência. |
| experiencias_comunidade | `{ tipoProblema: 1, publicadoEm: -1, _id: -1 }` | P se futuramente adotado; adiar no MVP inicial | Aprovada + tipoProblema por igualdade; ordem `{ publicadoEm: -1, _id: -1 }` | Não é redundância estrutural, mas tipo tem poucos valores e não há evidência de volume/seletividade que justifique mais um índice inicial. Manter filtro residual no feed geral ou no caminho cultura/problema quando informados; medir leituras antes de reconsiderar. |
| experiencias_comunidade | `{ autorId: 1, criadoEm: -1, _id: -1 }` | Sem parcial; manter | autorId autenticado, estado opcional; ordem `{ criadoEm: -1, _id: -1 }` | Lista todos os estados próprios; estado é residual. Não substituído pelos parciais aprovados ou pela fila por estado. |
| experiencias_comunidade | `{ "moderacao.status": 1, criadoEm: 1, _id: 1 }` | Sem parcial; manter | Estado por igualdade, inclusive pendente/oculta; ordem `{ criadoEm: 1, _id: 1 }` | Fila mais antiga primeiro; vínculo/ordem diferentes da listagem própria e do feed por publicadoEm. Não garante ordem global ao consultar vários estados sem ordenar/mesclar. |
| adocoes_tratamento | `{ usuarioId: 1, criadoEm: -1, _id: -1 }` | Sem parcial; manter | usuarioId autenticado, status opcional; ordem `{ criadoEm: -1, _id: -1 }` | Histórico próprio, incluindo realizadas/canceladas; status residual. Único parcial da seção 14.6.1 não atende a esse histórico/ordenação. |
| denuncias_comunidade | `{ status: 1, criadoEm: 1, _id: 1 }` | Sem parcial; manter | status pendente ou analisada por igualdade; ordem `{ criadoEm: 1, _id: 1 }` | Fila e consulta por estado, sem estado em_analise. Não duplica o caminho por experiência. |
| denuncias_comunidade | `{ experienciaId: 1, criadoEm: -1, _id: -1 }` | Sem parcial; manter | experienciaId por igualdade; ordem `{ criadoEm: -1, _id: -1 }` | Histórico das denúncias da publicação para análise; a fila por status não oferece esse prefixo/ordenação. Não usar como garantia de existência da experiência. |

Detalhes por `_id` usam o automático com verificação de estado/autorização. Não criar índice simples que duplique prefixo de composto não único. Filtros combinados escolhem um caminho de feed e conferem os demais critérios como residuais, sem índice para cada combinação. Os índices de feed usam campos escalares, sem fotos/método. Não indexar nome público, região ou textos sem consulta confirmada. A restrição de adoção planejada abaixo tem regra explícita; não estendê-la a nomes, publicações por ocorrência, tratamento vinculado ou denúncias.

Contagem recomendada: 13 anteriores preservados + 8 adicionais de consulta + 1 único parcial de integridade = 22, excluindo automáticos de `_id`. A igualdade com o total anteriormente proposto é coincidência: o índice por tipo foi adiado e entrou uma restrição diferente, sem substituir sua finalidade. Não há alteração ou substituição dos 13 anteriores. Testar futuramente os filtros isolados/combinados, sobretudo tipo residual, filas, estados fora dos parciais e paginação com datas iguais. Medir espaço e escritas, inclusive saída/entrada dos parciais nas revisões e nas transições de adoção. Definição não comprova ganho de desempenho.

#### 14.6.1 Índice único parcial de adoções planejadas

| Coleção | Chaves exatas e ordem | Opções exatas | Regra/consulta | Justificativa e limites |
|---|---|---|---|---|
| adocoes_tratamento | `{ experienciaId: 1, ocorrenciaId: 1 }` | `unique: true`, `partialFilterExpression: { status: "planejada" }` | No máximo uma planejada por par; busca `{ experienciaId, ocorrenciaId, status: "planejada" }`, sem ordenação | Garante a regra mesmo com concorrência; não incluir usuarioId nem experienciaVersao, pois permitiria duplicar o mesmo par. A ordem começa pela experiência compartilhada e depois pelo destino; ambas são igualdades nessa busca, sem impor seletividade presumida. Não substitui o índice do histórico próprio. |

experienciaId e ocorrenciaId são ObjectIds obrigatórios escalares. O filtro parcial é somente por status, sem excluir silenciosamente tipos inválidos da restrição; Schema Validation deve rejeitar tipos incorretos/ausências. Realizadas/canceladas ficam fora da unicidade, preservando histórico e permitindo nova planejada após a saída da anterior desse estado. Antes da futura criação, auditar duplicidades planejadas e dados incompatíveis; interromper para análise, sem apagar/corrigir automaticamente. A aplicação trata conflito de duplicidade. O índice não verifica autoria, existência das referências, compatibilidade de cultura/problema, estado da plantação ou consistência do tratamento realizado.
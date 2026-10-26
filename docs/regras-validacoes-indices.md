# BD4 — Definição de regras, validações e índices

## 2. Objetivo

Definir regras de integridade, validações e índices para manter os dados consistentes e apoiar as principais consultas do Sentinela.

Esta etapa documenta as configurações previstas. Não aplica validadores ou índices no Atlas e não insere massa de dados.

## 3. Responsabilidades

| Verificação | MongoDB | Backend |
|---|---|---|
| Presença de campos obrigatórios | Sim, com Schema Validation | Sim, antes de salvar |
| Tipos BSON dos campos | Sim | Sim, validar e converter |
| Valores permitidos de status | Sim, com enum | Sim |
| Limites de texto, número e lista | Sim | Sim |
| Unicidade de firebaseUid | Sim, com índice único | Tratar erro de duplicidade |
| Existência de documentos referenciados | Não automaticamente | Sim |
| Autorização do usuário | Não pelo Schema Validation | Sim |
| Compatibilidade entre referências | Não automaticamente | Sim |
| Transições de status | Não apenas pelo schema | Sim |
| Comparações entre datas | Possível em validadores adicionais; não previsto no schema básico | Sim |
| Existência do arquivo no Cloudinary | Não | Sim |
| Autenticação e credenciais | Não | Firebase e backend |


## 4. Regras gerais

### 4.1 Campos obrigatórios e opcionais

- Manter os campos obrigatórios e opcionais definidos na BD3, conforme o resumo da seção 5.
- Campos opcionais devem ser omitidos quando não houver informação.
- Não utilizar null como substituto de ausência nesta proposta.
- Campos condicionais serão exigidos quando a condição ocorrer.
- Não aceitar texto vazio ou composto apenas por espaços em campos preenchidos.
- Não utilizar zero para representar uma quantidade ou área desconhecida.
- Arrays opcionais sem itens podem ser omitidos.
- Arrays obrigatórios devem respeitar as regras específicas.

### 4.2 Identificadores

- _id deve ser ObjectId.
- Referências internas devem ser ObjectId.
- firebaseUid deve ser String.
- O backend deve validar identificadores recebidos antes de convertê-los.
- Não aceitar objetos de consulta enviados no lugar de identificadores ou textos.

### 4.3 Textos

Os limites de textos são os definidos abaixo. A revisão coletiva permanece pendente.

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

O backend remove espaços nas extremidades dos textos de entrada e rejeita conteúdo vazio. Exceção: `publicId` deve preservar integralmente o valor retornado pelo Cloudinary, sem trim ou outra transformação, conforme a seção 4.6. Nomes de pessoas não devem ser limitados somente a letras sem acentos.

#### 4.3.1 Limites específicos dos campos

Os limites específicos são os definidos abaixo. A revisão coletiva permanece pendente. Campos opcionais continuam opcionais; os limites se aplicam quando preenchidos. Campos condicionais mantêm suas condições existentes.

| Campo | Limite definido | Finalidade |
|---|---|---|
| propriedades.municipio | 1 a 150 caracteres | Nome do município. |
| problemas_agricolas.informacoesDisseminacao | 1 a 5000 caracteres | Descrição da disseminação. |
| problemas_agricolas.orientacaoBuscaAgronomo | 1 a 5000 caracteres | Orientação para buscar agrônomo. |
| ocorrencias.sintomas | 1 a 5000 caracteres | Descrição textual dos sintomas; não é a lista de sintomas do catálogo. |
| ocorrencias.motivoEncerramento | 1 a 5000 caracteres | Explicação do encerramento, exigida quando a ocorrência estiver encerrada. |
| tratamentos.produtoUtilizado | 1 a 200 caracteres | Nome do produto utilizado, quando informado. |
| tratamentos.responsavelAplicacao | 2 a 150 caracteres | Nome de uma pessoa responsável pela aplicação, quando informado. |

#### 4.3.2 Identificador externo de imagem: publicId

`publicId` é uma String obrigatória quando houver um objeto de imagem, inclusive em cada item de um array de imagens. A aplicação deve preenchê-la com o valor retornado pelo Cloudinary e preservá-lo integralmente, sem trim, alteração de maiúsculas/minúsculas ou outra transformação. Não aceitar String vazia ou composta apenas por espaços; verificar esse conteúdo sem modificar o identificador. Não aplicar regras de URL ao `publicId` nem definir `maxLength` arbitrário. Caso seja necessário um limite, conferir primeiro a documentação oficial do Cloudinary. Essa obrigatoriedade interna não torna a imagem obrigatória; a obrigatoriedade de cada campo de imagem permanece como já definida.

Campos com enum, como estado, status, tipo, intensidade, resultado, canalCodigoPreferido e respostas do questionário, já têm o conjunto permitido delimitado e não precisam receber um máximo arbitrário nesta revisão. CPF possui comprimento fixo de 11 dígitos; firebaseUid possui máximo de 128; outraCultura possui máximo de 150; unidadeQuantidade possui máximo de 30. Os demais textos são atendidos pelas categorias da seção 4.3 ou pelos limites de itens da seção 6.

### 4.4 Números

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
- Áreas sobrepostas ficam fora do escopo desta versão. A soma das áreas dos talhões ativos deve ser compatível com a área da propriedade, quando conhecida; a aplicação confere essa compatibilidade sem introduzir campos geográficos.
- Não estabelecer limite máximo arbitrário de propriedade sem requisito do domínio.

Na aplicação, áreas e quantidades serão números. O schema aceitará os tipos BSON numéricos int, long, double e decimal, com as restrições correspondentes. O backend utilizará uma representação consistente.

A precisão de apresentação não deve alterar o valor armazenado sem uma regra explícita.

### 4.5 Datas

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

### 4.6 Imagens

- url deve ser uma URL HTTPS válida.
- `publicId` é uma String obrigatória quando houver um objeto de imagem, inclusive em cada item de um array de imagens. A aplicação deve preenchê-la com o valor retornado pelo Cloudinary e preservá-lo integralmente, sem trim, alteração de maiúsculas/minúsculas ou outra transformação. Não aceitar String vazia ou composta apenas por espaços; verificar esse conteúdo sem modificar o identificador. Não aplicar regras de URL ao `publicId` nem definir `maxLength` arbitrário. Caso seja necessário um limite, conferir primeiro a documentação oficial do Cloudinary. Essa obrigatoriedade interna não torna a imagem obrigatória; a obrigatoriedade de cada campo de imagem permanece como já definida. O objeto de imagem não possui identificador interno próprio na proposta atual da BD3.
- enviadaPor deve referenciar um usuário existente.
- enviadaEm deve ser Date.
- Foto de perfil: no máximo uma.
- Demais registros com imagens: até cinco, conforme o limite definido na seção 6; a obrigatoriedade das imagens permanece inalterada.
- Não repetir publicId dentro do mesmo registro.
- O backend deve conferir o resultado do upload e utilizar a URL e o identificador devolvidos pelo serviço.
- Remoção do arquivo e remoção do vínculo devem ser coordenadas.
- Não excluir o documento inteiro por falha isolada de upload.

## 5. Obrigatoriedade e validações por coleção

### 5.1 usuarios

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

### 5.2 Questionário incorporado

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
| quantidadeCulturas | 1, 2, 3, 4_ou_mais |
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

### 5.3 propriedades

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

### 5.4 talhoes

**Obrigatórios:** _id, propriedadeId, nome, areaHa, ativo, criadoEm e atualizadoEm.

**Opcionais:** observacoes.

**Regras:**

- A propriedade deve existir.
- O usuário deve possuir autorização sobre a propriedade.
- A propriedade deve estar ativa para novos cadastros.
- areaHa deve ser positiva e compatível com a área conhecida da propriedade.
- Não impor unicidade de nome nesta versão; se necessário, a regra deverá ser aprovada antes de criar índice único.
- Talhão inativo não recebe nova plantação sem reativação.

### 5.5 culturas

**Obrigatórios:** _id, nome, ativa, criadoEm e atualizadoEm.

**Opcionais:** nomeCientifico, descricao e imagem.

**Regras:**

- Manutenção somente por usuário autorizado da equipe.
- Antes de cadastrar, conferir possíveis duplicações de nome no catálogo.
- A conferência por nome não será uma garantia técnica de unicidade nesta versão.
- Cultura inativa permanece disponível no histórico, mas não em novas seleções.
- Desativar cultura não apaga suas plantações anteriores.

### 5.6 plantacoes

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
- A aplicação confere a existência de plantação ativa antes de cadastrar ou ativar outra no mesmo talhão. Uma consulta prévia isolada não impede conflitos concorrentes: a restrição também depende do índice único parcial definido na seção 9. A aplicação deve tratar erro de duplicidade sem apagar ou encerrar automaticamente a plantação existente.
- Preservar o histórico quando a cultura do talhão mudar.

### 5.7 problemas_agricolas

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
- Não gerar diagnóstico ou urgência automaticamente a partir do nome do problema.

### 5.8 fontes_conhecimento

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

### 5.9 ocorrencias

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
- Para novos registros, o cultivo e seus responsáveis devem permitir a operação.
- Se problemaAgricolaId existir, o problema deve ser compatível com o tipo e a cultura.
- Se tipo for nao_identificado, problemaAgricolaId deve estar ausente.
- Área afetada deve ser positiva e não superior à área plantada conhecida.
- Data de observação não pode ser futura.
- Encerramento não pode anteceder a observação.
- Quando não encerrada, campos de encerramento devem estar ausentes.
- Seleção de problema pelo produtor não representa confirmação de diagnóstico.

**Transições permitidas:**

Este registro não representa aprovação coletiva da equipe nem implementação.

- aberta → em_acompanhamento.
- aberta → encerrada.
- em_acompanhamento → encerrada.
- Sem reabertura nesta versão. Uma nova observação após o encerramento deverá gerar outra ocorrência.
- Encerramento não comprova resolução do problema; o motivo deve explicar a finalização do acompanhamento.
- `encerradoEm` e `motivoEncerramento` devem estar presentes quando o status for `encerrada` e ausentes em `aberta` e `em_acompanhamento`.
- A aplicação verifica autorização, referências, dependentes e transições de status. O MongoDB valida a estrutura, os valores permitidos e as condições estruturais dos campos; a comparação com o status anterior pertence à aplicação. Não criar campos novos para essas decisões.

### 5.10 monitoramentos

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
- Se problemaObservado for false, intensidade e areaAfetadaHa devem estar ausentes.
- Sem ocorrência vinculada, evolucao deve estar ausente ou ser nao_avaliada.
- Data de observação não pode ser futura.
- Em acompanhamento de ocorrência, observação não pode anteceder a observação inicial da ocorrência.
- Próxima inspeção deve ser posterior à observação.
- Área afetada deve ser compatível com a plantação.

### 5.11 tratamentos

**Obrigatórios:** _id, ocorrenciaId, registradoPor, tipoMedida, descricao, dataAplicacao, criadoEm e atualizadoEm.

**Opcionais:** areaTratadaHa, produtoUtilizado, responsavelAplicacao, observacoes e imagens.

**Condicionais:** quantidadeUtilizada e unidadeQuantidade devem ser informadas juntas.

**Tipos de medida:** manual, cultural, biologica, quimica ou outra.

**Regras:**

- Ocorrência e autor devem existir.
- A ocorrência deve permitir novos tratamentos.
- Aplicação não pode ser futura.
- Aplicação não deve anteceder a observação inicial da ocorrência.
- Quantidade e área informadas devem ser positivas.
- Área tratada não pode superar a área plantada conhecida.
- Unidade deve ser texto não vazio com até 30 caracteres.
- Não confundir quantidade total utilizada com dose por área.
- O sistema registra a ação; não calcula dose nem emite prescrição automaticamente.

### 5.12 avaliacoes_tratamento

**Obrigatórios:** _id, tratamentoId, registradoPor, dataAvaliacao, resultado, observacoes, criadoEm e atualizadoEm.

**Opcional:** monitoramentoId.

**Resultados permitidos:**

- melhora_observada.
- sem_mudanca.
- piora_observada.
- inconclusivo.

**Regras:**

- Tratamento e autor devem existir.
- Avaliação não pode anteceder a aplicação.
- Avaliação não pode ser futura.
- Se houver monitoramento, ele deve ser compatível com a plantação e, quando informada, com a ocorrência do tratamento.
- O monitoramento utilizado deve ter data entre a aplicação e a avaliação.
- Resultado representa observação, sem comprovação automática de eficácia.

### 5.13 alertas

Regra de geração definida para o MVP; esta documentação não comprova implementação.

As intensidades permanecem `baixa`, `media` e `alta`. A aplicação gera um alerta somente no cadastro de uma ocorrência com intensidade `alta`, com tipo `ocorrencia_intensidade_alta`. O destinatário é o responsável pela propriedade, obtido pelo vínculo ocorrência → plantação → talhão → propriedade → usuário responsável. O contexto é a ocorrência cadastrada. A exibição ocorre somente dentro do aplicativo, sem envio por e-mail, SMS ou notificação push. Deve existir apenas um alerta desse tipo por ocorrência, inclusive em tentativas repetidas. Alterações posteriores de intensidade e registros de monitoramento não geram esse alerta. A aplicação gera o alerta; o MongoDB apenas o armazena e aplica as restrições configuradas.

**Obrigatórios:** _id, usuarioId, tipo, titulo, mensagem, prioridade, contexto e criadoEm.

**Opcionais:** lidoEm e expiraEm.

**Dentro de contexto:** tipo e id são obrigatórios.

**Valores:**

- contexto.tipo: ocorrencia para o tipo inicial definido.
- prioridade: baixa, media ou alta.
- tipo: ocorrencia_intensidade_alta. Novos tipos exigem definição de sua finalidade e regra.
- O alerta `ocorrencia_intensidade_alta` terá `prioridade: "alta"`. Essa prioridade reflete a intensidade informada pelo produtor; não representa diagnóstico ou classificação técnica de risco. Este registro não representa aprovação coletiva da equipe. Os valores gerais de prioridade existentes são preservados, mas este tipo de alerta deve usar somente `alta`.

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

### 5.13.1 Prevenção de alertas duplicados

- A identidade deste evento é a combinação de `tipo`, `contexto.tipo` e `contexto.id`, sem `usuarioId`: trocar o destinatário não deve permitir um segundo alerta para a mesma ocorrência.
- A aplicação deverá usar essa combinação como filtro de um upsert com `$setOnInsert`, preenchendo o alerta somente se ainda não existir. A operação é uma proposta de implementação futura, não executada aqui. Repetições não deverão apagar `lidoEm` ou reescrever um alerta existente.
- Uma consulta de existência seguida de inserção não impede duplicidade em operações concorrentes. Um índice único parcial deverá garantir essa restrição no banco; a aplicação deverá tratar o conflito de duplicidade como evento já registrado, sem esconder outros erros.
- O índice cobre somente documentos com `tipo: "ocorrencia_intensidade_alta"` e `contexto.tipo: "ocorrencia"`. Antes de aplicá-lo, auditar duplicidades existentes; não apagar documentos automaticamente.
- A restrição garante no máximo um alerta, mas não garante sua geração. A aplicação deverá prever falhas entre salvar a ocorrência e salvar o alerta, com repetição segura do mesmo evento de cadastro; não deve varrer ocorrências antigas como novos eventos nem gerar alertas em simples edições. O mecanismo de recuperação ainda precisa ser definido na implementação.

## 6. Limites de listas

Os limites de listas são os definidos abaixo, mantendo a obrigatoriedade existente. A revisão coletiva permanece pendente.

Listas opcionais continuam opcionais; seus limites se aplicam quando forem preenchidas. Para `questionario.problemasFrequentes`, permanecem de 1 a 2 respostas no questionário concluído, sem repetições, com `nao_identificado` selecionado somente sozinho, conforme a seção 5.2.

| Lista | Limite |
|---|---|
| imagens | Até 5 |
| questionario.culturasIds | Até 50 |
| questionario.problemasFrequentes | 1 a 2 no questionário concluído; regra definida conforme a tela, detalhada na seção 5.2 |
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

## 7. MongoDB Schema Validation

### 7.1 Configuração de validação

A estrutura mínima de cada coleção será validada com `$jsonSchema` e as configurações abaixo. A revisão coletiva permanece pendente.

Configuração definida:

- `validationLevel: "strict"`.
- `validationAction: "error"`.

Isso faz com que inserções e atualizações inválidas sejam rejeitadas. Antes da aplicação na BD5, os documentos existentes deverão ser conferidos. Não apagar nem corrigir dados automaticamente; inconsistências encontradas deverão ser registradas para análise. Aplicar um validator não corrige retroativamente os dados. A definição documentada não comprova aplicação no banco.

### 7.2 Recursos previstos

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

#### 7.2.1 Campos extras serão bloqueados

Os schemas usarão `additionalProperties: false`, substituindo a proposta anterior de permitir campos adicionais. Este registro não representa aprovação coletiva da equipe nem aplicação no Atlas.

- Declarar em `properties` todos os campos legítimos descritos na BD3: `_id`, datas e campos opcionais ou condicionais. A obrigatoriedade existente permanece definida por `required` e pelas condições documentadas; declarar um campo não o torna obrigatório.
- Aplicar o fechamento separadamente ao documento principal e a cada objeto incorporado: termos, questionario, fotoPerfil, imagem e contexto. Cada objeto deve declarar seus respectivos campos conforme a BD3.
- Nos arrays `imagens` e `formasControle`, declarar em `items` o schema de cada objeto, com `bsonType: "object"`, `properties`, `required` conforme a definição existente e `additionalProperties: false`. O fechamento do documento principal não se propaga automaticamente.
- Objetos incorporados e itens de arrays não recebem `_id` ou datas adicionais automaticamente. A BD3, seção 6.13, lista seus campos permitidos. Os marcadores Extended JSON dos exemplos não são campos extras a autorizar.
- Arrays de Strings ou ObjectIds mantêm as validações de seus itens, sem `additionalProperties` em valores escalares. As demais regras, incluindo problemasFrequentes, permanecem inalteradas.
- Antes da aplicação na BD5, conferir também campos extras nos documentos e objetos existentes. Registrar inconsistências para análise, sem apagar documentos, remover campos ou corrigir dados automaticamente. Campos legítimos ainda não documentados devem ser discutidos antes de alterar o schema.
- A aplicação continua responsável por controlar os campos recebidos; isso não substitui o bloqueio no banco.

### 7.3 Exemplo ilustrativo

Exemplo ilustrativo de validador para talhoes, incluindo todos os campos permitidos pela BD3. `observacoes` permanece opcional; `_id`, `criadoEm` e `atualizadoEm` estão declarados e continuam obrigatórios.

O padrão `"\\S"` exige pelo menos um caractere que não seja espaço, complementando os limites de tamanho. A aplicação continua responsável pela normalização dos textos conforme a seção 4.3.

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


## 8. Referências e integridade

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

### 8.1 Criação

- O documento referenciado precisa existir antes da vinculação.
- Criar pai antes do filho.
- Para novos registros, conferir a situação dos cadastros relacionados.

### 8.2 Exclusão e desativação

As regras de exclusão e preservação são as definidas abaixo. A revisão coletiva permanece pendente e não há comprovação de implementação:

- Não realizar exclusão física de documentos que possuam dependentes.
- Desativar propriedades, talhões, culturas e problemas agrícolas já utilizados, usando os campos existentes e preservando vínculos e histórico.
- Permitir excluir cadastros feitos por engano somente quando não tiverem dependentes, após a aplicação conferir autorização e vínculos. Essa permissão não substitui as restrições específicas de preservação abaixo.
- Encerrar plantações ao finalizar o cultivo, preservando os registros relacionados.
- Encerrar ocorrências com data (`encerradoEm`) e motivo (`motivoEncerramento`) obrigatórios, conforme a seção 5.9. Encerramento significa finalização do acompanhamento, sem comprovar resolução do problema.
- Preservar monitoramentos, tratamentos e avaliações, permitindo correções autorizadas, sem exclusão comum nesta versão, mesmo que não tenham dependentes.
- Exclusão de conta indisponível nesta versão. A política de tratamento de dados pessoais permanece pendente, sem autorizar remoção ou anonimização automática.
- A aplicação verifica autorização, referências, dependentes e transições de status. O MongoDB valida estrutura e valores permitidos; o Schema Validation não confere a existência de dependentes em outras coleções. Não criar campos novos sem necessidade.

### 8.2.1 Requisitos planejados para dados pessoais

Estes são requisitos planejados, sem comprovação de controles implementados ou de política de privacidade concluída. CPF e telefone serão utilizados somente nas finalidades documentadas de cadastro e autenticação. O acesso aos dados pessoais será restrito ao próprio usuário e a pessoas autorizadas, conforme a função e a necessidade. CPF e telefone não deverão constar em alertas nem em logs da aplicação. Exemplos, testes e massa de dados deverão utilizar dados fictícios. A exclusão de conta ficará indisponível no aplicativo nesta versão. A política de retenção, anonimização e atendimento a solicitações de exclusão permanece pendente; a ausência de exclusão automática não autoriza armazenamento permanente.

A aplicação deverá aplicar as verificações de acesso e impedir a inclusão de CPF e telefone em alertas e logs, inclusive mensagens de erro. A validação estrutural do MongoDB não comprova que esses controles existem nem garante que valores pessoais não sejam incluídos em textos livres. Estas regras não autorizam remoção ou anonimização automática dos dados existentes.

### 8.3 Referências inválidas encontradas

- Não ignorar silenciosamente o erro.
- Registrar a inconsistência para correção.
- Retornar mensagem controlada à aplicação.
- Não apagar automaticamente registros filhos.
- Distinguir cadastro inativo de cadastro inexistente.

Se o sistema permitir exclusões concorrentes, as verificações deverão ser coordenadas para evitar referências órfãs. Uma consulta de existência isolada não garante integridade diante de alterações simultâneas.

## 9. Índices iniciais

O conjunto de índices iniciais é o definido abaixo, incluindo o índice único de usuarios.firebaseUid, os índices das consultas previstas e o índice único parcial para impedir duplicidade do alerta ocorrencia_intensidade_alta. A ordem dos campos, as opções e as justificativas permanecem inalteradas. Os índices candidatos da seção 9.1 continuam fora da criação inicial. Este registro não representa aprovação coletiva da equipe, implementação no Atlas ou desempenho comprovado.

| Coleção | Campos | Tipo | Objetivo e justificativa |
|---|---|---|---|
| Todas | _id | Único, padrão | Identificar documentos; já fornecido pelo MongoDB |
| usuarios | firebaseUid: 1 | Simples e único | Localizar perfil após login e impedir duplicidade de conta |
| propriedades | usuarioId: 1, ativa: 1 | Composto | Listar propriedades do responsável e filtrar situação |
| talhoes | propriedadeId: 1, ativo: 1 | Composto | Listar áreas da propriedade e filtrar situação |
| plantacoes | talhaoId: 1, status: 1, safra: 1 | Composto | Consultar cultivos do talhão com filtros |
| plantacoes | talhaoId: 1 | Simples, único e parcial; filtro status: ativa | Garantir no máximo uma plantação ativa por talhão, inclusive em operações concorrentes |
| problemas_agricolas | culturasAfetadasIds: 1, ativo: 1 | Composto multikey | Consultar problemas ativos de uma cultura |
| ocorrencias | plantacaoId: 1, dataObservacao: -1, _id: -1 | Composto | Histórico de uma plantação em ordem recente |
| monitoramentos | ocorrenciaId: 1, dataObservacao: -1, _id: -1 | Composto | Evolução cronológica da ocorrência |
| monitoramentos | plantacaoId: 1, dataObservacao: -1, _id: -1 | Composto | Histórico de inspeções, inclusive sem ocorrência |
| tratamentos | ocorrenciaId: 1, dataAplicacao: -1, _id: -1 | Composto | Listar medidas por ocorrência |
| avaliacoes_tratamento | tratamentoId: 1, dataAvaliacao: -1, _id: -1 | Composto | Consultar avaliações do tratamento |
| alertas | usuarioId: 1, criadoEm: -1, _id: -1 | Composto | Listar avisos recentes do responsável pela propriedade |
| alertas | tipo: 1, contexto.tipo: 1, contexto.id: 1 | Composto, único e parcial | Garantir apenas um alerta ocorrencia_intensidade_alta por ocorrência, inclusive com concorrência |

1 significa ordem crescente; -1 significa decrescente.

_id participa dos históricos como desempate para uma ordenação estável.

**Ajuste inicial de integridade para alertas:** o índice único sobre `{ tipo: 1, "contexto.tipo": 1, "contexto.id": 1 }` terá `partialFilterExpression: { tipo: "ocorrencia_intensidade_alta", "contexto.tipo": "ocorrencia" }`. Seu objetivo é impedir duplicidade do evento, não substituir o índice de listagem por destinatário. A consulta de verificação usa igualdade nesses três campos; o upsert usará o mesmo filtro. É um índice inicial de integridade, não um índice candidato dependente de ganho de desempenho. Nenhum índice foi criado nesta etapa.

**Integridade das plantações ativas:** em `plantacoes`, definir chave `{ talhaoId: 1 }`, opção `unique: true` e `partialFilterExpression: { status: "ativa" }`. Somente plantações ativas participam da restrição; várias encerradas no mesmo talhão permanecem permitidas. A finalidade é de integridade, não depende de ganho de desempenho comprovado e não substitui automaticamente o índice composto `{ talhaoId: 1, status: 1, safra: 1 }` das consultas. Trata-se de índice inicial, não candidato.

Antes de criá-lo na BD5, conferir se existem duas ou mais plantações ativas para o mesmo `talhaoId`. Se houver, registrar os conflitos para análise antes da criação, sem corrigir, excluir ou encerrar documentos automaticamente. Esta definição não comprova criação do índice no Atlas.

## 9.1 — Índices candidatos
São possibilidades para avaliar nos testes, não configurações obrigatórias agora.

1. Ocorrências por situação

Exemplo: mostrar somente as ocorrências abertas de uma plantação, começando pelas mais recentes.

O índice reúne:
- plantacaoId: identifica a plantação.
- status: seleciona abertas, em acompanhamento ou encerradas.
- dataObservacao: organiza por data.
- _id: desempata registros com a mesma data.
Só adicionaríamos esse índice se essa consulta fosse frequente e precisasse melhorar.

2. Alertas não lidos

Exemplo: mostrar os alertas não lidos de um destinatário, começando pelos mais recentes.

O índice combina usuário, leitura e data. Precisamos testar se ele ajuda a consulta que procura a ausência de lidoEm.

3. Plantações por safra

Exemplo: mostrar todas as plantações da safra 2026/2027 do Talhão A, independentemente da situação.

Esse índice seria avaliado se essa busca fosse frequente e o índice já planejado não fosse suficiente.

Nos índices, 1 significa ordem crescente e -1 significa decrescente. Não representam quantidade.

### 9.2 Índices não previstos inicialmente

- Não criar índice simples adicional em um campo já atendido pelo prefixo de um índice composto, sem justificativa.
- Não indexar todos os campos de referência por padrão.
- Não criar índice em fontesIds sem consulta reversa confirmada.
- fontes_conhecimento utiliza inicialmente o índice padrão de _id.
- Não criar índice único para telefone. Não criar outros índices em telefone ou CPF sem necessidade de consulta e regra confirmada; CPF também permanece sem índice único na configuração inicial.
- Não criar unicidade de nomes sem decisão de negócio.
- Não criar índice em status isoladamente por padrão.
- Não criar índice de texto sem requisito de pesquisa definido.
- Não criar TTL em expiraEm sem política de remoção aprovada.

### 9.3 Custo dos índices

Índices ocupam armazenamento adicional além dos documentos. Seu tamanho depende do número de documentos, valores indexados e quantidade de chaves; no multikey, um documento pode gerar várias entradas por causa dos itens do array. Também disputam espaço no cache. Não há estimativa numérica medida nesta etapa.

- **Inserção:** além de salvar o documento, o MongoDB precisa incluir as entradas nos índices aplicáveis e verificar restrições únicas.
- **Atualização:** quando valores indexados mudam, suas entradas precisam ser atualizadas. A entrada ou saída de um filtro parcial também exige manutenção; nem toda atualização altera todos os índices.
- **Exclusão:** remover um documento também exige remover suas entradas dos índices.
- **Criação:** construir um índice sobre dados existentes exige leitura dos dados, processamento e armazenamento, devendo ter execução planejada.

O benefício esperado nas consultas deve ser comparado com esse custo. Evitar índices redundantes ou sem consulta justificada. Índices únicos também atendem à integridade, mesmo quando não houver ganho de tempo demonstrado. Não criar candidatos automaticamente. Na futura avaliação, registrar tamanho total e por índice antes/depois e, quando viável no ambiente de teste, comparar lotes equivalentes de inserções, atualizações e exclusões com a mesma massa sintética. Não realizar esses ensaios no banco principal.

## 10. Decisão de escopo: geolocalização adiada

A geolocalização foi adiada para uma versão futura para reduzir o escopo do MVP e priorizar as funcionalidades principais. Município e estado da propriedade permanecem no modelo. Detalhes descritivos podem utilizar os campos de observações já existentes, sem criar novos campos.

O MVP não prevê armazenamento de coordenadas geográficas, validações desses dados ou índices geoespaciais. Uma eventual inclusão futura exigirá nova definição do modelo, das validações e das consultas, sem prever índices nesta etapa. Esta decisão documental não remove dados existentes do banco.

## 11. Desempenho

### 11.1 Consultas prioritárias

- Perfil por firebaseUid.
- Propriedades do produtor.
- Talhões da propriedade.
- Plantações por talhão.
- Problemas por cultura.
- Histórico de ocorrências.
- Evolução dos monitoramentos.
- Tratamentos e avaliações.
- Alertas do responsável pela propriedade.

### 11.1.1 Possibilidades futuras de análise de áreas

A análise da distribuição das áreas e os indicadores de área afetada são possibilidades futuras. Não representam funcionalidades implementadas ou requisitos desta versão e não autorizam novos campos, cálculos, índices ou restrições automaticamente. Eventuais indicadores deverão ter sua definição e interpretação discutidas antes da implementação; não somar registros de área afetada como se representassem necessariamente áreas distintas.

### 11.2 Estratégia de listagem

- Paginar históricos.
- Proposta inicial: 20 registros por página e máximo de 100.
- Utilizar ordenação por data e _id.
- Preferir paginação por cursor em históricos grandes.
- Retornar apenas os campos necessários.
- Não carregar todo o histórico para montar uma tela simples.


### 11.3 Plano futuro de avaliação com explain

Para cada índice inicial da seção 9, preparar a consulta correspondente abaixo e usar `explain("executionStats")`. Esta seção é um plano documental, sem comandos executáveis preparados e sem resultados medidos. Os nomes terminados em Id representam parâmetros BSON ObjectId existentes na massa de teste, não valores fictícios para inserir agora.

| Coleção / índice | Filtro da consulta de uso | Ordenação |
|---|---|---|
| Todas / _id padrão | `{ _id: documentoId }` | Nenhuma; limite 1. |
| usuarios / firebaseUid | `{ firebaseUid: uid }` | Nenhuma; limite 1. |
| propriedades / usuarioId, ativa | `{ usuarioId: responsavelId, ativa: true }` | Nenhuma. |
| talhoes / propriedadeId, ativo | `{ propriedadeId: propriedadeId, ativo: true }` | Nenhuma. |
| plantacoes / talhaoId, status, safra | `{ talhaoId: talhaoId, status: "ativa", safra: safra }` | Nenhuma. |
| plantacoes / único parcial em talhaoId | `{ talhaoId: talhaoId, status: "ativa" }` | Nenhuma; localizar a plantação ativa do talhão. |
| problemas_agricolas / culturasAfetadasIds, ativo | `{ culturasAfetadasIds: culturaId, ativo: true }` | Nenhuma. |
| ocorrencias / plantacaoId, dataObservacao, _id | `{ plantacaoId: plantacaoId }` | `{ dataObservacao: -1, _id: -1 }`. |
| monitoramentos / ocorrenciaId, dataObservacao, _id | `{ ocorrenciaId: ocorrenciaId }` | `{ dataObservacao: -1, _id: -1 }`. |
| monitoramentos / plantacaoId, dataObservacao, _id | `{ plantacaoId: plantacaoId }` | `{ dataObservacao: -1, _id: -1 }`. |
| tratamentos / ocorrenciaId, dataAplicacao, _id | `{ ocorrenciaId: ocorrenciaId }` | `{ dataAplicacao: -1, _id: -1 }`. |
| avaliacoes_tratamento / tratamentoId, dataAvaliacao, _id | `{ tratamentoId: tratamentoId }` | `{ dataAvaliacao: -1, _id: -1 }`. |
| alertas / usuarioId, criadoEm, _id | `{ usuarioId: responsavelId }` | `{ criadoEm: -1, _id: -1 }`. |
| alertas / índice único parcial | `{ tipo: "ocorrencia_intensidade_alta", "contexto.tipo": "ocorrencia", "contexto.id": ocorrenciaId }` | Nenhuma; verificar identidade do evento. |

Manter o mesmo filtro, projeção, ordenação e limite nas fases comparadas. Nas listagens, documentar o limite utilizado, tomando 20 como proposta ainda não aprovada de paginação. Não usar `hint` na verificação inicial: observar a escolha natural do otimizador.

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

### 11.4 Comparação antes/depois em banco separado

1. Após a massa da BD6, preparar banco de teste separado do `sentinela`, com dados sintéticos e volume, distribuição e seletividade representativos. Não copiar dados pessoais nem criar massa nesta etapa.
2. Preparar uma linha de base em banco novo, com as mesmas coleções e dados e apenas os índices padrão. Se o banco de teste já tiver outros índices, preparar outro banco; não remover índices do banco principal para simular a linha de base. Não conectar a aplicação a esse laboratório sem restrições de integridade.
3. Registrar consultas e todas as métricas da seção 11.3 na fase antes. Preservar os dados durante a comparação.
4. Após a conferência prévia dos dados e do ambiente, criar os índices iniciais definidos na seção 9 no ambiente de teste e repetir exatamente as consultas na fase depois. Os candidatos continuam fora da configuração automática.
5. Manter recursos, carga e condições comparáveis; identificar aquecimento de cache e fazer múltiplas amostras por fase. Registrar tempos sem ocultar variações e analisar também os planos e o trabalho examinado.
6. Registrar tamanho dos índices e executar os testes de integridade separados das medições de leitura. Ensaios de escrita devem usar cópias equivalentes da massa sintética, para não alterar os dados entre as consultas comparadas.
7. Relatar benefício, ausência de benefício ou regressão somente com evidência. Os testes com volume representativo dependem da BD6; não há valores de desempenho ou melhorias comprovadas nesta documentação.

## 12. Tratamento de erros na aplicação

- Dados inválidos: mensagem de validação com campos identificados.
- Usuário não autenticado: rejeitar operação.
- Usuário sem autorização: negar acesso.
- Documento não encontrado: retornar erro controlado.
- firebaseUid duplicado: tratar conflito sem expor detalhes internos do banco.
- Falha do Cloudinary: informar falha e permitir tentativa controlada.
- Não retornar URI, credenciais, stack trace ou informações internas ao aplicativo.



## 13. Casos de teste futuros e resultados esperados

Esta é uma matriz documental para execução futura em banco isolado e, quando indicado, no fluxo da aplicação. Não comprova execução. Usar um documento válido de cada coleção como base e alterar somente o campo sob teste. Repetir os testes gerais nas 12 coleções, cobrindo os objetos incorporados presentes. Não exigir implementar agora um sistema de testes ou o backend.

| Caso | Camada responsável | Resultado esperado |
|---|---|---|
| Documento com campos e tipos válidos; opcionais ausentes | MongoDB | Aceitar após configuração do validator; a ausência do opcional não é erro. |
| Omitir um campo obrigatório ou um obrigatório interno de objeto presente | MongoDB | Rejeitar a gravação. |
| Campo conhecido com tipo incorreto, inclusive referência em String em vez de ObjectId | MongoDB | Rejeitar. |
| Enviar null em campo sem tipo null, inclusive opcional | MongoDB | Rejeitar; omitir o campo quando não houver informação. |
| Texto vazio ou somente espaços | MongoDB para a restrição de conteúdo; aplicação para normalização | Rejeitar no banco após implementação dessa restrição; a aplicação também rejeita após remover espaços nas extremidades. minLength sozinho não cobre espaços. |
| Texto no mínimo/máximo definido e fora do limite | MongoDB | Aceitar os limites inclusivos e rejeitar valores menores/maiores, quando o campo estiver presente. Incluir os limites específicos definidos em 4.3.1; não inventar maxLength para publicId, conforme 4.3.2. |
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
| Áreas informadas sem coordenadas; área total diferente da cultivada | Banco e aplicação | Não exigir coordenadas nem igualdade entre área total e cultivada; preservar as verificações existentes de compatibilidade. |
| Porte declarado pequena, media ou grande, independentemente da área ou quantidade de propriedades | MongoDB e aplicação | Aceitar o valor permitido sem cálculo por área ou classificação oficial; não restringir área ou quantidade de propriedades com base nessa resposta. |
| problemasFrequentes válido | MongoDB | Aceitar pragas, doencas ou nao_identificado isolados e pragas/doencas juntos, em qualquer ordem. |
| problemasFrequentes vazio, repetido, com 3 itens ou nao_identificado combinado | MongoDB | Rejeitar as combinações inválidas no questionário concluído. |
| Área zero ou negativa; enum não previsto; data como String | MongoDB | Rejeitar conforme tipo e limites. |
| ObjectId bem formado apontando a documento inexistente ou de contexto incompatível | Aplicação | Rejeitar o vínculo; o banco não verifica existência entre coleções automaticamente. |
| Exclusão de documento com dependentes; referência inválida encontrada | Aplicação | Impedir exclusão com dependentes conforme as regras da seção 8.2; registrar inconsistência sem apagar filhos automaticamente. Monitoramentos, tratamentos e avaliações não têm exclusão comum; exclusão de conta indisponível. |
| Campos condicionais de encerramento, acessadoEm com URL e quantidade/unidade | MongoDB nas condições estruturais; aplicação antes de salvar | Rejeitar falta de campos exigidos pela condição; impedir campos de encerramento quando a regra exige ausência. |
| Datas em ordem inválida ou futura onde proibida; área superior à área relacionada | Aplicação | Rejeitar conforme as comparações documentadas; o schema básico não consulta outros documentos nem aplica as comparações temporais. |
| Duas plantações ativas para o mesmo talhão, inclusive cadastros ou ativações concorrentes | Aplicação e MongoDB após criação do índice único parcial | A aplicação verifica a regra; o índice permite no máximo uma ativa e rejeita o conflito. Não encerrar ou excluir a outra automaticamente. |
| Plantação atual encerrada e novo cultivo no mesmo talhão | Aplicação e MongoDB | Permitir nova plantação ativa se as demais regras forem atendidas, preservando o histórico das encerradas e a relação histórica 1:N. |
| Conferência antes de criar o índice único parcial de plantacoes | Auditoria da BD5 | Registrar ativas duplicadas por talhão e interromper a criação para análise, sem corrigir ou excluir dados automaticamente. |
| firebaseUid duplicado | MongoDB, após criação do índice único definido na seção 9; aplicação trata erro | Rejeitar a segunda identidade duplicada; retornar conflito controlado. Não presumir índice já criado. |
| Cadastro de ocorrência alta e repetição do mesmo evento, inclusive concorrente | Aplicação e MongoDB após criação do índice definido na seção 9 | Exatamente um alerta do tipo para a ocorrência; destinatário responsável e contexto corretos; repetição preserva lidoEm. O alerta deve ter prioridade alta, sem diagnóstico ou classificação técnica de risco. Não executar esse cenário de ponta a ponta antes de definir a recuperação de falhas. |
| Ocorrência cadastrada com intensidade baixa/media, edição para alta ou monitoramento alto | Aplicação | Não gerar esse alerta; geração restrita ao evento de cadastro de ocorrência alta. |
| Objeto de imagem sem publicId, com tipo diferente de String, vazio ou somente espaços | MongoDB | Rejeitar; a ausência de uma imagem opcional continua permitida. |
| publicId retornado pelo Cloudinary | Aplicação | Armazenar exatamente o valor recebido, sem trim ou regras de URL; não rejeitar por máximo arbitrário. |
| Dois objetos de imagem com mesmo publicId e outros metadados diferentes | Aplicação | Rejeitar repetição do recurso; uniqueItems sobre objetos completos não resolve esse caso sozinho. |
| Acesso a dados pessoais por outro usuário sem autorização ou sem necessidade para sua função | Aplicação, em testes futuros com dados fictícios | Negar acesso; permitir somente ao próprio usuário ou a pessoas autorizadas conforme função e necessidade. Controle planejado, ainda não comprovado. |
| Geração de alertas ou logs, inclusive de erro | Aplicação, em testes futuros com dados fictícios | Não incluir CPF ou telefone. Conferir os textos e registros produzidos, não somente os campos do schema. |
| Exclusão de conta pelo aplicativo nesta versão | Aplicação | Operação indisponível; não interpretar essa indisponibilidade como permissão de retenção permanente. |
| Conferência dos documentos existentes antes de strict/error e fechamento dos objetos | Auditoria planejada da BD5 | Registrar documentos/campos incompatíveis e solicitar análise; não apagar nem corrigir automaticamente. |
| Índices e consultas da seção 11.3 | Conferência de estrutura e avaliação no banco de teste | Conferir definição, ordem, unicidade e filtro parcial conforme as definições da seção 9; registrar plano/métricas reais, sem exigir ganho de tempo como resultado obrigatório. |

## 14. Cobertura documental e decisões ainda pendentes

A tabela abaixo cobre os requisitos fornecidos nesta revisão. Não equivale a aprovação coletiva, comprovação de implementação ou encerramento da BD4.

| Requisito | Seção que atende | Situação |
|---|---|---|
| Obrigatoriedade, tipos, formatos e limites por coleção | 4, 5, 6 e BD3 seção 6 | Documentado, incluindo os limites definidos em 4.3.1; telefone definido em 5.1 e publicId definido em 4.3.2, sem máximo arbitrário. |
| Ausência, vazio e null | 4.1, 4.3 e 13 | Documentado. |
| ObjectId, existência, compatibilidade e exclusões | 3, 4.2, 5 e 8 | Documentado: exclusão e preservação definidas em 8.2; exclusão de conta indisponível. Política de dados pessoais ainda pendente. |
| Responsabilidades do banco e da aplicação | 3, 5, 7 e 13 | Documentado. |
| Bloqueio de campos extras, objetos e itens de arrays | 7.2.1 e BD3 seção 6.13 | Documentado; revisão coletiva pendente. |
| Coleção, campos ordenados, tipo e justificativa dos índices | 9 | Documentado: conjunto inicial definido, sem aprovação coletiva ou comprovação de execução. |
| Armazenamento e manutenção dos índices | 9.3 | Documentado, sem medições realizadas. |
| Plano explain, métricas e comparação isolada | 11.3 e 11.4 | Documentado para execução futura, dependente de massa representativa da BD6. |
| Casos de teste e resultados esperados | 13 | Documentado; testes não executados. |
| Limites e configuração de validação | 4.3, 6, 7.1 e 7.2.1 | Documentado, incluindo os sete limites específicos definidos em 4.3.1, com índices iniciais definidos separadamente na seção 9, sem definir limite máximo para publicId. |
| Prioridade do alerta ocorrencia_intensidade_alta | 5.13 | Documentado: alta, sem aprovação coletiva e sem significado de diagnóstico ou risco técnico. |
| Finalidade, acesso e não exposição de CPF/telefone | 8.2.1 e 13 | Requisitos planejados documentados; controles não comprovados e política de privacidade não concluída. |
| Revisão coletiva | Definições documentadas não substituem a revisão da equipe | Pendente; nenhuma aprovação coletiva declarada. |

### 14.1 Decisões de estrutura antes da configuração correspondente na BD5

- Preservar o conjunto de índices iniciais definido na seção 9, incluindo ordem dos campos, opções únicas e filtro parcial de alertas. Os candidatos não fazem parte da criação inicial.
- Usar os limites definidos em 4.3 e 4.3.1. Aplicar o formato de telefone definido em 5.1. Aplicar a regra de publicId definida em 4.3.2, preservando o valor do serviço, sem limite máximo arbitrário. Uma eventual necessidade de limite exige consulta prévia à documentação oficial do Cloudinary.
- Conferir o estado dos dados e configurações existentes antes de aplicar validação ou índices, sem modificações automáticas corretivas. Esta é uma condição de execução; strict/error já está definido.
- Submeter a documentação à revisão coletiva ainda pendente, registrando o resultado sem presumir concordância.

### 14.2 Detalhes da futura implementação

A prioridade do alerta `ocorrencia_intensidade_alta` está definida como `alta`, conforme a seção 5.13, e não está mais pendente. A recuperação de falhas na geração, a viabilidade de SMS/e-mail, a implementação da normalização e da conferência de DDD conforme a regra de telefone já definida, a paginação e a convenção de datas sem horário são detalhes a resolver nos fluxos da aplicação, sem alterar o backend nesta tarefa. A política de exclusão e preservação está definida em 8.2, com exclusão de conta indisponível. A política de tratamento de dados pessoais e a retenção de alertas permanecem pendentes; não criar TTL ou novas unicidades para antecipá-las. A decisão de adiar geolocalização permanece preservada.

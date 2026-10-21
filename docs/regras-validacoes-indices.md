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

Limites propostos:

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

O backend remove espaços nas extremidades e rejeita conteúdo vazio. Nomes de pessoas não devem ser limitados somente a letras sem acentos.

### 4.4 Números

- Áreas e quantidades informadas devem ser finitas e maiores que zero.
- Área de talhão não pode superar a área total da propriedade, quando conhecida.
- Área plantada não pode superar a área do talhão.
- Área afetada e área tratada não podem superar a área plantada, quando conhecida.
- A soma dos talhões ativos deve ser compatível com a propriedade, se forem áreas sem sobreposição.
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

### 4.6 Localização

- latitude: Number entre -90 e 90.
- longitude: Number entre -180 e 180.
- Exigir as duas coordenadas quando localizacao existir.
- Não criar coordenadas fictícias quando o GPS não estiver disponível.
- O ponto não representa o contorno da propriedade ou talhão.

### 4.7 Imagens

- url deve ser uma URL HTTPS válida.
- publicId deve ser texto não vazio.
- enviadaPor deve referenciar um usuário existente.
- enviadaEm deve ser Date.
- Foto de perfil: no máximo uma.
- Demais registros com imagens: proposta de até cinco.
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
- telefone, conforme protótipo.
- termos, com versao e aceitoEm.
- criadoEm.
- atualizadoEm.

**Opcionais ou condicionais:**

- fotoPerfil: opcional.
- cpf: condicionado à confirmação de necessidade.
- canalCodigoPreferido: condicionado à manutenção da funcionalidade.
- questionario: ausente até sua conclusão.

**Regras:**

- firebaseUid: texto não vazio, com até 128 caracteres e único.
- O backend obtém firebaseUid do token validado.
- Não permitir alteração do vínculo de um perfil para outra conta.
- Telefone armazenado como texto, normalizado com código do país.
- Para celular brasileiro, validar DDD e número; não usar tipo numérico.
- CPF, se mantido: texto com 11 dígitos, validação dos dígitos verificadores e rejeição de sequências inválidas.
- Validação de CPF não comprova identidade.
- Não definir CPF como único enquanto essa regra não for confirmada.
- canalCodigoPreferido: email ou sms.
- Aceite dos termos deve resultar de uma ação explícita do usuário.
- O backend registra a versão vigente e o momento do aceite.
- Senhas, confirmações e códigos não são armazenados.

### 5.2 Questionário incorporado

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
- problemasFrequentes: de um a dois itens, sem repetição.
- nao_identificado não pode aparecer junto com pragas ou doencas.
- Guardar o questionário completo, sem persistência parcial nesta proposta.
- A quantidade declarada não será comparada rigidamente ao número de itens do catálogo: uma opção como “Hortaliças” pode representar um grupo.
- Critérios de porte permanecem declaratórios até definição da equipe.

### 5.3 propriedades

**Obrigatórios:** _id, usuarioId, nome, municipio, estado, ativa, criadoEm e atualizadoEm.

**Opcionais:** areaTotalHa, localizacao e observacoes.

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

**Opcionais:** localizacao e observacoes.

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
- Não criar índice que limite a uma plantação ativa por talhão enquanto cultivos simultâneos não forem decididos.
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
- Fonte referenciada não pode ser excluída fisicamente.
- Antes do cadastro, conferir se a publicação já existe.
- Não impor unicidade apenas pelo título: publicações diferentes podem ter títulos iguais.

### 5.9 ocorrencias

**Obrigatórios:**

- _id, plantacaoId e registradoPor.
- tipo, dataObservacao, sintomas e intensidade.
- status, criadoEm e atualizadoEm.

**Opcionais:** problemaAgricolaId, areaAfetadaHa, localizacao e imagens.

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

**Transições propostas:**

- aberta → em_acompanhamento.
- aberta → encerrada.
- em_acompanhamento → encerrada.
- Reabertura não prevista inicialmente; se necessária, definir fluxo específico.

### 5.10 monitoramentos

**Obrigatórios:**

- _id, plantacaoId e registradoPor.
- dataObservacao, problemaObservado e observacoes.
- criadoEm e atualizadoEm.

**Opcionais:** ocorrenciaId, evolucao, areaAfetadaHa, localizacao, imagens e proximaInspecaoEm.

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

Coleção condicionada à confirmação no MVP.

**Obrigatórios:** _id, usuarioId, tipo, titulo, mensagem, prioridade, contexto e criadoEm.

**Opcionais:** lidoEm e expiraEm.

**Dentro de contexto:** tipo e id são obrigatórios.

**Valores:**

- contexto.tipo: propriedade, plantacao, ocorrencia ou monitoramento.
- prioridade: baixa, media ou alta.
- Tipo inicial proposto: acompanhamento_pendente. Novos tipos exigem definição de sua finalidade e regra.

**Regras:**

- Destinatário e contexto devem existir.
- O destinatário deve estar autorizado a acessar o contexto.
- Cada alerta possui exatamente um contexto principal.
- lidoEm fica ausente até a leitura.
- lidoEm é preenchido pelo backend e não pode anteceder criadoEm.
- expiraEm, quando informado, deve ser posterior a criadoEm.
- Não utilizar regraOrigem.
- Não utilizar um booleano lido junto com lidoEm.
- Não apagar automaticamente alertas expirados enquanto não houver política de retenção.

## 6. Limites de listas

Propostas para aprovação:

| Lista | Limite |
|---|---|
| imagens | Até 5 |
| questionario.culturasIds | Até 50 |
| questionario.problemasFrequentes | 1 a 2 |
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

### 7.1 Decisão proposta

Utilizar $jsonSchema para validar a estrutura mínima de cada coleção.

Configuração prevista:

- validationLevel: strict.
- validationAction: error.

Isso faz com que inserções e atualizações inválidas sejam rejeitadas. Documentos existentes devem ser auditados antes da ativação; aplicar um validator não corrige retroativamente os dados.

### 7.2 Recursos previstos

- required: campos obrigatórios.
- bsonType: tipos aceitos.
- enum: valores permitidos.
- minLength e maxLength: limites de texto.
- minimum, maximum e exclusiveMinimum: limites numéricos.
- minItems e maxItems: quantidade de itens.
- uniqueItems: impedir repetições exatas em listas.
- properties e items: estrutura de objetos e arrays.

A exclusividade de publicId entre objetos de imagem será conferida pelo backend, pois objetos diferentes podem compartilhar o mesmo publicId.

Não utilizar additionalProperties: false inicialmente. Campos aceitos na API serão controlados pelo backend; o fechamento integral do schema poderá ser avaliado na implementação.

### 7.3 Exemplo ilustrativo

Fragmento de validador para talhoes.

```javascript
{
  $jsonSchema: {
    bsonType: "object",
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
        maxLength: 150
      },
      areaHa: {
        bsonType: ["int", "long", "double", "decimal"],
        minimum: 0,
        exclusiveMinimum: true
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

Proposta para preservar históricos:

- Não realizar exclusão física de documentos que possuam dependentes.
- Propriedades, talhões, culturas e problemas podem ser desativados pelos campos existentes.
- Plantações são encerradas.
- Ocorrências são encerradas.
- Monitoramentos, tratamentos e avaliações permanecem disponíveis no histórico.
- Registros sem dependentes podem ser excluídos por operação autorizada.
- Exclusão da conta e tratamento dos dados pessoais continuam pendentes de política específica.

### 8.3 Referências inválidas encontradas

- Não ignorar silenciosamente o erro.
- Registrar a inconsistência para correção.
- Retornar mensagem controlada à aplicação.
- Não apagar automaticamente registros filhos.
- Distinguir cadastro inativo de cadastro inexistente.

Se o sistema permitir exclusões concorrentes, as verificações deverão ser coordenadas para evitar referências órfãs. Uma consulta de existência isolada não garante integridade diante de alterações simultâneas.

## 9. Índices iniciais propostos

A ordem dos campos faz parte da definição do índice.

| Coleção | Campos | Tipo | Objetivo e justificativa |
|---|---|---|---|
| Todas | _id | Único, padrão | Identificar documentos; já fornecido pelo MongoDB |
| usuarios | firebaseUid: 1 | Simples e único | Localizar perfil após login e impedir duplicidade de conta |
| propriedades | usuarioId: 1, ativa: 1 | Composto | Listar propriedades do responsável e filtrar situação |
| talhoes | propriedadeId: 1, ativo: 1 | Composto | Listar áreas da propriedade e filtrar situação |
| plantacoes | talhaoId: 1, status: 1, safra: 1 | Composto | Consultar cultivos do talhão com filtros |
| problemas_agricolas | culturasAfetadasIds: 1, ativo: 1 | Composto multikey | Consultar problemas ativos de uma cultura |
| ocorrencias | plantacaoId: 1, dataObservacao: -1, _id: -1 | Composto | Histórico de uma plantação em ordem recente |
| monitoramentos | ocorrenciaId: 1, dataObservacao: -1, _id: -1 | Composto | Evolução cronológica da ocorrência |
| monitoramentos | plantacaoId: 1, dataObservacao: -1, _id: -1 | Composto | Histórico de inspeções, inclusive sem ocorrência |
| tratamentos | ocorrenciaId: 1, dataAplicacao: -1, _id: -1 | Composto | Listar medidas por ocorrência |
| avaliacoes_tratamento | tratamentoId: 1, dataAvaliacao: -1, _id: -1 | Composto | Consultar avaliações do tratamento |
| alertas | usuarioId: 1, criadoEm: -1, _id: -1 | Composto, condicionado ao MVP | Listar avisos recentes do destinatário |

1 significa ordem crescente; -1 significa decrescente.

_id participa dos históricos como desempate para uma ordenação estável.

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

Exemplo: mostrar os alertas não lidos da Julia, começando pelos mais recentes.

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
- Não criar índices em CPF ou telefone sem necessidade de consulta e regra confirmada.
- Não criar unicidade de nomes sem decisão de negócio.
- Não criar índice em status isoladamente por padrão.
- Não criar índice de texto sem requisito de pesquisa definido.
- Não criar TTL em expiraEm sem política de remoção aprovada.

## 10. Avaliação geoespacial

Não criar índice geoespacial inicialmente, pois a localização será usada como ponto de registro e exibição.

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
- Alertas, se incluídos.

### 11.2 Estratégia de listagem

- Paginar históricos.
- Proposta inicial: 20 registros por página e máximo de 100.
- Utilizar ordenação por data e _id.
- Preferir paginação por cursor em históricos grandes.
- Retornar apenas os campos necessários.
- Não carregar todo o histórico para montar uma tela simples.


## 12. Tratamento de erros na aplicação

- Dados inválidos: mensagem de validação com campos identificados.
- Usuário não autenticado: rejeitar operação.
- Usuário sem autorização: negar acesso.
- Documento não encontrado: retornar erro controlado.
- firebaseUid duplicado: tratar conflito sem expor detalhes internos do banco.
- Falha do Cloudinary: informar falha e permitir tentativa controlada.
- Não retornar URI, credenciais, stack trace ou informações internas ao aplicativo.


# BD3 — Modelagem das coleções do MongoDB

## 2. Objetivo

Transformar o modelo conceitual do Sentinela em uma estrutura adequada ao MongoDB, definindo coleções, documentos, campos, tipos, obrigatoriedade, referências e dados incorporados.

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

### 5.1 Localização

| Campo | Tipo | Obrigatório |
|---|---|---|
| latitude | Number | S |
| longitude | Number | S |

### 5.2 Imagem

| Campo | Tipo | Obrigatório |
|---|---|---|
| url | String | S |
| publicId | String | S |
| legenda | String | N |
| enviadaPor | ObjectId → usuarios | S |
| enviadaEm | Date | S |

Os arquivos ficam no Cloudinary. O MongoDB guarda somente os metadados.

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
| cpf | String | C — necessidade a confirmar |
| telefone | String | S, conforme protótipo |
| canalCodigoPreferido | String | C — funcionalidade a confirmar |
| fotoPerfil | Object de imagem | N |
| termos | Object | S |
| termos.versao | String | S |
| termos.aceitoEm | Date | S |
| questionario | Object | N — até conclusão |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

#### Campos de questionario

| Campo | Tipo | Obrigatório no objeto |
|---|---|---|
| versao | String | S |
| portePropriedade | String | S |
| quantidadeCulturas | String | S |
| culturasIds | Array<ObjectId> → culturas | S; pode estar vazio se outra cultura for informada |
| outraCultura | String | C — opção Outro |
| problemasFrequentes | Array<String> | S |
| frequenciaProblemas | String | S |
| identificaProblemasSozinho | String | S |
| concluidoEm | Date | S |

### 6.2 propriedades

**Objetivo:** armazenar propriedades e seus responsáveis.

**Identificador:** _id.

**Dados incorporados:** localização.

**Referência:** usuarioId → usuarios.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| usuarioId | ObjectId | S |
| nome | String | S |
| municipio | String | S |
| estado | String | S |
| areaTotalHa | Number | N |
| localizacao | Object de localização | N |
| observacoes | String | N |
| ativa | Boolean | S |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

### 6.3 talhoes

**Objetivo:** armazenar as áreas de cultivo de cada propriedade.

**Identificador:** _id.

**Dados incorporados:** localização.

**Referência:** propriedadeId → propriedades.

| Campo | Tipo | Obrigatório |
|---|---|---|
| _id | ObjectId | S |
| propriedadeId | ObjectId | S |
| nome | String | S |
| areaHa | Number | S |
| localizacao | Object de localização | N |
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

Ocorrências não serão incorporadas à plantação.

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
| informacoesDisseminacao | String | N |
| medidasPreventivas | Array<String> | S |
| formasControle | Array<Object> | S |
| orientacaoBuscaAgronomo | String | N |
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

**Referências:** os problemas armazenam fontesIds; a fonte não mantém uma lista inversa dos problemas.

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

**Dados incorporados:** localização e imagens.

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
| sintomas | String | S |
| intensidade | String | S |
| areaAfetadaHa | Number | N |
| localizacao | Object de localização | N |
| imagens | Array<Object de imagem> | N |
| status | String | S |
| encerradoEm | Date | C — ocorrência encerrada |
| motivoEncerramento | String | C — ocorrência encerrada |
| criadoEm | Date | S |
| atualizadoEm | Date | S |

### 6.9 monitoramentos

**Objetivo:** registrar inspeções e acompanhamentos.

**Identificador:** _id.

**Dados incorporados:** localização e imagens.

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
| localizacao | Object de localização | N |
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
| produtoUtilizado | String | N |
| quantidadeUtilizada | Number | C — se informar unidade |
| unidadeQuantidade | String | C — se informar quantidade |
| responsavelAplicacao | String | N |
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

**Situação:** inclusão condicionada à confirmação no MVP.

**Identificador:** _id.

**Dados incorporados:** contexto principal.

**Referências:**

- usuarioId → usuarios.
- contexto.id → documento da coleção indicada por contexto.tipo.

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

contexto.tipo pode representar propriedade, plantacao, ocorrencia ou monitoramento.

## 7. Exemplos de documentos

Os exemplos são fictícios e utilizam Extended JSON:

- $oid representa ObjectId.
- $date representa Date.

Eles não são comandos de inserção nem massa de dados definitiva. As datas foram simplificadas para demonstrar a estrutura.

### 7.1 usuarios

```json
{
  "_id": {"$oid": "000000000000000000000001"},
  "firebaseUid": "uid_produtor_teste",
  "nomeCompleto": "Produtor Teste",
  "telefone": "19999999999",
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
    "problemasFrequentes": ["pragas"],
    "frequenciaProblemas": "as_vezes",
    "identificaProblemasSozinho": "nao",
    "concluidoEm": {"$date": "2026-10-20T12:05:00Z"}
  },
  "criadoEm": {"$date": "2026-10-20T12:00:00Z"},
  "atualizadoEm": {"$date": "2026-10-20T12:05:00Z"}
}

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
  "intensidade": "baixa",
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

```json
{
  "_id": {"$oid": "00000000000000000000000c"},
  "usuarioId": {"$oid": "000000000000000000000001"},
  "tipo": "acompanhamento_pendente",
  "titulo": "Acompanhar ocorrência",
  "mensagem": "Registre uma nova observação.",
  "prioridade": "baixa",
  "contexto": {
    "tipo": "ocorrencia",
    "id": {"$oid": "000000000000000000000008"}
  },
  "criadoEm": {"$date": "2026-10-22T12:00:00Z"}
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
| Incorporar localização | Informação pertencente ao registro |
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
| Remover regraOrigem | Ajuste solicitado por Julia |

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


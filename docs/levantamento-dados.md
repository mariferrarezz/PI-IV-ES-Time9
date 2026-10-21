# BD1 — Levantamento e definição dos dados do Sentinela

## 1. Objetivo

Identificar e documentar as informações que o Sentinela precisa armazenar para apoiar a gestão de propriedades, áreas de cultivo, plantações, problemas agrícolas, ocorrências, monitoramentos e medidas de controle.

Este levantamento registra os dados necessários, suas características, obrigatoriedade, origem e operações previstas. A definição técnica das coleções e dos documentos do MongoDB pertence à etapa BD3.

## 2. Base utilizada e limites do levantamento

Foram consideradas:

- As telas disponíveis de cadastro e questionário inicial.
- As funcionalidades previstas para o projeto.
- As decisões discutidas durante o levantamento.


## 3. Funcionalidades que utilizam o banco de dados

| Funcionalidade | Dados necessários |
|---|---|
| Cadastrar e editar perfil | Identificação do usuário, dados pessoais e aceite dos termos |
| Responder ao questionário | Perfil inicial de cultivo e dificuldades declaradas |
| Gerenciar propriedades | Identificação, localização, área e responsável |
| Gerenciar talhões | Áreas de cultivo pertencentes às propriedades |
| Registrar plantações | Cultura, talhão, safra e período de cultivo |
| Consultar banco de conhecimento | Problemas agrícolas, sintomas, prevenção, controle e fontes |
| Registrar ocorrências | Problemas observados, data, sintomas, intensidade e situação |
| Realizar monitoramentos | Inspeções, observações e evolução dos problemas |
| Registrar tratamentos | Medidas realizadas, produtos e quantidades, quando aplicável |
| Avaliar tratamentos | Resultados observados após as medidas |
| Adicionar imagens | Fotografias de perfil, ilustrações e evidências |
| Consultar histórico e dashboard | Registros existentes, filtros e cálculos |
| Consultar alertas | Avisos e situação de leitura |

## 4. Elementos identificados

| Elemento | Finalidade |
|---|---|
| Usuário | Representar o perfil de quem utiliza o sistema |
| Questionário inicial | Registrar as respostas iniciais do produtor |
| Propriedade | Representar uma propriedade administrada pelo usuário |
| Talhão | Representar uma divisão da área de cultivo |
| Cultura | Identificar o que pode ser cultivado |
| Plantação | Representar uma cultura em um talhão e período |
| Problema agrícola | Reunir conhecimento sobre praga, doença ou deficiência |
| Ocorrência | Registrar um problema observado em uma plantação |
| Monitoramento | Registrar uma inspeção ou acompanhamento |
| Tratamento | Registrar uma medida de controle realizada |
| Avaliação de tratamento | Registrar o resultado observado posteriormente |
| Imagem | Representar uma fotografia ou ilustração vinculada ao sistema |
| Fonte de conhecimento | Identificar a origem das informações técnicas |
| Alerta | Representar um aviso ao usuário, condicionado ao escopo |


## 5. Convenções do dicionário de dados

- Obrigatório: necessário para concluir o registro correspondente.
- Opcional: pode ser omitido.
- Condicional: exigido apenas na situação indicada.
- A validar: depende de decisão da equipe.
- Tipos apresentados são conceituais, como texto, número e data.
- Identificadores e relacionamentos terão representação técnica definida nas etapas seguintes.

## 6. Dicionário dos dados

### 6.1 Usuário

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Identificador Firebase | Texto | Obrigatório | Firebase/backend |
| Nome completo | Texto | Obrigatório | Produtor |
| CPF | Texto | Obrigatório no protótipo; finalidade a validar | Produtor |
| Telefone | Texto | Obrigatório no protótipo | Produtor |
| Canal preferido para código | Texto | Condicional à manutenção da funcionalidade | Produtor |
| Foto de perfil | Imagem | Opcional | Produtor |
| Versão dos termos aceitos | Texto | Obrigatório | Sistema |
| Data de aceite | Data | Obrigatório | Sistema, após aceite |
| Questionário inicial | Conjunto de respostas | Opcional até a conclusão dessa etapa | Produtor |

O e-mail de acesso e a senha são administrados pelo Firebase Authentication. Senha, confirmação de senha e códigos de autenticação não serão armazenados no banco da aplicação.

### 6.2 Questionário inicial

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Versão das perguntas | Texto | Ao concluir | Sistema |
| Porte declarado da propriedade | Texto | Ao concluir | Produtor |
| Faixa de quantidade de culturas | Texto | Ao concluir | Produtor |
| Culturas selecionadas | Lista de culturas | Selecionar cultura ou informar outra | Produtor |
| Outra cultura | Texto | Quando selecionar “Outro” | Produtor |
| Problemas frequentes | Lista de opções | Ao concluir | Produtor |
| Frequência dos problemas | Texto | Ao concluir | Produtor |
| Identifica problemas sozinho | Texto | Ao concluir | Produtor |
| Data de conclusão | Data | Ao concluir | Sistema |

- Porte: pequena, média ou grande.
- Quantidade de culturas: uma, duas, três ou quatro ou mais.
- Problemas: pragas, doenças ou ainda não identificados.
- Frequência: raramente, às vezes, frequentemente ou sempre.
- Identificação autônoma: sim, não ou às vezes.

### 6.3 Propriedade

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Responsável | Usuário | Obrigatório | Backend |
| Nome | Texto | Obrigatório | Produtor |
| Município | Texto | Obrigatório | Produtor |
| Estado | Texto | Obrigatório | Produtor |
| Área total em hectares | Número | Opcional | Produtor |
| Localização | Coordenadas | Opcional | Produtor/GPS |
| Observações | Texto | Opcional | Produtor |
| Situação ativa ou arquivada | Situação | Obrigatório | Sistema/produtor |

### 6.4 Talhão

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Propriedade | Propriedade | Obrigatório | Produtor |
| Nome | Texto | Obrigatório | Produtor |
| Área em hectares | Número | Obrigatório | Produtor |
| Localização | Coordenadas | Opcional | Produtor/GPS |
| Observações | Texto | Opcional | Produtor |
| Situação ativa ou arquivada | Situação | Obrigatório | Sistema/produtor |

### 6.5 Cultura

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Nome | Texto | Obrigatório | Equipe |
| Nome científico | Texto | Opcional | Pesquisa da equipe |
| Descrição | Texto | Opcional | Equipe |
| Imagem ilustrativa | Imagem | Opcional | Equipe |
| Situação | Situação | Obrigatório | Equipe/sistema |

### 6.6 Plantação

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Talhão | Talhão | Obrigatório | Produtor |
| Cultura | Cultura | Obrigatório | Produtor |
| Variedade | Texto | Opcional | Produtor |
| Safra | Texto | Opcional | Produtor |
| Data de plantio | Data | Opcional | Produtor |
| Área plantada em hectares | Número | Opcional | Produtor |
| Situação | Texto | Obrigatório | Sistema/produtor |
| Data de encerramento | Data | Quando encerrada | Produtor |
| Observações | Texto | Opcional | Produtor |

### 6.7 Problema agrícola

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Nome comum | Texto | Obrigatório | Pesquisa da equipe |
| Nome científico | Texto | Opcional | Pesquisa da equipe |
| Tipo: praga, doença ou deficiência | Texto | Obrigatório | Equipe |
| Descrição | Texto | Obrigatório | Equipe |
| Culturas afetadas | Lista de culturas | Obrigatório | Pesquisa da equipe |
| Sintomas | Lista de textos | Obrigatório | Pesquisa da equipe |
| Partes afetadas | Lista de textos | Opcional | Pesquisa da equipe |
| Condições favoráveis | Lista de textos | Opcional | Pesquisa da equipe |
| Informações de disseminação | Texto | Opcional, quando aplicável | Pesquisa da equipe |
| Medidas preventivas | Lista de textos | Obrigatório para disponibilizar o conteúdo | Equipe |
| Formas de controle | Lista de medidas | Obrigatório para disponibilizar o conteúdo | Equipe |
| Orientação para buscar agrônomo | Texto | Opcional | Equipe |
| Imagens ilustrativas | Lista de imagens | Opcional | Equipe |
| Fontes | Lista de fontes | Obrigatório | Equipe |
| Data de revisão | Data | Obrigatório | Equipe/sistema |
| Situação | Situação | Obrigatório | Equipe/sistema |


### 6.8 Ocorrência

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Plantação | Plantação | Obrigatório | Produtor |
| Autor | Usuário | Obrigatório | Backend |
| Tipo informado | Texto | Obrigatório | Produtor |
| Problema agrícola identificado | Problema agrícola | Opcional | Produtor |
| Data da observação | Data | Obrigatório | Produtor |
| Sintomas observados | Texto | Obrigatório | Produtor |
| Intensidade | Texto | Obrigatório | Produtor |
| Área afetada em hectares | Número | Opcional | Produtor |
| Localização | Coordenadas | Opcional | Produtor/GPS |
| Imagens | Lista de imagens | Opcional na proposta inicial | Produtor |
| Situação | Texto | Obrigatório | Sistema/produtor |
| Data de encerramento | Data | Quando encerrada | Sistema |
| Motivo de encerramento | Texto | Quando encerrada | Produtor |


### 6.9 Monitoramento

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Plantação inspecionada | Plantação | Obrigatório | Produtor |
| Ocorrência acompanhada | Ocorrência | Opcional | Produtor |
| Autor | Usuário | Obrigatório | Backend |
| Data da observação | Data | Obrigatório | Produtor |
| Problema observado | Sim/não | Obrigatório | Produtor |
| Observações | Texto | Obrigatório | Produtor |
| Intensidade | Texto | Quando houver problema observado | Produtor |
| Evolução | Texto | Opcional | Produtor |
| Área afetada | Número | Opcional | Produtor |
| Localização | Coordenadas | Opcional | Produtor/GPS |
| Imagens | Lista de imagens | Opcional | Produtor |
| Próxima inspeção | Data | Opcional | Produtor |


### 6.10 Tratamento ou medida de controle

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Ocorrência | Ocorrência | Obrigatório | Produtor |
| Autor do registro | Usuário | Obrigatório | Backend |
| Tipo de medida | Texto | Obrigatório | Produtor |
| Descrição | Texto | Obrigatório | Produtor |
| Data de aplicação | Data | Obrigatório | Produtor |
| Área tratada | Número | Opcional | Produtor |
| Produto utilizado | Texto | Opcional | Produtor |
| Quantidade utilizada | Número | Se informar unidade | Produtor |
| Unidade | Texto | Se informar quantidade | Produtor |
| Responsável pela aplicação | Texto | Opcional | Produtor |
| Observações | Texto | Opcional | Produtor |
| Imagens | Lista de imagens | Opcional | Produtor |

### 6.11 Avaliação de tratamento

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Tratamento | Tratamento | Obrigatório | Produtor |
| Autor | Usuário | Obrigatório | Backend |
| Data de avaliação | Data | Obrigatório | Produtor |
| Resultado observado | Texto | Obrigatório | Produtor |
| Observações | Texto | Obrigatório | Produtor |
| Monitoramento relacionado | Monitoramento | Opcional | Produtor |

### 6.12 Imagem

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| URL | Texto | Obrigatório | Cloudinary |
| Identificador do arquivo | Texto | Obrigatório | Cloudinary |
| Legenda | Texto | Opcional | Produtor/equipe |
| Remetente | Usuário | Obrigatório | Backend |
| Data de envio | Data | Obrigatório | Sistema |
| Contexto de uso | Registro relacionado | Obrigatório | Sistema |

Os arquivos ficam no Cloudinary.

### 6.13 Fonte de conhecimento

| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Título | Texto | Obrigatório | Equipe |
| Instituição ou autor | Texto | Obrigatório | Equipe |
| URL | Texto | Opcional | Equipe |
| Data de publicação | Data | Opcional | Equipe |
| Data de acesso | Data | Para fonte online | Equipe |

### 6.14 Alerta


| Atributo | Tipo | Obrigatoriedade | Origem |
|---|---|---|---|
| Identificador | Identificador | Obrigatório | Sistema |
| Destinatário | Usuário | Obrigatório | Sistema |
| Tipo | Texto | Obrigatório | Sistema |
| Título | Texto | Obrigatório | Sistema |
| Mensagem | Texto | Obrigatório | Sistema |
| Prioridade | Texto | Obrigatório | Regra definida |
| Motivo de geração | Texto | Obrigatório | Sistema |
| Contexto principal | Registro relacionado | Obrigatório | Sistema |
| Data de criação | Data | Obrigatório | Sistema |
| Data de leitura | Data | Opcional | Sistema |
| Data de expiração | Data | Opcional | Sistema |

### 6.15 Localização

Quando informada, a localização possui latitude e longitude numéricas, ambas obrigatórias.

## 7. Operações previstas

| Elemento | Cadastro | Consulta | Alteração | Exclusão ou arquivamento |
|---|---|---|---|---|
| Usuário | Próprio perfil | Próprio perfil | Dados e preferências | Exclusão de conta a definir |
| Questionário | Próprias respostas | Próprias respostas | Respostas atuais | Acompanha o perfil |
| Propriedade | Responsável | Registros autorizados | Dados da propriedade | Arquivar se houver histórico |
| Talhão | Responsável | Registros autorizados | Nome, área e observações | Arquivar se houver histórico |
| Cultura | Equipe autorizada | Usuários autenticados | Equipe autorizada | Desativar quando utilizada |
| Plantação | Responsável | Registros autorizados | Dados do cultivo | Encerrar para preservar histórico |
| Problema agrícola | Equipe autorizada | Usuários autenticados | Equipe autorizada | Desativar quando utilizado |
| Ocorrência | Produtor | Registros autorizados | Dados e situação | Regra final pendente |
| Monitoramento | Produtor | Registros autorizados | Correções | Regra final pendente |
| Tratamento | Produtor | Registros autorizados | Correções | Regra final pendente |
| Avaliação | Produtor | Registros autorizados | Correções | Regra final pendente |
| Imagem | Usuário autorizado | Conforme o contexto | Legenda | Remover arquivo e vínculo conforme regra |
| Fonte | Equipe autorizada | Conforme acesso à base | Dados bibliográficos | Preservar se utilizada |
| Alerta | Sistema | Destinatário | Registrar leitura | Retenção a definir |





# Servidor Java do Sentinela

O pré-cadastro consulta os comandos individuais `VALIDAR_CPF<TAB>cpf` e
`VALIDAR_TELEFONE<TAB>telefoneCanonico`. Ambos usam as mesmas regras dos campos
no cadastro completo e não recebem ou fabricam os demais campos. Reinicie o
servidor Java após recompilar para disponibilizar os novos comandos.

Comunidade: [contratos, regras e fonte oficial de DDD](comunidade.md).
Teste TCP: `npm --prefix backend run test:comunidade:java`, com Java ativo.
Teste direto: `sentinela.validacao.ValidadorComunidadeTest`, após compilar os testes.

As respostas TCP de erro respeitam 65.536 bytes UTF-8, reservando CRLF. Se houver
omissão, preservam um prefixo de mensagens completas e acrescentam
`Existem erros adicionais não exibidos nesta resposta.`. `OK` e respostas pequenas
não mudam. Os validadores diretos mantêm todos os erros e suas listas intactas.
Teste da montagem: `sentinela.protocolo.RespostaLimitadaTest` (classpath de produção
e de testes, após compilação).

A validação composta `VALIDAR_PROBLEMA_AGRICOLA` está documentada em
[protocolo-problema-agricola.md](protocolo-problema-agricola.md), com as 59 partes fixas,
blocos variáveis, condições estruturais de revisão e limites do transporte.
Teste isolado com Java ativo: `npm --prefix backend run test:problemas:java`.

## Validação isolada de culturas e fontes

`ValidadorCultura.validarCultura(String nome, String nomeCientifico, String descricao,
Boolean ativa, ImagemOcorrencia imagem)` acumula erros sem modificar entradas.
Nome obrigatório preenchido, 1–150 pontos de código Unicode. Nome científico opcional
preenchido, 1–200; descrição opcional preenchida, 1–5000. Ativa obrigatório sem default:
false é válido e diferente de ausência. Imagem é um único objeto opcional, reutilizando
`ValidadorImagens` sem mudanças: HTTPS válida até 2048 pontos, publicId preenchido e
preservado integralmente, legenda opcional preenchida até 300 pontos e enviadaEm
obrigatória. Envio futuro é permitido. Não gerar metadados para apresentação padrão.

`ValidadorFonteConhecimento.validarFonteConhecimento(String titulo,
String instituicaoOuAutor, String url, Instant publicadoEm, Instant acessadoEm,
Instant instanteReferencia)` exige título preenchido de 1–300 pontos de código e
instituição/autor de 1–200. URL opcional, quando presente HTTP **ou** HTTPS válida,
até 2048 pontos. Não usa a restrição HTTPS das imagens. URL presente exige acesso,
mas acesso sem URL é permitido. Publicação e acesso opcionais, não posteriores à
referência obrigatória confiável. Quando ambos existem, acesso deve ser igual ou
posterior à publicação. Sem trim, normalização ou consultas no Java.

### Protocolos dos catálogos

`VALIDAR_CULTURA`: exatamente **13 partes** em uma linha UTF-8 separada por TAB real:

| Parte | Conteúdo |
|---|---|
| 1 | VALIDAR_CULTURA |
| 2 | nome |
| 3 | nomeCientificoPresente |
| 4 | nomeCientifico |
| 5 | descricaoPresente |
| 6 | descricao |
| 7 | ativa |
| 8 | imagemPresente |
| 9 | url |
| 10 | publicId |
| 11 | legendaPresente |
| 12 | legenda |
| 13 | enviadaEm |

Ativa: `0` false, `1` true, vazio ausência para obrigatoriedade; outros valores inválidos.
Marcadores estritos `0`/`1`. Textos ausentes exigem parte vazia; presentes vazios são
inválidos. Imagem ausente exige url/publicId/legenda/enviadaEm vazios e legendaPresente
`0`. Envio ausente em imagem presente gera obrigatoriedade.

`VALIDAR_FONTE_CONHECIMENTO`: exatamente **8 partes**:

| Parte | Conteúdo |
|---|---|
| 1 | VALIDAR_FONTE_CONHECIMENTO |
| 2 | titulo |
| 3 | instituicaoOuAutor |
| 4 | urlPresente |
| 5 | url |
| 6 | publicadoEm |
| 7 | acessadoEm |
| 8 | instanteReferencia |

URL ausente usa `0` e parte vazia; presente vazia é inválida. Datas opcionais vazias
representam ausência; referência vazia gera obrigatoriedade. Datas usam o parser
existente de instantes ISO UTC com `Z`, sem definir conversão de dias de calendário.
Datas malformadas geram erros de conversão antes das regras de domínio.

Ambos usam `CodecDeCampos` (`\\`, `\t`, `\r`, `\n`): separar primeiro por TAB real
preservando vazios, depois decodificar. Estrutura, marcadores e escapes inconsistentes
geram `ERRO<TAB>Pedido de validação inválido.` sem encerrar a conexão. Respostas seguem
`OK` ou `ERRO<TAB>mensagem...`; todos os comandos anteriores permanecem intactos.

Não há unicidade de nome, título ou URL, validação científica/editorial, consultas,
autorização, upload/autoria, exclusão ou persistência. Esses comandos atendem validação
isolada de futuros fluxos de manutenção; não são utilizados automaticamente na leitura
do catálogo. Nenhuma rota ou modelo foi criado.

Após compilar produção em `out` e testes em `out/testes`:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorCatalogosTest
# Com Java ativo separadamente:
npm --prefix backend run test:catalogos:java
```

Testes usam somente Java/TCP local, sem Firebase ou Atlas, cobrindo Unicode, Boolean,
metadados, HTTP/HTTPS, dependência URL/acesso, comparações temporais, pedidos malformados
e recuperação na mesma conexão.

## Validações independentes de perfil

`ValidadorPerfil.validarPerfil(String nomeCompleto, String cpf)` preserva seu
comportamento e mensagens. `validarCadastroPerfil(String nomeCompleto, String cpf,
String telefoneCanonico, String canalCodigoPreferido)` reutiliza esse método e acumula
erros de telefone e canal. Telefone obrigatório no formato exato
`^\+55[0-9]{2}9[0-9]{8}$`, sem normalização, separadores ou dígitos não ASCII.
Canal obrigatório exatamente `email` ou `sms`, sem padrão automático.

**Telefone:** formato canônico e lista oficial dos 67 DDDs conferidos no Java.
Fonte Anatel e data de consulta em [comunidade.md](comunidade.md). Não comprova
existência do número ou posse. Não foi definido algoritmo de normalização nem
versão dos termos; formatos adicionais continuam rejeitados.

`validarOpcionaisPerfil(String nomePublico, ImagemOcorrencia fotoPerfil)` permite ambos
ausentes (null interno). Nome público presente exige conteúdo e 2–80 pontos de código
Unicode; sem trim ou normalização. Foto é um único objeto opcional, reutilizando
`ImagemOcorrencia` e `ValidadorImagens`, com as mesmas regras e mensagens de metadados:
HTTPS válida até 2048 pontos de código, publicId obrigatório preservado integralmente,
legenda opcional preenchida até 300 pontos de código e enviadaEm obrigatória.
Não há restrição de envio futuro. A assinatura de objeto único garante foto única,
sem modificar o limite de imagens dos demais módulos.

### Protocolos de perfil

Exatamente **cinco partes**, incluindo o comando:

```text
VALIDAR_CADASTRO_PERFIL<TAB>nomeCompleto<TAB>cpf<TAB>telefoneCanonico<TAB>canalCodigoPreferido
```

Exatamente **nove partes**, incluindo o comando:

```text
VALIDAR_OPCIONAIS_PERFIL<TAB>nomePublicoPresente<TAB>nomePublico<TAB>fotoPresente<TAB>url<TAB>publicId<TAB>legendaPresente<TAB>legenda<TAB>enviadaEm
```

Marcadores são estritamente `0`/`1`. Nome ausente exige texto vazio. Foto ausente exige
url/publicId/legenda/enviadaEm vazios e legendaPresente `0`. Legenda ausente exige texto
vazio. Presença vazia é distinta de ausência: nome/legenda presentes vazios são inválidos.
Ambos opcionais ausentes são válidos. Envio usa o parser existente de instantes ISO UTC
com `Z`: vazio quando a foto está presente gera obrigatoriedade; malformado gera erro
de conversão. Todos os campos usam o codec `\\`, `\t`, `\r`, `\n`: separar primeiro por
TAB real preservando vazios e só depois decodificar. Estrutura, marcadores ou escapes
inválidos retornam `ERRO<TAB>Pedido de validação inválido.` sem encerrar a conexão.
Respostas continuam `OK` ou `ERRO<TAB>mensagem...`. Comandos anteriores permanecem intactos.

Não há rota, modelo, persistência, unicidade nova ou contrato HTTP de edição/remoção.
UID vem exclusivamente do token no Node. Autoria, enviadaPor, uploads, acesso a arquivos,
aceite dos termos e posse do telefone permanecem fora deste escopo. Credenciais, email de conta,
senhas, confirmações e códigos não fazem parte das entradas de perfil.

Após compilar produção em `out` e testes em `out/testes`:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorPerfilTest
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorComplementoPerfilTest
# Com Java ativo separadamente:
npm --prefix backend run test:perfil:java
```

Testes usam somente dados sintéticos e TCP local, sem Firebase ou Atlas.

## Validação isolada do questionário

`ValidadorQuestionario.validarQuestionario(String versao, String portePropriedade,
String quantidadeCulturas, List<String> culturasIds, String outraCultura,
List<String> problemasFrequentes, String frequenciaProblemas,
String identificaProblemasSozinho, Instant concluidoEm)` em `sentinela.validacao`
acumula erros sem transformar ou reordenar valores recebidos.

Versão obrigatória preenchida, de 1 a 30 pontos de código Unicode; não há versão
vigente definida. Porte: `pequena`, `media`, `grande`. Quantidade declarada: `1`, `2`,
`3`, `4_ou_mais`. Culturas: lista obrigatória, até 50, sem duplicações. Outra cultura
opcional, preenchida, até 150 pontos de código. Exige ao menos uma cultura ou outra
cultura válida, permitindo ambas. Não compara porte com área nem quantidade declarada
com tamanho da lista. IDs chegam canonicalizados pelo Node; o Java não normaliza,
valida formato de ObjectId ou consulta o catálogo. Aprovação Java não comprova existência
ou disponibilidade das culturas.

Problemas: lista obrigatória de 1 a 2, sem duplicações; valores `pragas`, `doencas`,
`nao_identificado`. Este último só pode aparecer sozinho. Pragas e doenças podem ser
combinadas em qualquer ordem. Frequência: `raramente`, `as_vezes`, `frequentemente`,
`sempre`. Identificação sozinho: `sim`, `nao`, `as_vezes`. Conclusão obrigatória como
Instant; nenhuma comparação temporal, inclusive proibição de conclusão futura.
Textos somente com espaços ASCII/Unicode são inválidos; Java não aplica trim.

### Protocolo do questionário

**13 partes fixas + N culturas + M problemas**, em uma linha UTF-8 separada por TAB:

| Parte | Conteúdo |
|---|---|
| 1 | VALIDAR_QUESTIONARIO |
| 2 | versao |
| 3 | portePropriedade |
| 4 | quantidadeCulturas |
| 5 | culturasPresente |
| 6 | quantidadeCulturasIds (N) |
| 7 | outraCulturaPresente |
| 8 | outraCultura |
| 9 | problemasPresente |
| 10 | quantidadeProblemas (M) |
| 11 | frequenciaProblemas |
| 12 | identificaProblemasSozinho |
| 13 | concluidoEm |

Após as fixas vêm N identificadores e depois M problemas. Total exato: **13 + N + M**.
Marcadores estritos `0`/`1`. Lista ausente: `0`, contagem zero, convertida para null
interno para obrigatoriedade. Lista presente vazia: `1`, contagem zero, convertida
para lista vazia. Outra cultura ausente: `0` e texto vazio; presente vazia é inválida.
Contagens decimais não negativas sem sinal ou zeros à esquerda (exceto `0`), coerentes
com marcadores e total de partes. Números fora do intervalo inteiro ou com soma
incompatível são rejeitados sem encerrar o atendimento. Limites de 50/2 são de domínio,
checados quando a estrutura e a contagem estão corretas.

Reutiliza `CodecDeCampos` (`\\`, `\t`, `\r`, `\n`): separar primeiro por TAB real,
preservando vazios, depois decodificar. Contagem, marcadores e escapes malformados
retornam `ERRO<TAB>Pedido de validação inválido.`. Conclusão usa parser ISO UTC com `Z`;
vazia gera erro obrigatório e malformada gera erro de conversão antes do domínio.
Respostas permanecem `OK` ou `ERRO<TAB>mensagem...`. Outros comandos não mudam.

Não há rota, modelo ou persistência. Autenticação, perfil próprio, consultas às culturas,
versão apresentada, geração explícita da conclusão e gravação completa ficam no Node.
Null interno não autoriza null no futuro contrato HTTP. Telas Flutter não foram adaptadas.

Após compilar produção em `out` e testes em `out/testes`:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorQuestionarioTest
# Com Java iniciado separadamente:
npm --prefix backend run test:questionario:java
```

Testes exercitam enums, Unicode, listas ausentes/vazias, combinações, limites,
conclusão futura, escapes, contagens malformadas e recuperação na mesma conexão.
Não acessam Atlas ou Firebase. Versões usadas nos testes são apenas entradas sintéticas.

## Validação isolada de avaliações de tratamento

`sentinela.validacao.ValidadorAvaliacaoTratamento.validarAvaliacaoTratamento(
Instant dataAvaliacao, String resultado, String observacoes, Instant instanteReferencia)`
acumula erros em `List<String>` sem alterar os valores recebidos.

Data de avaliação obrigatória e não posterior à referência confiável fornecida pelo
Node; igualdade é aceita. Referência obrigatória. Resultado obrigatório e exatamente
`melhora_observada`, `sem_mudanca`, `piora_observada` ou `inconclusivo`.
Observações obrigatórias, não somente espaços ASCII/Unicode, de 1 a 5000 pontos de
código Unicode. Não há trim ou normalização no Java; caracteres suplementares contam
um ponto e acentos combinantes contam separadamente. Campos sem conteúdo geram apenas
erro de obrigatoriedade, sem erro adicional de comprimento.

### Protocolo de avaliação de tratamento

Exatamente **cinco partes**, incluindo o comando, separadas por TAB real:

```text
VALIDAR_AVALIACAO_TRATAMENTO<TAB>dataAvaliacao<TAB>resultado<TAB>observacoes<TAB>instanteReferencia
```

Todos os campos são obrigatórios, sem marcadores de presença. Valores vazios são
preservados na separação e geram erros de domínio. Datas usam instantes ISO UTC com
`Z`, pelo parser existente. Datas malformadas retornam erros de conversão antes da
validação de domínio; nenhuma convenção de datas de calendário do Flutter é definida.
Reutiliza `CodecDeCampos`: `\\`, `\t`, `\r`, `\n`. Primeiro separe por TAB real
preservando vazios, depois decodifique. Quantidade incorreta de partes, escapes
desconhecidos/incompletos e CR/LF reais dentro do pedido são inválidos. Para transmitir
quebras dentro do texto, utilize o codec; na conexão, CR/LF reais delimitam mensagens.
Respostas permanecem `OK` ou `ERRO<TAB>mensagem...`, em uma linha. Estrutura/escapes
inválidos retornam `ERRO<TAB>Pedido de validação inválido.`.

O comando não recebe IDs ou autoria, não consulta tratamento/monitoramento e não
compara avaliação com aplicação ou intervalos do monitoramento. Autorização, estados,
referências, consultas, concorrência e persistência permanecem pendências de integração.
Não há notas, imagens, prazo mínimo, unicidade, eficácia automática ou exigência de
ocorrência aberta/em acompanhamento. Inclusividade dos limites do monitoramento não
foi decidida nesta etapa. Os contratos anteriores permanecem intactos.

Após compilar em `out` e testes em `out/testes`:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorAvaliacaoTratamentoTest
# Com Java ativo separadamente:
npm --prefix backend run test:avaliacoes:java
```

Testes incluem campos ausentes/vazios, enums, limites Unicode, escapes, datas com
referência fixa, acúmulo de erros, pedidos malformados e recuperação na mesma conexão.
Não acessam Atlas ou Firebase.

## Validação isolada de tratamentos

`sentinela.validacao.ValidadorTratamento.validarTratamento(String tipoMedida,
String descricao, Instant dataAplicacao, Double areaTratadaHa, String produtoUtilizado,
Double quantidadeUtilizada, String unidadeQuantidade, String responsavelAplicacao,
String observacoes, List<ImagemOcorrencia> imagens, Instant instanteReferencia)`
acumula erros em português sem alterar os valores recebidos.

Tipo obrigatório: `manual`, `cultural`, `biologica`, `quimica`, `outra`. Descrição
obrigatória com conteúdo, até 5000 pontos de código Unicode. Aplicação obrigatória,
não posterior à referência confiável fornecida pelo Node. Área opcional positiva e
finita. Produto opcional preenchido, até 200 pontos de código. Quantidade opcional
positiva e finita; quantidade e unidade devem estar ambas presentes ou ambas ausentes.
Unidade opcional preenchida, até 30 pontos de código. Responsável opcional preenchido,
2–150 pontos de código. Observações opcionais preenchidas, até 5000 pontos de código.
Campos compostos somente por espaços ASCII/Unicode são inválidos. O Java não aplica trim.
Null representa ausência interna; não autoriza null em um futuro contrato HTTP.

Imagens reutilizam `ImagemOcorrencia` e `ValidadorImagens`, sem mudar regras ou mensagens:
até cinco, ausentes ou lista vazia válidas, URL HTTPS válida até 2048 pontos de código,
publicId obrigatório e preservado integralmente sem duplicação, legenda opcional preenchida
até 300 pontos de código e enviadaEm obrigatória. Envio futuro é permitido.

### Protocolo de tratamentos

`VALIDAR_TRATAMENTO`: **17 partes fixas + 5 por imagem**, separadas por TAB real:

| Parte | Conteúdo |
|---|---|
| 1 | VALIDAR_TRATAMENTO |
| 2 | tipoMedida |
| 3 | descricao |
| 4 | dataAplicacao |
| 5 | areaTratadaHa |
| 6 | produtoPresente |
| 7 | produtoUtilizado |
| 8 | quantidadeUtilizada |
| 9 | unidadePresente |
| 10 | unidadeQuantidade |
| 11 | responsavelPresente |
| 12 | responsavelAplicacao |
| 13 | observacoesPresente |
| 14 | observacoes |
| 15 | instanteReferencia |
| 16 | imagensPresente |
| 17 | quantidadeImagens |

Cada imagem acrescenta **url, publicId, legendaPresente, legenda, enviadaEm**.
Marcadores são estritamente `0`/`1`. Marcador de texto `0` exige campo vazio e
representa ausência; `1` preserva presença, inclusive texto vazio inválido.
Imagens ausentes usam `0`, quantidade `0` e nenhum grupo; lista vazia presente usa
`1` e quantidade `0`. Quantidade de imagens é decimal não negativa, sem sinal ou zeros
à esquerda (exceto `0`), e deve corresponder exatamente aos grupos. Acima de cinco
com grupos completos gera erro de validação. Área e quantidade utilizada vazias
representam ausência. Não confundir quantidade utilizada com quantidade de imagens.

Datas são ISO UTC com `Z`; aplicação/referência vazias geram obrigatoriedade.
Datas malformadas e números não conversíveis geram erros de conversão antes das regras
de domínio. Estrutura, marcadores, contagem e escapes inválidos geram
`ERRO<TAB>Pedido de validação inválido.`. Reutiliza `CodecDeCampos`: `\\`, `\t`, `\r`, `\n`;
separe por TAB preservando vazios antes de decodificar. Respostas permanecem uma linha
`OK` ou `ERRO<TAB>mensagem...`. Todos os comandos anteriores permanecem compatíveis.

Não calcula dose, converte unidades ou prescreve medidas; não exige produto para
medida química nem responsável/imagens por tipo. Não há teto numérico ou limite de
casas decimais. Referências, autorização, plantação ativa, ocorrência aberta/em
acompanhamento, comparação com observação inicial e área plantada, autoria, upload,
concorrência e persistência permanecem fora desta etapa. Nenhuma comparação com área
afetada é realizada. Não há conversão definida para dias de calendário do Flutter.

Após compilar produção em `out` e testes em `out/testes`:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorTratamentoTest
# Com Java iniciado separadamente:
npm --prefix backend run test:tratamentos:java
```

Os testes TCP exercitam limites, números, datas, dependências, imagens, escapes,
malformados e recuperação da conexão, sem acessar Firebase ou Atlas.

## Validação isolada de monitoramentos

`sentinela.validacao.ValidadorMonitoramento.validarMonitoramento(boolean ocorrenciaPresente,
Instant dataObservacao, Boolean problemaObservado, String observacoes, String intensidade,
String evolucao, Double areaAfetadaHa, Instant proximaInspecaoEm,
List<ImagemOcorrencia> imagens, Instant instanteReferencia)` retorna todos os erros em português.
O Java não modifica os valores. `Boolean` distingue ausência de `false`; não há padrão automático.

Observações obrigatórias, com conteúdo e até 5000 pontos de código Unicode. Problema
observado exige intensidade `baixa`, `media` ou `alta`; `false` proíbe intensidade e área.
Evolução opcional: `melhorou`, `estavel`, `piorou`, `nao_avaliada`; sem ocorrência,
somente ausente ou `nao_avaliada`. Área opcional positiva e finita.
Observação e referência são obrigatórias; observação não pode superar a referência.
Próxima inspeção, se informada, deve ser estritamente posterior à observação, podendo
estar no passado em relação à referência. Não há comparação com plantio ou estado da ocorrência.

Imagens opcionais (inclusive lista vazia), até cinco, reutilizam o tipo existente
`ImagemOcorrencia`. `ValidadorImagens` compartilha exatamente as regras anteriores de
ocorrências: URL HTTPS válida até 2048 pontos de código, publicId preenchido e
preservado integralmente sem duplicação ou teto arbitrário, legenda opcional preenchida
até 300 pontos de código e enviadaEm obrigatória. Envio futuro é permitido.
Ocorrências preservam assinatura, tipo de entrada e mensagens, inclusive a do limite de imagens.

### Protocolo de monitoramentos

`VALIDAR_MONITORAMENTO`: **14 partes fixas + 5 por imagem**, em uma linha UTF-8,
separadas por TAB real, nesta ordem:

| Parte | Conteúdo |
|---|---|
| 1 | VALIDAR_MONITORAMENTO |
| 2 | ocorrenciaPresente |
| 3 | dataObservacao |
| 4 | problemaObservado |
| 5 | observacoes |
| 6 | intensidadePresente |
| 7 | intensidade |
| 8 | evolucaoPresente |
| 9 | evolucao |
| 10 | areaAfetadaHa |
| 11 | proximaInspecaoEm |
| 12 | instanteReferencia |
| 13 | imagensPresente |
| 14 | quantidadeImagens |

Cada imagem acrescenta: **url, publicId, legendaPresente, legenda, enviadaEm**.
Marcadores e booleanos preenchidos são estritamente `0`/`1`. Problema observado vazio
representa campo obrigatório ausente e chega ao Java como null, nunca false.
Intensidade, evolução e legenda com marcador `0` exigem texto vazio e representam
ausência; marcador `1` mantém presença, inclusive texto vazio inválido.
Imagens ausentes exigem quantidade zero e nenhum grupo. Lista presente vazia usa
marcador `1` e quantidade `0`. Quantidade deve ser decimal não negativa sem sinal ou
zeros à esquerda (exceto `0`) e corresponder exatamente aos grupos.
Quantidade acima de cinco com grupos completos gera erro de validação.

Área e próxima inspeção vazias representam ausência. Datas são instantes ISO UTC
com `Z`; datas malformadas e área não numérica retornam erros de conversão antes das
regras de domínio. Observação e referência vazias retornam erros de obrigatoriedade.
Não foi definida conversão para datas de calendário do Flutter.
Todos os campos reutilizam o codec de barras, TAB, CR e LF (`\\`, `\t`, `\r`, `\n`).
Primeiro separe por TAB preservando vazios, depois decodifique. Estrutura, marcadores,
contagem ou escapes inválidos retornam `ERRO<TAB>Pedido de validação inválido.`.
Respostas continuam `OK` ou `ERRO<TAB>mensagem...`, em uma única linha.

O comando não consulta referências, autoria, cultura, área plantada nem a data inicial
da ocorrência. Essas verificações e autorização/estado da plantação permanecem no Node.
Não existem novas rotas, modelos, persistência, formatos ou limites de upload.

Após compilar em out e os testes em out/testes:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorMonitoramentoTest
# Com Java ativo em outro terminal:
npm --prefix backend run test:monitoramentos:java
```

Os testes TCP usam serviços locais, sem Firebase ou Atlas, e verificam também recuperação
da conexão após pedidos malformados e compatibilidade com todos os comandos anteriores.

## Validação isolada de ocorrências

`sentinela.validacao.ValidadorOcorrencia.validarOcorrencia(String tipo,
boolean problemaAgricolaPresente, Instant dataObservacao, String sintomas,
String intensidade, Double areaAfetadaHa, String status, Instant encerradoEm,
String motivoEncerramento, List<ImagemOcorrencia> imagens, Instant instanteReferencia)`
acumula erros em português sem alterar os valores. `ImagemOcorrencia` contém somente
`url`, `publicId`, `legenda` e `enviadaEm`; autoria permanece no Node.

Tipos: `praga`, `doenca`, `deficiencia`, `nao_identificado`. Intensidade obrigatória:
**String `baixa`, `media` ou `alta`**, sem escala 1–5. Status: `aberta`,
`em_acompanhamento`, `encerrada`. Sintomas obrigatórios até 5000 pontos de código,
não somente espaços. Área opcional positiva e finita. Observação e referência são
obrigatórias; observação não pode superar a referência confiável fornecida pelo Node.
Encerrada exige encerramento e motivo preenchido até 5000 pontos de código; outros
estados proíbem ambos. Encerramento não pode anteceder observação, mas **pode ser futuro**.
Problema agrícola vinculado é proibido em `nao_identificado`.

Imagens são opcionais, até cinco; lista vazia é aceita. Cada imagem exige URL HTTPS
válida até 2048 pontos de código, publicId com conteúdo (preservado integralmente,
sem teto arbitrário e sem duplicação no registro) e enviadaEm válida. Legenda opcional,
quando presente preenchida e até 300 pontos de código. Não se compara enviadaEm com
o relógio nem se impõem MIME, tamanho de arquivo, coordenadas ou regras agronômicas.

### Protocolo de ocorrências

`VALIDAR_OCORRENCIA` tem **14 partes fixas + 5 por imagem**, separadas por TAB real:

| Parte (1-based) | Conteúdo |
|---|---|
| 1 | VALIDAR_OCORRENCIA |
| 2 | tipo |
| 3 | problemaAgricolaPresente |
| 4 | dataObservacao |
| 5 | sintomas |
| 6 | intensidade |
| 7 | areaAfetadaHa |
| 8 | status |
| 9 | encerradoEm |
| 10 | motivoPresente |
| 11 | motivoEncerramento |
| 12 | instanteReferencia |
| 13 | imagensPresente |
| 14 | quantidadeImagens |

Cada imagem acrescenta nesta ordem: **url, publicId, legendaPresente, legenda, enviadaEm**.
Não são transmitidos IDs de referências, autoria ou arquivos binários.

Marcadores são estritamente `0` ou `1`. Motivo e legenda com marcador `0` exigem
valor vazio e representam ausência; `1` representa presença, inclusive vazio inválido.
`imagensPresente=0` exige quantidade zero e nenhum grupo; `1` admite zero ou mais grupos.
Quantidade é inteiro decimal não negativo, sem sinal ou zeros à esquerda (exceto `0`),
e deve corresponder exatamente aos grupos. Quantidade acima de cinco, com grupos
completos, gera erro de validação. Problema usa somente o indicador de presença.
Área vazia e encerradoEm vazio representam ausência; observação e referência vazias
geram erro de obrigatoriedade. Datas usam ISO UTC com `Z`, sem conversão de dias de calendário.

Todos os campos reutilizam `CodecDeCampos`: `\\`, `\t`, `\r`, `\n`. Separe por TAB
preservando vazios antes de decodificar. Estrutura, contagem, marcadores ou escapes
inválidos retornam `ERRO<TAB>Pedido de validação inválido.` antes das regras de domínio.
Datas malformadas e área não numérica geram erros de conversão sem executar o validador.
Respostas continuam em uma linha: `OK` ou `ERRO<TAB>mensagem...`. Nenhum valor recebido
é registrado no console. Talhões, propriedades e plantações mantêm seus contratos.

Teste direto após compilar testes em `out/testes`:

```powershell
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorOcorrenciaTest
```

Com Java iniciado, execute `npm --prefix backend run test:ocorrencias:java`.
Nenhum teste consulta Atlas. Rotas, consultas, transições, autoria, upload,
comparação com área plantada e regras de alertas não são implementados nesta etapa.

## Validação isolada de plantações

`sentinela.validacao.ValidadorPlantacao.validarPlantacao(String variedade, String safra,
Instant dataPlantio, Double areaPlantadaHa, String status, Instant dataEncerramento,
String observacoes, Instant instanteReferencia)` retorna todos os erros em `List<String>`.
Null representa ausência interna de opcionais; a referência é obrigatória. O Java não
apara nem normaliza textos. Comprimentos usam pontos de código Unicode.

Variedade, safra e observações são opcionais, mas quando presentes devem ter conteúdo
e no máximo 200, 30 e 5000 pontos de código, respectivamente. Safra não tem formato
obrigatório. Área opcional deve ser positiva e finita. Status é exatamente `ativa` ou
`encerrada`, sem padrão. Ativa proíbe encerramento; encerrada exige encerramento,
que não pode anteceder o plantio nem superar a referência. Igualdades são aceitas.
Plantio futuro é permitido. Não há conversão definida para datas de calendário do Flutter.

Pedido UTF-8 em uma linha, com exatamente 12 partes separadas por TAB real:

```text
VALIDAR_PLANTACAO<TAB>variedadePresente<TAB>variedade<TAB>safraPresente<TAB>safra<TAB>dataPlantio<TAB>areaPlantadaHa<TAB>status<TAB>dataEncerramento<TAB>observacoesPresente<TAB>observacoes<TAB>instanteReferencia
```

Marcadores são estritamente `0` ou `1`; `0` exige texto vazio e significa ausência;
`1` preserva presença, inclusive texto vazio inválido. Reutiliza `CodecDeCampos`:
barra invertida, TAB, CR e LF usam `\\`, `\t`, `\r`, `\n`. Separe antes de decodificar.
Quantidade incorreta, marcadores inválidos e escapes desconhecidos/incompletos geram
`ERRO<TAB>Pedido de validação inválido.`. Datas opcionais e área vazias representam
ausência. Datas usam instantes ISO UTC com `Z`, sem espaços externos; datas inválidas,
referência ausente e área não numérica retornam erros em português, na mesma linha.
Respostas continuam `OK` ou `ERRO<TAB>mensagem...`. Outros comandos não mudam.

Não há rota, modelo ou persistência de plantações nesta etapa. Referências, autorização,
disponibilidade, área do talhão e concorrência ficam para a integração no Node/MongoDB.

Após compilar produção em `out`, compile os testes em `out/testes` e execute:

```powershell
$testes = Get-ChildItem servidor-java/src/test/java -Recurse -Filter *.java | ForEach-Object FullName
javac -encoding UTF-8 -cp servidor-java/out -d servidor-java/out/testes $testes
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorPlantacaoTest
```

Com Java iniciado, `npm --prefix backend run test:plantacoes:java` testa o cliente
TypeScript e o protocolo real, incluindo erros e recuperação na mesma conexão. Não acessa Atlas.

Java puro, sem Maven ou bibliotecas externas. Execute os comandos PowerShell a partir da raiz do repositório, com JDK no PATH.

```powershell
$fontes = @(Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object { $_.FullName })
New-Item -ItemType Directory -Path servidor-java/out -Force | Out-Null
javac -encoding UTF-8 -d servidor-java/out @fontes
if ($LASTEXITCODE -ne 0) { throw 'Falha na compilação Java' }
java -cp servidor-java/out sentinela.servidor.Servidor
```

Porta padrão: 7000. Para escolher outra porta:

```powershell
java -cp servidor-java/out sentinela.servidor.Servidor 8080
```

O processo permanece aguardando conexões; use Ctrl+C para encerrar. Os `.class` ficam somente em `out/`, ignorado pelo Git, assim como `*.class`. Não compile diretamente dentro de `src/`.

## Pacotes

- `sentinela.servidor`: `Servidor`, `AceitadoraDeConexao` e `SupervisoraDeConexao`.
- `sentinela.protocolo`: `ProcessadorDeValidacao` e `CodecDeCampos`.
- `sentinela.validacao`: `ValidadorTalhao` e `ValidadorPropriedade`, ambos retornando todos os erros em `List<String>`.

O protocolo continua sendo UTF-8 por linha: `VALIDAR_TALHAO<TAB>nome<TAB>areaHa`. TAB é o caractere real de tabulação; campos não podem conter TAB, CR ou LF. As respostas são `OK` ou `ERRO<TAB>mensagem1<TAB>mensagem2`. Cada conexão aceita múltiplos pedidos e é atendida por sua própria thread.

O nome do talhão é obrigatório e mantém o limite documentado de **1–150 pontos de código Unicode**, contando o valor original com todos os espaços. Não há trim, normalização ou filtro semântico. Nome nulo, vazio ou somente com espaços ASCII/Unicode recebe apenas `O nome do talhão é obrigatório.` para esse campo. Um nome preenchido acima do limite recebe `O nome do talhão deve ter no máximo 150 caracteres.`. Acentos, números e pontuação são preservados. Um caractere fora do BMP, como `🌱`, conta 1; uma letra seguida de acento combinante conta 2. A regra usa `codePointCount`, equivalente a `[...valor].length` no backend e à contagem de comprimento Unicode do validator MongoDB. As regras de área permanecem inalteradas.

## Cadastro de propriedades

Assinatura: `public static List<String> validarPropriedade(String nome, String municipio, String estado, Double areaTotalHa, String observacoes)` em `sentinela.validacao.ValidadorPropriedade`.

Nome e município são obrigatórios, não podem ser somente espaços e têm máximo de 150 pontos de código Unicode; observações são opcionais, mas quando presentes exigem conteúdo e têm máximo de 5000 pontos. Texto somente com espaços recebe apenas o erro de conteúdo, sem erro adicional de tamanho. A UF é exatamente uma das 27 siglas maiúsculas, sem aparar ou converter. Área omitida é válida; quando informada, precisa ser finita e maior que zero, sem teto ou precisão decimal adicional. Nomes repetidos são permitidos e não há consulta a municípios.

O Java não modifica os campos. No POST HTTP, o Node mantém o trim já existente de nome, município e observações antes da chamada Java; não aplica trim à UF. Não há normalização Unicode. Os limites contam pontos de código, não unidades UTF-16 ou grafemas. Null nos opcionais HTTP continua inválido; null nos argumentos Java representa ausência de área/observações.

Pedido de propriedades, com **exatamente sete partes**, separadas por tabulações reais:

```text
VALIDAR_PROPRIEDADE<TAB>nome<TAB>municipio<TAB>estado<TAB>areaTotalHa<TAB>observacoesPresente<TAB>observacoes
```

O marcador `0` exige o último campo vazio e representa ausência de observações. O marcador `1` representa presença, inclusive texto vazio (que é rejeitado pelo validador). Área vazia representa ausência; preenchida usa `Double.valueOf`. Falha na conversão retorna `A área total deve ser numérica.`, acumulada com os demais erros.

Escapes reversíveis, exclusivos dos campos de `VALIDAR_PROPRIEDADE`:

| Caractere original | Sequência transmitida |
|---|---|
| Barra invertida | `\\` |
| TAB | `\t` |
| CR | `\r` |
| LF | `\n` |

Codifique barras antes dos outros caracteres. Separe primeiro por TAB real, preservando campos vazios, e só então decodifique. Escape desconhecido ou barra final incompleta, estrutura incorreta ou marcador inválido retornam `ERRO<TAB>Pedido de validação inválido.`. Uma sequência literal barra + `n` é transmitida como `\\n`, distinguindo-a de LF. `CodecDeCampos` (Java) e `codec-validacao.ts` (TypeScript) implementam a mesma convenção. `VALIDAR_TALHAO` permanece sem escapes: suas barras são literais e campos continuam proibindo TAB, CR e LF reais.

As respostas de ambos os comandos permanecem `OK` ou `ERRO<TAB>mensagem1<TAB>mensagem2`, sempre em uma linha com flush. Erros de campos usam mensagens fixas, sem incluir valores recebidos. Conexões continuam aceitando múltiplos pedidos.

## Testes de propriedades sem Atlas

Na raiz, após compilar os fontes de produção conforme o início deste arquivo:

```powershell
$testes = @(Get-ChildItem servidor-java/src/test/java -Recurse -Filter '*.java' | ForEach-Object { $_.FullName })
javac -encoding UTF-8 -cp servidor-java/out -d servidor-java/out/testes @testes
if ($LASTEXITCODE -ne 0) { throw 'Falha na compilação dos testes Java' }
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorPropriedadeTest
npm --prefix backend run test:propriedades
npm --prefix backend run test:java
```

Com uma instância Java iniciada em outro terminal, `npm --prefix backend run test:propriedades:java` testa regras, Unicode, todas as UFs, escapes, pedidos malformados e compatibilidade por TCP real. Não importa Express, Firebase ou MongoDB. Os testes de rota usam mocks e não comprovam persistência real.

Com o Java iniciado, teste o cliente Node em outro terminal, na raiz:

```powershell
npm --prefix backend run test:java:real
```

Esse teste inclui 1, 150 e 151 pontos de código, campos vazios, espaços ASCII/Unicode, espaços externos incluídos no limite, acentos, números, pontuação, caracteres fora do BMP e acentos combinantes. `npm --prefix backend run test:talhoes` confere também que o schema HTTP e o modelo preservam o valor original e o mesmo limite, sem acessar o Atlas.

O harness `npm --prefix backend run test:talhoes:real -- --executar` compila os fontes recursivamente em um subdiretório exclusivo de `servidor-java/out/`, executa `sentinela.servidor.Servidor` com esse classpath e remove apenas sua compilação ao terminar. Seus pré-requisitos de autenticação, banco, segurança e limpeza estão em `backend/README.md`.

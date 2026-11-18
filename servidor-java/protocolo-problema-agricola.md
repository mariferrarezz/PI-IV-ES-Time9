# Validação estrutural de problemas agrícolas

`ValidadorProblemaAgricola.validarProblemaAgricola(CamposProblemaAgricola campos,
Instant instanteReferencia)` retorna `List<String>`, acumulando erros sem transformar,
deduplicar, completar ou reordenar os dados. `CamposProblemaAgricola` e seus objetos
`FormaControle`, `NiveisAtencao` e `RevisaoEditorial` são entradas, não modelos MongoDB.

## Regras

Nome comum obrigatório até 200 pontos de código; tipo `praga`, `doenca`, `deficiencia`;
descrição obrigatória até 5000. Nome científico opcional até 200. Textos informados
devem conter conteúdo além de espaços ASCII/Unicode, sem trim no Java. Comprimento é
de pontos de código, não bytes, grafemas ou unidades UTF-16. Conteúdo vazio gera
obrigatoriedade, sem erro adicional de comprimento.

Culturas e fontes são listas obrigatórias de 1–100 IDs sem repetição; IDs chegam
canonicalizados pelo Node. Não se valida existência ou disponibilidade no Java.
Sintomas e medidas preventivas: obrigatórios, 1–50 textos de até 1000 pontos cada.
Partes afetadas: opcionais, 0–30; condições favoráveis: opcionais, 0–50; danos:
opcionais, 1–50; boas práticas: opcionais, 1–30; todos com textos de até 1000 pontos.
Chips: opcionais, 0–4 textos até 150 pontos. Não há unicidade adicional nas listas editoriais.

Campos opcionais disseminação, orientação para agrônomo, onde olhar, dica de campo,
perda estimada, época propícia e introdução de tratamento: textos até 5000 pontos.
Abrangência das culturas: até 1000; código editorial: até 100. Níveis opcionais exigem
os três textos baixo/medio/alto preenchidos, até 1000 cada. São textos qualitativos,
sem cálculo de urgência, intensidade, risco ou limiar agronômico.

Formas de controle são obrigatórias, 1–30 objetos. Cada um exige tipo (`manual`,
`cultural`, `biologica`, `quimica`, `outra`) e descrição até 5000. Observações opcionais
até 5000, classe opcional até 200 e exemplos opcionais de 0–30 textos até 200 cada.
Não reutiliza regras de intervenção realizada, doses ou produto obrigatório.

Imagens opcionais (inclusive vazias) reutilizam `ImagemOcorrencia`/`ValidadorImagens`:
até cinco, HTTPS válida até 2048 pontos, publicId preenchido preservado integralmente
e sem repetição, legenda opcional preenchida até 300 pontos, envio obrigatório.
Envio futuro é permitido. Ordem preservada: a primeira imagem continua principal.
PublicId não possui teto textual de negócio; não fabricar imagens padrão.

Ativo é Boolean obrigatório; false difere de ausência. Sem revisão editorial, o
documento legado exige revisadoEm. Revisão presente exige status `pendente` ou
`aprovada`; pendente exige ativo false, com data opcional; aprovada exige data, podendo
continuar inativa. Observações de revisão opcionais até 5000, flags opcionais Boolean
registroAgrofitConferido/fotoPendente distinguem ausência de false. Data de revisão
presente não pode superar a referência confiável obrigatória. Não há outras relações temporais.

Ficha precisa cumprir obrigatórios e listas mínimas mesmo inativa. Opcionais não se
tornam obrigatórios por seção editorial. Java não define quais seções são aplicáveis.
Ausência interna é null, diferente de texto/lista/objeto vazio; isso não autoriza null
no futuro contrato HTTP. Não há defaults ou novas unicidades.

Fontes: `database/validators/validar-problemas_agricolas.mongodb.js` e BD4 §§4.7/4.7.1.
**Aprovação Java é estrutural**, sem revisão humana, fundamentação científica,
registro Agrofit ou disponibilidade para novas seleções. Consultas, autorização,
upload/autoria, revisão real, invalidação após edição, concorrência e persistência
permanecem no Node. Não aplica automaticamente a exceção acadêmica BD6.

## Contrato TCP

Pedido UTF-8 delimitado por quebra de linha. **59 partes fixas**, incluindo comando,
separadas por TAB real, preservando partes vazias:

| Parte | Conteúdo |
|---|---|
| 1 | VALIDAR_PROBLEMA_AGRICOLA |
| 2 | nomeComum |
| 3 | tipo |
| 4 | descricao |
| 5 | nomeCientificoPresente |
| 6 | nomeCientifico |
| 7 | culturasPresente |
| 8 | quantidadeCulturas |
| 9 | sintomasPresente |
| 10 | quantidadeSintomas |
| 11 | medidasPresente |
| 12 | quantidadeMedidas |
| 13 | controlesPresente |
| 14 | quantidadeControles |
| 15 | fontesPresente |
| 16 | quantidadeFontes |
| 17 | ativo |
| 18 | revisadoEm |
| 19 | instanteReferencia |
| 20 | partesPresente |
| 21 | quantidadePartes |
| 22 | condicoesPresente |
| 23 | quantidadeCondicoes |
| 24 | disseminacaoPresente |
| 25 | informacoesDisseminacao |
| 26 | orientacaoPresente |
| 27 | orientacaoBuscaAgronomo |
| 28 | imagensPresente |
| 29 | quantidadeImagens |
| 30 | codigoPresente |
| 31 | codigoEditorial |
| 32 | chipsPresente |
| 33 | quantidadeChips |
| 34 | niveisPresente |
| 35 | baixo |
| 36 | medio |
| 37 | alto |
| 38 | ondeOlharPresente |
| 39 | ondeOlhar |
| 40 | dicaPresente |
| 41 | dicaDeCampo |
| 42 | danosPresente |
| 43 | quantidadeDanos |
| 44 | perdaPresente |
| 45 | perdaEstimada |
| 46 | epocaPresente |
| 47 | epocaPropicia |
| 48 | abrangenciaPresente |
| 49 | abrangenciaCulturas |
| 50 | introducaoPresente |
| 51 | tratamentoIntro |
| 52 | boasPraticasPresente |
| 53 | quantidadeBoasPraticas |
| 54 | revisaoPresente |
| 55 | status |
| 56 | observacoesRevisaoPresente |
| 57 | observacoesRevisao |
| 58 | registroAgrofitConferido |
| 59 | fotoPendente |

Depois das fixas, nesta ordem:

1. Culturas (um ID por parte), sintomas (um texto por parte), medidas preventivas.
2. Controles: **8 partes** por controle: tipo, descricao, observacoesPresente,
   observacoes, classePresente, classe, exemplosPresente, quantidadeExemplos.
   **Imediatamente depois de cada controle**, seus exemplos (um texto por parte).
3. Fontes (um ID por parte), partes afetadas, condições favoráveis.
4. Imagens: **5 partes** por imagem: url, publicId, legendaPresente, legenda, enviadaEm.
5. Chips, danos, boas práticas.

Total exato:

```text
59 + culturas + sintomas + medidas + 8 × controles + totalExemplos
   + fontes + partes + condições + 5 × imagens + chips + danos + boasPraticas
```

Marcadores estritos `0`/`1`. Lista ausente usa 0 e contagem zero; presente vazia usa 1
e zero. Textos ausentes exigem parte vazia; presentes vazios chegam ao domínio como
inválidos. Níveis ausentes exigem baixo/medio/alto vazios. Revisão ausente exige status,
observações e flags vazios, com observacoesRevisaoPresente=0. Booleanos (ativo e flags)
usam vazio para ausência, 0 para false, 1 para true.

Contagens são decimais não negativas, sem sinal/zeros à esquerda exceto o próprio 0,
representáveis como inteiro de 32 bits e coerentes com a quantidade real de partes.
O parser calcula mínimos em long, pré-percorre todos os blocos/exemplos sem alocar
listas e só materializa após conferir disponibilidade de partes, marcadores e fim.
Não usa contagens recebidas como capacidade de coleções. Limites de negócio continuam
checados pelo validador, sem truncar itens excedentes.

Reutiliza codec de `\\`, `\t`, `\r`, `\n`: separar por TAB real antes de decodificar.
Datas usam o parser existente ISO UTC com Z; revisão vazia representa ausência,
referência vazia gera obrigatoriedade, data malformada gera erro de conversão.
Partes excedentes/truncadas, contagens, marcadores e escapes inválidos retornam
`ERRO<TAB>Pedido de validação inválido.` sem encerrar o atendimento.
Respostas continuam `OK` ou `ERRO<TAB>mensagem...`. Contratos anteriores não mudam.

## Transporte e testes

O transporte atual não impõe limite de bytes ao pedido; 64 KiB é limite da **resposta**
no cliente. O timeout total permanece 3 segundos. Pedido válido responde OK (3 bytes
com LF, 4 com CRLF). Não se alterou limite de transporte ou de negócio.
O teste `Transporte: ficha válida com todos os limites finitos simultâneos` mede bytes
e partes e envia uma ficha preenchida até os limites finitos, com caracteres de quatro
bytes UTF-8 e todas as listas/controles/exemplos. Não é um máximo absoluto: publicId
não tem teto, nem há garantia de prazo para pedidos arbitrariamente grandes.
Na retomada, a execução real mediu **3.207.763 bytes UTF-8 e 1.688 partes**,
incluindo o LF do pedido, e recebeu `OK` dentro do timeout atual. A fixture usa
caracteres suplementares de quatro bytes nos textos limitados, URLs ASCII de
2048 caracteres, IDs canonicalizados de 24 caracteres e publicIds curtos distintos.
Portanto, a medição não é um máximo em bytes de todas as representações possíveis.
No domínio, `publicId` é o campo textual sem teto finito; os IDs são recebidos
canonicalizados do Node, não textos editoriais arbitrários. O parser não inventa
um limite textual para esses IDs. O pedido não possui teto explícito no cliente
nem no `BufferedReader.readLine()` do servidor; memória e prazo continuam limites
operacionais. Nenhum limite foi ampliado para obter este resultado.
Respostas de erro são limitadas na montagem TCP a 65.536 bytes UTF-8, reservando
dois bytes para CRLF. Respostas pequenas e `OK` permanecem iguais. Quando necessário,
envia-se um prefixo ordenado de mensagens completas seguido de
`Existem erros adicionais não exibidos nesta resposta.`; o aviso aparece somente
quando há omissão. Se a primeira mensagem não couber com o aviso, envia-se apenas
`ERRO<TAB>` e o aviso. Não se cortam mensagens ou caracteres e não se deduplica.
Os validadores diretos continuam retornando todos os erros, em listas intactas.
O cliente mantém o limite de 64 KiB e rejeita respostas excessivas de outros
servidores como indisponibilidade; a resposta limitada válida retorna `valido=false`.

```powershell
# Após compilar produção em out e testes em out/testes:
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorProblemaAgricolaTest
# Com Java ativo separadamente:
npm --prefix backend run test:problemas:java
```

Testes locais não acessam Atlas/Firebase nem fazem aprovação real de conteúdo.

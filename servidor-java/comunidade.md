# Validação pura da Comunidade e telefone

Contrato definido antes das serializações. Fonte: validators das três coleções,
BD3 §10 e BD4 §14. Java não publica, modera, consulta ou persiste.
IDs são representados apenas por indicadores de presença internos, resolvidos pelo
Node; aprovação estrutural não comprova referência, autoria ou revisão humana.
Versões usam Long positivo no Java e bigint no TypeScript, preservando BSON long.
Datas UTC ISO com Z; metadados são fornecidos pelo chamador confiável, não defaults.
Textos são contados em pontos de código Unicode e não são transformados.

Assinaturas Java:
`validarExperienciaComunidade(CamposComunidade.Experiencia, Instant)`,
`validarAdocaoTratamento(CamposComunidade.Adocao)` e
`validarDenunciaComunidade(CamposComunidade.Denuncia, Instant)`, todas retornando
`List<String>`. Os clientes TypeScript correspondentes terminam em `NoJava` e
recebem campos e metadados em argumentos separados; referência em argumento próprio
para experiência e denúncia. Nenhum valor de status, data ou versão é gerado
automaticamente. As verificações de presença de referências não recebem IDs privados.

## Protocolos

Regras implementadas:

- Experiência: nome público 2–80; culturaNome 1–200; problemaNome opcional 1–200,
  exigido quando há referência de problema. Tipo praga/doenca/deficiencia/nao_identificado;
  não identificado proíbe essa referência. Status da ocorrência aberta/em_acompanhamento/
  encerrada; título 1–150; relato 1–5000. Fotos opcionais até cinco, HTTPS até 2048,
  publicId preenchido sem teto e sem duplicação, legenda opcional 1–300. Sem datas de
  envio ou autoria nas fotos públicas. Método opcional, exigido com tratamento de
  origem; tipo manual/cultural/biologica/quimica/outra, descrição 1–5000 e observações
  opcionais 1–5000. Resultado exige avaliação de origem e vice-versa; avaliação exige
  tratamento. Resultado melhora_observada/sem_mudanca/piora_observada/inconclusivo,
  data obrigatória não futura, observações opcionais 1–5000. Região opcional exige
  município 1–150 ou uma das 27 UFs exatas. Método ou problemaNome sem referência
  não são proibidos: o banco não define a dependência inversa.
- Versão positiva obrigatória. Moderação obrigatória: pendente proíbe revisor/data/
  motivo; aprovada exige revisor/data e publicação, motivo opcional; rejeitada/oculta
  exigem revisor/data/motivo; retirada permite ausência da decisão ou preservação de
  revisor/data juntos, motivo somente com ambos. Motivo presente 1–2000. Revisão não
  futura nem anterior à criação. Criação/atualização obrigatórias, publicação opcional
  nos demais estados com comparação interna, sem presumir aprovação histórica.
- Adoção: versão positiva, método copiado e planejamento obrigatórios. Método segue
  o mesmo contrato compartilhado; planejamento tem descrição 1–5000, observações
  opcionais 1–5000 e data opcional sem comparação temporal. Status planejada/realizada/
  cancelada; presença de tratamento somente em realizada. Criação/atualização obrigatórias.
- Denúncia: motivo dados_pessoais/conteudo_inadequado/informacao_perigosa/outro,
  descrição opcional 1–2000; status pendente/analisada. Pendente proíbe análise;
  analisada exige decisão manter_publicacao/ocultar_publicacao, justificativa
  preenchida 1–2000, analista e data. Data não futura nem anterior à criação.
  Criação/atualização obrigatórias. Motivo outro não torna descrição obrigatória.

Fontes de regra: `database/validators/validar-experiencias_comunidade.mongodb.js`,
`validar-adocoes_tratamento.mongodb.js`, `validar-denuncias_comunidade.mongodb.js`;
`docs/modelagem-mongodb.md` §10, `docs/regras-validacoes-indices.md` §14.1–14.5.
Índices em `database/indexes/configurar-indices.mongodb.js` conferidos: a unicidade
parcial de adoção planejada por experiência/ocorrência continua no MongoDB.

TAB real separa partes antes do codec atual. Marcadores estritos 0/1. Texto opcional
usa marcador e valor: ausência exige valor vazio. Objetos ausentes exigem campos
internos vazios e marcadores zero. Datas vazias representam ausência. Flags de
referências são marcadores de presença, não IDs nem autorização. Listas ausentes
exigem zero itens; fotos presentes vazias são permitidas. Cada foto tem quatro
partes: url, publicId, legendaPresente, legenda. Sem enviadaEm/enviadaPor fictícios.

### VALIDAR_EXPERIENCIA_COMUNIDADE: 40 + 4 × fotos

|Parte|Campo|
|---|---|
|1|comando|
|2|nomePublico|
|3|culturaNome|
|4|tipoProblema|
|5|statusOcorrencia|
|6|titulo|
|7|relato|
|8|problemaAgricolaPresente|
|9|problemaNomePresente|
|10|problemaNome|
|11|tratamentoOrigemPresente|
|12|avaliacaoOrigemPresente|
|13|metodoPresente|
|14|tipoMedida|
|15|descricaoMetodo|
|16|observacoesMetodoPresente|
|17|observacoesMetodo|
|18|resultadoPresente|
|19|resultado|
|20|dataAvaliacao|
|21|observacoesResultadoPresente|
|22|observacoesResultado|
|23|regiaoPresente|
|24|municipioPresente|
|25|municipio|
|26|estadoPresente|
|27|estado|
|28|versao|
|29|moderacaoPresente|
|30|statusModeracao|
|31|revisorPresente|
|32|revisadoEm|
|33|motivoModeracaoPresente|
|34|motivoModeracao|
|35|publicadoEm|
|36|criadoEm|
|37|atualizadoEm|
|38|instanteReferencia|
|39|fotosPresente|
|40|quantidadeFotos|

Depois seguem os grupos de quatro partes por foto, na ordem original.

### VALIDAR_ADOCAO_TRATAMENTO: exatamente 16 partes

1 comando; 2 experienciaVersao; 3 metodoPresente; 4 tipoMedida; 5 descricaoMetodo;
6 observacoesMetodoPresente; 7 observacoesMetodo; 8 planejamentoPresente;
9 descricaoPlanejamento; 10 dataPrevista; 11 observacoesPlanejamentoPresente;
12 observacoesPlanejamento; 13 status; 14 tratamentoPresente; 15 criadoEm;
16 atualizadoEm. Data prevista futura é permitida; não é aplicação realizada.

### VALIDAR_DENUNCIA_COMUNIDADE: exatamente 14 partes

1 comando; 2 motivo; 3 descricaoPresente; 4 descricao; 5 status;
6 decisaoPresente; 7 decisao; 8 justificativaPresente; 9 justificativa;
10 analistaPresente; 11 analisadoEm; 12 criadoEm; 13 atualizadoEm;
14 instanteReferencia.

## Fronteiras e pendências

Moderação e análise conferem condições internas e datas comparáveis à criação e
referência. Publicação confere criadoEm ≤ publicadoEm ≤ atualizadoEm. Não se exige
que planejamento seja futuro. Datas copiadas de avaliação não são futuras; não há
data da aplicação neste contrato para comparar. Não se inventa comparação adicional.
Preservação histórica da publicação, transições, projeção pública, seleção de fotos,
referências e versões consultadas, unicidade e concorrência ficam no Node/MongoDB.
Não há rotas/modelos implementados. As telas atuais não estabelecem contrato HTTP
de Comunidade nem algoritmo de normalização telefônica. Ausência interna usa null;
isso não autoriza null num futuro body HTTP. Não escolhemos versões vigentes.
Respostas usam o montador existente de 64 KiB, com aviso explícito de erros omitidos;
validadores diretos mantêm todos os erros.

## DDD

Relação oficial de códigos nacionais por UF, página 2, consultada em **2026-11-17**:
https://www.anatel.gov.br/Portal/verificaDocumentos/documento.asp?assuntoPublicacao=null&caminhoRel=null&documentoPath=telefonia_fixa%2Fstfc%2Fcod_prestadoras%2Flista_csp_codigos_nacionais.pdf&filtro=1&numeroPublicacao=141766

Os 67 códigos distintos são incorporados no Java; nenhuma rede é usada na validação.
O formato continua `^\+55[0-9]{2}9[0-9]{8}$`, sem aceitar separadores. A BD3 §3.1 e
BD4 §4.1 dizem que a aplicação normaliza, mas não definem algoritmo/entradas aceitas;
essa normalização fica pendente. A tela `tela_cadastro_telefone.dart` possui entrada
telefônica sem algoritmo canônico completo. DDD e formato não comprovam posse,
existência do número ou envio de código; nenhuma unicidade é adicionada.

## Verificação local

`npm --prefix backend run test:comunidade:java` usa o Java configurado por
JAVA_HOST/JAVA_PORT; compilar produção em `servidor-java/out` antes da execução.
O teste direto é `sentinela.validacao.ValidadorComunidadeTest` com classpath de
produção e `out/testes`. A execução de conclusão usou uma instância Java própria
em porta temporária, encerrada no finally, sem tocar serviços anteriores ou Atlas.
Na retomada, passaram 366 verificações diretas Java, TypeScript (produção e testes afetados),
964 testes Node/TCP (incluindo regressões anteriores) e `git diff --check`.
Os validadores, comandos e clientes anteriores foram preservados; corrigiu-se apenas
a validação duplicada do motivo em moderação rejeitada/oculta. O motivo continua
obrigatório nesses estados, mas cada falha de conteúdo gera uma única mensagem.

Para revisão: `out/` e `*.class` são gerados e ignorados; não incluir `.env`, tokens,
logs ou dados sintéticos. `database/perfil-temporario-manual.local.json` já existia
antes desta tarefa e deve ficar fora do commit; não foi lido ou alterado aqui.

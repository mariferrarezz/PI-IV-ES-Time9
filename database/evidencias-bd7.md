# BD7 — Testes e validação final do banco

## Estado e origem das evidências

Enunciado completo fornecido pelo usuário: revisão de estrutura, integridade, consultas, índices, massa BD6, integração inicial e registro dos problemas. A dependência formal é a conclusão das Issues 1–6. **BD7 concluído no escopo documentado, com base nos resultados existentes e na declaração de aceite do usuário em 10/11/2026.** Acesso, rede/IPs e revisão/aceite foram aprovados por declaração do usuário; não constituem nova verificação técnica.

Fontes desta consolidação, lidas localmente sem repetir os testes:

- [relatorio-bd7-leitura.txt](../relatorio-bd7-leitura.txt): `banco: sentinela`, `modo: --leitura`, `somenteLeitura: true`, `leitura.aprovado: true`.
- [relatorio-bd7-crud.txt](../relatorio-bd7-crud.txt): `modo: --crud`, `somenteLeitura: false`, leitura e temporários aprovados; rodada `6aebae7a4b6206df65974811`.
- [Evidências BD5](evidencias-bd5.md) e [BD6](evidencias-bd6.md): resultados anteriores, separados desta execução.

Os relatórios mencionados anteriormente como Texto colado(7)/(8) estavam inacessíveis nas revisões anteriores. Essa limitação foi resolvida pelos dois arquivos salvos na raiz; as pendências de recebimento foram substituídas pelos resultados efetivamente conferidos. O arquivo CRUD contém linhas de reserva de IDs antes do objeto JSON final: ambos foram considerados, sem tratar o arquivo inteiro como um único JSON. Os textos acentuados apresentam corrupção de codificação; nomes foram apresentados aqui conforme o executor, sem alterar os originais. Campos estruturais, números, códigos e booleanos estão legíveis. Não há data/hora de execução no objeto final: não se inventou horário a partir do ObjectId ou da data do arquivo.

Nesta atualização somente este documento foi alterado. Não houve acesso ao Atlas, repetição de testes, cargas, configuração, alteração de scripts, dados, credenciais, backend, schemas ou índices. A branch permanece `database/configuracao-bd5`; as alterações locais anteriores foram preservadas.

## Matriz dos critérios de aceite

| Critério do enunciado | Evidência e resultado | Situação / limite |
|---|---|---|
| Todas as coleções revisadas | Local: 15 tabelas BD3 e configurações. Remoto: auditoria das 15 coleções, sem adicionais | Atendido tecnicamente |
| Estrutura corresponde à modelagem | Local: 15 schemas individuais iguais aos consolidados; tabelas principais comparadas. Remoto: aprovação do fluxo que exige igualdade integral dos validators, strict/error e opções compatíveis | Atendido no escopo conferido; aprovação humana da modelagem não presumida |
| Tipos e obrigatórios corretos | Local: 200 snapshots e 60 casos de schema. Remoto: 224 documentos globais, zero inválidos nas 15 coleções | Atendido; não equivale a testar todas as combinações possíveis |
| Regras de validação funcionando | Evidências BD5; nesta rodada, atualização inválida e cinco inserções inválidas rejeitadas com 121 | Atendido para casos principais e escopo documentado |
| Relacionamentos testados | Remoto: zero referências ausentes nos campos projetados; 200 snapshots consistentes e conferidos | Atendido para referências auditadas e cenários BD6; não há foreign keys |
| Dados válidos e inválidos testados | 12 entradas de testes temporários aprovadas e limpeza zero | Atendido; CRUD desta rodada cobre propriedades temporárias |
| Principais consultas testadas | BD5: 29 consultas com massa anterior. BD7: 34 consultas em cada relatório, métricas e correspondências iguais entre os modos | Atendido tecnicamente; sete planos globais com COLLSCAN/SORT analisados abaixo |
| Índices verificados | BD5: 22 listados/conferidos e quatro únicos testados. Local atual: definição por chaves ordenadas, unique e parciais. BD7: fluxo remoto exige correspondência antes de prosseguir | Atendido nos limites do executor; a saída não contém nova listagem integral dos 22 índices |
| Massa de testes validada | Remoto: demonstracao_aplicada, 200 documentos, 184 principais preservados + uma ficha com alteração autorizada + sete do complemento + oito das adoções | Atendido; 200 é subconjunto do total global 224 |
| Integração inicial, quando aplicável | Driver MongoDB em Node: conexão, leitura, inserção, atualização, rejeições, exclusão e limpeza comprovadas | Atendido como integração inicial direta; não comprova API/Flutter |
| Problemas corrigidos ou documentados | LF/CRLF já corrigido; planos, backend anterior, conteúdo simulado, codificação e limites registrados | Atendido para problemas conhecidos; não foram feitas mudanças silenciosas de modelagem |
| Documentação atualizada | Este relatório consolida as duas execuções sem substituir as evidências BD5/BD6 | Atendido no escopo técnico |
| Equipe revisou e aprovou | Usuário declarou aprovadas as pendências de revisão/aceite em 10/11/2026 | Atendido por declaração do usuário, sem verificação independente |
| Banco pronto para próximas etapas | Resultados técnicos existentes e declaração de aceite em 10/11/2026 | Atendido no escopo BD7 e nos limites documentados |

## Estrutura, configuração e documentos existentes

As auditorias `existentes`, o resultado `massa` e as 34 entradas de `consultas` são iguais entre o relatório de leitura e a parte de leitura do CRUD. Em ambos: `existentes.aprovado: true`, `colecoesAdicionais: []`, `referenciasAusentes: []`, `totalReferenciasAusentes: 0` e zero inválidos em cada coleção.

| Coleção | Total global auditado | Documentos BD6 | Inválidos globais |
|---|---:|---:|---:|
| usuarios | 3 | 2 | 0 |
| propriedades | 4 | 3 | 0 |
| talhoes | 7 | 6 | 0 |
| culturas | 24 | 23 | 0 |
| plantacoes | 9 | 8 | 0 |
| problemas_agricolas | 42 | 40 | 0 |
| fontes_conhecimento | 82 | 80 | 0 |
| ocorrencias | 10 | 6 | 0 |
| monitoramentos | 10 | 8 | 0 |
| tratamentos | 9 | 6 | 0 |
| avaliacoes_tratamento | 5 | 4 | 0 |
| alertas | 2 | 1 | 0 |
| experiencias_comunidade | 9 | 7 | 0 |
| adocoes_tratamento | 4 | 3 | 0 |
| denuncias_comunidade | 4 | 3 | 0 |
| **Total** | **224** | **200** | **0** |

Há 24 registros globais fora dos lotes BD6. As contagens globais foram coletadas nas leituras anteriores ao CRUD temporário; não são uma nova contagem global impressa após a limpeza. A leitura auditou schema e existência das referências projetadas também nos registros anteriores; não comparou todos esses 24 registros integralmente com snapshots históricos.

O executor chama `configuracao` antes de produzir o resultado aprovado: compara os validators completos, strict/error e opções das 15 coleções, e exige os 22 índices por chaves na ordem exata, unique e filtros parciais, além de rejeitar opções incompatíveis. Portanto, o sucesso do fluxo evidencia essa conferência remota. A saída não traz uma nova listagem completa dos índices nem identifica individualmente todos os adicionais; a listagem anterior do BD5 continua sendo a fonte para esse detalhe. Nenhum índice foi criado, removido ou substituído. Não há nova prova de concorrência ou repetição dos quatro testes de unicidade BD5; a duplicidade desta rodada é a do próprio `_id` temporário.

### Preservação dos três lotes e estado editorial

`massa.aprovado: true`, `estado: demonstracao_aplicada`, `totalDocumentosDosLotes: 200`, `novos: 0`, `principalPreservado: 184`, `fichaExistenteComAlteracaoExplicita: 1`, `comunidadePreservada: 7`, `adicionaisPresentes: 8`. As verificações adicionais identificam dois registros idênticos de ocorrências, dois de tratamentos, uma experiência e três adoções, todos sem inválidos.

O resultado confirma 39 fichas BD6 pendentes/inativas e uma aprovada/ativa por simulação, com `revisaoTecnicaRealComprovada: false`. Isso se refere às 40 fichas dos lotes, não ao estado dos dois problemas antigos fora da massa. A ficha de Lagarta-do-cartucho não foi duplicada; o snapshot da única alteração autorizada está em [alteracao-ficha.json](seed/adocoes-demonstracao-bd6/alteracao-ficha.json).

As adoções planejada, realizada com tratamento correspondente e cancelada têm uma correspondência BD6 em cada consulta. Mesma cultura/problema, autoria, cronologia e demais relações são conferidas pelas verificações locais sobre os snapshots e pela comparação desses documentos no banco.

No modo CRUD, a saída final ocorre depois da chamada de reconferência dos 200 e da configuração. O sucesso do fluxo também evidencia essa reconferência posterior, embora seu resultado detalhado não seja impresso como um segundo bloco independente. O campo `massa.escritaExecutada: false` descreve a validação da massa, não nega as escritas temporárias do modo `--crud`.

## CRUD temporário — resultados individuais

Todos os 12 objetos de `temporarios.testes` têm `aprovado: true`; `temporarios.aprovado: true` e **`temporariosRestantes: 0`**. A rodada usa somente propriedades temporárias. Os códigos esperados e obtidos coincidem.

| Teste | Resultado efetivamente registrado |
|---|---|
| Inserção e leitura válidas | Aprovado |
| Atualização válida e leitura posterior | Aprovado; matchedCount 1 e modifiedCount 1 |
| Atualização inválida | Rejeitada com 121 |
| Original preservado após rejeição | Aprovado, caso separado |
| Duplicidade do `_id` temporário | Rejeitada com 11000 |
| Obrigatório ausente | Rejeitado com 121 |
| Tipo incorreto | Rejeitado com 121 |
| Enum inválido | Rejeitado com 121 |
| Área não positiva | Rejeitada com 121 |
| Campo adicional proibido | Rejeitado com 121 |
| ObjectId sem documento pai | schemaAceitou true; referenciaAusenteIdentificadaPorConsulta true; caso aprovado e removido na limpeza |
| Exclusão apenas do temporário criado | Aprovado |
| Limpeza final (campo adicional aos 12 casos) | temporariosRestantes 0 |

Os IDs reservados aparecem antes do JSON final do relatório CRUD. A limpeza usa a lista fechada dos candidatos da própria execução, não prefixos ou registros da massa. Não foram testadas exclusões de pais preexistentes ou com dependentes. A ausência de referências na auditoria inicial não contradiz o caso negativo: o órfão foi criado temporariamente depois da auditoria e removido antes da conclusão.

A integração é direta pelo driver MongoDB no Node, sem inicializar os modelos legados, autoIndex, Firebase ou servidor HTTP. Não comprova CRUD da API, integração Flutter, isolamento entre produtores, consentimento, autorização de moderação ou transições da aplicação. ObjectId valida o tipo do identificador; **não garante que o documento pai exista**.

## Consultas e planos reais desta execução

São 34 consultas em cada relatório, com métricas idênticas: **27 com índice e sem SORT/COLLSCAN; sete com COLLSCAN e SORT; nenhuma sem resultados**. Não são 68 formatos diferentes nem um benchmark. As correspondências BD6 são conferidas separadamente pelo executor; o explain usa o filtro natural, sem a restrição extra aos IDs do lote, sem hint, com projeção mínima `_id` e limite 20.

A tabela abaixo registra cada consulta. `BD6` é a quantidade conferida dentro dos lotes; `R` é nReturned do explain natural; `K` e `D` são chaves e documentos examinados. Os valores de R podem incluir registros anteriores. `CS+S` indica COLLSCAN e SORT bloqueante, sem índice escolhido.

| Consulta | BD6 | R | K | D | Índice / estágios de atenção |
|---|---:|---:|---:|---:|---|
| Propriedades por produtor | 2 | 2 | 2 | 2 | `ix_propriedades_usuarioId` |
| Detalhe da propriedade | 1 | 1 | 1 | 1 | `_id_` |
| Talhões da propriedade | 2 | 2 | 2 | 2 | `ix_talhoes_propriedadeId` |
| Plantações do talhão | 1 | 1 | 1 | 1 | `ix_plantacoes_talhao_safra_status` |
| Plantações por safra e estado | 1 | 1 | 1 | 1 | `ix_plantacoes_talhao_safra_status` |
| Catálogo por cultura | 1 | 1 | 4 | 4 | `ix_problemas_culturas_tipo` |
| Catálogo por cultura e tipo | 1 | 1 | 3 | 3 | `ix_problemas_culturas_tipo` |
| Ocorrências por plantação | 2 | 2 | 2 | 0 | `ix_ocorrencias_plantacao_data` |
| Ocorrências por problema | 2 | 2 | 0 | 10 | CS+S |
| Ocorrências por período | 1 | 1 | 1 | 0 | `ix_ocorrencias_plantacao_data` |
| Ocorrências estado aberta | 3 | 7 | 0 | 10 | CS+S |
| Ocorrências estado em_acompanhamento | 1 | 1 | 0 | 10 | CS+S |
| Ocorrências estado encerrada | 2 | 2 | 0 | 10 | CS+S |
| Ocorrências intensidade baixa | 4 | 7 | 0 | 10 | CS+S |
| Ocorrências intensidade media | 1 | 1 | 0 | 10 | CS+S |
| Ocorrências intensidade alta | 1 | 2 | 0 | 10 | CS+S |
| Monitoramentos da plantação | 2 | 2 | 2 | 0 | `ix_monitoramentos_plantacao_data` |
| Inspeção sem ocorrência | 1 | 1 | 2 | 2 | `ix_monitoramentos_plantacao_data` |
| Monitoramentos por ocorrência | 1 | 1 | 1 | 0 | `ix_monitoramentos_ocorrencia_data` |
| Tratamentos por ocorrência | 1 | 1 | 1 | 0 | `ix_tratamentos_ocorrencia_data` |
| Avaliações por tratamento | 1 | 1 | 1 | 0 | `ix_avaliacoes_tratamento_data` |
| Alertas não lidos | 1 | 1 | 1 | 1 | `ix_alertas_usuario_data` |
| Moderação pendente | 2 | 3 | 3 | 0 | `ix_experiencias_moderacao_fila` |
| Moderação aprovada | 2 | 3 | 3 | 0 | `ix_experiencias_moderacao_fila` |
| Moderação rejeitada | 1 | 1 | 1 | 0 | `ix_experiencias_moderacao_fila` |
| Moderação oculta | 1 | 1 | 1 | 0 | `ix_experiencias_moderacao_fila` |
| Moderação retirada | 1 | 1 | 1 | 0 | `ix_experiencias_moderacao_fila` |
| Feed por cultura e problema | 1 | 1 | 1 | 1 | `ix_experiencias_problema_feed` |
| Adoção planejada | 1 | 1 | 3 | 3 | `ix_adocoes_usuario_data` |
| Adoção realizada | 1 | 1 | 3 | 3 | `ix_adocoes_usuario_data` |
| Adoção cancelada | 1 | 1 | 3 | 3 | `ix_adocoes_usuario_data` |
| Planejada por par | 1 | 1 | 1 | 1 | `uq_adocoes_experiencia_ocorrencia_planejada` |
| Denúncias pendente | 1 | 2 | 2 | 0 | `ix_denuncias_status_fila` |
| Denúncias analisada | 2 | 2 | 2 | 0 | `ix_denuncias_status_fila` |

### Avaliação dos sete COLLSCAN/SORT

Os sete casos são exatamente **ocorrências por problema; estado aberta, em_acompanhamento e encerrada; intensidade baixa, media e alta**. Todos examinaram os dez documentos globais de ocorrências e zero chaves. Os retornos estão individualizados na tabela. Não houve COLLSCAN ou SORT nas demais consultas.

Esses filtros são **globais de diagnóstico**: não incluem `plantacaoId` nem delimitam produtor/propriedade. A BD3 §§7.1–7.2 prevê ocorrências por plantação com período/status opcionais e dashboard obtido pela cadeia de propriedades/talhões/plantações autorizados. O índice `{ plantacaoId: 1, dataObservacao: -1, _id: -1 }` possui o prefixo e ordem desse histórico; não oferece caminho direto equivalente para problema, status ou intensidade isolados em todo o banco.

Há evidência positiva para o caminho delimitado: por plantação foram examinadas duas chaves e zero documentos, com dois retornos; por plantação/período, uma chave e zero documentos, com um retorno. Isso não demonstra o plano de uma futura consulta entre várias plantações, nem resolve a ordenação global de históricos entre elas — necessidade que a modelagem mantém para especificação conforme a tela.

**Encaminhamento:** registrar a limitação dos filtros globais, sem classificar as sete varreduras como falha estrutural nem criar índice automaticamente. Antes de decidir novos índices, a implementação deve definir o escopo autorizado, filtro e ordenação da consulta real. Se uma busca global ou um histórico entre plantações for requisito efetivo e continuar custoso com volume representativo, abrir avaliação específica de índices/plano. Com dez documentos nesta coleção, não há evidência suficiente para impor alteração agora. As consultas globais não são exemplos de endpoints seguros sem delimitação de acesso.

Nos outros casos, os índices correspondem aos caminhos previstos: propriedade por usuário, talhão por propriedade, plantação por talhão/safra/status, históricos por referência/data, fila por estado, adoções por usuário e único parcial de planejada por par. O feed combinado usou `ix_experiencias_problema_feed`; cultura pode ser filtro residual, conforme BD4 §14.6. O catálogo usou o multikey cultura/tipo; atividade e revisão permanecem residuais. A fila de moderação ordena por criação e não deve ser confundida com o feed por primeira publicação.

Massa pequena, projeção mínima e limite 20 não comprovam custo da tela completa, desempenho em escala ou comparação antes/depois. Resultados cobertos com D=0 não garantem cobertura quando a projeção incluir outros campos. Os planos são os relatados nesta execução; não extrapolar para outras distribuições ou versões do servidor. Nenhum índice foi alterado ou proposto como condição obrigatória de fechamento.

## Evidências locais e anteriores reutilizadas

- BD5: configuração e índices, testes principais de schema, CRUD básico, quatro únicos com 42 verificações aprovadas/zero falhas e um cenário de alerta fora do parcial não executável sem violar o schema; 29 explains com massa anterior. Não atribuir seus planos a esta execução BD7.
- BD6: 185 + 7 + 8 documentos; exceção editorial explícita. Os relatórios atuais acrescentam reconferência remota, sem reaplicar cargas.
- Local: 15 tabelas principais do BD3 comparadas por nomes/tipos explícitos/obrigatórios S; 15 schemas individuais iguais aos consolidados; 22 índices comparados por chaves ordenadas, unique e parciais; 200 snapshots e referências; 60 casos locais de schema (um válido e três negativos por coleção); 34 filtros com correspondências calculadas.
- Local: nove verificações existentes BD6/BD7 aprovadas, sintaxe e diff sem erros. Refatoração das bibliotecas preservou exports, pacotes, impressões e três planos comparados com a versão anterior; 14 funções de proteção/execução mantiveram o código funcional, desconsiderados comentários.
- Testes em memória cobrem repetição, divergências, rollback simulado e limpeza dos próprios temporários. Mocks não comprovam transações/autorizações no servidor; a integração remota acima acrescenta somente o que seus casos efetivamente demonstraram.

O avaliador local não interpreta automaticamente toda a prosa, todas as condições C ou a revisão humana da modelagem. Os schemas completos são usados na validação; as referências consultadas não equivalem a foreign keys e as leituras avulsas não constituem snapshot único.

## Responsabilidades e problemas registrados

| Item | Classificação e encaminhamento |
|---|---|
| Schema | Tipos, obrigatórios, enums, limites e condições internas definidos; não impõe existência do pai, transições históricas ou revisão humana |
| Índices | Consultas e quatro restrições únicas com seus parciais; não garantem autorização, compatibilidade agrícola ou desempenho |
| Scripts/consultas | Referências existentes auditadas e cenários BD6 conferidos; não protegem automaticamente todas as escritas futuras |
| Aplicação | Deve resolver UID Firebase → usuários → propriedades, autorização, consentimento e transições; não comprovados pelo driver |
| Sete COLLSCAN/SORT globais | Limitação de acesso/ordenação desses filtros; encaminhamento para definição da consulta real e medição futura, sem mudança automática de índice |
| Backend de propriedades anterior ao schema | Importante para uso desse endpoint; tratar em issue de integração, não enfraquecer validators nem declarar API validada |
| Uma ficha aprovada/ativa simulada | Exceção deliberada de desenvolvimento; não é revisão agronômica, eficácia ou aprovação profissional; não promover a massa para produção |
| Fontes parcialmente confirmadas, controles e imagens | Pendências de conteúdo para disponibilização agrícola real; não bloqueiam as adoções acadêmicas autorizadas |
| Codificação dos relatórios | Textos acentuados corrompidos, sem impedir leitura dos resultados estruturados; preservar originais e corrigir captura futura se necessário, sem repetir os testes já comprovados |
| LF/CRLF | Problema local já corrigido e testado; dados e hashes históricos preservados |
| Acesso e rede | Pendências aprovadas por declaração do usuário em 10/11/2026; acesso previsto somente para o usuário e sua amiga. Não houve nova inspeção de IPs/permissões |
| Aceite | Pendências de revisão/aceite aprovadas por declaração do usuário em 10/11/2026, inclusive para o fechamento documental das dependências; não houve auditoria independente ou alteração de status externo |

Não foi identificado nos relatórios erro estrutural, referência ausente persistente ou falha de CRUD que exija alterar o banco. As sete varreduras foram documentadas como limitação, sem evidência de necessidade obrigatória de novo índice. Nenhum teste foi repetido nesta consolidação.

## Reprodução histórica — não executar novamente para documentar

A partir da raiz do repositório, os modos preparados são:

```powershell
node database/tests/validar-bd7.cjs --local
node database/tests/verificar-executor-bd7.cjs
# Já executados remotamente, conforme os relatórios preservados:
node database/tests/validar-bd7.cjs --leitura
node database/tests/validar-bd7.cjs --crud --autorizar-temporarios
```

Os modos remotos usam `MONGODB_URI` do processo ou leitura de `backend/.env`, sem imprimi-la, e destino fixo `sentinela`. Não ampliar permissões nem fixar resolvedores DNS específicos de outra rede. O contorno DNS do BD6 é histórico e está documentado em suas evidências. A limpeza zero desta rodada não garante limpeza em execução futura com encerramento abrupto; IDs reservados e diagnóstico seguro permanecem necessários.

## Checklist final e pendências exatas

- [x] Enunciado completo recebido e critérios mapeados.
- [x] Estrutura, embedding, tipos e obrigatórios revisados localmente e documentos existentes validados remotamente nas 15 coleções.
- [x] Configuração e índices conferidos pelo fluxo remoto, com definições e evidências anteriores distinguidas.
- [x] Referências auditadas sem ausências; 200 documentos BD6 e estado editorial exato reconferidos.
- [x] 34 consultas/explains com massa BD6 executados e analisados, inclusive sete COLLSCAN/SORT.
- [x] Integração inicial Node e 12 casos temporários aprovados; limpeza zero confirmada e reconferência dos 200 pelo fluxo.
- [x] Problemas conhecidos documentados, sem correção estrutural adicional indicada pelos resultados disponíveis.
- [x] Documentação consolidada com separação entre histórico, testes locais, resultados remotos e simulação acadêmica.
- [x] Acesso e rede/IPs aprovados por declaração do usuário em 10/11/2026; somente ele e sua amiga acessarão o banco.
- [x] Pendências de revisão/aceite das dependências consideradas aprovadas pelo usuário em 10/11/2026, para este fechamento documental; sem nova revisão técnica ou mudança das issues externas.
- [x] Revisão/aceite do BD7 registrados por declaração do usuário em 10/11/2026.

**Não falta repetir testes remotos ou criar índices para suprir estes resultados.** As pendências de acesso/rede e aceite acima foram atendidas por declaração do usuário, sem repetir verificações técnicas. Integração completa API/Flutter, autorização/transições e desempenho com volume representativo pertencem aos respectivos escopos futuros; não são apresentados como já comprovados nem como novas exigências desta integração inicial.

**Estado final: BD7 concluído no escopo documentado, com evidências técnicas existentes e aceite declarado pelo usuário em 10/11/2026.**

## Declaração de aceite e fechamento documental — 10/11/2026

O usuário declarou que somente ele e sua amiga acessarão o banco e considerou aprovadas as pendências de acesso dos integrantes, rede/IPs autorizados e revisão/aceite da equipe. Este registro reproduz **a declaração do usuário**: não comprova nova inspeção do Atlas, teste de acesso pela amiga, identificação técnica individual dos IPs ou reunião/revisão independente. Não se inventam nomes, datas de testes ou atas.

Foram conferidos os critérios restantes nos registros existentes. Os resultados técnicos e seus limites permanecem preservados; as pendências de confirmação/aceite foram atendidas pela declaração acima. O BD7 tem estrutura, regras, referências, índices, massa, consultas e integração inicial documentados.

**BD7 considerado concluído no escopo da issue neste documento**, com base nas evidências anteriores e no aceite declarado. Não houve alteração do status de issues em serviço externo. Não foram repetidos testes nem acessado o Atlas ou alteradas configurações nesta atualização. As limitações registradas continuam válidas: integração Flutter e outros endpoints não são comprovados; simulação acadêmica não equivale a revisão agronômica real.

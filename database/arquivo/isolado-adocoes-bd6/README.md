# BD6 — Adoções em simulação isolada

**Plano substituído; não executar.** O usuário decidiu manter a massa no `sentinela` de desenvolvimento e não criar/configurar `sentinela_testes_bd6`. Os arquivos deste diretório são preparação histórica não aplicada. O plano atual está em [adocoes-demonstracao-bd6](../../seed/README.md#cenarios-das-adocoes-academicas), com alteração explícita da ficha existente, sem duplicá-la. Os comandos abaixo permanecem somente como registro do plano anterior.

**Disponível somente após execução em `sentinela_testes_bd6`. Nenhum comando foi executado no Atlas nesta preparação.** Não misturar estes arquivos ou relatórios com os lotes compartilhados de 185 + 7 documentos. O banco `sentinela` e suas 40 fichas pendentes/inativas não são alterados. As três adoções do ambiente compartilhado continuam bloqueadas.

## Documentos e proveniência

| Coleção | Documentos |
|---|---:|
| usuarios | 2 |
| propriedades | 2 |
| talhoes | 2 |
| culturas | 1 — Milho |
| plantacoes | 2 ativas |
| problemas_agricolas | 1 cópia de Lagarta-do-cartucho |
| fontes_conhecimento | 3, copiadas da ficha |
| ocorrencias | 2 abertas, origem e destino identificados |
| tratamentos | 2, um na origem e um na realização do destino |
| avaliacoes_tratamento | 1, da origem, resultado inconclusivo |
| experiencias_comunidade | 1 aprovada simulada, com método e resultado copiados |
| adocoes_tratamento | 3 — planejada, realizada e cancelada |
| monitoramentos, alertas, denuncias_comunidade | 0 |
| **Total** | **22** |

`documentos.json` contém Extended JSON. `manifesto.json` registra aliases, IDs estáveis em namespace exclusivo, contagens, hashes dos arquivos compartilhados preservados e a origem da cópia: `lagarta-do-cartucho`, uma das 40 fichas existentes. Nenhum problema adicional foi inventado. Seções e três fontes da ficha são preservadas; a cultura Milho é remapeada à cópia isolada. Os limites editoriais e de comprovação das fontes continuam valendo. Não se criam imagens, princípios ativos, doses, produtos ou referências bibliográficas.

Na cópia isolada, `revisaoEditorial.status: aprovada`, `ativo: true` e `revisadoEm` são **SIMULAÇÃO PARA TESTES**, sem revisão técnica comprovada. A ressalva está em `revisaoEditorial.observacoes`, permitido pelo schema, e neste manifesto; `registroAgrofitConferido` continua false. Isso representa elegibilidade sintética, não aprovação agronômica. Não importar essa cópia no catálogo compartilhado nem usá-la como recomendação real.

Usuários, termos, moderação e consentimento são fictícios. O usuário B atua como moderador simulado da experiência de A; isso não concede papel ou permissão à conta e não introduz campo de papel no schema. Não enviar SMS ou mensagens e não tentar autenticar com estes dados sintéticos. A referência em `revisadoPor` não comprova autorização pela API.

## Autoria, cronologia e restrições

Cada produtor tem sua propriedade, talhão e plantação ativa de Milho. As duas ocorrências apontam ao mesmo ObjectId da ficha isolada. A experiência de A copia seu método, sua avaliação inconclusiva e sua cultura/problema; B adota na ocorrência de destino de sua propriedade.

| Instante UTC simulado | Evento |
|---|---|
| 01/11/2026, 07h–09h | Preparação dos apoios, revisão editorial simulada às 08h e plantio às 09h |
| 02/11, 10h | Observações identificadas na origem e no destino |
| 02/11, 13h | Tratamento manual na origem, sem prescrição ou eficácia comprovada |
| 03/11, 10h | Avaliação da origem, inconclusiva |
| 03/11, 11h–12h | Experiência criada; moderação aprovada/publicação às 12h, ambas simuladas |
| 03/11, 13h–13h30 | Primeiro planejamento criado e cancelado |
| 03/11, 14h–16h | Segundo planejamento criado e realizado, com tratamento B às 16h |
| 03/11, 17h | Terceiro planejamento criado, permanecendo planejado |

As três adoções têm IDs distintos e o mesmo par experiência/ocorrência. Existe **apenas uma planejada** no snapshot final, respeitando o índice único parcial `{ experienciaId: 1, ocorrenciaId: 1 }`, filtro `{ status: 'planejada' }`. Realizada tem `tratamentoId` da ocorrência B; planejada e cancelada não têm esse campo. Versão e método copiados coincidem com a experiência disponível. As janelas simuladas não se sobrepõem: cancelamento precede o segundo planejamento e realização precede o terceiro. Os snapshots não comprovam concorrência nem execução dessa sequência na API.

A carga grava snapshots históricos finais em transação; não cria três planejadas intermediárias simultâneas nem atualiza documentos preexistentes. Os estados e datas representam cenários sintéticos independentes. **Inserção direta não comprova autenticação, autorização, transições, consentimento ou revisão humana.**

## Configuração e execução futura

### Conferência pela conexão ativa da extensão

Abra **`database/arquivo/isolado-adocoes-bd6/conferir-configuracao.mongodb.js`** e execute **Run All**. Esse Playground é autossuficiente e somente de leitura, equivalente ao plano inicial de `configurar.cjs` sem `--aplicar`. Usa exclusivamente `sentinela_testes_bd6` pela conexão ativa; não lê credenciais da extensão, `.env` ou arquivos locais no momento da execução.

Compara os 15 validadores completos e as chaves/ordem/opções dos 22 índices, audita duplicidades com os filtros parciais e verifica os IDs e colisões naturais dos 22 documentos. Informa coleções e índices ausentes, contagens e divergências, sem imprimir documentos ou chaves pessoais. Não cria banco, coleção, índice ou documento. Um plano aprovado com ausências não significa configuração já aplicada nem comprova permissão de escrita.

O arquivo contém um snapshot das definições atuais para funcionar no Playground sem `require`. Se os arquivos de origem mudarem, regenere **localmente**, sem conexão, e confira a sintaxe/sincronização:

```powershell
node database/arquivo/isolado-adocoes-bd6/gerar-conferencia-playground.cjs
node database/tests/verificar-playground-isolado-bd6.cjs
```

`conferencia-playground.inc.js` é somente o corpo auxiliar do gerador, não o arquivo para Run All. O teste executa oito cenários em memória, incluindo destino ausente, massa existente idêntica, divergências e acesso negado. Nesta preparação não houve execução real pela extensão. O usuário informou a identidade/papel da conexão; o script não verifica nem extrai suas credenciais ou papéis.

Pré-requisitos: Node 18+, dependências do backend instaladas, conexão ao cluster e permissões para criar/configurar **`sentinela_testes_bd6`**, inserir e usar transações. O usuário com `readWrite` apenas em `sentinela` pode não ter acesso ao banco isolado; não ampliar privilégios silenciosamente. Os scripts leem `MONGODB_URI` do processo ou, se ausente, `backend/.env`; não alteram `.env`, não exibem a URI e usam explicitamente o destino fixo isolado. `--banco=sentinela` ou outro destino é rejeitado.

Na raiz `C:\Projetos\PI-IV-ES-Time9`, execute futuramente, uma etapa por vez:

```powershell
# 1. Leitura: planejar configuração, conferir divergências, colisões e duplicidades.
node database/arquivo/isolado-adocoes-bd6/configurar.cjs

# 2. Após conferir o plano: criar apenas coleções e índices ausentes no isolado.
node database/arquivo/isolado-adocoes-bd6/configurar.cjs --aplicar

# 3. Leitura: exigir configuração completa e conferir a massa antes da carga.
node database/arquivo/isolado-adocoes-bd6/pre-conferir.cjs

# 4. Somente após aprovação: inserir os 22 documentos em transação.
node database/arquivo/isolado-adocoes-bd6/inserir.cjs --aplicar

# 5. Leitura após commit: IDs, snapshots, schema no servidor e referências.
node database/arquivo/isolado-adocoes-bd6/validar.cjs
```

Os 15 schemas completos e os 22 índices são lidos dos arquivos atuais do projeto, sem executar os validadores individuais que apontam ao principal. Não há `collMod`, exclusão, bypass, upsert ou substituição. Coleção existente sem o schema exato é divergência, mesmo vazia: interromper para análise. Índices adicionais são preservados; divergências de nome/chaves/opções são informadas, sem substituição. Auditoria dos únicos respeita os filtros parciais e não imprime chaves pessoais.

Toda a auditoria precede a configuração. A criação de coleções/índices não é atômica: se falhar, parte pode ter sido criada; repetir somente o plano de leitura para conferir. Não corrigir divergências removendo dados ou índices automaticamente. Reservar janela sem edições/configurações concorrentes.

A inserção não configura o banco automaticamente; sem `--aplicar`, apenas confere. Exige todos os 22 IDs ausentes ou todos presentes e idênticos; parcial exige análise. Pais ausentes, colisões naturais, schemas/índices ou snapshots divergentes abortam. Uma repetição idêntica faz zero inserções. Em erro de commit incerto, interromper e executar `validar.cjs` antes de repetir a carga. Transações exigem replica set/Atlas; sem suporte, não há fallback com gravações parciais.

Guarde os relatórios deste ambiente separadamente, com banco, impressão do pacote e horário. Contagens são dos IDs da simulação, não totais globais. O manifesto e os hashes do principal permanecem arquivos de preparação histórica; nenhum registro de execução no Atlas é inventado.

## Verificação local executada nesta preparação

```powershell
node database/tests/verificar-adocoes-isoladas-bd6.cjs
```

Dez grupos em memória aprovados: schemas completos/referências, configuração reproduzível, carga/validação/repetição, bloqueio do destino principal, duplicidades, lote parcial, divergências, rollback simulado, tratamento incorreto/duplicidade planejada e filtro parcial divergente. Esses testes não comprovam permissões, transações, índices ou validação BSON no servidor. Nenhum comando deste ambiente foi executado no Atlas.

Regras usadas: BD3 §5.6 e §10; BD4 §4.7, §14.4 e §14.6.1; validadores individuais e definições atuais dos índices. O aceite formal e as confirmações de acesso do BD5 continuam sendo pendências separadas já registradas.

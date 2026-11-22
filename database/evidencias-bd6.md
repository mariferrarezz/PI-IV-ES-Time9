# BD6 — Evidências da massa de desenvolvimento
<!-- Consolida resultados confirmados, limites e pendências de acesso/aceite; não executa comandos. -->

## Resultado e origem da evidência

**200 documentos nos três lotes do `sentinela` de desenvolvimento**, incluindo adoções planejada, realizada e cancelada. A única alteração de documento preexistente foi a aprovação editorial **simulada** da ficha existente de Lagarta-do-cartucho. Não houve duplicação dessa ficha. Revisão agronômica real, eficácia, autorização e funcionamento da API não são comprovados.

| Lote | Documentos novos | Evidência disponível |
|---|---:|---|
| Principal | 185 | Relatórios completos de pré-conferência, inserção e validação disponíveis na conversa; transação confirmada, snapshots encontrados/idênticos e zero inválidos |
| Comunidade | 7 | Relatórios completos de inserção e validação disponíveis na conversa: quatro experiências e três denúncias idênticas, zero inválidos, principal reconferido |
| Adoções acadêmicas | 8 | Usuário confirmou pré-conferência aprovada no estado `antes_da_demonstracao` com DNS temporário e, na solicitação desta consolidação, confirmou os relatórios finais e 200 documentos; o JSON integral final desse lote não foi reproduzido no histórico disponível |
| **Total** | **200** | Contagem dos IDs únicos nos arquivos dos três lotes também corresponde a 200; essa leitura local não substitui a evidência de execução |

Não atribuir ao terceiro lote horários de commit, impressão ou métricas de execução não recebidos. Os relatórios locais/mocks são evidência de verificação do código, não de execução no Atlas. A falha anterior de DNS não é o estado final da execução: o usuário confirmou o sucesso posterior com resolvedores temporários no processo.

As contagens abaixo referem-se aos IDs da massa, **não ao total global do banco**, que inclui registros anteriores preservados.

| Coleção | Quantidade final da massa |
|---|---:|
| usuarios | 2 |
| propriedades | 3 |
| talhoes | 6 |
| culturas | 23 |
| plantacoes | 8 |
| problemas_agricolas | 40 |
| fontes_conhecimento | 80 |
| ocorrencias | 6 |
| monitoramentos | 8 |
| tratamentos | 6 |
| avaliacoes_tratamento | 4 |
| alertas | 1 |
| experiencias_comunidade | 7 |
| adocoes_tratamento | 3 |
| denuncias_comunidade | 3 |
| **Total** | **200** |

## Cenários confirmados e limites

- Dois produtores fictícios, propriedades distintas e múltiplos talhões; uma propriedade sem ocorrências e outras com ocorrências ativas.
- Diferentes culturas/safras; plantações ativas e encerradas; ocorrências em diferentes períodos, estados e intensidades permitidos.
- Monitoramentos vinculados e quatro inspeções sem ocorrência; tratamentos e avaliações com referências e datas coerentes.
- Catálogo com as mesmas 40 fichas (20 pragas e 20 doenças), fontes relacionadas e recortes de culturas documentados, sem expandir grupos por suposição.
- Alerta de intensidade alta; experiências pendentes, aprovadas, rejeitada, oculta e retirada; denúncias pendente e analisadas com as duas decisões permitidas. Estados de moderação/análise são simulações.
- Três adoções acadêmicas: cancelada, realizada com tratamento do destino posterior ao planejamento, e planejada sem tratamento. Mesma cultura Milho e mesma ficha identificada na origem/destino, método/versão copiados; apenas uma planejada por par experiência/ocorrência.

Os testes locais já confirmados abrangem schemas completos, referências, cronologia, unicidade, repetição sem duplicações, preservação de divergências e rollback simulado. Não foram repetidos nesta consolidação. As provas de unicidade e avaliação inicial de consultas do BD5 continuam registradas em seu [documento próprio](evidencias-bd5.md); não se afirma nova avaliação de desempenho com esta massa.

Não há imagem/evidência fotográfica inventada; imagens opcionais continuam pendentes quando não fornecidas. Dados pessoais, termos, relatos e tratamentos são sintéticos; não usar para contato real, prescrição, comprovação de eficácia ou produção. A carga direta não valida autenticação, isolamento entre produtores, consentimento ou transições da API. As incompatibilidades do backend de propriedades permanecem documentadas no [README do banco](README.md#compatibilidade-do-backend-de-propriedades).

## Única alteração editorial simulada

Ficha: `88b8a8ae41cde9df3d9c5df2`, **Lagarta-do-cartucho**, código `lagarta-do-cartucho`. Estado anterior e posterior completos: [alteracao-ficha.json](seed/adocoes-demonstracao-bd6/alteracao-ficha.json).

| Campo | Alteração confirmada para a simulação |
|---|---|
| `ativo` | false → true |
| `revisaoEditorial.status` | pendente → aprovada, simulada |
| `revisaoEditorial.observacoes` | Ressalva original preservada e aviso explícito de simulação acadêmica, sem revisão agronômica real ou eficácia comprovada |
| `revisadoEm` | Instante simulado `2026-11-04T04:40:00.000Z`, não data de revisão humana nem de commit |
| `atualizadoEm` | Mesmo instante simulado |

Resultado: **39 fichas pendentes/inativas e uma aprovada/ativa simulada; zero revisões agronômicas reais comprovadas**. Conteúdo, fontes, IDs, `registroAgrofitConferido: false` e `fotoPendente: true` preservados. A ficha pode aparecer nos filtros normais de aprovado/ativo do desenvolvimento; a observação não implementa isolamento na API. A exceção é acadêmica, explícita e não extensível automaticamente a outras fichas ou à produção.

Os JSON e manifestos são snapshots históricos de preparação, preservados por hashes. Flags como `aplicadoNoAtlas: false`, referências a bloqueios ou nomes antigos de comandos nesses snapshots descrevem sua criação, não o resultado posterior desta execução. O estado final está consolidado aqui e no [README da massa](seed/README.md); não reescrever os snapshots para simular relatórios gerados automaticamente. As verificações atuais reconhecem somente os estados exatos anterior/posterior autorizados.

## Contorno temporário de DNS nesta execução

Diagnóstico somente de leitura: o DNS configurado `127.0.0.1` recusou SRV e TXT (`ECONNREFUSED`); consultas ao resolvedor público `1.1.1.1` terminaram em timeout. Isso não comprovava senha inválida ou falta de permissão. O usuário confirmou que a pré-conferência passou ao definir **`172.16.0.3` e `172.16.0.4` apenas no processo Node**.

Esses endereços são específicos do ambiente usado, **não configuração universal nem recomendação para outras redes**. Não foram fixados no código de conexão, `.env` ou DNS do Windows. Uma nova execução deve usar resolvedores válidos/autorizados no seu ambiente.

Exemplos de reprodução histórica no PowerShell, a partir da raiz do repositório; **não é necessário repetir a carga já confirmada**:

```powershell
# Leitura com os resolvedores temporários usados nesta execução:
node -e "require('node:dns').setServers(['172.16.0.3','172.16.0.4']); require('./database/seed/bd6.cjs').executarCLI(['adocoes','conferir']);"

# Escrita somente com autorização e pré-conferência; não executar para consolidar evidências:
node -e "require('node:dns').setServers(['172.16.0.3','172.16.0.4']); require('./database/seed/bd6.cjs').executarCLI(['adocoes','inserir','--aplicar']);" -- --aplicar

# Validação de leitura:
node -e "require('node:dns').setServers(['172.16.0.3','172.16.0.4']); require('./database/seed/bd6.cjs').executarCLI(['adocoes','validar']);"
```

O `require.main === module` impede executar o CLI apenas importando-o; por isso chama-se `executarCLI`. Na escrita acima, `-- --aplicar` também disponibiliza a opção em `process.argv`, exigida pela biblioteca atual. Não expor URI, senha ou mensagens brutas do driver. Não ampliar permissões do backend para contornar erros.

## Critérios de aceite do BD6

Avaliação com base na tarefa fornecida pelo usuário, nos arquivos e nas confirmações de execução; não é aceite da equipe.

| Critério | Situação | Evidência/limite |
|---|---|---|
| Principais cenários definidos | Atendido | Cenários e cronologia documentados para os três lotes |
| Dados para as principais coleções | Atendido | As 15 coleções têm documentos na massa final |
| Dados fictícios/anonimizados | Atendido no escopo preparado | Dados pessoais sintéticos, uso exclusivo de desenvolvimento; não comprova inexistência de coincidências com dados reais |
| Tipos, regras BD3/BD4 e obrigatórios | Atendido para a massa confirmada | Validadores atuais, verificações locais e resultados de carga/validação; exceção editorial acadêmica explícita, sem enfraquecer schema |
| Referências válidas | Atendido para os lotes confirmados | Pais/snapshots e relações conferidos; não basta tipo ObjectId |
| Diferentes situações de uso e estados de ocorrências | Atendido | Culturas, períodos, intensidades, plantios/históricos, Comunidade e três adoções |
| Dados inseridos corretamente | Atendido conforme evidência disponível | 185 + 7 com relatórios integrais; +8 e total 200 confirmados pelo usuário |
| Consultas de consistência realizadas | Atendido conforme evidência disponível | Contagens, snapshots, schema e filtros de estado/referências das validações; sem novo benchmark |
| Scripts/arquivos organizados | Atendido | CLI único, dados/manifestações por lote, pesquisa separada e plano isolado arquivado |
| Massa disponível para uso por toda a equipe | Parcialmente confirmado | Existe no desenvolvimento e foi acessada na execução; falta confirmação de acesso/uso pelos demais integrantes |
| Problemas corrigidos ou documentados | Atendido no escopo conhecido | DNS temporário, fontes parciais, imagens, simulação e incompatibilidades da API explicitados |

## Pendências reais para fechamento

1. **Acesso/disponibilidade para a equipe:** confirmar que os integrantes responsáveis conseguem acessar a massa com os privilégios necessários e conhecem o caráter simulado da ficha. Não confundir essa confirmação com autorização dos produtores na API.
2. **Aceite formal:** revisão/validação pela equipe e confirmação do fechamento do BD5, dependência declarada do BD6. Não há aceite inventado nesta documentação.
3. **Confirmações de acesso/rede já registradas:** identificação/necessidade dos dois IPs /32 adicionais e demais confirmações externas pendentes do BD5. O contorno DNS não resolve nem substitui essa verificação.

Fontes parcialmente confirmadas, revisão agronômica e imagens permanecem pendências de conteúdo para disponibilização agrícola real, **não bloqueios das três adoções acadêmicas já confirmadas**. Funcionamento da API, testes funcionais e avaliação ampliada pertencem às etapas correspondentes; não se afirma que foram executados por uma carga direta.

A massa técnica está criada e sua inserção/validação está confirmada nos limites acima. O fechamento formal permanece condicionado às confirmações de acesso e aceite. Esta consolidação alterou somente documentação: sem Atlas, repetição de testes/cargas ou commit.

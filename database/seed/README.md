# BD6 — Massa de desenvolvimento do Sentinela
<!-- Explica os arquivos, cenários, evidências e comandos dos lotes de desenvolvimento BD6. -->

Este é o ponto de entrada para apresentar e reproduzir a massa. **200 documentos nos três lotes foram inseridos e validados no `sentinela` de desenvolvimento**, conforme as evidências da conversa e a confirmação final do usuário. Incluem adoções planejada, realizada e cancelada e uma única alteração editorial simulada da ficha existente de Lagarta-do-cartucho. Ver [evidências e critérios de aceite](../evidencias-bd6.md); acesso/disponibilidade para toda a equipe e aceite formal não foram presumidos.

## Onde está cada parte

Os hashes históricos dos arquivos UTF-8 aceitam somente equivalência de finais de linha LF/CRLF (inclusive mistos). A conferência calcula as duas representações, sem modificar os arquivos ou os hashes dos manifestos. Espaços, BOM, linha final, IDs e conteúdo continuam protegidos. A impressão do pacote principal usa CRLF por arquivo e separador LF para preservar a impressão histórica já registrada. Não normalizar hashes de IDs ou assinaturas BSON. Verificação local sem rede: `node database/tests/verificar-integridade-texto-bd6.cjs`.

| Arquivo/pasta | Conteúdo |
|---|---|
| `catalogo-completo-sentinela.json` | Original editorial das 40 fichas, preservado; não importar diretamente |
| `catalogo-pendente-bd6.json` | Snapshot original da carga: 40 fichas pendentes/inativas, 80 fontes e 23 culturas; a exceção simulada posterior fica no lote de adoções |
| `documentos-sinteticos-bd6.json` | 62 documentos de usuários, propriedades, plantios e relacionamentos; 20 culturas compartilhadas com o catálogo |
| `comunidade-complementar-bd6.json` | Quatro experiências e três denúncias, com estados simulados |
| `manifesto-bd6.json` | IDs, contagens, dependências e ordem de carga do lote principal de 185 documentos |
| `manifesto-comunidade-complementar-bd6.json` | IDs, dependências e cronologia simulada dos sete documentos complementares |
| `preparacao/pesquisa-catalogo-bd6.json` | Fontes pesquisadas, metadados confirmados, evidências e limitações das pesquisas |
| `preparacao/mapeamento-catalogo-bd6.json` | Transformações das 40 fichas editoriais para o schema, referências e pendências por ficha |
| `adocoes-demonstracao-bd6/documentos.json` | Oito documentos acadêmicos inseridos: duas ocorrências, dois tratamentos, uma experiência e três adoções |
| `adocoes-demonstracao-bd6/alteracao-ficha.json` | Snapshots completos anterior e posterior da única ficha alterada, com aprovação editorial simulada |
| `adocoes-demonstracao-bd6/manifesto.json` | IDs, contagens, dependências e contrato da demonstração; snapshot da preparação preservado |
| `adocoes-demonstracao-bd6/relatorio-local.json` | Resultados das verificações locais e limitações; não comprova execução no Atlas |
| `adocoes-demonstracao-bd6/lib.cjs` | Implementação da conferência, aplicação transacional e validação da demonstração |
| `bd6.cjs` | Comando único para conferir, inserir ou validar cada lote |
| `lib-bd6.cjs` | Leitura, conferência, inserção e validação do lote principal |
| `lib-complemento-bd6.cjs` | Leitura, conferência, inserção e validação do complemento da Comunidade |
| `lib-estado-editorial-bd6.cjs` | Reconhecimento da alteração editorial simulada exata nas verificações dos lotes |
| `diagnostico-bd6.cjs` | Códigos e classes seguros de erro, sem URI, hosts, mensagens brutas ou documentos |
| `integridade-texto-bd6.cjs` | Equivalência LF/CRLF para os hashes históricos de texto, sem relaxar a proteção do conteúdo |
| `.gitkeep` | Marcador usado pelo Git para preservar a pasta; não contém dados ou comandos |
| `README.md` | Guia dos arquivos, cenários e comandos de execução |
| `../tests/*bd6.cjs` | Verificações locais em memória, sem conexão |
| `../arquivo/isolado-adocoes-bd6/` | Plano isolado abandonado, preservado com relatórios e entrada Node bloqueada |

Os nomes históricos de pesquisa nos manifestos são resolvidos para `preparacao/` pelas bibliotecas. Os bytes, hashes, IDs e impressões dos pacotes foram preservados. Não misturar ou importar cegamente os JSON.

Manifestos, flags de aplicação e relatórios locais preservam o estado da preparação histórica; a situação final de execução está em [evidencias-bd6.md](../evidencias-bd6.md). Não alterar esses snapshots para fabricar registros automáticos da execução posterior.

JSON não aceita comentários. Suas descrições curtas ficam nesta tabela para preservar a validade e os hashes dos arquivos; `.gitkeep` permanece vazio.

## Comando único

Execute no terminal do VS Code, na raiz `C:\Projetos\PI-IV-ES-Time9`, com Node 18+ e dependências do backend instaladas. Estes comandos Node não são Playgrounds e não usam a conexão ativa da extensão.

```powershell
node database/seed/bd6.cjs --ajuda
node database/seed/bd6.cjs principal conferir
node database/seed/bd6.cjs comunidade conferir
node database/seed/bd6.cjs adocoes conferir
```

`conferir` e `validar` são somente leitura. `inserir` sem `--aplicar` também somente confere. Escrita exige a opção explícita:

```powershell
# Reprodução futura: os três lotes já foram inseridos; não repetir sem motivo.
node database/seed/bd6.cjs principal inserir --aplicar
node database/seed/bd6.cjs principal validar
node database/seed/bd6.cjs comunidade inserir --aplicar
node database/seed/bd6.cjs comunidade validar

# Inclui uma alteração de ficha; exige autorização específica e conferência:
node database/seed/bd6.cjs adocoes inserir --aplicar
node database/seed/bd6.cjs adocoes validar
```

Os comandos substituem os antigos arquivos `pre-conferir-*.cjs`, `inserir-*.cjs`, `validar-*.cjs` e as três entradas da demonstração. Nos manifestos e relatórios históricos esses nomes permanecem como evidência da execução anterior; use a interface acima para reprodução atual. `adocoes inserir --aplicar` altera explicitamente uma ficha preexistente, além de inserir oito documentos, em transação.

Credenciais: `MONGODB_URI` do processo ou, se ausente, leitura de `backend/.env`. Não altera `.env`, não imprime URI/segredos e não amplia permissões. Destino fixo: `sentinela`, exclusivamente desenvolvimento. A disponibilidade de uma conexão da extensão não configura automaticamente o ambiente Node.

O diagnóstico das adoções informa a etapa (preparação, ambiente, conexão, configuração ou conferência), a origem da variável, a modalidade SRV/direta e códigos permitidos. `ECONNREFUSED` com `operacaoRede: querySrv` significa recusa na consulta DNS SRV, antes da autenticação e da conferência dos dados; não comprova credencial inválida ou falta de permissão no Atlas. O CLI separa argumentos inválidos de erros de carregamento/execução. Mensagens brutas, stacks, URI, hosts e documentos não entram nesse diagnóstico. A verificação local correspondente é `node database/tests/verificar-diagnostico-bd6.cjs`.

Nesta execução, o usuário contornou a falha de DNS com `dns.setServers(['172.16.0.3','172.16.0.4'])` **apenas no processo Node**, sem alterar Windows ou `.env`. São resolvedores específicos desse ambiente, não configuração universal. Os comandos históricos com `executarCLI` e a distinção de evidências estão em [DNS e reprodução](../evidencias-bd6.md#contorno-temporário-de-dns-nesta-execução); não repetir a carga já confirmada para documentá-la.

As bibliotecas conferem os 15 schemas completos e 22 índices atuais, incluindo chaves na ordem, unicidade e filtros parciais. Índices adicionais, como `ownerUid_1`, são preservados. Não criam configuração, não excluem dados, não usam bypass ou upsert. Divergências, colisões ou lotes parciais interrompem para análise. Em erro ou commit incerto, executar a validação do lote antes de repetir. Guardar os relatórios com data e impressão; reservar janela sem alterações concorrentes.

## Cenários e evidências

| Coleção | Principal | Comunidade | Adoções confirmadas |
|---|---:|---:|---:|
| usuarios | 2 | 0 | 0 |
| propriedades | 3 | 0 | 0 |
| talhoes | 6 | 0 | 0 |
| culturas | 23 | 0 | 0 |
| plantacoes | 8 | 0 | 0 |
| problemas_agricolas | 40 | 0 | 0 — altera uma existente |
| fontes_conhecimento | 80 | 0 | 0 |
| ocorrencias | 4 | 0 | 2 |
| monitoramentos | 8 | 0 | 0 |
| tratamentos | 4 | 0 | 2 |
| avaliacoes_tratamento | 4 | 0 | 0 |
| alertas | 1 | 0 | 0 |
| experiencias_comunidade | 2 | 4 | 1 |
| adocoes_tratamento | 0 | 0 | 3 |
| denuncias_comunidade | 0 | 3 | 0 |
| **Total** | **185** | **7** | **8** |

Principal: dois produtores, três propriedades (uma sem ocorrências), dois talhões por propriedade, seis plantações ativas e duas históricas encerradas; ocorrências aberta, em acompanhamento e encerradas; quatro inspeções sem ocorrência; tratamentos/avaliações com referências e datas coerentes. O catálogo tem 20 pragas e 20 doenças, com 23 culturas específicas/recortes autorizados. Não expandir grupos genéricos automaticamente.

Execuções confirmadas: principal com 185 documentos; complemento com sete; demonstração de adoções com oito, totalizando **200**, além da alteração de uma ficha já contada no principal. Os relatórios completos dos dois primeiros lotes estão na conversa; a execução/validação final das adoções e o total foram confirmados pelo usuário. Não se inventam horário de commit ou métricas ausentes do terceiro relatório. Essas contagens são dos lotes, não totais globais das coleções.

Estado confirmado das adoções acadêmicas: **39 fichas pendentes/inativas e uma aprovada/ativa simulada**. A mesma ficha de Lagarta-do-cartucho foi alterada, sem duplicação; seu estado anterior integral permanece no arquivo de alteração. A exceção aceita apenas o snapshot exato, não aprova outras fichas nem comprova revisão agronômica ou eficácia. Filtros normais podem exibir a ficha simulada; o aviso textual não implementa isolamento ou autorização na API.

Dados pessoais são sintéticos. Não enviar SMS, autenticar ou contatar pessoas com esses exemplos. Moderação, termos e consentimento de teste não comprovam decisões humanas reais. A inserção direta não comprova funcionamento da API; o CRUD de propriedades tem incompatibilidades documentadas no [README do banco](../README.md#compatibilidade-do-backend-de-propriedades). Aceite da equipe, acesso e identificação dos IPs adicionais permanecem pendências separadas. Não declarar BD6 concluído só por preparar arquivos.

## Verificações locais

```powershell
node database/tests/verificar-preparacao-bd6.cjs
node database/tests/verificar-complemento-comunidade-bd6.cjs
node database/tests/testar-execucao-complemento-bd6.cjs
node database/tests/verificar-demonstracao-adocoes-bd6.cjs
node database/tests/verificar-cli-bd6.cjs
```

Testes em memória não comprovam permissões, transações, collation ou Schema Validation no servidor. Configuração e dados existentes devem ser conferidos novamente antes de futuras escritas. Não há execução contra Atlas nesta reorganização.

## Detalhes preservados

As seções abaixo consolidam os antigos documentos de pesquisa, cenários da Comunidade e demonstração. Menções históricas a bloqueios e preparação anterior devem ser lidas com a decisão atual acima; não representam novas execuções.


## Pesquisa e pendencias do catalogo

Pesquisa limitada às mesmas 40 fichas, com recortes de hospedeiros incorporados por autorização explícita do usuário. O original editorial permanece intacto. As **40 fichas estruturalmente completas foram inseridas**; atualmente 39 estão pendentes/inativas e uma possui aprovação editorial simulada para o exercício acadêmico. A pesquisa e a simulação não são revisão agronômica concluída nem certificação de toda afirmação.

### Hospedeiros: exemplos documentados, não listas exaustivas

| Ficha | Proposta e trecho literal curto | Fonte e localização | Alcance |
|---|---|---|---|
| Formigas-cortadeiras | Nogueira-pecã: “Nogueira-pecã atacada por formigas cortadeiras” | [Embrapa, CT367 (2019)](https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1109531/1/COMUNICADO-TECNICO-367.pdf), página impressa 10, seção 2.2, **Figura 4**. Corrige a indicação anterior de Figura 2. | Confirma esse exemplo de planta atacada por Atta/Acromyrmex. Não limita a ficha à nogueira nem implica que toda espécie de formiga ataque toda cultura. |
| Mosca-das-frutas | Manga: “goiaba, manga, pitanga, cajá, acerola e carambola são hospedeiros preferidos” | [Embrapa, Citros para o Nordeste (2003)](https://sistemasdeproducao.cnptia.embrapa.br/FontesHTML/Citros/CitrosNordeste/pragas.htm), seção Moscas-das-frutas, Considerações importantes. | Manga é um exemplo documentado, não exclusividade. Espécie da mosca e hospedeiro devem ser confirmados; não associar tomate automaticamente. |
| Greening/HLB | Laranja: “de citros (laranja, tangerinas e limões)” | [ADAPAR, Todos contra o greening](https://www.agricultura.pr.gov.br/sites/default/arquivos_restritos/files/documento/2023-12/folder_greening_1-2.pdf), página 2, plantas doentes em pomares domésticos. | Laranja exemplifica Citros. Não presume espécie/cultivar nem ausência de outros hospedeiros; medidas oficiais do Paraná não viram regras nacionais automaticamente. |

Os três recortes iniciais foram incorporados: Nogueira-pecã, Manga e Laranja. São referências não exaustivas, com a abrangência editorial preservada no documento e no mapeamento. Um filtro por cultura retorna somente culturasAfetadasIds explicitamente relacionadas; outros hospedeiros ainda não vinculados não aparecerão no filtro. Ampliar essa cobertura continua exigindo definição e fundamento, sem converter grupos genéricos em culturas.

### Seis controles: texto original, dúvida e proposta

As classes e observações originais continuam no mapeamento. As descrições preparadas acrescentam o recorte sustentado, sem novos princípios ativos, produtos ou doses. A classificação descreve uma modalidade; não autoriza seu uso.

| Ficha / texto original | Dúvida | Proposta e fundamento | Preparação |
|---|---|---|---|
| lagarta-rosca: “Controle localizado conforme cultura e registro” | Localizado descreve a distribuicao da intervencao, nao o metodo; poderia ser manual, biologico ou quimico. | quimica, com recorte explicito para a possibilidade descrita no milho; manter controle cultural como item separado. Secao Agrotis ipsilon distingue manejo cultural de tratamento com inseticida e iscas. Nao foi conferido registro atual. Fontes: [fonte_alt_rosca_milho](https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/milho/producao/pragas-e-doencas/pragas/pragas-da-fase-inicial). | `quimica`; descrição com limites expressos, pendente de revisão técnica. |
| cochonilha: “Produtos seletivos conforme espécie e hospedeiro” | Seletividade nao define categoria biologica/quimica; fontes tratam cochonilhas e hospedeiros distintos. | quimica para a modalidade de inseticidas descrita nas fontes; preservar controle biologico conservativo separado. Citros e videira possuem secoes de controle com inseticidas; isso nao comprova indicacao para Cafe ou todo Coccoidea. Fontes: [fonte_07](https://sistemasdeproducao.cnptia.embrapa.br/FontesHTML/Citros/CitrosNordeste/pragas.htm), [fonte_26](https://www.cnpuv.embrapa.br/uzum/uva/cocho_farinhenta.html). | `quimica`; descrição com limites expressos, pendente de revisão técnica. |
| antracnose: “Tratamento de sementes quando pertinente” | Tratamento de sementes e uma etapa de aplicacao, nao define se e quimico, biologico ou fisico. | quimica para o tratamento com fungicidas documentado em feijao/C. lindemuthianum; nao generalizar a outras modalidades ou hospedeiros. O trabalho primario avalia fungicidas via tratamento de sementes de feijoeiro. Estudo de 2002 nao comprova registro atual. Fontes: [fonte_alt_antracnose_sementes](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/866669?mode=full). | `quimica`; descrição com limites expressos, pendente de revisão técnica. |
| podridao-negra-das-cruciferas: “Produtos protetores quando tecnicamente indicados” | Nao identifica produto nem categoria. A fonte de brocolis informa ausencia de registro na edicao de 2015; isso nao prova a situacao atual. | quimica apenas se o sentido pretendido for bactericida protetor e houver suporte especifico por cultura/alvo. Nao aplicar essa classificacao ainda. Manejo sanitario permanece cultural. A cultura dos brocolis, paginas 85 e 87: ausencia de agrotoxico registrado a epoca e medidas preventivas. Tabela de cobre para Alternaria nao prova indicacao para Xanthomonas. Fontes: [fonte_60](https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1044078/1/PLANTARBrocolised012015.pdf). | Mantido fora do documento final; não descartar o texto. |
| mosca-das-frutas: “Iscas e controle de adultos conforme hospedeiro” | Isca pode ser apenas atrativo de monitoramento ou isca toxica; nao classificar armadilha automaticamente como quimica. | quimica para a modalidade de isca toxica descrita na fonte; monitoramento com armadilhas permanece prevencao e controle biologico continua separado. Secao Moscas-das-frutas distingue armadilhas de monitoramento, isca toxica e parasitoides; fonte historica de 2003. Fontes: [fonte_07](https://sistemasdeproducao.cnptia.embrapa.br/FontesHTML/Citros/CitrosNordeste/pragas.htm). | `quimica`; descrição com limites expressos, pendente de revisão técnica. |
| greening-hlb: “Manejo fitossanitário e do vetor; sem tratamento curativo da bactéria” | Combina saneamento e controle do inseto vetor, que podem pertencer a metodos diferentes. Nenhum deles representa cura do HLB. | Separar cultural (sanidade/mudas), quimica e biologica (possibilidades de controle do psilideo documentadas); sem produtos e sem eliminar plantas automaticamente. Folder ADAPAR, pagina 2, distingue mudas sadias/saneamento e inseticidas quimicos/biologicos para o vetor sob orientacao profissional. Fontes: [fonte_49](https://www.gov.br/agricultura/pt-br/assuntos/sanidade-animal-e-vegetal/sanidade-vegetal/pragas-quarentenarias-presentes/HLB), [fonte_alt_hlb_adapar](https://www.agricultura.pr.gov.br/sites/default/arquivos_restritos/files/documento/2023-12/folder_greening_1-2.pdf). | `cultural` + `quimica` + `biologica`; descrição com limites expressos, pendente de revisão técnica. |

Em HLB, os três componentes conservam a mesma classe editorial de origem e são separados em itens cultural, químico e biológico. O componente sanitário não representa cura e não deve disparar eliminação de plantas pelo aplicativo. Em mosca-das-frutas, a isca tóxica é separada do atrativo de monitoramento. Em antracnose, o suporte ao tratamento químico é específico de feijão/C. lindemuthianum, sem generalização à soja ou a frutíferas. Em cochonilha, a descrição não extrapola automaticamente os exemplos de citros/videira para café.

**Podridão-negra:** por autorização do usuário, a ficha final usa somente o Manejo sanitário cultural fundamentado, que atende a minItems: 1 e aos campos obrigatórios de formasControle. Produtos protetores quando tecnicamente indicados permanece apenas no mapeamento, sem classificação forçada e sem bloqueio estrutural da ficha. A fonte de 2015 informa ausência de registro para brócolis à época, sem comprovar a situação atual; a tabela de cobre para Alternaria não sustenta indicação para Xanthomonas.

### Tratamento das 14 URLs antes não confirmadas

Oito foram identificadas na própria publicação ou no conteúdo indexado da URL original. Abertura bloqueada e confirmação bibliográfica são registradas separadamente. Para seis, as alternativas sustentam apenas os itens indicados e **não são declaradas a mesma publicação**. As URLs e menções originais continuam preservadas.

| URL/alias original | Resultado | O que sustenta e o que não comprova |
|---|---|---|
| [fonte_02](https://ainfo.cnptia.embrapa.br/digital/bitstream/item/47486/1/folder-doencascafeeiro.pdf) | Doenças do cafeeiro — Embrapa Rondônia. PDF original recuperado, creditos tecnicos e instituicao ao final; data impressa maio/2010. | Sintomas de ferrugem e cercosporiose no cafe; Medidas gerais de manejo nutricional e fungico. Limites: Material de 2010; nao comprova registros atuais, calendario por regiao ou toda a ficha. |
| [fonte_17](https://www.atermaisdigital.cnptia.embrapa.br/web/controle-de-pragas/w/mancha-alvo-corynespora-cassiicola-9) | Mancha-alvo (Corynespora cassiicola) — Embrapa — Ater+ Digital. Conteudo indexado na URL original com nome cientifico e classes de produtos. | Identidade Corynespora cassiicola; Categoria fungicida. Limites: Todas as culturas no portal nao prova associacao especifica ou registro cultura/alvo. Usar fonte_21 e fonte_71 para tomate e soja, respectivamente. |
| [fonte_24](https://www.cnpt.embrapa.br/publicacoes/sist-prod/soja04/mip.htm) | Manejo integrado de pragas — "MIP" — Embrapa Trigo. Texto indexado na pagina original do sistema de producao de soja; abertura direta ainda retorna 502. | MIP na soja; Monitoramento e manejo de pragas. Limites: Sistema antigo; nao atualizar doses, ingredientes ou limiares por inferencia. Complemento de identificacao: fonte_55. |
| [fonte_29](https://www.embrapa.br/documents/1344498/2767891/manejo-da-lagarta-do-cartucho-em-milho.pdf/a2f4a72a-9889-4c38-b88d-31e29556911d) | Manejo da lagarta-do-cartucho, Spodoptera frugiperda, em milho — Embrapa Milho e Sorgo. PDF original recuperado; capa e bloco institucional. | Lagarta-do-cartucho no milho; Controle biologico com Bacillus thuringiensis e baculovirus. Limites: Nao comprova registro atual ou recomendacao especifica de aplicacao. |
| [fonte_38](https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/tomate/producao/doencas-e-pragas/doencas/fungo/requeima) | Requeima — Carlos Alberto Lopes; Maria Alice Quezado-Soares. Conteudo indexado na URL original Ageitec, cabecalho/autores e texto. | Requeima em tomate; Sintomas, umidade/temperatura e prevencao. Limites: Nao comprova sozinho todo o manejo de batata ou qualquer registro atual. |
| [fonte_41](https://www.embrapa.br/en/web/soja/ferrugem) | Ferrugem asiática da soja: manejo e prevenção — Embrapa Soja. Conteudo indexado na URL original; abertura direta 403. | Soja e Phakopsora pachyrhizi; Vazio sanitario, plantas voluntarias e manejo de resistencia. Limites: Nao copiar datas de calendario por UF/safra nem assumir eficacia atual de ingrediente isolado. |
| [fonte_42](https://www.embrapa.br/pt/alerta-helicoverpa) | Alerta Helicoverpa — Embrapa. Conteudo indexado da URL original, cabecalho e perguntas/respostas. | Helicoverpa armigera em soja, milho e algodao; Monitoramento regional e controle biologico. Limites: Portal historico de 2013; nao comprova todos os hospedeiros de H. zea nem recomendacoes atuais de produtos. |
| [fonte_45](https://www.embrapa.br/web/hortalicas/pimenta/pragas) | Pragas — Pimenta — Embrapa Hortaliças. Conteudo indexado na URL original; secao Vaquinha Diabrotica speciosa e Controle. | D. speciosa em pimenteira; Danos foliares e medidas culturais/quimicas. Limites: Pimenta nao e automaticamente todas as hortalicas; a associacao especifica com feijao depende de fonte complementar, nao desta pagina. |
| [fonte_03](https://biologico.agricultura.sp.gov.br/uploads/files/pdf/livros/brassicas/livro-brassicas.pdf) | Alternativas: [fonte_alt_brassicas](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1138623). Identidade da original permanece pendente. | Mofo-branco em brassicas/hortalicas, clima, agente e manejo; soja/feijao conservam fontes_04 e _46. Limites: Nao houve leitura do livro original; niveis qualitativos e toda a ficha nao foram tecnicamente validados. |
| [fonte_23](https://www.ciiagro.sp.gov.br/monitoramentocafe/Pragas%20e%20Doen%C3%A7as/Doencas.htm) | Alternativas: [fonte_alt_cafe](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/901892). Identidade da original permanece pendente. | Sintomas e manejo geral de ambas as doencas no cafe, recorte de Rondonia. Limites: Nem periodicidade local de ocorrencia nem eventual conteudo exclusivo do CIIAGRO foram recuperados. |
| [fonte_30](https://www.embrapa.br/documents/1355126/49127128/embrapa.br-Doen%C3%A7as%2Bcausadas%2Bpor%2Bbact%C3%A9rias.pdf/89418647-b4c1-e77c-59cb-6b8755116114) | Alternativas: [fonte_alt_tomate_2005](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/778171). Identidade da original permanece pendente. | Secao Xanthomonas em tomate e pimentao, sintomas, agua/vento e manejo preventivo. Limites: Identidade do PDF original desconhecida. Registro atual e adequacao por cultura nao verificados. |
| [fonte_39](https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/tomate/producao/doencas-e-pragas/pragas/mosca-branca) | Alternativas: [fonte_70](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1021765), [fonte_alt_bemisia](https://anais.seb.org.br/index.php/aseb/article/view/8). Identidade da original permanece pendente. | Guia primario para tomate; artigo original confirma Bemisia em soja/feijao. Limites: URL /en/web original continua bloqueada; variante /web localizada como candidata, nao declarada equivalente. Controle por hospedeiro requer revisao. |
| [fonte_44](https://www.embrapa.br/web/agencia-de-informacao-tecnologica/cultivos/tomate/producao/doencas-e-pragas/pragas/traca-do-tomateiro) | Alternativas: [fonte_11](https://sistemasdeproducao.cnptia.embrapa.br/FontesHTML/Tomate/TomateIndustrial_2ed/pragas_traca.htm), [fonte_77](https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/991795). Identidade da original permanece pendente. | Tuta em tomate, minas e danos, parasitoides e MIP. Limites: Nao presumir equivalencia entre as variantes /web e /en/web; disponibilidade atual de produtos nao comprovada. |
| [fonte_47](https://www.gov.br/agricultura/pt-br/assuntos/noticias/2022/controle-biologico-pode-alcancar-ate-80-de-eficiencia-contra-acaro-rajado-na-producao-de-morango) | Alternativas: [fonte_57](https://www.infoteca.cnptia.embrapa.br/handle/doc/879820). Identidade da original permanece pendente. | Bioecologia e controle do acaro-rajado em morango com azadiractina e predadores ja incluidos no editorial. Limites: Nao confirma a identidade da noticia MAPA nem a taxa de 80%; nao importar essa porcentagem. Nao cobre sozinho tomate/feijao. |

Foram acrescentadas fontes primárias específicas de hospedeiros para não presumir que uma publicação de outra cultura resolva a associação:
- [Manejo Integrado de Pragas do Feijoeiro, Eliane D. Quintela/Embrapa (2001)](https://www.embrapa.br/documents/1344498/2767895/manejo-integrado-de-pragas-do-feijoeiro.pdf/c8bb5013-3bf8-4579-a9ea-64570cb70e90), Tabela 5: Diabrotica speciosa e Tetranychus urticae no feijoeiro.
- [Estudo original da UFG em tomateiro](https://revistas.ufg.br/pat/article/view/1655): confirma T. urticae nesse hospedeiro; produtos, doses e eficácia do estudo não foram importados.
- [Saissetia coffeae no Ater+ Digital](https://www.atermaisdigital.cnptia.embrapa.br/web/controle-de-pragas/w/cochonilha-parda-saissetia-coffeae-3): inclui Café entre as culturas; não comprova indicação de cada produto para cada cultura.

Não consolidar o livro de doenças do tomateiro de 2005 com a edição de 2021. A única equivalência adicional anteriormente comprovada permanece fonte_55/fonte_66, pelo registro Infoteca e seu PDF exato.

### Pendências remanescentes

1. Os três recortes iniciais foram autorizados e incorporados. Uma ampliação futura de hospedeiros é opcional e exigirá suporte; a limitação dos filtros continua explícita.
2. A definição e o suporte do controle protetor de podridão-negra continuam pendentes de conteúdo. O trecho está preservado somente no mapeamento; a ficha usa o controle sanitário fundamentado e não fica bloqueada.
3. A identidade bibliográfica das seis URLs substituídas permanece não comprovada. Isso está registrado e não impede usar as alternativas parciais identificadas; eventual recuperação da original exige comparação, sem fusão por URL semelhante.
4. A revisão técnica permanece pendente para todas as 40 fichas, incluindo adequação por espécie/cultura, controles e níveis qualitativos. As seis identidades bibliográficas originais, registro atual de produtos e imagens não foram certificados. As alternativas parciais identificadas estão documentadas; fotos ausentes são permitidas pelo schema.

### Arquivos e verificações

- `preparacao/pesquisa-catalogo-bd6.json`: confirmações, alternativas, trechos, propostas, limites e histórico da pesquisa.
- `preparacao/mapeamento-catalogo-bd6.json`: todas as 40 fichas, textos originais, controles separados, referências resolvidas e pendências.
- `catalogo-pendente-bd6.json`: 40 fichas, 80 fontes e 23 culturas; as 20 culturas compartilhadas com o arquivo sintético devem ser reutilizadas uma única vez.
- `manifesto-bd6.json` e `README.md`: contagens, reservas estáveis e instruções atualizadas.

Os scripts Node usados nas cargas e validações estão preservados e disponíveis pelo CLI único. Os IDs dos três lotes têm execução/validação confirmadas nas evidências; os arquivos de preparação e testes locais continuam separados dos resultados do servidor. A repetição sem duplicações foi verificada localmente; não se afirma nova repetição da carga no Atlas nesta consolidação.


## Cenarios do complemento da Comunidade

**Decisão posterior:** o bloqueio das adoções descrito abaixo é histórico. O usuário autorizou preparar os três cenários acadêmicos no próprio desenvolvimento, com exceção editorial explícita, sem revisão técnica real. Ver [novo lote de demonstração](#cenarios-das-adocoes-academicas). Os sete documentos deste complemento permanecem inalterados; não copiar a massa isolada nem reaprovar silenciosamente as experiências antigas.

Lote de **sete documentos inseridos e validados**, separado dos 185 do principal. O terceiro lote acrescentou oito documentos de adoções, totalizando 200. Nenhum desses comandos foi repetido nesta consolidação documental.

### Arquivos e contagens

| Arquivo | Finalidade |
|---|---|
| `comunidade-complementar-bd6.json` | Extended JSON: quatro experiências e três denúncias; adoções vazias, sem documentos finais inválidos |
| `manifesto-comunidade-complementar-bd6.json` | IDs, hashes, dependências e cronologia; preserva o bloqueio histórico anterior, superado pelo terceiro lote acadêmico |
| `../tests/verificar-complemento-comunidade-bd6.cjs` | Conferência local de schema completo, referências, autoria, datas, snapshots, unicidade e preservação do principal |

| Coleção | Inseridos neste complemento | Inseridos no terceiro lote |
|---|---:|---:|
| experiencias_comunidade | 4 | 0 |
| denuncias_comunidade | 3 | 0 |
| adocoes_tratamento | 0 | 3 |
| Apoios das adoções: ocorrências, tratamentos e experiência | 0 | 5 |

São **sete documentos confirmados neste complemento**, subtotal de 192 antes das adoções. O terceiro lote elevou o total a 200, sem duplicar a ficha existente. Cada lote continua separado no CLI; não executar importação avulsa ou repetir cargas para fins de apresentação.

### Cenários e referências

As quatro experiências reutilizam as ocorrências atuais de A e B, suas plantações ativas de Milho e seus tratamentos. A origem continua `nao_identificado`, sem diagnóstico ou referência a ficha agrícola inventados. O método é cópia explícita do tratamento selecionado; não são compartilhadas fotos ou resultados de avaliações. Nome público é copiado do perfil sintético, sem nome completo.

| Experiência adicional | Origem | Estado final e cronologia fictícia |
|---|---|---|
| Aprovada | A, ocorrência aberta e tratamento manual | Primeira aprovação/publicação em 01/11/2026 12h UTC; disponível no feed de testes |
| Rejeitada | A, mesma ocorrência e tratamento | Pendente em 01/11; rejeitada em 02/11, com responsável, data e motivo; nunca publicada |
| Oculta | B, ocorrência em acompanhamento e tratamento cultural | Publicada em 01/11 12h; denunciada às 13h; ocultada por análise em 02/11 12h; preserva primeira publicação |
| Retirada | B, mesma ocorrência e tratamento | Retirada pelo autor em 02/11 enquanto pendente; sem aprovação, revisão ou publicação inventadas |

Não existe unicidade por ocorrência de origem: as duas cópias de cada autor são cenários independentes. Não se modifica nenhuma das duas experiências pendentes do principal.

Três denúncias: B denuncia a experiência aprovada de A (uma pendente e uma analisada com `manter_publicacao`); A denuncia a experiência de B quando ainda disponível (analisada com `ocultar_publicacao`, consistente com o estado final oculta). Não existe unicidade por denunciante/publicação. A denúncia pendente não oculta conteúdo. As datas são BSON Date em UTC no Extended JSON.

Os usuários existentes A/B são também atores **simulados** de moderação/análise, sem criar campo de papel no schema ou conceder permissões reais. Não há segregação obrigatória entre denunciante e analista definida no BD3/BD4; este lote não comprova autorização nem deve ser usado como especificação de concessão de papéis. Termos, seleção de conteúdo, decisões e revisão de moderação são ficções de teste, não aceite humano real. Qualquer execução futura deve ficar restrita ao desenvolvimento, sem exposição pública ou uso de notificações reais.

### Adoções: bloqueio histórico resolvido na demonstração acadêmica

O bloqueio original foi resolvido pela exceção acadêmica explícita registrada na BD3 §5.6 e BD4 §14.4: a mesma ficha de Lagarta-do-cartucho recebeu aprovação editorial simulada, sem revisão agronômica real. Permanecem as exigências estruturais e de vínculos: mesma cultura/problema, origem e destino identificados, publicação disponível com método/versão, destino próprio e plantação ativa.

As ocorrências não identificadas antigas foram preservadas. O terceiro lote criou duas novas ocorrências identificadas de Milho, dois tratamentos e uma experiência específica para as três adoções; não reutilizou os problemas fictícios antigos do BD5 nem criou ficha adicional.

| Estado confirmado | Condição representada |
|---|---|
| Planejada | Origem/destino identificados compatíveis, versão/método copiados; sem `tratamentoId`; única planejada do par |
| Realizada | Tratamento correspondente na ocorrência de destino, posterior ao planejamento; `tratamentoId` presente |
| Cancelada | Desistência posterior ao planejamento; sem `tratamentoId`; histórico preservado |

Os três cenários agora têm documentos e referências definidos no manifesto do terceiro lote e execução confirmada pelo usuário. A sequência simulada evita sobreposição de planejadas do mesmo par. Nenhuma aprovação editorial ou moderação simulada comprova revisão técnica, eficácia ou autorização real.

### Conferência e execução futura

Execute apenas a verificação local, na raiz do repositório:

```powershell
node database/tests/verificar-complemento-comunidade-bd6.cjs
```

Antes de futura carga do complemento: inserir e validar o principal por seu fluxo próprio; conferir no destino os pais e seus snapshots exatos, schemas, índices, colisões dos IDs reservados e divergências; abortar em ausência/conflito. Uma confirmação antiga não substitui essa leitura. Não sobrescrever pais, não recriar IDs e não publicar registros privados automaticamente.

A cronologia representa ciclos simulados (pendente → aprovada/rejeitada; aprovada → oculta por análise; pendente → retirada), preservando `publicadoEm`. Os sete snapshots finais foram inseridos em transação e validados conforme relatório disponível. Análise e estado final de ocultação pertencem ao mesmo lote. Os JSON e a carga direta não comprovam transições, consentimento, autenticação ou autorização da API.

Referências normativas: [BD3, Comunidade](../../docs/modelagem-mongodb.md#10-modelagem-da-comunidade), [BD4, adoção](../../docs/regras-validacoes-indices.md#144-adoção-como-planejamento), [BD4, denúncias](../../docs/regras-validacoes-indices.md#145-denúncias-e-responsabilidades) e validadores individuais atuais. Continuam pendentes as confirmações de acesso e o aceite formal do BD5 já registrados.


## Cenarios das adocoes academicas

**Lote aplicado e validado, conforme confirmação final do usuário: oito documentos novos e uma única alteração editorial simulada.** A decisão acadêmica substituiu o plano de outro banco e o bloqueio anterior por revisão técnica real para esses testes. Não executar o plano arquivado de `isolado-adocoes-bd6/`.

### Alteração explícita e escopo

Usou a ficha **já existente** de Lagarta-do-cartucho, `_id: 88b8a8ae41cde9df3d9c5df2`, e Milho. Não criou ou duplicou ficha, cultura, fonte ou usuário. `alteracao-ficha.json` preserva o documento completo **antes** e o **depois** aplicado. A única mudança de um documento preexistente é:

| Campo | Antes | Depois confirmado |
|---|---|---|
| `ativo` | false | true, só para demonstração acadêmica |
| `revisaoEditorial.status` | pendente | aprovada, explicitamente simulada |
| `revisaoEditorial.observacoes` | Ressalva original | Ressalva preservada + aviso explícito de simulação, sem revisão agronômica real ou eficácia comprovada |
| `revisadoEm` | ausente | `2026-11-04T04:40:00.000Z`, instante **simulado**, não data de revisão técnica |
| `atualizadoEm` | data anterior preservada no snapshot | mesmo instante simulado |

`registroAgrofitConferido: false`, `fotoPendente: true`, conteúdo, fontes e todos os demais campos permanecem intactos. Não se inventa responsável técnico, revisão humana ou campo extra. Nenhum schema é modificado. O campo `revisadoEm` é utilizado porque o schema exige Date para o estado aprovado; sua natureza simulada fica explícita no documento e no manifesto.

**Limitação concreta:** os filtros usuais `ativo: true` e `revisaoEditorial.status: aprovada` poderão encontrar essa ficha no desenvolvimento. A observação não implementa bloqueio ou isolamento na API. Não apresentar a aprovação simulada como certificação agronômica; não promover esta massa para produção. O backend não foi alterado. Eficácia, autorização, consentimento e transições reais da API não são comprovados.

### Oito documentos adicionais

| Coleção | Novos | Referências |
|---|---:|---|
| ocorrencias | 2 | Novas observações identificadas, nas plantações ativas de Milho dos produtores A e B; mesma ficha existente |
| tratamentos | 2 | Biológico educativo na origem; outro no destino, posterior ao planejamento realizado; sem produto ou dose inventados |
| experiencias_comunidade | 1 | Nova cópia de A, origem identificada, método selecionado; aprovação de moderação simulada por B |
| adocoes_tratamento | 3 | Cancelada, realizada com tratamento B e planejada |

Reutiliza as plantações `f98879d75c77dc508f29af45` (A) e `0b2e8fb74c25322369485c7c` (B), a cultura `f04d5232bcbcda1037cdb0e3` e os usuários existentes. A cadeia de propriedade é conferida localmente e, antes da aplicação, pela igualdade integral dos documentos no banco. Ocorrências, tratamentos e experiências antigos não são reclassificados. Não se adiciona avaliação obrigatória inexistente no escopo.

Cronologia simulada em UTC em 04/11/2026: aprovação editorial às 04h40; observações às 04h41; tratamento A às 04h42; experiência criada às 04h43 e aprovada/publicada às 04h44; primeira adoção criada às 04h45 e cancelada às 04h45min30s; segunda criada às 04h46 e realizada com tratamento B às 04h47; terceira criada às 04h48 e ainda planejada. São três documentos independentes, com janelas sem sobreposição, não três planejadas simultâneas. O único parcial mantém no máximo uma planejada por par experiência/ocorrência. Planejada e cancelada não têm `tratamentoId`; realizada aponta ao tratamento do destino. Datas representam o exercício fictício, não execução agrícola, revisão humana ou horário de commit.

### Manifestos, estado anterior e reprodução

`manifesto.json` é uma **extensão explícita** dos manifestos históricos dos lotes de 185 e 7 documentos. Preserva hashes e IDs desses arquivos e do JSON editorial original. Não reescreve a evidência histórica de 40 fichas pendentes/inativas. O novo contrato é:

| Fase | Pendentes/inativas | Aprovada/ativa simulada | Documentos dos lotes |
|---|---:|---:|---:|
| Antes | 40 | 0 | 192 |
| Depois, aplicado/validado conforme confirmação do usuário | 39 | 1 | 200 |

As conferências de `lib-bd6.cjs` e do complemento passam a aceitar somente **o estado original completo ou o estado simulado exato**, através de `lib-estado-editorial-bd6.cjs`. Não basta ter status aprovado; diferenças adicionais continuam sendo falhas. O relatório do principal identifica `estadoEditorialDemonstracao` e calcula 40/0 ou 39/1. Os novos scripts exigem ou o estado anterior com todos os oito IDs ausentes, ou o posterior com todos presentes e idênticos. Estado parcial é bloqueio para análise.

Os scripts do principal/complemento continuam sem criar estas adoções nem aplicar a exceção. A nova aplicação faz compare-and-swap do snapshot integral da ficha e insere os oito documentos em **uma transação snapshot/majority**. Sem upsert, exclusões, bypass, criação de índices ou alteração de outro preexistente. Repetição idêntica resulta em zero alterações e inserções. Não há restauração automática da ficha, pois isso afetaria seus novos vínculos.

Na raiz `C:\Projetos\PI-IV-ES-Time9`, comando de **pré-conferência somente de leitura**, para futuras conferências justificadas:

```powershell
node database/seed/bd6.cjs adocoes conferir
```

Somente após relatório aprovado e autorização específica para escrever:

```powershell
node database/seed/bd6.cjs adocoes inserir --aplicar
node database/seed/bd6.cjs adocoes validar
```

Sem `--aplicar`, o comando de aplicação somente confere. Usa Node 18+, dependências do backend e `MONGODB_URI` do processo ou `backend/.env` somente para leitura. Não imprime URI nem modifica credenciais. Destino fixo `sentinela`, apenas desenvolvimento; requer transações. Não amplia permissões. Erro ou commit incerto: interromper, executar validação e analisar antes de repetir. Reservar janela sem alterações concorrentes.

Verificações locais sem rede:

```powershell
node database/tests/verificar-demonstracao-adocoes-bd6.cjs
```

Nenhum resultado local comprova commit no Atlas. Aprovação editorial simulada não resolve pendências técnicas reais das 40 fichas para uso agrícola. Esta exceção aplica-se somente à ficha/estado exatos e ao exercício acadêmico autorizado.

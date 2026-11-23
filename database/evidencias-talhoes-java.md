# Cadastro de talhões com Java — preparação e execução real

Data: 12/11/2026 (America/Sao_Paulo). Branch: `backend/servidor-java`.

## Ambiente identificado sem segredos

- Configuração MongoDB Atlas presente; banco selecionado pelo backend: `sentinela`. Nenhuma URI ou credencial registrada.
- Autenticação configurada para Auth Emulator em `127.0.0.1:9099`. A consulta HTTP local com timeout de 3 segundos não conseguiu acessá-lo, inclusive fora do sandbox.
- Contas sintéticas A/B estão identificadas na documentação BD8 e na massa BD6; tokens `BD8_TOKEN_A` e `BD8_TOKEN_B` ausentes da configuração/sessão disponível.
- Nenhum perfil, conta ou propriedade preexistente foi alterado ou escolhido para a rodada.

## Execução e limites

Comando tentado: `npm --prefix backend run test:talhoes:real -- --executar`.
Rodada: `6701cd70-67a3-45dc-aaef-f1485411818f`.

O harness interrompeu nos pré-requisitos, com `BD8_TOKEN_A_AUSENTE` e `BD8_TOKEN_B_AUSENTE`, código de saída 1 e `aprovado: false`. Não abriu conexão ao Atlas nem iniciou as instâncias temporárias de Java/HTTP.

| Cenário planejado | Resultado desta tentativa |
|---|---|
| Válido: 201 e campos persistidos | Não executado |
| Nome vazio/área zero: 400 sem gravação | Não executado |
| Java indisponível: 503 sem gravação | Não executado |
| Sem token: acesso negado sem gravação | Não executado |
| Propriedade de B: acesso negado sem gravação | Não executado |
| Área acima da disponível: rejeição sem gravação | Não executado |
| Duas criações concorrentes sem excesso de soma | Não executado |

**Limpeza:** `escritasIniciadas: false`; listas de IDs de propriedades e talhões vazias. Não houve documentos criados ou removidos, nem limpeza pendente nesta tentativa.

Os checks TypeScript do backend e do harness passaram. Isso verifica a preparação do código, não autenticação, persistência, transação ou concorrência reais. O harness também força snapshots reais sobrepostos no cenário concorrente e exige repetição de transação; esse caminho permanece sem execução real.

## Para executar

Disponibilizar o Auth Emulator do projeto configurado com as contas sintéticas A/B existentes e tokens atuais dessas contas em variáveis da sessão que executará o comando. Não enviar tokens ao chat ou gravá-los no repositório. O banco precisa estar acessível à mesma sessão com os perfis BD6 existentes e suporte a transações. Essa conectividade não foi testada nesta tentativa.

O teste cria suas próprias propriedades temporárias e registra seus IDs, sem precisar escolher uma propriedade preexistente. Ao executar novamente, preservar o relatório final, com os sete resultados, contadores de concorrência, IDs e confirmação da limpeza. Não substituir este resultado incompleto por uma aprovação baseada em mocks.

## Execução real aprovada — 12/11/2026

Após o usuário informar que o Emulator estava ativo e autorizar a preparação das contas, a consulta real confirmou ausência das contas A/B. Foram criadas somente no Auth Emulator do projeto configurado:

| Ator | UID | E-mail sintético |
|---|---|---|
| A | sentinela_bd6_v1_20261103_a | produtor.a.bd8@example.invalid |
| B | sentinela_bd6_v1_20261103_b | produtor.b.bd8@example.invalid |

Senhas aleatórias e tokens ficaram somente em memória. O login usou `accounts:signInWithPassword` no Emulator, seguido de verificação dos tokens com revogação. Tokens foram repassados ao processo filho como `BD8_TOKEN_A`/`BD8_TOKEN_B`, sem impressão ou gravação em arquivos. Não houve mudança no `.env`, permissões, contas preexistentes ou perfis MongoDB. As duas contas sintéticas criadas permanecem no Emulator.

Comando executado: `npm --prefix backend run test:talhoes:real -- --executar`.
Rodada: `91cfda3d-50d4-42b4-b1d5-fbee4b8d0839`. Código de saída: **0**. Resultado: **aprovado**, sem motivos de falha.

| Cenário | HTTP | Conferência real |
|---|---|---|
| Pedido válido | 201 | Nome, área 2,5 ha, observações, vínculo, ativo e datas confirmados no MongoDB |
| Nome vazio e área zero | 400 | As duas mensagens Java conferidas; contagem de documentos não aumentou |
| Java indisponível | 503 | Código JAVA_INDISPONIVEL e mensagem segura; sem documento novo |
| Sem token | 401 | Sem documento novo |
| Propriedade temporária de B, pedido de A | 404 | Sem documento novo |
| Área maior que a disponível | 409 | Código AREA_INSUFICIENTE; sem documento novo |
| Duas criações de 0,6 ha para propriedade de 1 ha | 409 e 201 | Um único talhão ativo de 0,6 ha, sem excesso na soma |

Concorrência comprovada com duas leituras reais sobrepostas em sessões/transações MongoDB e **quatro tentativas de reserva**, incluindo repetição após conflito. O teste usou HTTP, autenticação do Emulator, cliente TCP, Java e persistência/transação reais; não utilizou mocks. Não foi necessária correção no módulo de talhões nesta rodada.

IDs das três propriedades exclusivas criadas e removidas:

- `6af638484698927d5044ad86`
- `6af638484698927d5044ad87`
- `6af638484698927d5044ad88`

IDs dos dois talhões criados e removidos:

- `6af638494698927d5044ad8e`
- `6af6384a4698927d5044ada6`

**Limpeza confirmada:** o finally registrou os IDs, removeu somente os documentos desta rodada e conferiu ausência nas coleções. Relatório: `necessaria: true`, `confirmada: true`, `incerteza: false`. As instâncias próprias de HTTP/Java foram encerradas e a compilação temporária removida. Processos anteriores foram preservados.

Esta execução supera o bloqueio da tentativa anterior, que permanece documentada acima. Comprova os sete cenários e a concorrência controlada entre dois cadastros; não comprova integração Flutter, carga prolongada ou comportamento de escritores externos ao backend.

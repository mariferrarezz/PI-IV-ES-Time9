# Auditoria de usuários duplicados

A auditoria verificou todas as coleções, incluindo referências incorporadas e questionários dentro do próprio usuário. Antes de qualquer remoção foi criado um backup EJSON de todas as coleções e um backup separado da identidade sintética do Firebase Emulator, em `backups-sentinela/`, diretório ignorado pelo Git.

Foi removido somente o perfil `6b0369c5a0a2737cc85f0760` (Cadastro Teste), sem questionário nem referências, e sua credencial sintética do emulador `7NYO6WVppiWUMujmnI1tlCTJZxDG`. A identidade e o nome do teste estavam documentados e foram conferidos antes da exclusão.

Permanecem os seguintes perfis dos grupos duplicados:

| Usuário | ID | Motivo da preservação |
|---|---|---|
| Pessoa Ficticia BD6 A | `be013a28bfb4773b09f619d3` | Questionário, propriedades e histórico associado |
| Pessoa Ficticia Teste Manual | `6af8f9b6d3efbe6c9205b498` | Propriedade associada |
| Teste Login | `6afc42dd5ac9092d875aee00` | Identidade não encontrada no emulador; não se comprovou a origem pelo nome |
| Teste Login | `6afc60127946454609853a4b` | Questionário incorporado |
| Teste Java | `6afd8b3f9811ebbbe2bbfacb` | Questionário incorporado |
| Teste Integracao | `6b035aa52e5081bbcdd5f83d` | Questionário, propriedade e histórico associado |
| Julia Maria | `6b038b39dde010951f25e4df` | Identidade não comprovada como teste |
| Fluxo Sintético | `6b038d3fdde010951f25e4e7` | Questionário incorporado |
| Laura Oliveira | `6b038e36dde010951f25e4ee` | Questionário incorporado e identidade não comprovada como teste |

Outros perfis que não pertencem aos grupos duplicados permanecem sem alteração: `6ae8f301045abb5a0084cc0f` (Usuario Ficticio Teste Plantacoes) e `f143382bb56503d766a8f961` (Pessoa Ficticia BD6 B).

Após a remoção restaram 2 grupos de CPF (9 usuários) e 3 grupos de telefone (7 usuários). A tentativa de criar índices foi bloqueada pela auditoria; não há índices únicos nesses campos e a API mantém criação e edição de dados de conta bloqueadas. Os grupos restantes podem ser inspecionados sem revelar CPF ou telefone com `node tests/auditar-unicidade-usuarios.cjs` a partir de `backend`.

# PI-IV-ES-Time9
Repositório dedicado ao Projeto Integrador IV do time 2

# Sentinela

Aplicativo de gestão e monitoramento de pragas e doenças em plantações, voltado a pequenos produtores rurais. Projeto Integrador IV (Engenharia de Software).

## Estrutura

| Pasta | O que é |
|---|---|
| `mobile/` | App Flutter/Dart (frontend) |
| `backend/` | API em Node + TypeScript |
| `servidor-java/` | Servidor Java (sem Spring Boot) |
| `firebase.json` | Config do Firebase Auth + Emulator Suite |
| `docs/` | Modelagem do banco, diagramas e decisões |
| `database/` | Scripts, configuração e evidências do MongoDB Atlas |

## Fluxo do backend

`routes → controller → service → repository → MongoDB`

Cada módulo em `backend/src/modules/<nome>/` segue esse padrão.

## Como começar

1. Banco: utilizar o ambiente MongoDB Atlas do Sentinela e seguir os [pré-requisitos e a ordem de configuração](database/README.md#reprodução-pelo-mongodb-playground). Não há `docker-compose.yml` neste repositório; MongoDB local não é um pré-requisito do ambiente atual.
2. Backend: copiar `backend/.env.example` para `backend/.env` somente se o arquivo local ainda não existir e preencher `MONGODB_URI` e as demais variáveis necessárias. Obter acesso autorizado com a equipe; não versionar credenciais. A integração real do módulo de propriedades no BD8 teve 29 testes aprovados, com limpeza confirmada, conforme as [evidências BD8](database/evidencias-bd8.md). Acesso/rede e revisão/aceite foram aprovados por declaração do usuário em 10/11/2026, sem nova verificação técnica. Ver [configuração, contrato e testes do backend](backend/README.md). Essa execução não comprova integração Flutter nem endpoints de talhões ou dos demais módulos.
3. Mobile: dentro de `mobile/`, rodar `flutter create .` para gerar o projeto Flutter (as pastas de `lib/` já existem).

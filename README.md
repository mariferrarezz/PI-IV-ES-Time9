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
| `docker-compose.yml` | MongoDB local |

## Fluxo do backend

`routes → controller → service → repository → MongoDB`

Cada módulo em `backend/src/modules/<nome>/` segue esse padrão.

## Como começar

1. `docker compose up -d` para subir o MongoDB local.
2. Backend: copiar `backend/.env.example` para `backend/.env` e preencher.
3. Mobile: dentro de `mobile/`, rodar `flutter create .` para gerar o projeto Flutter (as pastas de `lib/` já existem).

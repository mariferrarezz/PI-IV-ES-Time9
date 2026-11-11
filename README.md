# PI-IV-ES-Time9
Repositório dedicado ao Projeto Integrador IV do time 9

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

## Banco de dados

O banco oficial é o **MongoDB Atlas** (na nuvem). Não há MongoDB local.

## Fluxo do backend

`routes → controller → service → repository → MongoDB Atlas`

Cada módulo em `backend/src/modules/<nome>/` segue esse padrão.

## Como começar

1. Backend: copiar `backend/.env.example` para `backend/.env` e preencher.
   - `MONGODB_URI`: string de conexão do MongoDB Atlas (pedir para quem administra o banco).
   - No Atlas, liberar o seu IP em **Network Access**, senão a conexão é recusada.
2. Firebase Emulator (Auth): na raiz do repositório, rodar
   `npx firebase-tools emulators:start --only auth --project projeto-integrador-4-8c129`
   e deixar o terminal aberto. A interface fica em http://127.0.0.1:4000.
3. API: dentro de `backend/`, rodar `npm install` (só na primeira vez) e `npm run dev`.
   Teste: http://localhost:3000/health deve responder `{"status":"ok"}`.
4. Mobile: dentro de `mobile/`, rodar `flutter create .` para gerar o projeto Flutter (as pastas de `lib/` já existem).

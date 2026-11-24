# Sentinela

Aplicativo para apoiar pequenos produtores rurais no acompanhamento de pragas e doenças em plantações. O produtor cadastra suas propriedades, talhões e plantações, registra ocorrências e tratamentos, consulta um catálogo de pragas e doenças e troca experiências com outros produtores na Comunidade.

Desenvolvido como parte do **Projeto Integrador IV — Engenharia de Software** (PUC-Campinas). É um projeto acadêmico: não está publicado e usa apenas dados fictícios.

## Funcionalidades

- Login com Firebase Authentication, cadastro em 8 passos (com conferência de CPF e celular) e recuperação de senha.
- Questionário inicial do produtor, respondido uma única vez.
- Tela inicial com saudação, propriedade mais recente, talhões ativos e alertas.
- Cadastro de propriedades, talhões e plantações, com encerramento de plantação.
- Registro de ocorrências de pragas e doenças, monitoramentos, tratamentos e avaliação dos resultados, com histórico por ocorrência.
- Catálogo com 40 fichas de pragas e doenças, com imagens.
- Comunidade: feed de experiências, denúncia de conteúdo e compartilhamento de uma ocorrência como relato.
- Perfil com avatar de iniciais e nome público editável.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Aplicativo | Flutter e Dart (executado no navegador Chrome) |
| Autenticação | Firebase Authentication e Firebase Emulator Suite |
| API | Node.js, TypeScript, Express 5, Mongoose e Zod |
| Banco de dados | MongoDB Atlas |
| Validações de regras de negócio | Java puro (sem Spring Boot), comunicação por TCP |
| Testes | Flutter Test, Node Test Runner e testes Java |

## Arquitetura

```text
App Flutter ──HTTP + token Firebase──▶ API Node.js ──▶ MongoDB Atlas
                                           │
                                           └──TCP──▶ Servidor Java (valida e responde)
```

- O aplicativo conversa **somente** com a API Node.js.
- **Somente** a API conversa com o servidor Java.
- Antes de gravar, a API envia os dados ao Java. Se o Java recusar, a API responde `400 ENTRADA_INVALIDA` com as mensagens. Se o Java estiver desligado, responde `503 JAVA_INDISPONIVEL` e nada é gravado.
- O Java não acessa o banco e não guarda nada: só confere as regras e devolve `OK` ou a lista de erros.

Dentro da API, o caminho de um pedido é:

```text
Rota → validação Zod → service → repository/Mongoose → MongoDB
                          ↓
                validadores Java (TCP)
```

## Estrutura do repositório

```text
.
├── lib/                 # Aplicativo Flutter
│   ├── features/        # Telas por funcionalidade (auth, catalogo, dashboard, ocorrencias, propriedades...)
│   └── services/        # Cliente da API, datas e máscaras
├── assets/images/       # Logo e imagens do catálogo
├── backend/             # API Node.js/TypeScript
├── servidor-java/       # Servidor TCP e validadores Java
├── database/            # Coleções, índices, validadores e dados de apoio do MongoDB
├── docs/                # Modelagem, documentos do projeto e estado das integrações
├── test/                # Testes do aplicativo Flutter
└── firebase.json        # Configuração do Firebase Emulator
```

## Pré-requisitos

- [Flutter](https://docs.flutter.dev/get-started/install) (SDK compatível com Dart `^3.11.5`) e o navegador Chrome
- Node.js 20 ou superior
- JDK 21
- Acesso autorizado ao cluster MongoDB Atlas da equipe

Cada integrante precisa liberar o próprio IP em **MongoDB Atlas → Network Access**. Ao trocar de rede, é preciso liberar de novo (sintoma: `BANCO_INDISPONIVEL` na API).

## Como executar

São quatro terminais, todos abertos na raiz do repositório. Os comandos abaixo são para macOS e Linux. No Windows (PowerShell), veja a observação no passo 2.

### 0. Clone e instale as dependências

```bash
git clone https://github.com/mariferrarezz/PI-IV-ES-Time9.git
cd PI-IV-ES-Time9
flutter pub get
npm ci --prefix backend
```

Copie `backend/.env.example` para `backend/.env` e preencha `MONGODB_URI` com a URI do Atlas (banco `sentinela`). **Nunca** versione o `.env`.

### 1. Emulador do Firebase Auth (terminal 1)

```bash
npx firebase-tools emulators:start --only auth --project projeto-integrador-4-8c129 --import=./firebase-export-sentinela --export-on-exit
```

Aguarde `All emulators ready!`. A interface do emulador fica em http://127.0.0.1:4000.

- O `--import/--export-on-exit` guarda as contas de teste entre uma execução e outra. Sem ele, as contas somem ao reiniciar, mas os perfis continuam no Atlas. Desligue sempre com `Ctrl+C`.
- Na primeira vez, se a pasta `firebase-export-sentinela` ainda não existir, use apenas `--export-on-exit=./firebase-export-sentinela`.

### 2. Servidor Java (terminal 2)

```bash
rm -rf servidor-java/out
mkdir -p servidor-java/out
javac -encoding UTF-8 -d servidor-java/out $(find servidor-java/src/main/java -name "*.java")
java -cp servidor-java/out sentinela.servidor.Servidor 7001
```

Aguarde `Servidor aguardando conexões na porta 7001.`

- **Recompile sempre que trocar de branch ou o código Java mudar.** Um Java desatualizado responde "Pedido de validação inválido." no app.
- A porta padrão é `7000`. No macOS ela costuma estar ocupada pelo Receptor AirPlay, por isso usamos `7001`. A porta escolhida precisa ser a mesma de `JAVA_PORT` no `backend/.env`.
- No Windows (PowerShell), a compilação fica assim:

  ```powershell
  $fontes = Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object FullName
  New-Item -ItemType Directory -Path servidor-java/out -Force | Out-Null
  javac -encoding UTF-8 -d servidor-java/out $fontes
  java -cp servidor-java/out sentinela.servidor.Servidor 7001
  ```

### 3. API (terminal 3)

```bash
cd backend
npm run dev
```

Aguarde `API_INICIADA` (porta 3000). Para conferir se tudo está ligado:

```bash
curl -s http://localhost:3000/ready; echo
```

A resposta deve trazer `"status":"pronto"`. `GET /health` só indica que a API está no ar; `GET /ready` também confere o banco.

### 4. Aplicativo (terminal 4)

```bash
flutter run -d chrome
```

- O app procura a API em `http://localhost:3000`. Para outro endereço: `flutter run -d chrome --dart-define=API_URL=http://SEU_HOST:3000`.
- Para usar o emulador em outro host: `--dart-define=FIREBASE_EMULATOR_HOST=SEU_HOST`.
- Depois de mudar imagens ou outros assets, reinicie o app com `R` maiúsculo.

## Testes

Use sempre dados fictícios (por exemplo, CPF `111.444.777-35` e celular `(19) 99876-5432`).

### Aplicativo Flutter

```bash
flutter analyze
flutter test
```

### API

```bash
cd backend
npm test
```

`npm test` não precisa de banco nem do Java (usa dependências simuladas). Com o servidor Java ligado, há testes que usam o Java de verdade, por exemplo:

```bash
npm run test:perfil:java
npm run test:questionario:java
npm run test:comunidade:publicacao:java
```

A lista completa está em `backend/package.json` (scripts `test:*`).

### Servidor Java

Depois de compilar os fontes de produção, compile os testes e rode a classe desejada:

```bash
mkdir -p servidor-java/out/testes
javac -encoding UTF-8 -cp servidor-java/out -d servidor-java/out/testes $(find servidor-java/src/test/java -name "*.java")
java -cp servidor-java/out:servidor-java/out/testes sentinela.validacao.ValidadorPropriedadeTest
```

As classes de teste ficam em `servidor-java/src/test/java/sentinela/validacao/` (uma por assunto: propriedade, plantação, ocorrência, comunidade...). No Windows, o separador do `-cp` é `;` em vez de `:`.

## Estado das integrações

| Recurso | Situação atual |
|---|---|
| Login, cadastro e questionário | Integrados de ponta a ponta (Firebase, API, Java e Atlas). |
| Tela inicial | Integrada (`GET /home/resumo`). |
| Perfil | Integrado: nome e iniciais vêm da API; o nome público é editável. Nome completo, CPF e telefone não mudam depois do cadastro. |
| Propriedades, talhões e plantações | Integrados, incluindo o encerramento de plantação. |
| Ocorrências, monitoramentos, tratamentos e avaliações | Integrados, com histórico por ocorrência. |
| Catálogo | 40 fichas com imagens, abertas a partir da tela inicial e da lista do catálogo. |
| Comunidade | Feed, detalhe, denúncia e compartilhamento a partir de uma ocorrência integrados. A publicação é aprovada automaticamente (não há moderação manual). Adoção de tratamento ainda não existe. |
| Notificações e privacidade | Apenas interface: as preferências ainda não são salvas e nenhuma notificação é enviada. |
| Upload de imagens | Fora do escopo: o app não envia fotos (perfil usa avatar com iniciais). |

O detalhamento por formulário está em [docs/estado-formularios-validacao.md](docs/estado-formularios-validacao.md).

## Documentação complementar

- [Documentação da API](backend/README.md)
- [Documentação do servidor Java](servidor-java/README.md) e [regras da Comunidade no Java](servidor-java/comunidade.md)
- [Configuração do banco de dados](database/README.md)
- [Modelagem MongoDB](docs/modelagem-mongodb.md) e [modelagem conceitual](docs/modelagem-conceitual.md)
- [Estado dos formulários e validações](docs/estado-formularios-validacao.md)
- [Lista inicial do catálogo de pragas e doenças](docs/catalogo-pragas-e-doencas.md)
- Documentos do projeto (relatório, pitch, matriz SWOT, mapa da empatia, mapa mental, canvas e lista de funcionalidades): pasta [docs/](docs/)

## Segurança e boas práticas

- Não versione arquivos `.env`, credenciais, tokens, a URI do MongoDB Atlas nem arquivos pessoais.
- CPF e telefone nunca aparecem em logs nem em mensagens de erro da API.
- O servidor Java é destinado à rede local controlada: não tem TLS nem autenticação própria.

## Equipe

Projeto desenvolvido pelo **Time 9** do Projeto Integrador IV.

| Integrante | Responsabilidade |
|---|---|
| Mariana Ferrarez | API Node.js (back-end) |
| Gabriel Santos | Aplicativo Flutter (telas) e documentação |
| Julia Ferreira | Banco de dados e servidor Java |
| Matheus Narducci | Testes do servidor Java |

## Como contribuir

1. Atualize a `main` (`git checkout main` e `git pull`) e crie uma branch no padrão `área/assunto`, por exemplo `backend/comunidade`.
2. Mantenha os testes relevantes passando.
3. Abra um pull request para a `main` descrevendo o que mudou e faça o merge com **"Create a merge commit"**.

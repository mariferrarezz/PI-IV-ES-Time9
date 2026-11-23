# Sentinela

Aplicativo para apoiar pequenos produtores rurais no acompanhamento de pragas e doenças em plantações. O projeto reúne cadastro e autenticação de usuários, organização de propriedades e talhões, catálogo de problemas agrícolas, registro de ocorrências e uma área de comunidade.

Desenvolvido como parte do **Projeto Integrador IV — Engenharia de Software**.

## Funcionalidades

- Autenticação de usuários com Firebase Authentication.
- Cadastro de conta, recuperação de senha e questionário inicial do produtor.
- Consulta a um catálogo de pragas e doenças agrícolas, com imagens e informações de apoio.
- Gestão de propriedades, talhões e plantações.
- Telas para registrar ocorrências e acompanhar sua evolução.
- Perfil do usuário, notificações, privacidade e área de comunidade.
- API com validações, regras de domínio e persistência no MongoDB.

> Algumas telas e fluxos ainda são demonstrativos. Consulte [Estado das integrações](#estado-das-integrações) para saber exatamente o que já possui integração ponta a ponta.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Aplicativo | Flutter e Dart |
| Autenticação | Firebase Authentication e Firebase Emulator Suite |
| API | Node.js, TypeScript, Express, Mongoose e Zod |
| Banco de dados | MongoDB Atlas |
| Validações de domínio | Java puro, comunicação TCP |
| Testes | Flutter Test, Node Test Runner e testes Java |

## Estrutura do repositório

```text
.
├── lib/                 # Aplicativo Flutter
│   ├── features/        # Telas organizadas por funcionalidade
│   └── services/        # Cliente HTTP, datas e máscaras
├── assets/images/       # Logo e imagens do catálogo
├── backend/             # API Node.js/TypeScript
├── servidor-java/       # Serviço TCP e validadores Java
├── database/            # Coleções, índices, validadores e dados de apoio MongoDB
├── docs/                # Modelagem e documentação do projeto
├── test/                # Testes do aplicativo Flutter
└── firebase.json        # Configuração do Firebase Emulator
```

O fluxo principal da API é:

```text
Rotas → validação Zod → controller → service → repository/Mongoose → MongoDB
                              ↓
                    validadores Java (TCP)
```

## Pré-requisitos

- [Flutter](https://docs.flutter.dev/get-started/install) (SDK compatível com Dart `^3.11.5`)
- Node.js 20 ou superior
- JDK instalado e disponível no `PATH`
- Uma conta/projeto Firebase configurado para desenvolvimento
- Acesso autorizado ao cluster MongoDB Atlas utilizado pela equipe

Para executar a API com Atlas, cada integrante deve liberar o próprio IP em **MongoDB Atlas → Network Access**.

## Como executar

### 1. Clone e instale as dependências do aplicativo

```powershell
git clone <URL_DO_REPOSITORIO>
cd sentinela
flutter pub get
```

### 2. Configure o Firebase

O aplicativo está configurado para utilizar o **Firebase Auth Emulator** na porta `9099` durante o desenvolvimento. Inicie-o em outro terminal:

```powershell
npx firebase-tools emulators:start --only auth --project "ID_DO_SEU_PROJETO"
```

No emulador Android, o endereço padrão usado pelo app é `10.0.2.2`. Nas demais plataformas, é `127.0.0.1`. Para informar outro host, use a variável de compilação:

```powershell
flutter run --dart-define=FIREBASE_EMULATOR_HOST=SEU_HOST
```

### 3. Execute o aplicativo Flutter

```powershell
flutter run
```

### 4. Configure e execute a API (opcional para o desenvolvimento do app)

Instale as dependências:

```powershell
npm ci --prefix backend
```

Copie `backend/.env.example` para `backend/.env`, caso o arquivo ainda não exista, e preencha as variáveis locais:

```env
MONGODB_URI=<URI_AUTORIZADA_DO_ATLAS>
PORT=3000
FIREBASE_PROJECT_ID=<ID_DO_PROJETO>
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

Depois, inicie a API:

```powershell
npm --prefix backend run dev
```

A API disponibiliza `GET /health` para liveness e `GET /ready` para verificar a conexão configurada com o banco.

### 5. Compile e execute o serviço Java (quando necessário)

Em outro terminal, na raiz do repositório:

```powershell
$fontes = Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object FullName
New-Item -ItemType Directory -Path servidor-java/out -Force | Out-Null
javac -encoding UTF-8 -d servidor-java/out $fontes
java -cp servidor-java/out sentinela.servidor.Servidor
```

O serviço usa a porta `7000` por padrão. Para outra porta:

```powershell
java -cp servidor-java/out sentinela.servidor.Servidor 8080
```

## Testes

### Flutter

```powershell
flutter test
```

### Backend

Os scripts disponíveis e seus requisitos estão em [backend/README.md](backend/README.md). Exemplos:

```powershell
npm --prefix backend run test:talhoes
npm --prefix backend run test:propriedades
npm --prefix backend run test:java
```

### Java

Após compilar os fontes de produção, compile os testes e execute a classe desejada:

```powershell
$testes = Get-ChildItem servidor-java/src/test/java -Recurse -Filter '*.java' | ForEach-Object FullName
javac -encoding UTF-8 -cp servidor-java/out -d servidor-java/out/testes $testes
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorTalhaoTest
```

## Estado das integrações

| Recurso | Situação atual |
|---|---|
| Login | Integrado ao Firebase Authentication. |
| Cadastro, recuperação de senha e questionário | Telas implementadas; a integração completa entre todas as etapas ainda está em evolução. |
| Propriedades e talhões | API possui rotas e validações; as telas Flutter ainda precisam consumir todo o fluxo real. |
| Plantações | API possui consulta e criação por talhão, com validação Java e persistência. |
| Ocorrências, evolução e comunidade | Telas e validadores existem, mas endpoints e persistência completos ainda não foram implementados. |
| Perfil, notificações e privacidade | Interface disponível; parte das preferências ainda não é persistida. |

Essa separação evita apresentar como concluídas funcionalidades que hoje são apenas interfaces ou validações isoladas.

## Documentação complementar

- [Documentação da API](backend/README.md)
- [Documentação do servidor Java](servidor-java/README.md)
- [Configuração do banco de dados](database/README.md)
- [Modelagem MongoDB](docs/modelagem-mongodb.md)
- [Modelagem conceitual](docs/modelagem-conceitual.md)
- [Levantamento das integrações do aplicativo](docs/levantamento-validacao-aplicativo.md)

## Segurança e boas práticas

- Não versione arquivos `.env`, credenciais, tokens ou a URI do MongoDB Atlas.
- Mantenha o Firebase e o MongoDB em ambientes de desenvolvimento autorizados.
- O serviço Java atual é destinado à rede local controlada: ele não implementa TLS nem autenticação própria.

## Equipe

Projeto desenvolvido pelo **Time 2** do Projeto Integrador IV. Os integrantes podem ser incluídos aqui com nome, função e, se desejarem, links para GitHub ou LinkedIn.

---

Para contribuir, crie uma branch para a alteração, mantenha os testes relevantes passando e descreva o que foi modificado no pull request.

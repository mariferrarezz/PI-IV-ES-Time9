# Manual de instalação e execução

## Pré-requisitos

- Flutter com Dart compatível com `^3.11.5`.
- Node.js 20 ou superior.
- JDK no `PATH`.
- Firebase CLI ou execução via `npx firebase-tools`.
- Acesso autorizado ao MongoDB Atlas do ambiente de desenvolvimento.

## Aplicativo Flutter

Na raiz do repositório:

```powershell
flutter pub get
flutter run
```

A URL da API pode ser definida na execução:

```powershell
flutter run --dart-define=API_URL=http://localhost:3000
```

## Firebase Auth Emulator

```powershell
npx firebase-tools emulators:start --only auth --project "ID_DO_PROJETO"
```

A porta configurada é `9099`. No Android, o aplicativo utiliza `10.0.2.2` para acessar o host local; nas demais plataformas, utiliza `127.0.0.1`. Para substituir o host:

```powershell
flutter run --dart-define=FIREBASE_EMULATOR_HOST=SEU_HOST
```

## Backend

1. Instale dependências com `npm ci --prefix backend`.
2. Copie `backend/.env.example` para `backend/.env` somente se ainda não houver arquivo local.
3. Preencha, sem versionar, `MONGODB_URI`, `PORT`, `FIREBASE_PROJECT_ID`, `FIREBASE_AUTH_EMULATOR_HOST`, `JAVA_HOST` e `JAVA_PORT` quando aplicável.
4. Execute:

```powershell
npm --prefix backend run dev
```

Verifique `http://localhost:3000/health` e `http://localhost:3000/ready`.

## Serviço Java

```powershell
$fontes = Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object FullName
New-Item -ItemType Directory -Path servidor-java/out -Force | Out-Null
javac -encoding UTF-8 -d servidor-java/out $fontes
java -cp servidor-java/out sentinela.servidor.Servidor
```

A porta padrão é `7000`. O serviço destina-se ao ambiente local controlado; não oferece TLS ou autenticação própria.

## Segurança

Não publique `.env`, URI do MongoDB, tokens Firebase ou dados reais de produtores. Ao alterar de rede, libere o IP atual no MongoDB Atlas quando o ambiente exigir acesso por lista de IPs.

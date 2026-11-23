# Demonstração de talhões no Chrome

Pré-requisitos: Flutter, Chrome, Node, Firebase CLI, JDK e MongoDB acessível com as coleções, validadores e índices do projeto. A criação de talhões usa transações: o MongoDB deve suportá-las. Configure `backend/.env` com `MONGODB_URI`, `FIREBASE_PROJECT_ID=projeto-integrador-4-8c129`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `JAVA_HOST=127.0.0.1` e `JAVA_PORT=7000`. Não compartilhe a URI. Verifique que o banco é apropriado para dados de demonstração.

Em terminais PowerShell separados, na raiz:

```powershell
$fontes = @(Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object { $_.FullName })
javac -encoding UTF-8 -d servidor-java/out @fontes
java -cp servidor-java/out sentinela.servidor.Servidor
```

```powershell
firebase emulators:start --only auth --project projeto-integrador-4-8c129
```

```powershell
npm ci --prefix backend
npm --prefix backend run dev
```

Confirme `http://localhost:3000/ready`: deve retornar `pronto` e `emulator`. O emulador vazio precisa de conta Firebase, perfil no MongoDB e propriedade vinculados ao mesmo UID. Para criar dados de demonstração, com os serviços ativos, execute o bloco abaixo em outro terminal. Ele cria registros reais no banco configurado; use somente dados de teste em um banco autorizado. O e-mail gerado é exibido para o login.

```powershell
$emailDemo = "demo-$([guid]::NewGuid().ToString('N'))@example.test"
$senhaDemo = 'SentinelaDemo123!'
$credencial = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo' -ContentType 'application/json' -Body (@{ email=$emailDemo; password=$senhaDemo; returnSecureToken=$true } | ConvertTo-Json)
$cabecalho = @{ Authorization="Bearer $($credencial.idToken)" }
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/auth/cadastro' -Headers $cabecalho -ContentType 'application/json' -Body (@{ nomeCompleto='Pessoa de Teste'; cpf='52998224725'; telefone='11999999999'; canalCodigoPreferido='email'; aceitouTermos=$true } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/propriedades' -Headers $cabecalho -ContentType 'application/json' -Body (@{ nome='Propriedade de teste'; municipio='Campinas'; estado='SP'; areaTotalHa=100 } | ConvertTo-Json) | Out-Null
Write-Host "E-mail: $emailDemo"
Write-Host "Senha: $senhaDemo"
```

Esses registros não são apagados automaticamente. O Firebase Emulator normalmente perde as contas ao reiniciar, a menos que se configure importação/exportação; o perfil e a propriedade permanecem no MongoDB. Use uma conta e propriedade existentes em vez do bloco acima quando disponíveis.

```powershell
flutter run -d chrome --dart-define=API_URL=http://localhost:3000
```

Entre com a conta, abra **Talhões**, selecione a propriedade e escolha **Novo talhão**. Deixe o nome vazio, digite `0` na área e envie: a resposta esperada contém as mensagens Java de nome obrigatório e área maior que zero, mantendo os campos. Corrija para `Talhão de teste` e `2,5`; após confirmação da API, a lista é recarregada. Se não houver área disponível suficiente, use uma propriedade adequada. A tela não salva cultura, plantio ou fase.

O teste `npx tsx --test tests/talhoes-java-real.test.ts`, executado dentro de `backend` com o Java ativo, confirma o percurso HTTP Node → Java para os valores inválidos usando autenticação e repositórios simulados; não comprova persistência nem execução no navegador.

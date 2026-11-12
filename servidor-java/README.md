# Servidor Java do Sentinela

Java puro, sem Maven ou bibliotecas externas. Execute os comandos PowerShell a partir da raiz do repositório, com JDK no PATH.

```powershell
$fontes = @(Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object { $_.FullName })
New-Item -ItemType Directory -Path servidor-java/out -Force | Out-Null
javac -encoding UTF-8 -d servidor-java/out @fontes
if ($LASTEXITCODE -ne 0) { throw 'Falha na compilação Java' }
java -cp servidor-java/out sentinela.servidor.Servidor
```

Porta padrão: 7000. Para escolher outra porta:

```powershell
java -cp servidor-java/out sentinela.servidor.Servidor 8080
```

O processo permanece aguardando conexões; use Ctrl+C para encerrar. Os `.class` ficam somente em `out/`, ignorado pelo Git, assim como `*.class`. Não compile diretamente dentro de `src/`.

## Pacotes

- `sentinela.servidor`: `Servidor`, `AceitadoraDeConexao` e `SupervisoraDeConexao`.
- `sentinela.protocolo`: `ProcessadorDeValidacao`.
- `sentinela.validacao`: `ValidadorTalhao`, com `public static List<String> validarTalhao(String nome, Double areaHa)`.

O protocolo continua sendo UTF-8 por linha: `VALIDAR_TALHAO<TAB>nome<TAB>areaHa`. TAB é o caractere real de tabulação; campos não podem conter TAB, CR ou LF. As respostas são `OK` ou `ERRO<TAB>mensagem1<TAB>mensagem2`. Cada conexão aceita múltiplos pedidos e é atendida por sua própria thread.

Com o Java iniciado, teste o cliente Node em outro terminal, na raiz:

```powershell
npm --prefix backend run test:java:real
```

O harness `npm --prefix backend run test:talhoes:real -- --executar` compila os fontes recursivamente em um subdiretório exclusivo de `servidor-java/out/`, executa `sentinela.servidor.Servidor` com esse classpath e remove apenas sua compilação ao terminar. Seus pré-requisitos de autenticação, banco, segurança e limpeza estão em `backend/README.md`.

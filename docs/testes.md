# Testes do projeto

## Estratégia

O projeto possui testes em três camadas:

| Camada | Local | Objetivo |
|---|---|---|
| Flutter | `test/` | Navegação, máscaras, cadastro, questionário e comportamento de widgets. |
| Backend | `backend/tests/` | Schemas, rotas, serviços e integração com validações Java. |
| Java | `servidor-java/src/test/java/` | Regras de domínio e protocolo de validação. |

## Comandos principais

### Flutter

```powershell
flutter test
```

### Backend

```powershell
npm ci --prefix backend
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:talhoes
npm --prefix backend run test:propriedades
```

Testes que dependem do servidor Java exigem o serviço ativo:

```powershell
npm --prefix backend run test:java:real
npm --prefix backend run test:plantacoes:java
npm --prefix backend run test:ocorrencias:java
npm --prefix backend run test:monitoramentos:java
npm --prefix backend run test:tratamentos:java
npm --prefix backend run test:avaliacoes:java
```

### Java

```powershell
$fontes = Get-ChildItem servidor-java/src/main/java -Recurse -Filter '*.java' | ForEach-Object FullName
New-Item -ItemType Directory -Path servidor-java/out -Force | Out-Null
javac -encoding UTF-8 -d servidor-java/out $fontes
$testes = Get-ChildItem servidor-java/src/test/java -Recurse -Filter '*.java' | ForEach-Object FullName
javac -encoding UTF-8 -cp servidor-java/out -d servidor-java/out/testes $testes
java -cp 'servidor-java/out;servidor-java/out/testes' sentinela.validacao.ValidadorTalhaoTest
```

## Interpretação das evidências

- Testes unitários e isolados não comprovam o fluxo visual completo no aplicativo.
- Testes com Java real comprovam a comunicação Node → Java, mas não substituem uma demonstração com Flutter, Firebase e MongoDB configurados.
- Testes que criam dados no MongoDB devem usar apenas ambiente autorizado e dados sintéticos.
- O roteiro de demonstração de talhões está em [demonstracao-talhoes.md](demonstracao-talhoes.md).

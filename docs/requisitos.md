# Requisitos do Sentinela

## Objetivo

Apoiar pequenos produtores rurais no registro e acompanhamento de propriedades, áreas de cultivo, ocorrências de pragas e doenças, tratamentos e informações agrícolas.

## Perfis envolvidos

| Perfil | Necessidade principal |
|---|---|
| Produtor rural | Organizar seus cultivos e registrar problemas observados. |
| Equipe do projeto | Manter catálogo, regras de validação e dados de demonstração. |
| Moderador da comunidade | Analisar denúncias de experiências compartilhadas (fluxo ainda parcial). |

## Requisitos funcionais

| ID | Requisito | Situação observada |
|---|---|---|
| RF01 | Permitir criar conta e autenticar usuário. | Firebase Authentication integrado. |
| RF02 | Registrar perfil, aceite dos termos e questionário inicial. | API disponível; integração visual deve ser validada conforme o fluxo. |
| RF03 | Consultar culturas e problemas agrícolas do catálogo. | Rotas de culturas e problemas disponíveis. |
| RF04 | Criar, listar, consultar, alterar e excluir propriedades do usuário autenticado. | API disponível. |
| RF05 | Criar e listar talhões de uma propriedade autorizada. | API disponível. |
| RF06 | Criar e listar plantações por talhão. | API disponível. |
| RF07 | Criar e listar ocorrências por plantação. | API disponível. |
| RF08 | Registrar e consultar monitoramentos de uma plantação. | API disponível. |
| RF09 | Registrar tratamentos e avaliações de tratamento de uma ocorrência. | API disponível. |
| RF10 | Consultar experiências aprovadas da comunidade e registrar denúncia. | Consulta e denúncia disponíveis; publicação e moderação não estão concluídas. |
| RF11 | Exibir informações de perfil, notificações e privacidade. | Telas existem; preferências ainda não possuem persistência completa. |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | O aplicativo deve ser desenvolvido em Flutter e executar nas plataformas suportadas pelo projeto. |
| RNF02 | A autenticação deve usar tokens do Firebase Authentication; credenciais não são enviadas à API própria. |
| RNF03 | A API deve validar entradas, autorização e regras de negócio antes da persistência. |
| RNF04 | Os dados devem ser persistidos no MongoDB com coleções, validadores e índices definidos na documentação BD3/BD4. |
| RNF05 | Regras de domínio selecionadas devem ser validadas pelo serviço Java via TCP. |
| RNF06 | Operações de criação sensíveis devem usar transações e, quando aplicável, chave de idempotência. |
| RNF07 | O sistema não deve versionar credenciais, tokens ou URI de banco de dados. |
| RNF08 | Os textos de erro devem ser compreensíveis ao usuário e não expor dados sensíveis. |

## Fora do escopo atual

- Geolocalização de propriedades.
- Entrega de imagens públicas autenticada e revogável.
- Publicação e moderação completas na comunidade.
- Persistência de preferências de notificações e privacidade.
- Notificações push, SMS ou e-mail disparadas pela aplicação.

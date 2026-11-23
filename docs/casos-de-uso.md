# Casos de uso principais

## UC01 — Autenticar-se

**Ator:** produtor rural.

1. O usuário informa e-mail e senha na tela de login.
2. O Flutter solicita a autenticação ao Firebase Authentication.
3. Após sucesso, o aplicativo direciona o usuário ao destino autenticado.

**Exceções:** credenciais inválidas, sessão expirada ou perfil ausente devem gerar orientação para nova autenticação ou conclusão do cadastro.

## UC02 — Concluir cadastro e questionário

**Ator:** novo produtor.

1. O usuário informa dados pessoais, contato, senha e aceite dos termos.
2. O Firebase cria a credencial.
3. A API recebe o perfil autenticado e aplica validações antes de gravar.
4. O usuário responde ao questionário inicial.
5. A API associa as respostas ao perfil do usuário.

## UC03 — Gerenciar propriedades e talhões

**Ator:** produtor autenticado.

1. O usuário cadastra uma propriedade com nome, município, UF, área e observações opcionais.
2. A API verifica a posse do perfil e as regras de validação.
3. O usuário consulta ou altera as propriedades sob sua responsabilidade.
4. Para cada propriedade, pode criar e listar talhões.
5. A API impede que um usuário opere registros que não pertencem a ele.

## UC04 — Registrar plantação

**Ator:** produtor autenticado.

1. O usuário escolhe um talhão autorizado e uma cultura do catálogo.
2. Informa dados da plantação, como data de plantio, área e situação.
3. A API valida a compatibilidade da área e persiste a plantação.
4. O usuário pode consultar as plantações do talhão.

## UC05 — Registrar ocorrência e monitoramento

**Ator:** produtor autenticado.

1. O usuário seleciona uma plantação ativa.
2. Registra a ocorrência com data, tipo, sintomas, intensidade, área e situação.
3. A API valida o vínculo, as regras de domínio e cria um alerta quando aplicável.
4. Em acompanhamento posterior, o usuário registra um monitoramento vinculado ou não a uma ocorrência.

## UC06 — Registrar tratamento e avaliação

**Ator:** produtor autenticado.

1. O usuário seleciona uma ocorrência aberta ou em acompanhamento.
2. Registra uma medida de tratamento e sua data de aplicação.
3. A API confere a situação da plantação e da ocorrência antes de persistir.
4. Posteriormente, o usuário registra uma avaliação do resultado; ela não pode anteceder a aplicação.

## UC07 — Consultar comunidade e denunciar conteúdo

**Ator:** visitante autenticado ou usuário da comunidade.

1. O usuário consulta experiências aprovadas e pode filtrar por cultura ou problema.
2. Ao identificar conteúdo inadequado, envia uma denúncia com motivo e descrição opcional.
3. A API valida e grava a denúncia como pendente.

**Limite atual:** a publicação de experiências, adoção de métodos e moderação não estão completos.

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "ERRO_APLICACAO",
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(404, message, "NAO_ENCONTRADO");
  }
}

export class ValidacaoTalhaoError extends AppError {
  constructor(public readonly erros: string[]) {
    super(400, "Dados inválidos", "ENTRADA_INVALIDA");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(401, message, "NAO_AUTENTICADO");
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor() {
    super(503, "Banco de dados temporariamente indisponível", "BANCO_INDISPONIVEL");
  }
}

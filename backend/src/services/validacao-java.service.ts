import { Socket } from "node:net";
import { configuracaoJava } from "../config/java";
import { AppError } from "../shared/errors";

export interface ResultadoValidacaoTalhao {
  valido: boolean;
  erros: string[];
}

export class JavaIndisponivelError extends AppError {
  constructor() {
    super(503, "Serviço de validação Java indisponível", "JAVA_INDISPONIVEL");
  }
}

export async function validarTalhaoNoJava(
  nome?: string | null,
  areaHa?: number | string | null,
): Promise<ResultadoValidacaoTalhao> {
  const campos = [nome ?? "", areaHa == null ? "" : String(areaHa)];
  // O protocolo não possui escape para delimitadores dentro dos campos.
  if (campos.some(campo => /[\t\r\n]/.test(campo))) {
    throw new AppError(400, "Os campos não podem conter TAB, CR ou LF.", "CAMPO_INCOMPATIVEL_COM_PROTOCOLO");
  }
  const pedido = `VALIDAR_TALHAO\t${campos.join("\t")}\n`;

  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let concluido = false;
    let resposta = Buffer.alloc(0);
    // Um único prazo cobre conexão e recebimento, sem reiniciar com os dados.
    const timer = setTimeout(() => finalizar(new JavaIndisponivelError()), 3000);

    function finalizar(erro?: JavaIndisponivelError, resultado?: ResultadoValidacaoTalhao) {
      if (concluido) return;
      concluido = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      if (erro) reject(erro);
      else resolve(resultado!);
    }

    socket.on("error", () => finalizar(new JavaIndisponivelError()));
    socket.on("end", () => finalizar(new JavaIndisponivelError()));
    socket.on("close", () => finalizar(new JavaIndisponivelError()));
    socket.on("data", (dados: Buffer) => {
      const quebra = dados.indexOf(10);
      const trecho = quebra < 0 ? dados : dados.subarray(0, quebra + 1);
      // O limite de 64 KiB inclui o terminador da linha.
      if (resposta.length + trecho.length > 64 * 1024) {
        finalizar(new JavaIndisponivelError());
        return;
      }
      resposta = Buffer.concat([resposta, trecho]);
      if (quebra < 0) return;

      try {
        const linha = new TextDecoder("utf-8", { fatal: true })
          .decode(resposta.subarray(0, -1)).replace(/\r$/, "");
        if (linha === "OK") {
          finalizar(undefined, { valido: true, erros: [] });
          return;
        }
        const partes = linha.split("\t");
        if (partes[0] !== "ERRO" || partes.length < 2 ||
            partes.slice(1).some(erro => !erro.trim() || /[\r\n]/.test(erro))) {
          throw new Error("RESPOSTA_INVALIDA");
        }
        finalizar(undefined, { valido: false, erros: partes.slice(1) });
      } catch {
        finalizar(new JavaIndisponivelError());
      }
    });

    try {
      socket.connect(configuracaoJava(), () => socket.write(pedido, "utf8"));
    } catch {
      finalizar(new JavaIndisponivelError());
    }
  });
}

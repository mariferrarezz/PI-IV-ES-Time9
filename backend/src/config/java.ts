import dotenv from "dotenv";
import path from "node:path";

// Carregue somente a configuração necessária ao cliente Java.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export function configuracaoJava() {
  const host = process.env.JAVA_HOST ?? "localhost";
  const port = Number(process.env.JAVA_PORT ?? 7000);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("CONFIGURACAO_JAVA_INVALIDA");
  }
  return { host, port };
}

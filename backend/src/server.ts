//Inicia o servidor
import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";

async function main() {
  await connectDatabase();
  const servidor = app.listen(env.port, () => {
    console.log(JSON.stringify({ codigo: "API_INICIADA", porta: env.port }));
  });
  let encerrando = false;
  async function encerrar() {
    if (encerrando) return;
    encerrando = true;
    // Recusa novas requisições, termina as atuais e depois libera o pool.
    const limite = setTimeout(() => servidor.closeAllConnections(), 10000);
    limite.unref();
    try {
      await new Promise<void>((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
    } catch { process.exitCode = 1; console.error('{"codigo":"FALHA_ENCERRAMENTO"}'); }
    finally {
      clearTimeout(limite);
      try { await disconnectDatabase(); }
      catch { process.exitCode = 1; console.error('{"codigo":"FALHA_ENCERRAMENTO_BANCO"}'); }
    }
  }
  process.once("SIGINT", encerrar);
  process.once("SIGTERM", encerrar);
  servidor.on("error", () => {
    console.error('{"codigo":"FALHA_SERVIDOR_HTTP"}');
    process.exitCode = 1;
    void encerrar();
  });
}

main().catch(async () => {
  console.error('{"codigo":"FALHA_INICIALIZACAO"}');
  try { await disconnectDatabase(); } catch { /* Nenhum erro bruto do driver. */ }
  process.exitCode = 1;
});

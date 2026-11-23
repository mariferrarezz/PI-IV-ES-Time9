import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:net";
import { execFile, spawn, ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

// Cada teste controla somente seu processo, porta e diretório de compilação.
export async function comJavaLocal(acao: (pasta: string) => Promise<void>) {
  const saida = path.resolve(__dirname, "../../servidor-java/out");
  await fs.mkdir(saida, { recursive: true });
  const pasta = await fs.mkdtemp(path.join(saida, "tratamentos-teste-"));
  const host = process.env.JAVA_HOST, port = process.env.JAVA_PORT;
  let java: ChildProcess | undefined;
  try {
    const arquivos: string[] = [];
    for (const relativo of ["src/main/java", "src/test/java"]) {
      const raiz = path.resolve(__dirname, "../../servidor-java", relativo);
      arquivos.push(...(await fs.readdir(raiz, { recursive: true })).filter(p => p.endsWith(".java")).map(p => path.join(raiz, p)));
    }
    await promisify(execFile)("javac", ["-encoding", "UTF-8", "-d", pasta, ...arquivos], { timeout: 25000, windowsHide: true });
    const reserva = createServer(); reserva.listen(0, "127.0.0.1"); await once(reserva, "listening");
    const porta = (reserva.address() as { port: number }).port;
    await new Promise<void>(r => reserva.close(() => r()));
    java = spawn("java", ["-cp", pasta, "sentinela.servidor.Servidor", String(porta)], { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    await new Promise<void>((resolve, reject) => {
      let texto = "";
      const timer = setTimeout(() => reject(Error("JAVA_TIMEOUT")), 10000);
      java!.once("error", e => { clearTimeout(timer); reject(e); });
      java!.once("exit", () => { clearTimeout(timer); reject(Error("JAVA_ENCERROU")); });
      java!.stdout!.on("data", b => {
        texto = (texto + b.toString()).slice(-2048);
        if (texto.includes("Servidor aguardando")) { clearTimeout(timer); resolve(); }
      });
    });
    process.env.JAVA_HOST = "127.0.0.1"; process.env.JAVA_PORT = String(porta);
    await acao(pasta);
  } finally {
    if (java?.pid && java.exitCode === null) { const fim = once(java, "exit"); java.kill(); await fim; }
    if (host === undefined) delete process.env.JAVA_HOST; else process.env.JAVA_HOST = host;
    if (port === undefined) delete process.env.JAVA_PORT; else process.env.JAVA_PORT = port;
    assert.equal(path.dirname(pasta), saida); assert(path.basename(pasta).startsWith("tratamentos-teste-"));
    await fs.rm(pasta, { recursive: true, force: true });
  }
}

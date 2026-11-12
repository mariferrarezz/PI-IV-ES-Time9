import test from "node:test";
import assert from "node:assert/strict";
import { createServer, Socket } from "node:net";
import { once } from "node:events";
import { validarTalhaoNoJava, JavaIndisponivelError } from "../src/services/validacao-java.service";

test("Cliente Java isolado", async t => {
  const hostAnterior = process.env.JAVA_HOST;
  const portaAnterior = process.env.JAVA_PORT;
  process.env.JAVA_HOST = "127.0.0.1";

  async function comServidor(atender: (socket: Socket) => void, executar: () => Promise<void>) {
    const sockets = new Set<Socket>();
    const servidor = createServer(socket => {
      sockets.add(socket);
      socket.on("error", () => {});
      socket.on("close", () => sockets.delete(socket));
      atender(socket);
    });
    servidor.listen(0, "127.0.0.1");
    await once(servidor, "listening");
    process.env.JAVA_PORT = String((servidor.address() as { port: number }).port);
    try {
      await executar();
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
    }
  }

  try {
    await t.test("campos vazios e resultados tipados", async () => {
      const pedidos: string[] = [];
      const respostas = ["OK\n", "ERRO\tNome obrigatório\tÁrea inválida\n", "ERRO\tÁrea obrigatória\n"];
      await comServidor(socket => {
        let pedido = "";
        socket.setEncoding("utf8");
        socket.on("data", dados => {
          pedido += dados;
          if (pedido.endsWith("\n")) {
            pedidos.push(pedido);
            socket.end(respostas[pedidos.length - 1]);
          }
        });
      }, async () => {
        assert.deepEqual(await validarTalhaoNoJava("Talhão Norte", 2.5), { valido: true, erros: [] });
        assert.deepEqual(await validarTalhaoNoJava("", 0), { valido: false, erros: ["Nome obrigatório", "Área inválida"] });
        assert.deepEqual(await validarTalhaoNoJava(null), { valido: false, erros: ["Área obrigatória"] });
      });
      assert.deepEqual(pedidos, ["VALIDAR_TALHAO\tTalhão Norte\t2.5\n", "VALIDAR_TALHAO\t\t0\n", "VALIDAR_TALHAO\t\t\n"]);
    });

    await t.test("fragmentação inclusive dentro de caractere UTF-8", async () => {
      await comServidor(socket => {
        socket.once("data", () => {
          const bytes = Buffer.from("ERRO\tÁrea inválida\r\n");
          socket.write(bytes.subarray(0, 6));
          setTimeout(() => socket.end(bytes.subarray(6)), 30);
        });
      }, async () => {
        assert.deepEqual(await validarTalhaoNoJava("Norte", 0), { valido: false, erros: ["Área inválida"] });
      });
    });

    for (const resposta of ["ECO\n", "ERRO\n", "ERRO\t\n", "OK\tindevido\n", "OK\rindevido\n", "x".repeat(65536) + "\n"]) {
      await t.test(`resposta inválida (${resposta.length} bytes/caracteres)`, async () => {
        await comServidor(socket => socket.once("data", () => socket.end(resposta)), async () => {
          await assert.rejects(validarTalhaoNoJava("Norte", 1), JavaIndisponivelError);
        });
      });
    }
    await t.test("fechamento antes da linha completa", async () => {
      await comServidor(socket => socket.once("data", () => socket.end("OK")), async () => {
        await assert.rejects(validarTalhaoNoJava("Norte", 1), JavaIndisponivelError);
      });
    });
    await t.test("timeout total mesmo recebendo fragmentos", async () => {
      await comServidor(socket => {
        const timer = setInterval(() => socket.write("O"), 100);
        socket.on("close", () => clearInterval(timer));
      }, async () => {
        const inicio = Date.now();
        await assert.rejects(validarTalhaoNoJava("Norte", 1), JavaIndisponivelError);
        assert(Date.now() - inicio >= 2900);
        assert(Date.now() - inicio < 5000);
      });
    });
    await t.test("conexão recusada", async () => {
      await comServidor(() => {}, async () => {});
      await assert.rejects(validarTalhaoNoJava("Norte", 1), JavaIndisponivelError);
    });
    await t.test("delimitadores rejeitados antes da conexão", async () => {
      for (const separador of ["\t", "\r", "\n"]) {
        await assert.rejects(validarTalhaoNoJava(`Norte${separador}`, 1), { code: "CAMPO_INCOMPATIVEL_COM_PROTOCOLO" });
        await assert.rejects(validarTalhaoNoJava("Norte", `1${separador}`), { code: "CAMPO_INCOMPATIVEL_COM_PROTOCOLO" });
      }
    });
  } finally {
    if (hostAnterior === undefined) delete process.env.JAVA_HOST;
    else process.env.JAVA_HOST = hostAnterior;
    if (portaAnterior === undefined) delete process.env.JAVA_PORT;
    else process.env.JAVA_PORT = portaAnterior;
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { createConnection, Socket } from "node:net";
import { once } from "node:events";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { comJavaLocal } from "./java-teste-local";
import { configuracaoJava } from "../src/config/java";
import { validarFonteConhecimentoNoJava, validarCulturaNoJava } from "../src/services/validacao-java.service";
import { montarExperienciaComunidade } from "../src/shared/protocolo-comunidade";

async function conectar(): Promise<Socket> {
  const socket = createConnection(configuracaoJava());
  try { await once(socket, "connect"); return socket; }
  catch (erro) { socket.destroy(); throw erro; }
}

async function resposta(socket: Socket, pedido: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let recebido = "";
    const timer = setTimeout(() => terminar(Error("TIMEOUT")), 3000);
    function terminar(erro?: Error, linha?: string) {
      clearTimeout(timer); socket.off("data", dados); socket.off("error", falha); socket.off("end", fim);
      if (erro) reject(erro); else resolve(linha!);
    }
    function dados(buffer: Buffer) {
      recebido += buffer.toString("utf8");
      if (recebido.includes("\n")) terminar(undefined, recebido.split("\n")[0].replace(/\r$/, ""));
    }
    function falha(erro: Error) { terminar(erro); }
    function fim() { terminar(Error("CONEXAO_ENCERRADA")); }
    socket.on("data", dados); socket.on("error", falha); socket.on("end", fim);
    socket.write(pedido);
  });
}

test("Servidor Java: prefixos, UTF-8 estrito, isolamento e códigos de saída", async () => {
  await comJavaLocal(async pasta => {
    const ref = new Date("2026-11-17T12:00:00Z");
    for (const esquema of ["http", "https", "HTTP", "HTTPS", "hTtPs"]) {
      const url = `${esquema}://example.com/a`;
      assert.equal((await validarFonteConhecimentoNoJava({ titulo: "Fonte", instituicaoOuAutor: "Autor", url, acessadoEm: ref }, ref)).valido,
        esquema === "http" || esquema === "https");
      assert.equal((await validarCulturaNoJava({ nome: "Milho", ativa: true,
        imagem: { url, publicId: " original ", enviadaEm: ref } })).valido, esquema === "https");
      const socket = await conectar();
      try {
        const pedido = montarExperienciaComunidade({ nomePublico: "Pessoa", culturaNome: "Milho", tipoProblema: "praga",
          statusOcorrencia: "aberta", titulo: "Título", relato: "Relato", fotos: [{ url, publicId: " original " }] },
        { problemaAgricolaPresente: false, tratamentoOrigemPresente: false, avaliacaoOrigemPresente: false,
          versao: 1n, moderacao: { status: "pendente", revisorPresente: false }, criadoEm: ref, atualizadoEm: ref }, ref);
        assert.equal((await resposta(socket, pedido)) === "OK", esquema === "https");
      } finally { socket.destroy(); }
    }

    const saudavel = await conectar();
    try {
      // Não processe bytes inválidos, mesmo com um pedido válido logo depois.
      for (const bytes of [[0xc3, 0x28], [0x80], [0xc0, 0xaf], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xe2, 0x82]]) {
        const corrompido = await conectar();
        try {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => { corrompido.destroy(); reject(Error("CONEXAO_INVALIDA_NAO_ENCERROU")); }, 3000);
            let tamanho = 0;
            corrompido.on("data", b => { tamanho += b.length; });
            // Um reset também é fechamento válido da conexão corrompida.
            corrompido.on("error", () => {});
            corrompido.once("close", () => { clearTimeout(timer); try { assert.equal(tamanho, 0); resolve(); } catch (e) { reject(e); } });
            const prefixo = Buffer.concat([Buffer.from("VALIDAR_TALHAO\t"), Buffer.from(bytes)]);
            if (bytes.length === 2 && bytes[0] === 0xe2) corrompido.end(prefixo);
            else corrompido.write(Buffer.concat([prefixo, Buffer.from("\t1\nVALIDAR_TALHAO\tNorte\t1\n")]));
          });
        } finally { corrompido.destroy(); }
        assert.equal(await resposta(saudavel, "VALIDAR_TALHAO\tNorte\t1\n"), "OK");
      }
      // Fragmentação de UTF-8 válido não é corrupção.
      const leitura = resposta(saudavel, "VALIDAR_TALHAO\t");
      saudavel.write(Buffer.from([0xc3]));
      await new Promise(resolve => setTimeout(resolve, 20));
      saudavel.write(Buffer.from([0xa1]));
      saudavel.write("\t1\n");
      assert.equal(await leitura, "OK");
      const novo = await conectar();
      try { assert.equal(await resposta(novo, "VALIDAR_TALHAO\tNovo\t1\n"), "OK"); }
      finally { novo.destroy(); }
    } finally { saudavel.destroy(); }

    for (const [args, mensagem] of [
      [["abc"], "inteiro"], [["0"], "65535"], [["65536"], "65535"],
      [["7000", "extra"], "Uso esperado"], [[process.env.JAVA_PORT!], "abrir a porta"],
    ] as Array<[string[], string]>) {
      await assert.rejects(promisify(execFile)("java", ["-cp", pasta, "sentinela.servidor.Servidor", ...args],
        { timeout: 5000, windowsHide: true }), (erro: unknown) => {
          assert(erro instanceof Error);
          assert("code" in erro && typeof erro.code === "number" && erro.code !== 0);
          assert("stdout" in erro && "stderr" in erro);
          assert((String(erro.stdout) + String(erro.stderr)).includes(mensagem));
          return true;
        });
    }
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { createConnection } from "node:net";
import { configuracaoJava } from "../src/config/java";
import { validarPropriedadeNoJava } from "../src/services/validacao-java.service";
import { codificarCampoProtocolo } from "../src/shared/codec-validacao";

// Somente Java real e TCP local; não importa Express, Firebase ou MongoDB.
test("Propriedade: regras de campo pelo Java real", async t => {
  const N = "O nome da propriedade é obrigatório.";
  const NL = "O nome da propriedade deve ter no máximo 150 caracteres.";
  const M = "O município é obrigatório.";
  const ML = "O município deve ter no máximo 150 caracteres.";
  const E = "O estado é obrigatório.";
  const UF = "O estado deve ser uma UF brasileira válida em maiúsculas.";
  const A = "A área total deve ser um número finito maior que zero.";
  const O = "As observações não podem ficar vazias quando informadas.";
  const OL = "As observações devem ter no máximo 5000 caracteres.";
  type Entrada = Parameters<typeof validarPropriedadeNoJava>;
  const casos: Array<{ nome: string; entrada: Entrada; erros: string[] }> = [
    { nome: "válido, opcionais ausentes", entrada: ["Fazenda 2 – Norte!", "São Paulo", "SP"], erros: [] },
    { nome: "erros simultâneos", entrada: ["", "", "", 0, ""], erros: [N, M, E, A, O] },
    { nome: "somente espaços, sem erros adicionais de tamanho", entrada: [" ".repeat(151), "\u2003".repeat(151), "SP", null, "\u00a0".repeat(5001)], erros: [N, M, O] },
    { nome: "limites ASCII", entrada: ["a".repeat(150), "b".repeat(150), "SP", null, "c".repeat(5000)], erros: [] },
    { nome: "acima dos limites ASCII", entrada: ["a".repeat(151), "b".repeat(151), "SP", null, "c".repeat(5001)], erros: [NL, ML, OL] },
    { nome: "limites Unicode fora do BMP", entrada: ["🌱".repeat(150), "🌱".repeat(150), "SP", 1, "🌱".repeat(5000)], erros: [] },
    { nome: "acima dos limites Unicode", entrada: ["🌱".repeat(151), "🌱".repeat(151), "SP", 1, "🌱".repeat(5001)], erros: [NL, ML, OL] },
    { nome: "acentos combinantes sem normalização", entrada: ["e\u0301".repeat(75), "e\u0301".repeat(75), "SP", 1, "e\u0301".repeat(2500)], erros: [] },
    { nome: "observações presentes vazias", entrada: ["Nome", "Cidade", "SP", null, ""], erros: [O] },
    { nome: "área zero", entrada: ["Nome", "Cidade", "SP", 0], erros: [A] },
    { nome: "área negativa", entrada: ["Nome", "Cidade", "SP", -1], erros: [A] },
    { nome: "área NaN", entrada: ["Nome", "Cidade", "SP", NaN], erros: [A] },
    { nome: "área infinita", entrada: ["Nome", "Cidade", "SP", Infinity], erros: [A] },
    { nome: "área infinita negativa", entrada: ["Nome", "Cidade", "SP", -Infinity], erros: [A] },
    { nome: "área não numérica", entrada: ["Nome", "Cidade", "SP", "abc"], erros: ["A área total deve ser numérica."] },
    { nome: "sem teto de área", entrada: ["Nome", "Cidade", "SP", Number.MAX_VALUE], erros: [] },
    { nome: "sem limite de casas decimais", entrada: ["Nome", "Cidade", "SP", 0.000000001], erros: [] },
    { nome: "delimitadores reais e sequências literais", entrada: ["N\\n\tA", "C\r\nD", "SP", 1, "Obs\\t\t\r\nFim\\"], erros: [] },
    { nome: "sequência literal não vira quebra", entrada: ["\\n", "\\t", "SP", null, "\\r"], erros: [] },
    { nome: "quebra e TAB decodificados são espaços", entrada: ["\n", "\t", "SP", null, "\r"], erros: [N, M, O] },
  ];
  for (const uf of ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]) {
    casos.push({ nome: `UF ${uf}`, entrada: ["Nome", "Cidade", uf], erros: [] });
  }
  for (const uf of ["sp", " SP ", "XX", "S", "São Paulo", " "]) {
    casos.push({ nome: `UF inválida ${JSON.stringify(uf)}`, entrada: ["Nome", "Cidade", uf], erros: [UF] });
  }
  for (const { nome, entrada, erros } of casos) {
    await t.test(nome, async () => {
      assert.deepEqual(await validarPropriedadeNoJava(...entrada), { valido: erros.length === 0, erros });
    });
  }
});

test("Protocolo: malformados, escapes e compatibilidade na mesma conexão", async () => {
  const propriedade = (campos: string[]) => "VALIDAR_PROPRIEDADE\t" + campos.map(codificarCampoProtocolo).join("\t");
  const invalido = "ERRO\tPedido de validação inválido.";
  const pedidos = [
    "VALIDAR_PROPRIEDADE", "VALIDAR_PROPRIEDADE\tN\tC\tSP\t1\t0", "VALIDAR_PROPRIEDADE\tN\tC\tSP\t1\t0\t\t",
    "VALIDAR_PROPRIEDADE\tN\\x\tC\tSP\t1\t0\t", "VALIDAR_PROPRIEDADE\tN\\\tC\tSP\t1\t0\t",
    propriedade(["N", "C", "SP", "1", "0", "indevido"]), propriedade(["N", "C", "SP", "1", "2", ""]),
    "OUTRO\tN\tC\tSP\t1\t0\t", "VALIDAR_TALHAO\tNome\\q\t2",
    propriedade(["Nome", "Cidade", "SP", "", "1", ""]), propriedade(["Nome", "Cidade", "SP", "", "0", ""]),
  ];
  const esperado = [...Array(8).fill(invalido), "OK", "ERRO\tAs observações não podem ficar vazias quando informadas.", "OK"];
  const respostas = await new Promise<string[]>((resolve, reject) => {
    const socket = createConnection(configuracaoJava());
    let recebido = "", terminou = false;
    const timer = setTimeout(() => finalizar(new Error("TIMEOUT_TESTE")), 3000);
    function finalizar(erro?: Error, linhas?: string[]) {
      if (terminou) return; terminou = true;
      clearTimeout(timer); socket.destroy();
      if (erro) reject(erro); else resolve(linhas!);
    }
    socket.setEncoding("utf8");
    socket.on("connect", () => socket.write(pedidos.join("\n") + "\n"));
    socket.on("error", erro => finalizar(erro));
    socket.on("data", trecho => {
      recebido += trecho;
      const linhas = recebido.split(/\r?\n/);
      if (linhas.length > pedidos.length) finalizar(undefined, linhas.slice(0, pedidos.length));
    });
  });
  assert.deepEqual(respostas, esperado);
});

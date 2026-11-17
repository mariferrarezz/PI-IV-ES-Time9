import test from "node:test";
import assert from "node:assert/strict";
import { validarTalhaoNoJava } from "../src/services/validacao-java.service";

// Execute somente com o servidor Java iniciado, sem Express ou banco.
test("Java real: válido, dois erros e área ausente", async () => {
  assert.deepEqual(await validarTalhaoNoJava("Talhão Norte", 2.5), { valido: true, erros: [] });
  assert.deepEqual(await validarTalhaoNoJava("", 0), {
    valido: false,
    erros: ["O nome do talhão é obrigatório.", "A área do talhão deve ser um número finito maior que zero."],
  });
  assert.deepEqual(await validarTalhaoNoJava("Norte"), {
    valido: false, erros: ["A área do talhão é obrigatória."],
  });
});

test("Java real: nome original de 1–150 pontos de código Unicode", async t => {
  const obrigatorio = "O nome do talhão é obrigatório.";
  const limite = "O nome do talhão deve ter no máximo 150 caracteres.";
  const casos: Array<{ caso: string; nome: string | null; erros: string[] }> = [
    { caso: "nulo", nome: null, erros: [obrigatorio] },
    { caso: "vazio", nome: "", erros: [obrigatorio] },
    { caso: "somente espaços", nome: "   ", erros: [obrigatorio] },
    { caso: "espaços Unicode", nome: "\u00a0\u2003\uFEFF", erros: [obrigatorio] },
    { caso: "151 espaços: apenas obrigatoriedade", nome: " ".repeat(151), erros: [obrigatorio] },
    { caso: "1 caractere", nome: "A", erros: [] },
    { caso: "150 caracteres", nome: "a".repeat(150), erros: [] },
    { caso: "151 caracteres", nome: "a".repeat(151), erros: [limite] },
    { caso: "espaços externos preservados", nome: "  Talhão 2 – Norte!  ", erros: [] },
    { caso: "150 incluindo espaços externos", nome: " " + "a".repeat(148) + " ", erros: [] },
    { caso: "151 incluindo espaços externos", nome: " " + "a".repeat(149) + " ", erros: [limite] },
    { caso: "150 pontos fora do BMP, 300 unidades UTF-16", nome: "🌱".repeat(150), erros: [] },
    { caso: "151 pontos fora do BMP", nome: "🌱".repeat(151), erros: [limite] },
    { caso: "acentos combinantes sem normalização: 150 pontos", nome: "e\u0301".repeat(75), erros: [] },
    { caso: "acentos combinantes: 151 pontos", nome: "e\u0301".repeat(75) + "a", erros: [limite] },
  ];
  for (const { caso, nome, erros } of casos) {
    await t.test(caso, async () => {
      assert.deepEqual(await validarTalhaoNoJava(nome, 1), { valido: erros.length === 0, erros });
    });
  }
});

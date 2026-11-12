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

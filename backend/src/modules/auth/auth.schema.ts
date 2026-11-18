import { z } from "zod";

// DDDs válidos no Brasil (Anatel).
const DDDS_VALIDOS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

// Confere os dois dígitos verificadores e recusa sequências repetidas (ex.: 111.111.111-11).
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (quantidade: number) => {
    let soma = 0;
    for (let i = 0; i < quantidade; i++) soma += Number(cpf[i]) * (quantidade + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

// Aceita "(19) 99999-9999", "19999999999", "+55 19 99999-9999" etc.
// Devolve no formato do banco (+55DD9XXXXXXXX) ou null se não for celular brasileiro válido.
export function normalizarTelefone(valor: string): string | null {
  let digitos = somenteDigitos(valor);
  if (digitos.length === 13 && digitos.startsWith("55")) digitos = digitos.slice(2);
  if (digitos.length !== 11) return null;
  const ddd = digitos.slice(0, 2);
  if (!DDDS_VALIDOS.has(ddd) || digitos[2] !== "9") return null;
  return `+55${digitos}`;
}

export const cadastroSchema = z.object({
  nomeCompleto: z.string().trim()
    .refine(valor => /\S/u.test(valor) && [...valor].length >= 2 && [...valor].length <= 150),
  cpf: z.string().transform(somenteDigitos).refine(cpfValido),
  telefone: z.string().transform(normalizarTelefone)
    .refine((valor): valor is string => valor !== null),
  // Canal escolhido no passo "Como deseja receber códigos" do cadastro.
  canalCodigoPreferido: z.enum(["email", "sms"]),
  aceitouTermos: z.literal(true),
}).strict();

export type CadastroDto = z.infer<typeof cadastroSchema>;

// ---------- Questionário inicial ----------
// Valores conforme o validator de "usuarios" e a seção 4.2 das regras do banco.
const semRepetidos = (lista: string[]) => new Set(lista).size === lista.length;

export const questionarioSchema = z.object({
  portePropriedade: z.enum(["pequena", "media", "grande"]),
  quantidadeCulturas: z.enum(["1", "2", "3", "4_ou_mais"]),
  // Ids vindos de GET /culturas. Pode ficar vazio se a pessoa só informar outraCultura.
  culturasIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(50).refine(semRepetidos).default([]),
  // Texto da opção "Outro". Vazio ou só espaços conta como não informado.
  outraCultura: z.string().trim().refine(valor => [...valor].length <= 150)
    .transform(valor => (valor === "" ? undefined : valor)).optional(),
  // "nao_identificado" só sozinho; "pragas" e "doencas" podem vir juntos.
  problemasFrequentes: z.array(z.enum(["pragas", "doencas", "nao_identificado"])).min(1).max(2)
    .refine(semRepetidos)
    .refine(lista => !lista.includes("nao_identificado") || lista.length === 1),
  frequenciaProblemas: z.enum(["raramente", "as_vezes", "frequentemente", "sempre"]),
  identificaProblemasSozinho: z.enum(["sim", "nao", "as_vezes"]),
}).strict()
  // Pelo menos uma cultura do catálogo ou a outra cultura digitada.
  .refine(dados => dados.culturasIds.length > 0 || dados.outraCultura !== undefined, { path: ["culturasIds"] });

export type QuestionarioDto = z.infer<typeof questionarioSchema>;

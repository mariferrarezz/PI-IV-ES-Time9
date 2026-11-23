import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Types } from "mongoose";

// Somente dependências simuladas: nenhuma conexão com MongoDB ou Firebase.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-sentinela-home";
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarHomeService, nomeSaudacao } = require("../src/modules/home/home.service") as typeof import("../src/modules/home/home.service");
type HomeRepository = import("../src/modules/home/home.repository").HomeRepository;
type PropriedadeResumo = import("../src/modules/home/home.repository").PropriedadeResumo;

const dono = new Types.ObjectId();
const perfilBase = { _id: dono, firebaseUid: "uid-dono", nomeCompleto: "Maria da Silva" };

function repoSimulado(opcoes: { propriedade?: PropriedadeResumo | null; talhoes?: number; alertas?: number } = {}) {
  const chamadas: string[] = [];
  let agoraRecebido: Date | undefined;
  const repo: HomeRepository = {
    async propriedadeMaisRecente(usuarioId) {
      chamadas.push(`propriedade:${usuarioId}`);
      return opcoes.propriedade === undefined ? null : opcoes.propriedade;
    },
    async contarTalhoesAtivos(propriedadeId) {
      chamadas.push(`talhoes:${propriedadeId}`);
      return opcoes.talhoes ?? 0;
    },
    async contarAlertasAtivos(usuarioId, agora) {
      chamadas.push(`alertas:${usuarioId}`);
      agoraRecebido = agora;
      return opcoes.alertas ?? 0;
    },
  };
  return { repo, chamadas, agora: () => agoraRecebido };
}

async function iniciarApi(service: ReturnType<typeof criarHomeService>) {
  const servidor = criarApp({ home: service, bancoDisponivel: () => true,
    verificarToken: async token => { if (token !== "token-dono") throw new Error("token inválido"); return { uid: "uid-dono" }; } }).listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const porta = (servidor.address() as import("node:net").AddressInfo).port;
  const chamar = (token?: string) => fetch(`http://127.0.0.1:${porta}/home/resumo`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { chamar, fechar: () => { servidor.closeAllConnections(); return new Promise<void>(r => servidor.close(() => r())); } };
}

test("Saudação usa o nome público ou o primeiro nome do nome completo", () => {
  assert.equal(nomeSaudacao("Seu Zé da Roça", "Maria da Silva"), "Seu Zé da Roça");
  assert.equal(nomeSaudacao(null, "Maria da Silva"), "Maria");
  assert.equal(nomeSaudacao(undefined, "  João  Pereira "), "João");
  assert.equal(nomeSaudacao("   ", "Ana"), "Ana");
});

test("GET /home/resumo devolve nome, propriedade mais recente, talhões e alertas ativos", async () => {
  const propriedade = { _id: new Types.ObjectId(), nome: "Sítio Esperança", municipio: "Limeira", estado: "SP" };
  const { repo, chamadas, agora } = repoSimulado({ propriedade, talhoes: 3, alertas: 2 });
  const relogio = new Date("2026-11-23T12:00:00Z");
  const service = criarHomeService(repo, { async buscarPorFirebaseUid(uid) { return uid === "uid-dono" ? { ...perfilBase, nomePublico: "Seu Zé" } as never : null; } }, () => relogio);
  const api = await iniciarApi(service);
  try {
    const resposta = await api.chamar("token-dono");
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), {
      nome: "Seu Zé",
      propriedade: { id: String(propriedade._id), nome: "Sítio Esperança", municipio: "Limeira", estado: "SP" },
      talhoes: 3,
      alertasAtivos: 2,
    });
    // As consultas usam o usuário do token e a propriedade encontrada.
    assert.ok(chamadas.includes(`propriedade:${dono}`));
    assert.ok(chamadas.includes(`alertas:${dono}`));
    assert.ok(chamadas.includes(`talhoes:${propriedade._id}`));
    assert.equal(agora()?.toISOString(), relogio.toISOString());
  } finally { await api.fechar(); }
});

test("GET /home/resumo sem propriedade: propriedade null e zero talhões", async () => {
  const { repo, chamadas } = repoSimulado({ propriedade: null, alertas: 0 });
  const service = criarHomeService(repo, { async buscarPorFirebaseUid() { return perfilBase as never; } });
  const api = await iniciarApi(service);
  try {
    const resposta = await api.chamar("token-dono");
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), { nome: "Maria", propriedade: null, talhoes: 0, alertasAtivos: 0 });
    assert.ok(!chamadas.some(c => c.startsWith("talhoes:")));
  } finally { await api.fechar(); }
});

test("GET /home/resumo: 401 sem token e 404 sem perfil", async () => {
  const { repo, chamadas } = repoSimulado();
  const service = criarHomeService(repo, { async buscarPorFirebaseUid() { return null; } });
  const api = await iniciarApi(service);
  try {
    assert.equal((await api.chamar()).status, 401);
    const semPerfil = await api.chamar("token-dono");
    assert.equal(semPerfil.status, 404);
    assert.equal((await semPerfil.json()).codigo, "PERFIL_NAO_ENCONTRADO");
    assert.equal(chamadas.length, 0);
  } finally { await api.fechar(); }
});

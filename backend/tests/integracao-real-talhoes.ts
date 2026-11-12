import assert from "node:assert/strict";
import { execFile, spawn, ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import dotenv from "dotenv";
import type { Server } from "node:http";
import type { mongo } from "mongoose";
type Db = mongo.Db;
type ObjectId = mongo.ObjectId;

// Não importa a aplicação nem conecta serviços antes dos pré-requisitos.
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const nomes = ["Válido e persistido", "Nome vazio e área zero", "Java indisponível",
  "Sem token", "Propriedade de outro usuário", "Área insuficiente", "Concorrência sem excesso"];
const casos = nomes.map(nome => ({ nome, estado: "não executado", status: [] as number[] }));
const rodada = randomUUID();
const executar = process.argv.includes("--executar");
const preRequisitos: string[] = [];
if (process.argv.slice(2).some(arg => arg !== "--executar")) preRequisitos.push("ARGUMENTO_INVALIDO");
for (const chave of ["MONGODB_URI", "FIREBASE_PROJECT_ID", "BD8_TOKEN_A", "BD8_TOKEN_B"]) {
  if (!process.env[chave]) preRequisitos.push(`${chave}_AUSENTE`);
}
if (!/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "")) {
  preRequisitos.push("AUTH_EMULATOR_LOCAL_NAO_CONFIGURADO");
}

const propriedades: ObjectId[] = [];
const talhoes = new Map<string, ObjectId>();
let banco: Db | undefined;
let api: Server | undefined;
let java: ChildProcess | undefined;
let pastaJava: string | undefined;
let desconectar: (() => Promise<void>) | undefined;
let etapa = "pre_requisitos";
let aprovado = false, limpezaConfirmada = false, escritasIniciadas = false;
let incerteza = false;
const operacoes = new Set<Promise<unknown>>();
const concorrencia = { leiturasSobrepostas: 0, tentativasDeReserva: 0 };
let alvoConcorrente: string | undefined;
let liberarConcorrentes: (() => void) | undefined;
let timerConcorrencia: NodeJS.Timeout | undefined;
let barreira: Promise<void> | undefined;
const motivos = [...preRequisitos];
const interromper = new AbortController();
const aoSinal = () => interromper.abort();
process.once("SIGINT", aoSinal);
process.once("SIGTERM", aoSinal);

async function portaLivre() {
  const reserva = createServer();
  reserva.listen(0, "127.0.0.1");
  await once(reserva, "listening");
  const porta = (reserva.address() as { port: number }).port;
  await new Promise<void>((resolve, reject) => reserva.close(erro => erro ? reject(erro) : resolve()));
  return porta;
}

async function iniciarJava(porta: number) {
  const processo = spawn("java", ["-cp", pastaJava!, "sentinela.servidor.Servidor", String(porta)],
    { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
  java = processo;
  await new Promise<void>((resolve, reject) => {
    let texto = "";
    const timer = setTimeout(() => terminar(new Error("JAVA_NAO_INICIOU")), 10000);
    const falhar = () => terminar(new Error("JAVA_NAO_INICIOU"));
    const dados = (trecho: Buffer) => {
      texto += trecho.toString("utf8");
      if (texto.includes("Servidor aguardando")) terminar();
    };
    function terminar(erro?: Error) {
      clearTimeout(timer);
      processo.stdout!.off("data", dados);
      processo.off("error", falhar);
      processo.off("exit", falhar);
      if (erro) reject(erro); else resolve();
    }
    processo.stdout!.on("data", dados);
    processo.once("error", falhar);
    processo.once("exit", falhar);
  });
}

async function pararJava() {
  const processo = java;
  java = undefined;
  if (!processo?.pid || processo.exitCode !== null || processo.signalCode !== null) return;
  const terminou = once(processo, "exit");
  processo.kill();
  await terminou;
}

async function principal() {
  if (!executar || motivos.length) return;
  try {
    etapa = "autenticacao_real";
    // Confira disponibilidade do Emulator, sem criar ou modificar contas.
    await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/`, { signal: AbortSignal.timeout(3000) });
    const { firebaseAuth } = await import("../src/config/firebase");
    const tokens = [process.env.BD8_TOKEN_A!, process.env.BD8_TOKEN_B!];
    const uids = ["sentinela_bd6_v1_20261103_a", "sentinela_bd6_v1_20261103_b"];
    for (const [i, token] of tokens.entries()) {
      const claims = await firebaseAuth.verifyIdToken(token, true);
      assert.equal(claims.uid, uids[i]);
      assert.equal((await firebaseAuth.getUser(uids[i])).disabled, false);
    }

    etapa = "banco_e_perfis_de_teste";
    const db = await import("../src/config/database");
    desconectar = db.disconnectDatabase;
    await db.connectDatabase();
    const mongoose = (await import("mongoose")).default;
    banco = mongoose.connection.db!;
    assert.equal(banco.databaseName, "sentinela");
    const { ObjectId } = mongoose.mongo;
    const semente = JSON.parse(await fs.readFile(path.resolve(__dirname,
      "../../database/seed/documentos-sinteticos-bd6.json"), "utf8"));
    const perfis: ObjectId[] = [];
    for (const uid of uids) {
      const esperado = semente.usuarios.find((u: { firebaseUid: string }) => u.firebaseUid === uid);
      assert(esperado);
      const perfil = await banco.collection("usuarios").findOne({
        _id: new ObjectId(esperado._id.$oid), firebaseUid: uid,
      }, { maxTimeMS: 5000 });
      assert(perfil);
      perfis.push(perfil._id);
    }
    // Não criar coleções, validators ou índices para viabilizar a rodada.
    for (const nome of ["propriedades", "talhoes"]) {
      assert(await banco.listCollections({ name: nome }, { nameOnly: true }).hasNext());
    }

    etapa = "java_temporario";
    const saidaJava = path.resolve(__dirname, "../../servidor-java/out");
    await fs.mkdir(saidaJava, { recursive: true });
    pastaJava = await fs.mkdtemp(path.join(saidaJava, "integracao-"));
    const fontes = path.resolve(__dirname, "../../servidor-java/src/main/java");
    const arquivos = (await fs.readdir(fontes, { recursive: true })).filter(nome => nome.endsWith(".java"));
    await promisify(execFile)("javac", ["-encoding", "UTF-8", "-d", pastaJava,
      ...arquivos.map(nome => path.join(fontes, nome))], { windowsHide: true, timeout: 15000 });
    const portaJava = await portaLivre();
    await iniciarJava(portaJava);
    process.env.JAVA_HOST = "127.0.0.1";
    process.env.JAVA_PORT = String(portaJava);

    etapa = "http_temporario";
    const { criarApp } = await import("../src/app");
    const { criarTalhoesService } = await import("../src/modules/talhoes/talhoes.service");
    const { talhoesRepository } = await import("../src/modules/talhoes/talhoes.repository");
    const { PropriedadeModel } = await import("../src/modules/propriedades/propriedades.model");
    const talhoesService = criarTalhoesService({
      ...talhoesRepository,
      async reservarPropriedade(id, usuarioId, session) {
        if (String(id) === alvoConcorrente) {
          concorrencia.tentativasDeReserva++;
          if (concorrencia.leiturasSobrepostas < 2) {
            // Leitura real estabelece o snapshot antes de liberar ambas as escritas.
            assert(await PropriedadeModel.findOne({ _id: id, usuarioId }, null, { session }).lean().exec());
            concorrencia.leiturasSobrepostas++;
            if (concorrencia.leiturasSobrepostas === 2) {
              clearTimeout(timerConcorrencia);
              liberarConcorrentes!();
            }
            await barreira;
          }
        }
        return talhoesRepository.reservarPropriedade(id, usuarioId, session);
      },
    });
    // Todas as dependências são reais; a API escuta somente em porta efêmera local.
    api = criarApp({ talhoesService: {
      criar(...args: Parameters<typeof talhoesService.criar>) {
        const operacao = talhoesService.criar(...args);
        operacoes.add(operacao);
        void operacao.then(() => operacoes.delete(operacao), () => operacoes.delete(operacao));
        return operacao;
      },
    } }).listen(0, "127.0.0.1");
    await once(api, "listening");
    const port = (api.address() as { port: number }).port;
    const url = `http://127.0.0.1:${port}`;
    const propCol = banco.collection("propriedades"), talhaoCol = banco.collection("talhoes");

    etapa = "fixtures_exclusivos";
    // IDs são reservados e registrados antes da primeira escrita.
    for (let i = 0; i < 3; i++) propriedades.push(new ObjectId());
    assert.equal(await propCol.countDocuments({ _id: { $in: propriedades } }), 0);
    assert.equal(await talhaoCol.countDocuments({ propriedadeId: { $in: propriedades } }), 0);
    console.log(JSON.stringify({ evento: "ids_propriedades_reservados", rodada, ids: propriedades.map(String) }));
    escritasIniciadas = true;
    for (const [i, id] of propriedades.entries()) {
      await propCol.insertOne({ _id: id, usuarioId: perfis[i === 1 ? 1 : 0],
        nome: `TEMP TALHOES ${rodada} ${i}`, municipio: "Município fictício", estado: "SP",
        areaTotalHa: i === 2 ? 1 : 10, ativa: true, criadoEm: new Date(), atualizadoEm: new Date() });
    }

    async function post(id: ObjectId, corpo: unknown, token: string | undefined = tokens[0]) {
      interromper.signal.throwIfAborted();
      const resposta = await fetch(`${url}/propriedades/${id}/talhoes`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(corpo), signal: AbortSignal.any([interromper.signal, AbortSignal.timeout(15000)]),
      });
      const dados = await resposta.json() as Record<string, any>;
      if (resposta.status === 201) {
        assert(ObjectId.isValid(dados._id));
        talhoes.set(dados._id, id);
        console.log(JSON.stringify({ evento: "talhao_criado", rodada, id: dados._id, propriedadeId: String(id) }));
      }
      return { status: resposta.status, dados };
    }
    async function contar() {
      return talhaoCol.countDocuments({ propriedadeId: { $in: propriedades } }, { maxTimeMS: 5000 });
    }
    async function caso(indice: number, acao: () => Promise<number[]>) {
      etapa = nomes[indice];
      casos[indice].estado = "em execução";
      try { casos[indice].status = await acao(); casos[indice].estado = "aprovado"; }
      catch { casos[indice].estado = "reprovado"; throw new Error("CENARIO_REPROVADO"); }
    }
    await caso(0, async () => {
      const antes = await contar();
      const r = await post(propriedades[0], { nome: `Talhão ${rodada}`, areaHa: 2.5, observacoes: "Teste de integração" });
      assert.equal(r.status, 201);
      const salvo = await talhaoCol.findOne({ _id: new ObjectId(r.dados._id) });
      assert(salvo); assert(salvo.propriedadeId.equals(propriedades[0]));
      assert.equal(salvo.nome, `Talhão ${rodada}`); assert.equal(salvo.areaHa, 2.5);
      assert.equal(salvo.observacoes, "Teste de integração"); assert.equal(salvo.ativo, true);
      assert(salvo.criadoEm instanceof Date && salvo.atualizadoEm instanceof Date);
      assert.equal(await contar(), antes + 1);
      return [r.status];
    });
    await caso(1, async () => {
      const antes = await contar();
      const r = await post(propriedades[0], { nome: "", areaHa: 0 });
      assert.equal(r.status, 400); assert.equal(r.dados.codigo, "ENTRADA_INVALIDA");
      assert.deepEqual(r.dados.detalhes, [
        { mensagem: "O nome do talhão é obrigatório." },
        { mensagem: "A área do talhão deve ser um número finito maior que zero." },
      ]);
      assert.equal(await contar(), antes); return [r.status];
    });
    await caso(2, async () => {
      await pararJava();
      const antes = await contar();
      const r = await post(propriedades[0], { nome: "Java desligado", areaHa: 1 });
      assert.equal(r.status, 503); assert.equal(r.dados.codigo, "JAVA_INDISPONIVEL");
      assert.equal(r.dados.erro, "Serviço de validação Java indisponível");
      assert.equal(await contar(), antes);
      await iniciarJava(portaJava); return [r.status];
    });
    await caso(3, async () => {
      const antes = await contar();
      const r = await post(propriedades[0], { nome: "Sem token", areaHa: 1 }, "");
      assert.equal(r.status, 401); assert.equal(await contar(), antes); return [r.status];
    });
    await caso(4, async () => {
      const antes = await contar();
      const r = await post(propriedades[1], { nome: "Propriedade alheia", areaHa: 1 });
      assert.equal(r.status, 404); assert.equal(await contar(), antes); return [r.status];
    });
    await caso(5, async () => {
      const antes = await contar();
      const r = await post(propriedades[0], { nome: "Área excedente", areaHa: 8 });
      assert.equal(r.status, 409); assert.equal(r.dados.codigo, "AREA_INSUFICIENTE");
      assert.equal(await contar(), antes); return [r.status];
    });
    await caso(6, async () => {
      // As duas chamadas usam repositórios e transações MongoDB reais.
      alvoConcorrente = String(propriedades[2]);
      barreira = new Promise<void>((resolve, reject) => {
        liberarConcorrentes = resolve;
        timerConcorrencia = setTimeout(() => reject(new Error("SEM_SOBREPOSICAO")), 5000);
      });
      // Evite rejeição não tratada caso uma chamada falhe antes de chegar à barreira.
      void barreira.catch(() => {});
      const pendentes = await Promise.allSettled([
        post(propriedades[2], { nome: "Concorrente A", areaHa: 0.6 }),
        post(propriedades[2], { nome: "Concorrente B", areaHa: 0.6 }),
      ]);
      const respostas = pendentes.map(resultado => {
        assert.equal(resultado.status, "fulfilled");
        return (resultado as PromiseFulfilledResult<{ status: number; dados: Record<string, any> }>).value;
      });
      assert.deepEqual(respostas.map(r => r.status).sort(), [201, 409]);
      assert.equal(concorrencia.leiturasSobrepostas, 2);
      assert(concorrencia.tentativasDeReserva >= 3); // Pelo menos uma repetição após conflito real.
      assert.equal(respostas.find(r => r.status === 409)!.dados.codigo, "AREA_INSUFICIENTE");
      const salvos = await talhaoCol.find({ propriedadeId: propriedades[2], ativo: true }).toArray();
      assert.equal(salvos.length, 1); assert.equal(salvos[0].areaHa, 0.6);
      assert(salvos.reduce((total, salvo) => total + salvo.areaHa, 0) <= 1);
      return respostas.map(r => r.status);
    });
    aprovado = true;
  } catch {
    // Nunca imprima erro, URI, tokens, credenciais ou stack do SDK/driver.
    motivos.push(`FALHA_EM_${etapa}`);
  } finally {
    liberarConcorrentes?.();
    clearTimeout(timerConcorrencia);
    try {
      if (api) {
        await new Promise<void>((resolve, reject) => api!.close(erro => erro ? reject(erro) : resolve()));
      }
      // Timeout HTTP não cancela uma transação: aguarde o service real antes de limpar.
      await Promise.allSettled([...operacoes]);
      // Recupere IDs de respostas incertas apenas nos pais exclusivos desta rodada.
      if (banco && escritasIniciadas) {
        const encontrados = await banco.collection("talhoes").find({ propriedadeId: { $in: propriedades } },
          { projection: { _id: 1, propriedadeId: 1 }, maxTimeMS: 5000 }).toArray();
        for (const doc of encontrados) talhoes.set(String(doc._id), doc.propriedadeId);
        for (const [id, propriedadeId] of talhoes) {
          console.log(JSON.stringify({ evento: "id_talhao_para_limpeza", rodada, id }));
          const { ObjectId } = (await import("mongoose")).mongo;
          await banco.collection("talhoes").deleteOne({ _id: new ObjectId(id), propriedadeId });
        }
        assert.equal(await banco.collection("talhoes").countDocuments({ propriedadeId: { $in: propriedades } }), 0);
        for (const [i, id] of propriedades.entries()) {
          await banco.collection("propriedades").deleteOne({ _id: id, nome: `TEMP TALHOES ${rodada} ${i}` });
        }
        assert.equal(await banco.collection("propriedades").countDocuments({ _id: { $in: propriedades } }), 0);
      }
      limpezaConfirmada = true;
    } catch { incerteza = true; motivos.push("LIMPEZA_NAO_CONFIRMADA"); }
    try { await pararJava(); } catch { motivos.push("FALHA_ENCERRAMENTO_JAVA"); }
    try { await desconectar?.(); } catch { motivos.push("FALHA_ENCERRAMENTO_BANCO"); }
    if (pastaJava) try { await fs.rm(pastaJava, { recursive: true, force: true }); }
    catch { motivos.push("FALHA_LIMPEZA_COMPILACAO_TEMPORARIA"); }
  }
}

void principal().finally(() => {
  process.off("SIGINT", aoSinal);
  process.off("SIGTERM", aoSinal);
  console.log(JSON.stringify({ rodada, modo: executar ? "execução real" : "preparação",
    ambiente: { autenticacao: "emulator local", banco: "sentinela",
      atlasConfigurado: /\.mongodb\.net/.test(process.env.MONGODB_URI ?? "") },
    aprovado: aprovado && limpezaConfirmada && !motivos.length, motivos, casos,
    escritasIniciadas, limpeza: { necessaria: escritasIniciadas,
      confirmada: limpezaConfirmada || !escritasIniciadas, incerteza },
    idsPropriedades: propriedades.map(String), idsTalhoes: [...talhoes.keys()],
    concorrencia,
    limite: "Não comprova Flutter; pré-requisitos ausentes não executam cenários nem transações.",
  }, null, 2));
  if (executar && (!aprovado || !limpezaConfirmada || motivos.length)) process.exitCode = 1;
});

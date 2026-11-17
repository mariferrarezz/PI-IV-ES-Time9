import test from "node:test";
import assert from "node:assert/strict";
import { createConnection } from "node:net";
import { configuracaoJava } from "../src/config/java";
import { validarPlantacaoNoJava, CamposValidacaoPlantacao } from "../src/services/validacao-java.service";
import { codificarCampoProtocolo as codificar } from "../src/shared/codec-validacao";

const referencia = new Date("2026-11-15T12:00:00Z");
test("Plantação: campos e datas pelo transporte real", async t => {
  const casos: Array<[string, CamposValidacaoPlantacao, number]> = [
    ["ausentes", { status: "ativa" }, 0],
    ["presentes vazios", {status: "ativa", variedade: "", safra: "", observacoes: ""}, 3],
    ["espaços Unicode", {status: "ativa", variedade: "\uFEFF", safra: "\u2003", observacoes: " "}, 3],
    ["limites Unicode", {status: "ativa", variedade: "🌱".repeat(200), safra: "🌱".repeat(30), observacoes: "🌱".repeat(5000)}, 0],
    ["acima Unicode", {status: "ativa", variedade: "🌱".repeat(201), safra: "🌱".repeat(31), observacoes: "🌱".repeat(5001)}, 3],
    ["combinantes", {status: "ativa", variedade: "a\u0301".repeat(100)}, 0],
    ["sem formato de safra", {status: "ativa", safra: "Safra de verão!"}, 0],
    ["escapes", {status: "ativa", variedade: "A\\t\tB", observacoes: "Obs\\n\r\nFim\\"}, 0],
    ["status ausente", {}, 1], ["status inválido", {status: "ATIVA"}, 1],
    ["encerramento obrigatório", {status: "encerrada"}, 1],
    ["encerramento proibido", {status: "ativa", dataEncerramento: referencia}, 1],
    ["igualdades", {status: "encerrada", dataPlantio: referencia, dataEncerramento: referencia}, 0],
    ["anterior e futuro", {status: "encerrada", dataPlantio: new Date("2027-01-02T00:00:00Z"), dataEncerramento: new Date("2027-01-01T00:00:00Z")}, 2],
    ["plantio futuro", {status: "ativa", dataPlantio: new Date("2027-01-01T00:00:00Z")}, 0],
    ...[0, -1, NaN, Infinity, -Infinity, "abc"].map(area => [`área ${area}`, {status: "ativa", areaPlantadaHa: area}, 1] as [string, CamposValidacaoPlantacao, number]),
    ["área positiva", {status: "ativa", areaPlantadaHa: 0.00001}, 0],
  ];
  for (const [nome, campos, quantidade] of casos) await t.test(nome, async () => {
    const antes = {...campos};
    const r = await validarPlantacaoNoJava(campos, referencia);
    assert.equal(r.valido, quantidade === 0); assert.equal(r.erros.length, quantidade);
    assert.deepEqual(campos, antes);
  });
  await assert.rejects(validarPlantacaoNoJava({status: "ativa"}, new Date(NaN)), /instante válido/);
});

test("Protocolo plantação: pedidos inválidos e recuperação na mesma conexão", async () => {
  const base = ["VALIDAR_PLANTACAO", "0", "", "0", "", "", "", "ativa", "", "0", "", referencia.toISOString()];
  const pedidos: Array<[string, string]> = [];
  const invalido = "ERRO\tPedido de validação inválido.";
  pedidos.push([base.slice(0,-1).join("\t"), invalido], [[...base, "extra"].join("\t"), invalido]);
  for (const i of [1,3,9]) {
    const p = [...base]; p[i] = "2"; pedidos.push([p.join("\t"), invalido]);
    p[i] = "0"; p[i+1] = "texto"; pedidos.push([p.join("\t"), invalido]);
  }
  const escape = [...base]; escape[2] = "\\q"; pedidos.push([escape.join("\t"), invalido]);
  escape[2] = "\\"; pedidos.push([escape.join("\t"), invalido]);
  for (const i of [5,8,11]) for (const valor of ["2026-11-15", "invalida", "2026-11-15T12:00:00+00:00", "2026-02-30T00:00:00Z"]) {
    const p=[...base]; p[i]=valor;
    const campo = i===5 ? "A data de plantio" : i===8 ? "A data de encerramento" : "O instante de referência";
    pedidos.push([p.join("\t"), `ERRO\t${campo} deve ser um instante ISO válido em UTC.`]);
  }
  const semRef=[...base];semRef[11]="";pedidos.push([semRef.join("\t"),"ERRO\tO instante de referência é obrigatório."]);
  const ok=[...base];ok[1]="1";ok[2]=codificar("Texto\\\t\r\nFim");pedidos.push([ok.join("\t"),"OK"]);
  pedidos.push(["VALIDAR_TALHAO\tNorte\t1","OK"], ["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"], [base.join("\t"),"OK"]);
  const socket=createConnection(configuracaoJava());
  try {
    await new Promise<void>((resolve,reject)=>{socket.once("connect",resolve);socket.once("error",reject);});
    await new Promise<void>((resolve,reject)=>{
      let acumulado="", indice=0;
      const timer=setTimeout(()=>reject(new Error("TIMEOUT")),5000);
      socket.on("error",reject);
      socket.on("data",chunk=>{acumulado+=chunk.toString("utf8");let fim;
        while((fim=acumulado.indexOf("\n"))>=0){
          const linha=acumulado.slice(0,fim).replace(/\r$/,"");acumulado=acumulado.slice(fim+1);
          try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}
          if(indice===pedidos.length){clearTimeout(timer);resolve();}
        }
      });
      socket.write(pedidos.map(p=>p[0]+"\n").join(""));
    });
  } finally {socket.destroy();}
});
